from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Any, Dict, List, Sequence, Set, Tuple

from app.log import LOG

from ...kwp_extraction.dbpedia.data_service1 import RecService
from .gcn_embedding_engine import GCNEmbeddingEngine
from .graph_recommender import GraphRecommender
from .in_memory_kg import EdgeKey, InMemoryKG

logger = LOG(name=__name__)


@dataclass
class RecommendationSnapshot:
    concept_rankings: List[Tuple[str, float]]
    sequence_rankings: List[Dict[str, Any]]


class ExplanationEvaluator:
    def __init__(self, driver, gcn_type: str = "rrgcn_1_2", sample_size: int = 5, sample_seed: int = 42):
        self.driver = driver
        self.gcn_type = gcn_type
        self.sample_size = sample_size
        self.sample_seed = sample_seed

        self.rec_service = RecService()
        self.explanation_generator = self.rec_service.explanation_generator

        logger.info(
            f"ExplanationEvaluator initialized: gcn_type={self.gcn_type}, "
            f"sample_size={self.sample_size}, sample_seed={self.sample_seed}"
        )

    def close(self):
        try:
            self.explanation_generator.close()
        except Exception:
            pass

        try:
            self.rec_service.db.close()
        except Exception:
            pass

        try:
            self.rec_service.sequence_recommendation.driver.close()
        except Exception:
            pass

    # Fetch user's DNU (do-not-understand) concepts from Neo4j
    def _get_dnu_info(self, uid: str, mid: str) -> Tuple[List[str], Dict[str, float]]:
        with self.driver.session() as session:
            rows = session.run(
                """
                MATCH (u)-[r:dnu]->(c)
                WHERE u.uid = $uid AND c.mid = $mid
                RETURN c.cid AS cid, toFloat(c.weight) AS weight
                """,
                uid=uid,
                mid=mid,
            ).data()

        dnu_cids = [str(r["cid"]) for r in rows if r.get("cid") is not None]
        dnu_weights = {
            str(r["cid"]): float(r.get("weight") or 0.0)
            for r in rows
            if r.get("cid") is not None
        }
        return dnu_cids, dnu_weights

    # Build a set of all directed edges in the full KG
    def _build_all_edge_universe(self, kg: InMemoryKG) -> Set[EdgeKey]:
        edge_universe: Set[EdgeKey] = set()
        for e in kg.all_edges:
            edge_universe.add(
                (
                    str(e["source_id"]),
                    str(e["target_id"]),
                    str(e.get("rel_type") or ""),
                )
            )
        return edge_universe

    # Extract edges from explanation paths that exist in the full KG
    def _extract_explanation_edges(self, ex_paths: Sequence[Dict[str, Any]], kg: InMemoryKG) -> Set[EdgeKey]:
        # Map explanation path edges to business IDs
        all_node_ids = set()
        for path in ex_paths:
            for node in path.get("nodes", []):
                node_id = node.get("id")
                if node_id is not None:
                    all_node_ids.add(int(node_id))

        id_to_business_id: Dict[int, str] = {}
        if all_node_ids:
            with self.driver.session() as session:
                rows = session.run(
                    """
                    MATCH (n)
                    WHERE id(n) IN $ids
                    RETURN id(n) AS nid, n.cid AS cid, n.sid AS sid
                    """,
                    ids=list(all_node_ids),
                ).data()

            for r in rows:
                node_key = r.get("cid") or r.get("sid")
                if node_key is not None:
                    id_to_business_id[int(r["nid"])] = str(node_key)

        raw_edges: Set[EdgeKey] = set()
        for path in ex_paths:
            for edge in path.get("edges", []):
                src = id_to_business_id.get(int(edge.get("start"))) if edge.get("start") is not None else None
                tgt = id_to_business_id.get(int(edge.get("end"))) if edge.get("end") is not None else None
                rel_type = str(edge.get("type") or edge.get("rel_type") or "")
                if src and tgt:
                    raw_edges.add((src, tgt, rel_type))

        all_edge_universe = self._build_all_edge_universe(kg)

        # Keep only edges that exist in the KG (allow reverse direction)
        filtered_edges: Set[EdgeKey] = set()
        for src, tgt, rel_type in raw_edges:
            direct = (src, tgt, rel_type)
            reverse = (tgt, src, rel_type)

            if direct in all_edge_universe:
                filtered_edges.add(direct)
            elif reverse in all_edge_universe:
                filtered_edges.add(reverse)

        logger.info(
            f"_extract_explanation_edges: num_paths={len(ex_paths)}, "
            f"num_nodes={len(all_node_ids)}, raw_num_edges={len(raw_edges)}, "
            f"filtered_num_edges={len(filtered_edges)}"
        )
        return filtered_edges

    # Retrieve PREREQUISITE_TO edges for adjacent pairs in a sequence
    def _get_sequence_prerequisite_edges(self, sequence: Sequence[str]) -> Set[EdgeKey]:
        if len(sequence) < 2:
            return set()

        pairs = [(str(sequence[i]), str(sequence[i + 1])) for i in range(len(sequence) - 1)]
        with self.driver.session() as session:
            rows = session.run(
                """
                UNWIND $pairs AS pair
                MATCH (a:Concept {cid: pair[0]})-[r:PREREQUISITE_TO]->(b:Concept {cid: pair[1]})
                RETURN a.cid AS source, b.cid AS target, type(r) AS rel_type
                UNION
                UNWIND $pairs AS pair
                MATCH (a:Concept {cid: pair[1]})-[r:PREREQUISITE_TO]->(b:Concept {cid: pair[0]})
                RETURN a.cid AS source, b.cid AS target, type(r) AS rel_type
                """,
                pairs=pairs,
            ).data()

        return {
            (str(r["source"]), str(r["target"]), str(r.get("rel_type") or "PREREQUISITE_TO"))
            for r in rows
        }

    # Reconstruct a user embedding consistent with the original recommender flow
    def _build_user_like_original_flow(self, kg: InMemoryKG, uid: str, mid: str, full_embeddings):
        dnu_cids, dnu_weights = self._get_dnu_info(uid, mid)
        user_embedding = GraphRecommender.build_user_embedding(
            final_embeddings=full_embeddings,
            kg=kg,
            user_id=uid,
            mid=mid,
            dnu_cids=dnu_cids,
            dnu_weights=dnu_weights,
        )
        return GraphRecommender.build_fake_user(user_embedding)

    # Run concept recommendation using the same flow as RecService
    def _get_concept_recommendation_like_recservice(
        self, uid: str, mid: str, kg: InMemoryKG, full_embeddings, top_n: int
    ) -> List[Tuple[str, float]]:
        concept_list = self.rec_service.db.get_concept_has_not_read(uid, mid)
        fake_user = self._build_user_like_original_flow(kg, uid, mid, full_embeddings)
        concept_list = GraphRecommender.inject_current_embeddings_into_candidates(
            concept_list, full_embeddings, kg
        )
        recommend_concepts = self.rec_service.recommendation.recommend(
            concept_list, fake_user, top_n=top_n
        )
        return [(str(item["n"]["cid"]), float(item["n"]["score"])) for item in recommend_concepts]

    # Run sequence recommendation using the same flow as RecService
    def _get_sequence_recommendation_like_recservice(
        self, uid: str, mid: str, kg: InMemoryKG, full_embeddings, top_n: int
    ) -> List[Dict[str, Any]]:
        sequence_concept_list = self.rec_service.db.get_prerequisite_concept_has_not_read(uid, mid)
        fake_user = self._build_user_like_original_flow(kg, uid, mid, full_embeddings)
        sequence_concept_list = GraphRecommender.inject_current_embeddings_into_candidates(
            sequence_concept_list, full_embeddings, kg
        )
        sequence_output = self.rec_service.sequence_recommendation.sequence_recommend(
            sequence_concept_list, fake_user, top_n=top_n
        )
        return GraphRecommender.sequence_output_to_rankings(sequence_output)

    # Compute embeddings and return concept/sequence rankings
    def _build_rankings(
        self,
        kg: InMemoryKG,
        uid: str,
        mid: str,
        concept_top_k: int,
        sequence_top_k: int,
        gcn_engine: GCNEmbeddingEngine,
    ) -> RecommendationSnapshot:
        logger.info(
            f"_build_rankings start: uid={uid}, mid={mid}, "
            f"concept_top_k={concept_top_k}, sequence_top_k={sequence_top_k}, "
            f"model={gcn_engine.gcn_type}"
        )

        full_embeddings = gcn_engine.compute(kg)

        concept_rankings = self._get_concept_recommendation_like_recservice(
            uid=uid, mid=mid, kg=kg, full_embeddings=full_embeddings, top_n=concept_top_k
        )
        sequence_rankings = self._get_sequence_recommendation_like_recservice(
            uid=uid, mid=mid, kg=kg, full_embeddings=full_embeddings, top_n=sequence_top_k
        )

        return RecommendationSnapshot(
            concept_rankings=concept_rankings,
            sequence_rankings=sequence_rankings,
        )

    # Sample a subset of sequences for evaluation
    def _sample_sequence_objects(self, sequence_rankings: List[Dict[str, Any]]) -> List[Tuple[str, ...]]:
        sequences = [tuple(item["sequence"]) for item in sequence_rankings]
        if len(sequences) <= self.sample_size:
            return sequences
        rng = random.Random(self.sample_seed)
        return rng.sample(sequences, self.sample_size)

    # Compute FNS as harmonic mean of PN and PS
    @staticmethod
    def _fns(pn: float, ps: float) -> float:
        return 0.0 if pn + ps == 0 else (2.0 * pn * ps / (pn + ps))

    # Find the rank (index) of a sequence in a ranked list
    @staticmethod
    def _find_sequence_rank(sequence_rankings: List[Dict[str, Any]], target_sequence: Tuple[str, ...]) -> int | None:
        for idx, item in enumerate(sequence_rankings):
            seq = tuple(item["sequence"])
            if seq == target_sequence:
                return idx
        return None

    # Evaluate a single extract/prune strategy by PN/PS on sequences
    def evaluate_method(
        self,
        uid: str,
        mid: str,
        concept_top_k: int = 5,
        sequence_top_k: int = 10,
        strategy_extract: str = "method_1",
        strategy_prune: str = "method_1",
    ) -> Dict[str, Any]:
        kg_full = InMemoryKG.from_neo4j(self.driver, mid)
        gcn_engine = GCNEmbeddingEngine(self.gcn_type)

        base = self._build_rankings(kg_full, uid, mid, concept_top_k, sequence_top_k, gcn_engine)
        concept_cids = [cid for cid, _ in base.concept_rankings]
        sampled_sequences = self._sample_sequence_objects(base.sequence_rankings)

        explanation_cids = set()
        for seq in sampled_sequences:
            explanation_cids.update(seq)

        explanations = self.explanation_generator.generate_for_concept(
            uid, list(explanation_cids), strategy_extract, strategy_prune
        )

        sequence_details = []
        sequence_pn_values: List[float] = []
        sequence_ps_values: List[float] = []

        # Remove/keep explanation edges and compare rank shifts
        for sequence in sampled_sequences:
            base_rank = self._find_sequence_rank(base.sequence_rankings, sequence)

            ex_edges: Set[EdgeKey] = set()
            for cid in sequence:
                ex_edges.update(self._extract_explanation_edges(explanations.get(cid, []), kg_full))

            sequence_prereq_edges = self._get_sequence_prerequisite_edges(sequence)
            ex_edges = ex_edges - sequence_prereq_edges

            logger.info(
                f"sequence validation: sequence={list(sequence)}, "
                f"num_explanation_edges={len(ex_edges)}, base_rank={base_rank}"
            )

            pn_rankings = self._build_rankings(
                kg_full.remove_edges(ex_edges),
                uid,
                mid,
                concept_top_k,
                sequence_top_k,
                gcn_engine,
            )
            pn_new_rank = self._find_sequence_rank(pn_rankings.sequence_rankings, sequence)
            pn = 1.0 if (pn_new_rank is None or pn_new_rank != base_rank) else 0.0

            ps_rankings = self._build_rankings(
                kg_full.keep_only_edges(ex_edges),
                uid,
                mid,
                concept_top_k,
                sequence_top_k,
                gcn_engine,
            )
            ps_top3_sequences = [tuple(item["sequence"]) for item in ps_rankings.sequence_rankings[:3]]
            ps = 1.0 if sequence in ps_top3_sequences else 0.0

            sequence_pn_values.append(pn)
            sequence_ps_values.append(ps)
            sequence_details.append(
                {
                    "sequence": list(sequence),
                    "base_rank": base_rank,
                    "pn_new_rank": pn_new_rank,
                    "pn": pn,
                    "ps": ps,
                    "ps_top3_sequences": [list(seq) for seq in ps_top3_sequences],
                    "num_explanation_edges": len(ex_edges),
                }
            )

        sequence_pn_avg = sum(sequence_pn_values) / len(sequence_pn_values) if sequence_pn_values else 0.0
        sequence_ps_avg = sum(sequence_ps_values) / len(sequence_ps_values) if sequence_ps_values else 0.0

        return {
            "model": self.gcn_type,
            "extract_method": strategy_extract,
            "prune_method": strategy_prune,
            "sample_size": self.sample_size,
            "sampled_concepts": [],
            "sampled_sequences": [list(seq) for seq in sampled_sequences],
            "concept_pn_avg": 0.0,
            "concept_ps_avg": 0.0,
            "sequence_pn_avg": sequence_pn_avg,
            "sequence_ps_avg": sequence_ps_avg,
            "pn": sequence_pn_avg,
            "ps": sequence_ps_avg,
            "fns": self._fns(sequence_pn_avg, sequence_ps_avg),
            "recommended_concepts": concept_cids,
            "recommended_sequences": [list(item["sequence"]) for item in base.sequence_rankings],
            "concept_details": [],
            "sequence_details": sequence_details,
        }

    # Evaluate all explanation models
    def evaluate_all_methods(
        self,
        uid: str,
        mid: str,
        concept_top_k: int = 5,
        sequence_top_k: int = 10,
        extract_methods: Sequence[str] = ("method_1", "method_2", "method_3"),
        prune_methods: Sequence[str] = ("method_1", "method_2", "method_3"),
    ) -> List[Dict[str, Any]]:
        results = []
        for extract_method in extract_methods:
            for prune_method in prune_methods:
                results.append(
                    self.evaluate_method(
                        uid=uid,
                        mid=mid,
                        concept_top_k=concept_top_k,
                        sequence_top_k=sequence_top_k,
                        strategy_extract=extract_method,
                        strategy_prune=prune_method,
                    )
                )
        return results