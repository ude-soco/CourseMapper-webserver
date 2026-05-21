"""
Append-only learner model equation tracer.

Run example:
    pipenv run python -m app.services.course_materials.Mooc_Recommendation.learner_model.test.test_learner_model_equation

What it does:
1. Load relationship info for one user
2. Update embeddings for dnu / interest / engagement
3. Compute each relation component step by step
4. Recompute learner model embedding step by step
5. Append a pretty markdown report to learner_model_equation_report.md

Notes:
- This script is intentionally independent from learner_model.LearnerModel.learner_model_pipeline
  so that it can show every intermediate numeric value.
- It also avoids the key-name mismatch in relation_component.py by computing the relation
  component explicitly inside this test file.
"""

from __future__ import annotations

import math
from pathlib import Path
from typing import Dict, Any, Tuple

import numpy as np
import torch

from ...database_connection.MongoDB_connection import MongoDBConnection
from ...database_connection.CourseMapper_connection import CourseMapperConnection
from ..relationship_info import DNUInfo, InterestInfo, EngagementInfo
from ..updated_embeddings import ConceptEmbeddingUpdater
from ..utils import glorot_seed, EMBEDDING_DIM


# ==============================
# configurable test user
# ==============================
UID = "69acb9460e3a21f27e87122f"
TORCH_SEED = 20260319
PREVIEW_DIM = 8
REPORT_FILE = Path(__file__).resolve().parent / "learner_model_equation_report.md"


# ==============================
# formatting helpers
# ==============================

def fmt_float(x: float, digits: int = 6) -> str:
    if isinstance(x, (np.floating, float, int)):
        return f"{float(x):.{digits}f}"
    return str(x)



def fmt_vec(vec: np.ndarray, preview_dim: int = PREVIEW_DIM, digits: int = 6) -> str:
    arr = np.asarray(vec, dtype=float).reshape(-1)
    if arr.size <= preview_dim:
        return "[" + ", ".join(fmt_float(v, digits) for v in arr) + "]"
    head = ", ".join(fmt_float(v, digits) for v in arr[:preview_dim])
    return f"[{head}, ...] (dim={arr.size})"



def relation_label(raw_name: str) -> str:
    mapping = {
        "dnu": "dnu",
        "INTERESTED_IN": "interest",
        "ENGAGED_IN": "engagement",
    }
    return mapping.get(raw_name, str(raw_name).lower())


# ==============================
# core math helpers
# ==============================

def load_relationships(uid: str, coursemapper_db, mongodb_db) -> Dict[str, Dict[str, Any]]:
    dnu_info = DNUInfo(uid, coursemapper_db, mongodb_db).get_dnu_info()
    interest_info = InterestInfo(uid, coursemapper_db, mongodb_db).get_interest_info()
    engagement_info = EngagementInfo(uid, coursemapper_db, mongodb_db).get_engagement_info()
    return {
        "dnu": dnu_info,
        "interest": interest_info,
        "engagement": engagement_info,
    }



def update_relation_embeddings(relations: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    updater = ConceptEmbeddingUpdater()
    updated = {}
    for name, info in relations.items():
        if not info:
            updated[name] = {}
            continue
        updated[name] = updater.update_embeddings(info)
    return updated



def compute_relation_component_verbose(relation_info: Dict[str, Dict[str, Any]]) -> Tuple[Dict[str, Any], list[str]]:
    logs: list[str] = []
    if not relation_info:
        result = {
            "relation_name": "empty",
            "relation_weight_sum": 0.0,
            "weighted_embedding_sum": None,
            "normalized_component": None,
            "details": [],
            "ignore_position": True,
        }
        logs.append("No data found for this relation.")
        return result, logs

    cids = list(relation_info.keys())
    raw_relation_name = relation_info[cids[0]]["relationship"]
    display_name = relation_label(raw_relation_name)

    time_indicators = [relation_info[cid]["position_time"] for cid in cids]
    ignore_position = all(t == 0 for t in time_indicators)
    logs.append(f"ignore_position = {ignore_position}")

    weighted_embedding_sum = None
    relation_weight_sum = 0.0
    details = []

    for cid in cids:
        concept = relation_info[cid]
        weight = float(concept["weight"])
        position_weight = float(concept["position_weight"])
        updated_embedding = np.asarray(concept["updated_embedding"], dtype=float)
        relation_weight = weight if ignore_position else (weight + position_weight) / 2.0

        if weighted_embedding_sum is None:
            weighted_embedding_sum = np.zeros_like(updated_embedding, dtype=float)

        weighted_term = relation_weight * updated_embedding
        weighted_embedding_sum += weighted_term
        relation_weight_sum += relation_weight

        details.append(
            {
                "cid": cid,
                "weight": weight,
                "position_weight": position_weight,
                "position_time": int(concept["position_time"]),
                "relation_weight": relation_weight,
                "updated_embedding": updated_embedding,
                "weighted_term": weighted_term,
            }
        )

        logs.append(
            f"cid={cid} | weight={fmt_float(weight)} | position_weight={fmt_float(position_weight)} "
            f"| relation_weight={fmt_float(relation_weight)}"
        )

    normalized_component = (
        weighted_embedding_sum / relation_weight_sum if relation_weight_sum > 0 else None
    )

    result = {
        "relation_name": display_name,
        "relation_weight_sum": relation_weight_sum,
        "weighted_embedding_sum": weighted_embedding_sum,
        "normalized_component": normalized_component,
        "details": details,
        "ignore_position": ignore_position,
    }
    return result, logs



def build_weight_matrices(seed: int = TORCH_SEED) -> Dict[str, np.ndarray]:
    torch.manual_seed(seed)
    return {
        "dnu": glorot_seed((EMBEDDING_DIM, EMBEDDING_DIM)).detach().cpu().numpy(),
        "interest": glorot_seed((EMBEDDING_DIM, EMBEDDING_DIM)).detach().cpu().numpy(),
        "engagement": glorot_seed((EMBEDDING_DIM, EMBEDDING_DIM)).detach().cpu().numpy(),
    }



def compute_final_embedding(components: Dict[str, Dict[str, Any]], weight_mats: Dict[str, np.ndarray]) -> Dict[str, Any]:
    print("\n========== DEBUG START ==========")

    print("W_rel_dnu shape:", weight_mats["dnu"].shape)
    print("W_rel_interest shape:", weight_mats["interest"].shape)
    print("W_rel_engagement shape:", weight_mats["engagement"].shape)

    dnu_sum = components["dnu"]["relation_weight_sum"]
    interest_sum = components["interest"]["relation_weight_sum"]
    engagement_sum = components["engagement"]["relation_weight_sum"]

    print("\n--- weighted_embedding_sum shapes ---")

    if components["dnu"]["weighted_embedding_sum"] is not None:
        print("dnu:", components["dnu"]["weighted_embedding_sum"].shape)

    if components["interest"]["weighted_embedding_sum"] is not None:
        print("interest:", components["interest"]["weighted_embedding_sum"].shape)

    if components["engagement"]["weighted_embedding_sum"] is not None:
        print("engagement:", components["engagement"]["weighted_embedding_sum"].shape)

    w_sum = dnu_sum + interest_sum + engagement_sum

    if w_sum == 0:
        return {
            "total_weight_sum": 0.0,
            "dnu_term": None,
            "interest_term": None,
            "engagement_term": None,
            "learner_model_embedding": None,
        }

    def term(name: str):
        comp = components[name]
        if comp["relation_weight_sum"] <= 0 or comp["weighted_embedding_sum"] is None:
            return np.zeros(EMBEDDING_DIM, dtype=float)
        normalized_component = comp["weighted_embedding_sum"] / comp["relation_weight_sum"]
        #return weight_mats[name].dot(normalized_component)


        print(f"\n--- {name} DEBUG ---")
        print("normalized_component shape:", normalized_component.shape)
        print("W shape:", weight_mats[name].shape)

        result = weight_mats[name].dot(normalized_component)

        print("after dot shape:", result.shape)

        return result

    dnu_term = term("dnu")
    interest_term = term("interest")
    engagement_term = term("engagement")

    print("\n--- TERM SHAPES ---")
    print("dnu_term:", dnu_term.shape)
    print("interest_term:", interest_term.shape)
    print("engagement_term:", engagement_term.shape)

    learner_model_embedding = (dnu_term + interest_term + engagement_term) / w_sum

    print("\n--- FINAL ---")
    print("final embedding shape:", learner_model_embedding.shape)
    print("final embedding preview:", learner_model_embedding[:10])
    print("========== DEBUG END ==========\n")

    return {
        "total_weight_sum": w_sum,
        "dnu_term": dnu_term,
        "interest_term": interest_term,
        "engagement_term": engagement_term,
        "learner_model_embedding": learner_model_embedding,
    }
    

# ==============================
# report writer
# ==============================

def append_report(uid: str, relations: Dict[str, Dict[str, Any]], components: Dict[str, Dict[str, Any]], weight_mats: Dict[str, np.ndarray], final_result: Dict[str, Any]) -> None:
    lines: list[str] = []
    lines.append("\n\n---\n")
    lines.append(f"# Learner Model Equation Trace\n")
    lines.append(f"- user_id: `{uid}`\n")
    lines.append(f"- torch_seed: `{TORCH_SEED}`\n")
    lines.append(f"- embedding_dim: `{EMBEDDING_DIM}`\n")

    for relation_name in ["dnu", "interest", "engagement"]:
        info = relations[relation_name]
        comp = components[relation_name]

        lines.append(f"\n## Relation: {relation_name}\n")
        lines.append(f"- concept_count: `{len(info)}`\n")
        lines.append(f"- ignore_position: `{comp['ignore_position']}`\n")
        lines.append(f"- relation_weight_sum: `{fmt_float(comp['relation_weight_sum'])}`\n")

        if not info:
            lines.append("- No data for this relation.\n")
            continue

        lines.append("\n### Concept details\n")
        lines.append("| cid | weight | position_weight | position_time | relation_weight | updated_embedding_preview | weighted_term_preview |\n")
        lines.append("|---|---:|---:|---:|---:|---|---|\n")
        for item in comp["details"]:
            lines.append(
                f"| {item['cid']} | {fmt_float(item['weight'])} | {fmt_float(item['position_weight'])} | {item['position_time']} | {fmt_float(item['relation_weight'])} | {fmt_vec(item['updated_embedding'])} | {fmt_vec(item['weighted_term'])} |\n"
            )

        if comp["weighted_embedding_sum"] is not None:
            lines.append("\n### Relation component summary\n")
            lines.append(f"- weighted_embedding_sum preview: `{fmt_vec(comp['weighted_embedding_sum'])}`\n")
            lines.append(f"- normalized component = weighted_embedding_sum / relation_weight_sum\n")
            lines.append(f"- normalized_component preview: `{fmt_vec(comp['normalized_component'])}`\n")
            lines.append(f"- W_rel_{relation_name} first row preview: `{fmt_vec(weight_mats[relation_name][0])}`\n")

    lines.append("\n## Final learner model equation\n")
    lines.append(
        "`E_learner = (dnu_term + interest_term + engagement_term) / (ω_dnu_sum + ω_interest_sum + ω_engagement_sum)`\n"
    )
    lines.append(f"- ω_total = `{fmt_float(final_result['total_weight_sum'])}`\n")

    if final_result["learner_model_embedding"] is None:
        lines.append("- learner_model_embedding: `None`\n")
    else:
        lines.append(f"- dnu_term preview: `{fmt_vec(final_result['dnu_term'])}`\n")
        lines.append(f"- interest_term preview: `{fmt_vec(final_result['interest_term'])}`\n")
        lines.append(f"- engagement_term preview: `{fmt_vec(final_result['engagement_term'])}`\n")
        lines.append(f"- final learner_model_embedding preview: `{fmt_vec(final_result['learner_model_embedding'], preview_dim=16)}`\n")
        lines.append("\n### Final embedding (full)\n")
        lines.append("```text\n")
        lines.append(",".join(f"{float(x):.10f}" for x in final_result["learner_model_embedding"]) + "\n")
        lines.append("```\n")

    with REPORT_FILE.open("a", encoding="utf-8") as f:
        f.writelines(lines)


# ==============================
# main test entry
# ==============================

def test_learner_model_equation_trace(uid: str = UID) -> np.ndarray | None:
    coursemapper_db = CourseMapperConnection()
    mongodb_db = MongoDBConnection()
    try:
        relations = load_relationships(uid, coursemapper_db, mongodb_db)
        updated_relations = update_relation_embeddings(relations)

        components: Dict[str, Dict[str, Any]] = {}
        for name in ["dnu", "interest", "engagement"]:
            components[name], _ = compute_relation_component_verbose(updated_relations[name])

        weight_mats = build_weight_matrices()
        final_result = compute_final_embedding(components, weight_mats)
        append_report(uid, updated_relations, components, weight_mats, final_result)

        print("=" * 80)
        print("Learner model equation trace finished")
        print(f"user_id: {uid}")
        print(f"report_file: {REPORT_FILE}")
        print("=" * 80)

        for name in ["dnu", "interest", "engagement"]:
            comp = components[name]
            print(f"[{name}] count={len(updated_relations[name])}, relation_weight_sum={fmt_float(comp['relation_weight_sum'])}")

        if final_result["learner_model_embedding"] is None:
            print("final learner_model_embedding: None")
            return None

        print("final learner_model_embedding preview:")
        print(fmt_vec(final_result["learner_model_embedding"], preview_dim=16))
        return final_result["learner_model_embedding"]
    finally:
        coursemapper_db.close()
        mongodb_db.close()


if __name__ == "__main__":
    test_learner_model_equation_trace()
