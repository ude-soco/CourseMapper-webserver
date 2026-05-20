import logging
from log import LOG
from .subgraph_extractor import SubgraphExtractor
from .graph_pruner import GraphPruner
from .path_validation import PathValidator
from .util import _mean

logger = LOG(name=__name__, level=logging.DEBUG)


class ExplanationGenerator:
    """Generate explanation for the user and recommended concepts"""

    def __init__(self):
        self.subgraph_extractor = SubgraphExtractor()
        self.graph_pruner = GraphPruner()
        self.path_validator = PathValidator()

    def close(self):
        self.subgraph_extractor.close()

    # For each recommended concept, generate explanation paths connecting the user and the concept
    # Select extract strategy and prune strategy here
    # Extract strategy: method_1 (2-hop neighbor paths) / method_2 (2-hop neighbors) / method_3 (1-hop neighbor paths)
    # Prune strategy: method_1 (path-length-based pruning) / method_2 (penalty-based pruning) / method_3 (KGE-sampling-based pruning)
    def generate_for_concept(self, uid, cid_list, strategy_extract="method_3", strategy_prune="method_1"):
        logger.info(f"generate_for_concept: uid={uid}, {len(cid_list)} concepts")

        # Step 1: Extract raw subgraph for all recommended concepts based on extract strategy
        raw_graph_by_cid = self.subgraph_extractor.extract_subgraph(
            uid, cid_list, strategy_extract=strategy_extract
        )
        if not isinstance(raw_graph_by_cid, dict):
            logger.error("extract_subgraph returned non-dict result, fallback to empty result")
            raw_graph_by_cid = {}

        # Split the raw subgraph by concept and prune/validate each subgraph separately
        result = {}
        for cid in cid_list:
            raw_subgraph = raw_graph_by_cid.get(cid, [])
            result[cid] = self._prune_validate(raw_subgraph, uid, cid, strategy_extract, strategy_prune)
        return result

    # Prune and validate the raw subgraph for a single concept
    def _prune_validate(self, raw_subgraph, uid, cid, strategy_extract, strategy_prune):
        if not raw_subgraph:
            logger.info(f"No paths to prune for User {uid} and Recommended Concept {cid}")
            return []

        try:
            # For KGE-sampling-based pruning, inject node embeddings before pruning
            if strategy_prune == "method_3":
                self._inject_embeddings(raw_subgraph)

            # Prune unimportant paths
            pruned_subgraph = self.graph_pruner.prune_graph(
                raw_subgraph=raw_subgraph,
                uid=uid,
                cid=cid,
                strategy_extract=strategy_extract,
                strategy_prune=strategy_prune,
                )
            if not pruned_subgraph:
                return []

            # Validate subgraph completeness
            validated_subgraph = self.path_validator.validate_paths(
                pruned_subgraph=pruned_subgraph,
                uid=uid,
                cid=cid,
                )

            return validated_subgraph

        except Exception as e:
            logger.error(f"Error in prune/validate for cid={cid}: {e}")
            return []

    # Retrieve the embeddings, then backfill only the nodes with missing embeddings to avoid unnecessary duplicate writes
    def _inject_embeddings(self, raw_subgraph):
        node_ids = {
            int(n["id"])
            for record in raw_subgraph
            for n in record.get("nodes", [])
        }

        if not node_ids:
            return {}

        emb_map = self.subgraph_extractor.fetch_node_embeddings(list(node_ids))

        for record in raw_subgraph:
            for n in record.get("nodes", []):
                if n.get("embedding") is not None:
                    continue
                nid = int(n["id"])
                emb = emb_map.get(nid)
                if emb is not None:
                    n["embedding"] = emb

        return emb_map

    # Select top-k paths based on average cosine similarity
    def _select_top_paths(self, all_paths, top_k=3):
        if not all_paths:
            return []

        if len(all_paths) <= top_k:
            return all_paths

        scored_paths = []
        for record in all_paths:
            weights = record.get("weights", [])
            avg_weight = _mean(weights) if weights else 0.0
            scored_paths.append((avg_weight, record))

        scored_paths.sort(key=lambda x: x[0], reverse=True)
        return [record for _, record in scored_paths[:top_k]]