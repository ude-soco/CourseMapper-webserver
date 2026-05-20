from collections import defaultdict, deque
from typing import Tuple
import numpy as np
import scipy.sparse as sp
import torch
from torch_geometric.nn.inits import glorot

# Path length weight
def _length_weight(length):
    length_weights = {2: 1, 3: 0.5, 4: 0.25}
    return length_weights.get(length, 0.0)

# Distance penalization weight
def _dist_weight(dist):
    dist_weights = {1: 0.5, 2: 0.25, 3: 0.125}
    return dist_weights.get(dist, 0.0)

# Compute BFS distances up to a max depth on the adjacency matrix
def _bfs_dist(weight_matrix, start):
    max_depth = 4
    dist = {start: 0}
    q = deque([start])

    while q:
        u = q.popleft()
        du = dist[u]
        if max_depth is not None and du >= max_depth:
            continue

        for v in weight_matrix[u].indices:
            if v not in dist:
                dist[v] = du + 1
                q.append(v)

    return dist

# Compute mean
def _mean(values):
    if not values:
        return 0.0

    cleaned = []
    for v in values:
        if v is None:
            continue
        try:
            cleaned.append(float(v))
        except (TypeError, ValueError):
            continue

    if not cleaned:
        return 0.0

    return float(np.mean(cleaned))

# Construct internal index mappings
def _build_idx_map(graph):
    node_ids = set()
    for record in graph:
        for n in record.get("nodes", []):
            node_ids.add(int(n["id"]))
    rev_map = sorted(node_ids)
    idx_map = {v: i for i, v in enumerate(rev_map)}
    return idx_map, rev_map

# Parse embedding from string or list, handling missing/invalid cases
def _parse_embedding(emb):
    if emb is None:
        return None
    if isinstance(emb, str):
        parts = [float(x) for x in emb.split(",") if x.strip()]
        return parts if parts else None
    return emb if emb else None

# Create a dense node embedding matrix aligned to idx_map
def _build_node_embedding_matrix(graph, idx_map):
    dim = None
    for record in graph:
        for n in record.get("nodes", []):
            emb = _parse_embedding(n.get("embedding", None))
            if emb is not None:
                dim = len(emb)
                break
        if dim is not None:
            break

    if dim is None:
        raise ValueError("Cannot infer embedding dim: nodes[].embedding is missing.")

    n_nodes = len(idx_map)
    x = np.zeros((n_nodes, dim), dtype=np.float32)
    filled = np.zeros((n_nodes,), dtype=bool)

    for record in graph:
        for n in record.get("nodes", []):
            nid = int(n["id"])
            if nid not in idx_map:
                continue
            idx = idx_map[nid]
            if filled[idx]:
                continue

            emb = _parse_embedding(n.get("embedding", None))
            if emb is not None:
                x[idx] = np.array(emb, dtype=np.float32)
                filled[idx] = True

    return x

# Construct a sparse adjacency matrix with edge weights
def _build_weight_matrix(graph, idx_map):
    rows, cols, data = [], [], []

    for record in graph:
        for e in record.get("edges", []):
            u = int(e["start"])
            v = int(e["end"])
            if u not in idx_map or v not in idx_map:
                continue
            rows.append(idx_map[u])
            cols.append(idx_map[v])
            data.append(float(e.get("weight")) if e.get("weight") is not None else 0.0)

    n_nodes = len(idx_map)
    return sp.coo_matrix((data, (rows, cols)), shape=(n_nodes, n_nodes), dtype=np.float32).tocsr()

# Initialize Glorot weights with seed
def _glorot_seed(shape: Tuple, seed: int = 42, dtype: torch.dtype = torch.float32):
    torch.manual_seed(seed)
    a = torch.zeros(shape, dtype=dtype)
    glorot(a)
    return a

# Initialize and normalize the global TransH hyperplane vector
def _init_global_transh_params(emb_dim: int):
    w0_t = torch.randn(emb_dim, dtype=torch.float32)
    w0_t = w0_t / (torch.norm(w0_t) + 1e-12)
    return w0_t.detach().cpu().numpy().astype(np.float32)

# Compute TransH score for a triple (h, r, t)
def _transh(h: np.ndarray, t: np.ndarray, w0: np.ndarray, r_edge: np.ndarray) -> float:
    h_proj = h - np.dot(w0, h) * w0
    t_proj = t - np.dot(w0, t) * w0
    return -float(np.linalg.norm(h_proj + r_edge - t_proj))

# Softmax funcion
def _softmax(scores):
    max_score = np.max(scores)
    exp_scores = np.exp(scores - max_score)
    sum_exp = np.sum(exp_scores)
    return exp_scores / (sum_exp + 1e-12)

# Create a reversed edge record that preserves metadata
def _reverse_edge(edge):
    return {
        "start": edge["end"],
        "end": edge["start"],
        "type": edge.get("type", "RELATED_TO"),
        "weight": edge.get("weight", 0.0),
        "reversed_from_original": True,
    }

# Convert index paths back to node/edge records with weights
def _paths_to_records(paths, raw_subgraph, rev_map):
    if not paths:
        return []

    node_info = {}
    edge_info = {}

    for record in raw_subgraph:
        for n in record.get("nodes", []):
            nid = int(n["id"])
            node_info.setdefault(nid, n)

        for e in record.get("edges", []):
            key = (int(e["start"]), int(e["end"]))
            edge_info.setdefault(key, e)

    results = []

    for path in paths:
        node_ids = [rev_map[idx] for idx in path]

        nodes = []
        valid = True
        for nid in node_ids:
            node = node_info.get(nid)
            if node is None:
                valid = False
                break
            nodes.append(node)

        if not valid:
            continue

        edges = []
        weights = []

        for i in range(len(node_ids) - 1):
            u = node_ids[i]
            v = node_ids[i + 1]

            # Resolve edge in forward direction, or synthesize reverse if needed
            edge = edge_info.get((u, v))
            if edge is None:
                reverse_edge = edge_info.get((v, u))
                if reverse_edge is not None:
                    edge = _reverse_edge(reverse_edge)

            if edge is None:
                valid = False
                break

            edges.append(edge)
            try:
                weights.append(float(edge.get("weight", 0.0)))
            except (TypeError, ValueError):
                weights.append(0.0)

        if not valid:
            continue

        results.append({
            "nodes": nodes,
            "edges": edges,
            "weights": weights,
            "length": len(edges),
        })

    return results

# Normalize weight list: convert missing/invalid values to 0.0
def _sanitize_weights(weights):
    cleaned = []
    for w in weights:
        if w is None:
            cleaned.append(0.0)
        else:
            try:
                cleaned.append(float(w))
            except (TypeError, ValueError):
                cleaned.append(0.0)
    return cleaned

# Extract user->RC subpath and align direction to user->RC
def _extract_subpath_user_to_rc(nodes, edges, weights, uid, cid):
    if not nodes or len(nodes) < 2:
        return None

    node_ids = [int(n["id"]) for n in nodes]
    uid_v = int(uid)
    cid_v = int(cid)

    pos_u = [i for i, nid in enumerate(node_ids) if nid == uid_v]
    pos_c = [i for i, nid in enumerate(node_ids) if nid == cid_v]
    if not pos_u or not pos_c:
        return None

    best = None
    for iu in pos_u:
        for ic in pos_c:
            if iu == ic:
                continue
            lo = min(iu, ic)
            hi = max(iu, ic)
            span = hi - lo
            if best is None or span < best[0]:
                best = (span, iu, ic)

    if best is None:
        return None

    _, i_u, i_c = best
    lo = min(i_u, i_c)
    hi = max(i_u, i_c)

    sub_nodes = nodes[lo:hi + 1]
    sub_edges = edges[lo:hi]
    sub_weights = weights[lo:hi]

    # Reverse the subpath if it is in RC->user direction
    if i_u > i_c:
        sub_nodes = list(reversed(sub_nodes))
        sub_edges = [
            {
                "start": e["end"],
                "end": e["start"],
                "type": e.get("type", "RELATED_TO"),
                "weight": e.get("weight", 0.0),
                "reversed_from_original": True,
            }
            for e in reversed(sub_edges)
        ]
        sub_weights = list(reversed(sub_weights))

    # Validate subpath structure and weight alignment
    if len(sub_nodes) < 2:
        return None
    if len(sub_edges) != len(sub_nodes) - 1:
        return None
    if len(sub_edges) != len(sub_weights):
        return None

    return {
        "nodes": sub_nodes,
        "edges": sub_edges,
        "weights": sub_weights,
        "length": len(sub_edges),
    }

