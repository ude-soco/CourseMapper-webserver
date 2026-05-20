import logging
import heapq
from typing import List, Dict, Any
import numpy as np

from log import LOG
from .util import (
    _length_weight,
    _dist_weight,
    _bfs_dist,
    _build_idx_map,
    _build_node_embedding_matrix,
    _build_weight_matrix,
    _mean,
    _glorot_seed,
    _init_global_transh_params,
    _transh,
    _softmax,
    _paths_to_records,
    _sanitize_weights,
    _extract_subpath_user_to_rc,
)

logger = LOG(name=__name__, level=logging.DEBUG)


class GraphPruner:
    """Graph pruning module"""

    def __init__(self):
        self.uid = None
        self.cid = None
        self.idx_map = {}
        self.rev_map = []
        self.node_embedding_matrix = None
        self.edge_embedding_matrix = {}
        self.weight_matrix = None
        self.weight_matrix_reverse = None
        self.weight_matrix_symmetric = None

    def prune_graph(self, raw_subgraph, uid, cid, strategy_extract="method_1", strategy_prune="method_1"):
        logger.info(f"Start pruning raw subgraph, extract={strategy_extract}, prune={strategy_prune}")

        self.preprocess(raw_subgraph, uid, cid)

        if self.uid is None or self.cid is None:
            logger.info(f"User or RC not resolved in subgraph (uid={self.uid}, cid={self.cid}), skipping")
            return []

        valid_paths = self._filter_valid_paths(raw_subgraph, strategy_extract=strategy_extract)
        if not valid_paths:
            logger.info("No valid paths found after filtering.")
            return []

        if strategy_prune == "method_1":
            return self.length_weight_pruning(valid_paths)
        elif strategy_prune == "method_2":
            return self.combined_pruning(valid_paths)
        elif strategy_prune == "method_3":
            return self.KGE_sampling_pruning(valid_paths)
        else:
            logger.warning(f"Unknown pruning strategy: {strategy_prune}, using default strategy")
            return self.length_weight_pruning(valid_paths)

    # Build index/weight matrices and resolve user/course IDs from the raw subgraph
    def preprocess(self, raw_subgraph, uid, cid):
        logger.info("Preprocessing raw subgraph for pruning")
        self.idx_map, self.rev_map = _build_idx_map(raw_subgraph)
        self.weight_matrix = _build_weight_matrix(raw_subgraph, self.idx_map)
        self.weight_matrix_reverse = self.weight_matrix.transpose().tocsr()
        self.weight_matrix_symmetric = (self.weight_matrix + self.weight_matrix_reverse).tocsr()
        self.edge_embedding_matrix = {}

        has_embedding = any(
            n.get("embedding") is not None
            for record in raw_subgraph
            for n in record.get("nodes", [])
        )
        if has_embedding:
            self.node_embedding_matrix = _build_node_embedding_matrix(raw_subgraph, self.idx_map)
        else:
            self.node_embedding_matrix = None

        self.uid = None
        self.cid = None

        for record in raw_subgraph:
            for n in record.get("nodes", []):
                # Use internal id
                if self.uid is None and n.get("uid") == uid:
                    self.uid = int(n["id"])
                if self.cid is None and n.get("cid") == cid:
                    self.cid = int(n["id"])
            if self.uid is not None and self.cid is not None:
                break

    # Normalize path records and apply extraction-specific validity rules
    # For extract method 2, extract user->RC subpaths with DNU and length constraints
    # For extract method 1/3, ensure paths start/end with user/RC
    def _filter_valid_paths(self, raw_subgraph, strategy_extract):
        valid_paths = []

        for record in raw_subgraph:
            nodes = record.get("nodes", [])
            edges = record.get("edges", [])
            weights = _sanitize_weights(record.get("weights", []))
            length = record.get("length", len(edges))

            if not nodes or len(nodes) < 2:
                continue

            if strategy_extract == "method_2":
                # For extract method 2: extract a user->RC subpath and enforce DNU + length constraints
                sub = _extract_subpath_user_to_rc(
                    nodes=nodes,
                    edges=edges,
                    weights=weights,
                    uid=self.uid,
                    cid=self.cid,
                    )
                if sub is None:
                    continue

                # Target path pattern：user -[dnu]- DNU -[1..2 hops]- RC
                # This is equivalent to the number of edges in the user->rc subpath being 2 or 3, with the first edge being dnu
                if sub["length"] not in (2, 3):
                    continue

                first_edge = sub["edges"][0] if sub["edges"] else None
                first_type = (first_edge.get("type", "").lower() if first_edge else "")
                if first_type != "dnu":
                    continue

                nodes = sub["nodes"]
                edges = sub["edges"]
                weights = sub["weights"]
                length = sub["length"]
            else:
                # For extract method 1/3: ensure paths start/end with user/RC
                if int(nodes[0]["id"]) != self.uid or int(nodes[-1]["id"]) != self.cid:
                    continue

            # Ensure length / edges / weights are consistent
            if len(edges) != len(weights):
                continue

            if length != len(edges):
                length = len(edges)

            if length < 2:
                continue

            normalized = {
                "nodes": nodes,
                "edges": edges,
                "weights": weights,
                "length": length,
                }
            valid_paths.append(normalized)

        return valid_paths

    # Prune Method 1
    # Utilize path length and semantic cosine similarity
    def length_weight_pruning(self, valid_paths):
        best_by_length = {}

        for record in valid_paths:
            length = record["length"]
            weights = record["weights"]

            # Path weight = length weight * average of cosine similarity for edges along the path
            lw = _length_weight(length)
            avg_w = _mean(weights[1:])  # exclude user->DNU
            p_w = lw * avg_w

            prev = best_by_length.get(length)
            if prev is None or p_w > prev[0]:
                best_by_length[length] = (p_w, record)

        return [best_by_length[length][1] for length in sorted(best_by_length.keys())]

    # Prune Method 2
    # Combine cosine similarity, common neighbors and penalization strategy
    def combined_pruning(self, valid_paths):
        # Get shortest path lengths for each common neighbors using BFS from user and RC
        dist_u = _bfs_dist(self.weight_matrix, self.idx_map[self.uid])
        dist_r = _bfs_dist(self.weight_matrix_reverse, self.idx_map[self.cid])

        best_three_paths = []
        counter = 0

        for record in valid_paths:
            nodes = record["nodes"]
            weights = record["weights"]
            length_edges = record["length"]

            start_idx = 1
            end_idx = len(nodes) - 1
            if end_idx < start_idx:
                continue

            node_scores = []
            if length_edges == 2:
                # Only one edge, take its weight
                node_scores = weights[1:2]
            else:
                # Score each common neighbor by prefix/suffix averages and panalization weights
                start_idx = 2 # excluding user->DNU
                for idx in range(start_idx, end_idx):
                    v_id = int(nodes[idx]["id"])
                    if v_id not in self.idx_map:
                        continue

                    vi = self.idx_map[v_id]
                    lcvu_raw = dist_u.get(vi)
                    lcvr_raw = dist_r.get(vi)

                    if lcvu_raw is None or lcvr_raw is None:
                        continue

                    lcvu = lcvu_raw - 1
                    lcvr = lcvr_raw

                    w_lcvu = _dist_weight(lcvu)
                    w_lcvr = _dist_weight(lcvr)

                    if lcvu == 0:
                        avg_pre = 0.0
                    else:
                        prefix_weights = weights[1:idx]
                        avg_pre = _mean(prefix_weights)

                    suffix_weights = weights[idx:length_edges]
                    avg_suf = _mean(suffix_weights)

                    node_weight = avg_pre * w_lcvu + avg_suf * w_lcvr
                    node_scores.append(node_weight)

            if not node_scores:
                continue

            # Average the node scores for the path score
            path_weight = _mean(node_scores)

            # Keep top-3 paths with a min-heap
            if len(best_three_paths) < 3:
                heapq.heappush(best_three_paths, (path_weight, counter, record))
            elif path_weight > best_three_paths[0][0]:
                heapq.heapreplace(best_three_paths, (path_weight, counter, record))
            counter += 1

        return [record for _, _, record in sorted(best_three_paths, reverse=True)]

    # Prune Method 3
    # Utilize KGE method, nucleus sampling and early pruning strategy
    def KGE_sampling_pruning(self, valid_paths):
        if self.node_embedding_matrix is None:
            logger.warning("KGE pruning requires node embeddings, but none were found.")
            return []

        if self.uid not in self.idx_map or self.cid not in self.idx_map:
            return []

        # Construct edge embeddings for TransH scoring
        sym = self.weight_matrix_symmetric
        emb_dim = self.node_embedding_matrix.shape[1]
        weight_relation_initialize = _glorot_seed((1, emb_dim), seed=42).numpy().reshape(-1)
        coo = sym.tocoo()
        for i, j, w in zip(coo.row, coo.col, coo.data):
            self.edge_embedding_matrix[(i, j)] = float(w) * weight_relation_initialize

        w0 = _init_global_transh_params(emb_dim)

        start_idx = self.idx_map[self.uid]
        end_idx = self.idx_map[self.cid]

        initial_neighbors = sym[start_idx].indices
        if len(initial_neighbors) == 0:
            return []

        active_paths = [[start_idx, n] for n in initial_neighbors]
        completed_paths = []

        max_expansion_rounds = 3
        for depth in range(max_expansion_rounds):
            if not active_paths:
                break

            still_active_paths = []
            for path in active_paths:
                if path[-1] == end_idx:
                    completed_paths.append(path)
                else:
                    still_active_paths.append(path)
            active_paths = still_active_paths

            if not active_paths:
                break

            is_last_round = depth == (max_expansion_rounds - 1)
            candidates = []

            for path_idx, path in enumerate(active_paths):
                frontier = path[-1]
                path_set = set(path)
                h_emb = self.node_embedding_matrix[frontier]

                for n in sym[frontier].indices:
                    if n in path_set:
                        continue
                    if is_last_round and n != end_idx:
                        continue

                    # Score candidate triple using TransH with node + edge embeddings
                    t_emb = self.node_embedding_matrix[n]
                    r_emb = self.edge_embedding_matrix.get((frontier, n), np.zeros(emb_dim, dtype=np.float32))
                    score = _transh(h_emb, t_emb, w0, r_emb)
                    candidates.append((path_idx, n, score))

            if not candidates:
                break

            scores_arr = np.array([c[2] for c in candidates], dtype=np.float32)
            probabilities = _softmax(scores_arr)

            # Nucleus sampling: keep a minimal set of triples covering 80% cumulative probability
            sorted_indices = np.argsort(-probabilities)
            cumulative_probs = 0.0
            kept_set = set()

            for idx in sorted_indices:
                kept_set.add(idx)
                cumulative_probs += probabilities[idx]
                if cumulative_probs >= 0.8:
                    break

            # Early pruning
            # Only expand paths through the sampled top-scoring triples, and immediately complete paths that reach the end_idx
            new_active_paths = []
            for idx in kept_set:
                path_idx, neighbor, _ = candidates[idx]
                new_path = active_paths[path_idx] + [neighbor]
                if neighbor == end_idx:
                    completed_paths.append(new_path)
                else:
                    new_active_paths.append(new_path)

            active_paths = new_active_paths

        if len(completed_paths) > 3:
            # Final rerank by mean edge weight and keep top-3 paths
            scored_paths = []
            for path in completed_paths:
                edge_weights = [float(sym[path[i], path[i + 1]]) for i in range(len(path) - 1)]
                avg_weight = _mean(edge_weights)
                scored_paths.append((avg_weight, path))

            scored_paths.sort(key=lambda x: x[0], reverse=True)
            completed_paths = [path for _, path in scored_paths[:3]]

        return _paths_to_records(completed_paths, valid_paths, self.rev_map)