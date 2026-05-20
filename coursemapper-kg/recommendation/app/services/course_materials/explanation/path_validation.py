import logging
from log import LOG

logger = LOG(name=__name__, level=logging.DEBUG)


class PathValidator:
    """Path validation module"""

    def __init__(self):
        pass

    def validate_paths(self, pruned_subgraph, uid, cid):
        logger.info(f"Start validating path completeness: User {uid} -> Recommended concept {cid}")

        if not pruned_subgraph:
            logger.warning("No paths to validate")
            return []

        validated_paths = []

        for record in pruned_subgraph:
            nodes = record.get("nodes", [])
            edges = record.get("edges", [])
            weights = record.get("weights", [])

            # Require at least user -> DNU -> RC structure (3 nodes)
            if not nodes or len(nodes) < 3:
                continue

            first_node = nodes[0]
            last_node = nodes[-1]

            node_uid = first_node.get("uid")
            node_cid = last_node.get("cid")

            # Ensure the path starts with the user and ends with the recommended concept
            if node_uid is not None and node_uid != uid:
                continue
            if node_cid is not None and node_cid != cid:
                continue

            if len(edges) != len(weights):
                continue
            if len(edges) != len(nodes) - 1:
                continue

            # Remove user->DNU prefix
            cleaned_nodes = nodes[1:]
            cleaned_edges = edges[1:] if len(edges) > 1 else []
            cleaned_weights = weights[1:] if len(weights) > 1 else []

            # Ensure the cleaned path still has at least two nodes (DNU -> RC)
            if len(cleaned_nodes) < 2:
                continue

            cleaned_record = {
                "nodes": cleaned_nodes,
                "edges": cleaned_edges,
                "weights": cleaned_weights,
                "length": len(cleaned_edges),
            }
            validated_paths.append(cleaned_record)

        logger.info(f"Validation complete: {len(validated_paths)} valid paths out of {len(pruned_subgraph)}")
        return validated_paths