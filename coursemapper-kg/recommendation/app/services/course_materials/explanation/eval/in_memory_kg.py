from __future__ import annotations

from collections import Counter
from typing import Any, Dict, List, Sequence, Set, Tuple

import numpy as np
import scipy.sparse as sp

from app.log import LOG

logger = LOG(name=__name__)

EdgeKey = Tuple[str, str, str]


class InMemoryKG:

    def __init__(
        self,
        nodes: Sequence[Dict[str, Any]],
        all_edges: Sequence[Dict[str, Any]],
    ):
        self.nodes = list(nodes)
        self.all_edges = list(all_edges)

        self.id_to_node_idx: Dict[str, int] = {}
        self.newid_to_node_idx: Dict[int, int] = {}
        self.id_to_newid: Dict[str, int] = {}
        self.id_to_type: Dict[str, str] = {}
        self.id_to_labels: Dict[str, Set[str]] = {}

        for idx, node in enumerate(self.nodes):
            node_id = str(node["id"])
            node_newid = int(node["newid"])
            node_type = str(node["type"])
            node_labels = set(node.get("labels") or [])

            self.id_to_node_idx[node_id] = idx
            self.newid_to_node_idx[node_newid] = idx
            self.id_to_newid[node_id] = node_newid
            self.id_to_type[node_id] = node_type
            self.id_to_labels[node_id] = node_labels

        self.relations, self.prerequisites = self._project_recommender_edges(self.all_edges)

    # Normalize embeddings into float32 numpy arrays
    @staticmethod
    def _parse_embedding(value: Any) -> np.ndarray:
        if isinstance(value, np.ndarray):
            return value.astype(np.float32)
        if value is None:
            return np.zeros((0,), dtype=np.float32)
        if isinstance(value, (list, tuple)):
            return np.asarray(value, dtype=np.float32)
        text = str(value).strip()
        if not text:
            return np.zeros((0,), dtype=np.float32)
        return np.asarray([float(x) for x in text.split(",")], dtype=np.float32)

    # Hash id + type to preserve original newid behavior
    @staticmethod
    def _make_newid(node_id: str, node_type: str) -> int:
        return hash(str(node_id) + str(node_type))

    # Load nodes/edges from Neo4j into an in-memory KG
    @classmethod
    def from_neo4j(cls, driver, mid: str) -> "InMemoryKG":
        with driver.session() as session:
            concept_rows = session.run(
                """
                MATCH (n:Concept)
                WHERE n.mid = $mid
                RETURN
                    n.cid AS id,
                    n.type AS type,
                    labels(n) AS labels,
                    n.initial_embedding AS embedding
                """,
                mid=mid,
            ).data()

            slide_rows = session.run(
                """
                MATCH (n:Slide)
                WHERE n.mid = $mid
                RETURN
                    n.sid AS id,
                    n.type AS type,
                    labels(n) AS labels,
                    n.initial_embedding AS embedding
                """,
                mid=mid,
            ).data()

            edge_rows = session.run(
                """
                MATCH (u)-[r]->(v)
                WHERE u.mid = $mid AND v.mid = $mid
                RETURN
                    labels(u) AS u_labels,
                    labels(v) AS v_labels,
                    u.cid AS u_cid,
                    u.sid AS u_sid,
                    u.type AS u_type,
                    v.cid AS v_cid,
                    v.sid AS v_sid,
                    v.type AS v_type,
                    type(r) AS rel_type,
                    COALESCE(r.weighted_weight, r.weight, 0.0) AS weight
                """,
                mid=mid,
            ).data()

        nodes: List[Dict[str, Any]] = []

        for row in concept_rows:
            # Build concept node entries with parsed embeddings.
            node_id = str(row["id"])
            node_type = str(row["type"] or "")
            nodes.append(
                {
                    "id": node_id,
                    "type": node_type,  # category/related_concep/main_concept
                    "labels": [str(x) for x in (row.get("labels") or [])],  # Neo4j labels
                    "newid": cls._make_newid(node_id, node_type),
                    "initial_embedding": cls._parse_embedding(row.get("embedding")),
                }
            )

        for row in slide_rows:
            # Build slide node entries with parsed embeddings
            node_id = str(row["id"])
            node_type = str(row["type"] or "")
            nodes.append(
                {
                    "id": node_id,
                    "type": node_type,  # Slide
                    "labels": [str(x) for x in (row.get("labels") or [])],  # Neo4j labels
                    "newid": cls._make_newid(node_id, node_type),
                    "initial_embedding": cls._parse_embedding(row.get("embedding")),
                }
            )

        valid_ids = {str(node["id"]) for node in nodes}
        valid_types = {(str(node["id"]), str(node["type"])) for node in nodes}

        all_edges: List[Dict[str, Any]] = []
        for row in edge_rows:
            source_id = row.get("u_cid") or row.get("u_sid")
            target_id = row.get("v_cid") or row.get("v_sid")
            source_type = str(row.get("u_type") or "")
            target_type = str(row.get("v_type") or "")

            if source_id is None or target_id is None:
                continue

            source_id = str(source_id)
            target_id = str(target_id)

            if source_id not in valid_ids or target_id not in valid_ids:
                continue
            if (source_id, source_type) not in valid_types or (target_id, target_type) not in valid_types:
                continue

            rel_type = str(row.get("rel_type") or "")
            weight = float(row.get("weight") or 0.0)

            all_edges.append(
                {
                    "source_id": source_id,
                    "target_id": target_id,
                    "source_type": source_type,
                    "target_type": target_type,
                    "source_labels": [str(x) for x in (row.get("u_labels") or [])],  # Neo4j labels
                    "target_labels": [str(x) for x in (row.get("v_labels") or [])],  # Neo4j labels
                    "source_newid": cls._make_newid(source_id, source_type),
                    "target_newid": cls._make_newid(target_id, target_type),
                    "weight": round(weight, 2),
                    "rel_type": rel_type,
                }
            )

        type_counter = Counter(str(node["type"]) for node in nodes)
        logger.info(
            f"InMemoryKG.from_neo4j: mid={mid}, "
            f"num_nodes={len(nodes)}, num_all_edges={len(all_edges)}, "
            f"type_distribution={dict(type_counter)}"
        )

        return cls(nodes, all_edges)

    # Project the edges that the recommender graph actually uses from the complete KG
    def _project_recommender_edges(
        self,
        all_edges: Sequence[Dict[str, Any]],
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        relations: List[Dict[str, Any]] = []
        prerequisites: List[Dict[str, Any]] = []

        for edge in all_edges:
            src_labels = set(edge.get("source_labels") or [])
            tgt_labels = set(edge.get("target_labels") or [])
            rel_type = str(edge.get("rel_type") or "")

            # Only keep edges compatible with the recommender graph shape
            is_recommender_shape = (
                ("Concept" in src_labels and "Concept" in tgt_labels)
                or ("Slide" in src_labels and "Concept" in tgt_labels)
            )

            if not is_recommender_shape:
                continue

            if rel_type == "PREREQUISITE_TO":
                prerequisites.append(edge)
            else:
                relations.append(edge)

        logger.info(
            f"InMemoryKG._project_recommender_edges: "
            f"projected_relations={len(relations)}, projected_prerequisites={len(prerequisites)}"
        )

        return relations, prerequisites

    # Return a new KG with the given edges removed
    def remove_edges(self, edges_to_remove: Set[EdgeKey]) -> "InMemoryKG":
        logger.info(f"Removing {len(edges_to_remove)} edges from KG")

        before_all = len(self.all_edges)

        new_all_edges = [
            e for e in self.all_edges
            if (str(e["source_id"]), str(e["target_id"]), str(e.get("rel_type") or "")) not in edges_to_remove
        ]

        removed_all = before_all - len(new_all_edges)

        new_kg = InMemoryKG(self.nodes, new_all_edges)

        logger.info(
            f"InMemoryKG.remove_edges: requested={len(edges_to_remove)}, "
            f"removed_all_edges={removed_all}, "
            f"remaining_all_edges={len(new_kg.all_edges)}, "
            f"remaining_relations={len(new_kg.relations)}, "
            f"remaining_prerequisites={len(new_kg.prerequisites)}"
        )
        return new_kg

    # Return a new KG containing only the given edges
    def keep_only_edges(self, edges_to_keep: Set[EdgeKey]) -> "InMemoryKG":
        new_all_edges = [
            e for e in self.all_edges
            if (str(e["source_id"]), str(e["target_id"]), str(e.get("rel_type") or "")) in edges_to_keep
        ]

        new_kg = InMemoryKG(self.nodes, new_all_edges)

        logger.info(
            f"InMemoryKG.keep_only_edges: requested={len(edges_to_keep)}, "
            f"kept_all_edges={len(new_kg.all_edges)}, "
            f"kept_relations={len(new_kg.relations)}, "
            f"kept_prerequisites={len(new_kg.prerequisites)}"
        )
        return new_kg

    # Stack initial embeddings in node order
    def build_embedding_matrix(self) -> np.ndarray:
        if not self.nodes:
            return np.zeros((0, 0), dtype=np.float32)
        return np.vstack([np.asarray(node["initial_embedding"], dtype=np.float32) for node in self.nodes])

    # Build sparse adjacency matrix from edge list using newid indexing
    def _build_matrix(self, edges: Sequence[Dict[str, Any]]) -> sp.coo_matrix:
        if not self.nodes:
            return sp.coo_matrix((0, 0), dtype=np.float32)
        if not edges:
            size = len(self.nodes)
            return sp.coo_matrix((size, size), dtype=np.float32)

        rows = []
        cols = []
        data = []
        for edge in edges:
            source_idx = self.newid_to_node_idx.get(int(edge["source_newid"]))
            target_idx = self.newid_to_node_idx.get(int(edge["target_newid"]))
            if source_idx is None or target_idx is None:
                continue
            rows.append(source_idx)
            cols.append(target_idx)
            data.append(float(edge["weight"]))

        size = len(self.nodes)
        return sp.coo_matrix((data, (rows, cols)), shape=(size, size), dtype=np.float32)

    def build_adj_matrix(self) -> sp.coo_matrix:
        # Adjacency matrix for non-prerequisite relations
        return self._build_matrix(self.relations)

    def build_prerequisite_matrix(self) -> sp.coo_matrix:
        # Adjacency matrix for prerequisite relations
        return self._build_matrix(self.prerequisites)

    def get_node_ids_in_order(self) -> List[str]:
        # Return node IDs in stored order
        return [str(node["id"]) for node in self.nodes]

    def get_node_embeddings_in_order(self) -> List[np.ndarray]:
        # Return initial embeddings in stored order
        return [np.asarray(node["initial_embedding"], dtype=np.float32) for node in self.nodes]

    def has_node(self, node_id: str) -> bool:
        # Check node existence by ID
        return str(node_id) in self.id_to_node_idx

    def get_node_idx(self, node_id: str) -> int:
        # Get internal node index for a node ID
        return self.id_to_node_idx[str(node_id)]

    def get_node_newid(self, node_id: str) -> int:
        # Get hashed newid for a node ID
        return self.id_to_newid[str(node_id)]

    def get_node_type(self, node_id: str) -> str:
        # Get node type attribute by node ID
        return self.id_to_type[str(node_id)]

    def get_num_nodes(self) -> int:
        # Return total number of nodes
        return len(self.nodes)