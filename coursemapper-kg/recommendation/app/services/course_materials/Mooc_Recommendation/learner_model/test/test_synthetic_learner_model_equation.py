"""
Run example:
    pipenv run python -m app.services.course_materials.Mooc_Recommendation.learner_model.test.test_synthetic_learner_model_equation
"""
from __future__ import annotations

from collections import OrderedDict
from datetime import datetime
from pathlib import Path
import numpy as np
from ..updated_embeddings import ConceptEmbeddingUpdater


THIS_DIR = Path(__file__).resolve().parent
REPORT_PATH = THIS_DIR / "synthetic_learner_model_equation_report.md"



EMBEDDING_DIM = 4


W_REL_DNU = np.array([
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 0.0, 1.0],
])

W_REL_INTEREST = np.array([
    [0.8, 0.1, 0.0, 0.0],
    [0.0, 0.9, 0.1, 0.0],
    [0.0, 0.0, 1.0, 0.1],
    [0.1, 0.0, 0.0, 0.9],
])

W_REL_ENGAGEMENT = np.array([
    [1.0, 0.0, 0.1, 0.0],
    [0.0, 1.0, 0.0, 0.1],
    [0.1, 0.0, 1.0, 0.0],
    [0.0, 0.1, 0.0, 1.0],
])


ENGAGEMENT_LEVEL_MAP = {
    "low": 0.2,
    "medium": 0.3,
    "high": 0.5,
}


def preview(vec: np.ndarray, digits: int = 6) -> str:
    arr = np.asarray(vec, dtype=float)
    return "[" + ", ".join(f"{x:.{digits}f}" for x in arr.tolist()) + "]"


def compute_time_features(info_dict: dict[str, dict]) -> OrderedDict[str, dict]:
    timestamps = {cid: info["timestamp"] for cid, info in info_dict.items()}
    unique_timestamps = sorted(set(timestamps.values()))
    timestamp_group = {ts: i for i, ts in enumerate(unique_timestamps)}
    concept_numbers = len(timestamps)

    for cid, ts in timestamps.items():
        group_id = timestamp_group[ts]
        position_weight = group_id / (concept_numbers - 1) if concept_numbers > 1 else 0.0
        info_dict[cid]["position_weight"] = float(position_weight)
        info_dict[cid]["position_time"] = int(group_id)

    sorted_items = sorted(info_dict.items(), key=lambda x: x[1]["position_time"])
    return OrderedDict(sorted_items)


def build_synthetic_user() -> dict[str, OrderedDict[str, dict]]:
    user_id = "synthetic_user_001"

    dnu = OrderedDict({
        "dnu_concept_1": {
            "relationship": "dnu",
            "unupdated_embedding": np.array([0.10, 0.20, 0.30, 0.40]),
            "weight": 1.0,
            "timestamp": datetime(2026, 3, 1, 9, 0, 0),
        },
        "dnu_concept_2": {
            "relationship": "dnu",
            "unupdated_embedding": np.array([0.20, 0.10, 0.00, 0.50]),
            "weight": 0.8,
            "timestamp": datetime(2026, 3, 3, 9, 0, 0),
        },
        "dnu_concept_3": {
            "relationship": "dnu",
            "unupdated_embedding": np.array([0.30, 0.40, 0.10, 0.20]),
            "weight": 0.6,
            "timestamp": datetime(2026, 3, 5, 9, 0, 0),
        },
    })

    interest = OrderedDict({
        "interest_concept_1": {
            "relationship": "INTERESTED_IN",
            "unupdated_embedding": np.array([0.50, 0.10, 0.20, 0.00]),
            "weight": 0.9,
            "timestamp": datetime(2026, 3, 2, 10, 0, 0),
        },
        "interest_concept_2": {
            "relationship": "INTERESTED_IN",
            "unupdated_embedding": np.array([0.20, 0.30, 0.40, 0.10]),
            "weight": 0.7,
            "timestamp": datetime(2026, 3, 4, 10, 0, 0),
        },
        "interest_concept_3": {
            "relationship": "INTERESTED_IN",
            "unupdated_embedding": np.array([0.60, 0.20, 0.10, 0.20]),
            "weight": 0.8,
            "timestamp": datetime(2026, 3, 4, 10, 0, 0),
        },
        "interest_concept_4": {
            "relationship": "INTERESTED_IN",
            "unupdated_embedding": np.array([0.10, 0.50, 0.20, 0.30]),
            "weight": 0.4,
            "timestamp": datetime(2026, 3, 6, 10, 0, 0),
        },
        "interest_concept_5": {
            "relationship": "INTERESTED_IN",
            "unupdated_embedding": np.array([0.30, 0.20, 0.50, 0.40]),
            "weight": 0.6,
            "timestamp": datetime(2026, 3, 8, 10, 0, 0),
        },
    })

    engagement = OrderedDict({
        "course_1": {
            "relationship": "ENGAGED_IN",
            "unupdated_embedding": np.array([0.40, 0.20, 0.10, 0.30]),
            "weight": ENGAGEMENT_LEVEL_MAP["low"],
            "level": "low",
            "timestamp": datetime(2026, 3, 1, 20, 0, 0),
        },
        "course_2": {
            "relationship": "ENGAGED_IN",
            "unupdated_embedding": np.array([0.20, 0.60, 0.30, 0.10]),
            "weight": ENGAGEMENT_LEVEL_MAP["medium"],
            "level": "medium",
            "timestamp": datetime(2026, 3, 7, 20, 0, 0),
        },
        "course_3": {
            "relationship": "ENGAGED_IN",
            "unupdated_embedding": np.array([0.70, 0.10, 0.40, 0.20]),
            "weight": ENGAGEMENT_LEVEL_MAP["high"],
            "level": "high",
            "timestamp": datetime(2026, 3, 9, 20, 0, 0),
        },
    })

    return {
        "user_id": user_id,
        "dnu": compute_time_features(dnu),
        "interest": compute_time_features(interest),
        "engagement": compute_time_features(engagement),
    }


def compute_relation_component(info_dict: OrderedDict[str, dict]) -> dict:
    if not info_dict:
        return {
            "relation_name": "",
            "ignore_position": True,
            "relation_weight_sum": 0.0,
            "weighted_embedding_sum": np.zeros(EMBEDDING_DIM),
            "normalized_component": np.zeros(EMBEDDING_DIM),
            "rows": [],
        }

    cids = list(info_dict.keys())
    relation_name = info_dict[cids[0]]["relationship"]
    time_indicators = [info_dict[cid]["position_time"] for cid in cids]
    ignore_position = all(ti == 0 for ti in time_indicators)

    relation_weight_sum = 0.0
    weighted_embedding_sum = np.zeros(EMBEDDING_DIM)
    rows = []

    for cid in cids:
        concept = info_dict[cid]
        weight = float(concept["weight"])
        position_weight = float(concept["position_weight"])
        updated_embedding = np.asarray(concept["updated_embedding"], dtype=float)

        if ignore_position:
            relation_weight = weight
            relation_formula = f"ω_{cid} = {weight:.4f}"
        else:
            relation_weight = (weight + position_weight) / 2
            relation_formula = (
                f"ω_{cid} = ({weight:.4f} + {position_weight:.4f}) / 2 = {relation_weight:.4f}"
            )

        weighted_term = relation_weight * updated_embedding
        weighted_embedding_sum += weighted_term
        relation_weight_sum += relation_weight

        rows.append({
            "cid": cid,
            "weight": weight,
            "position_weight": position_weight,
            "position_time": concept["position_time"],
            "relation_weight": relation_weight,
            "relation_formula": relation_formula,
            "updated_embedding": updated_embedding,
            "weighted_term": weighted_term,
        })

    normalized_component = weighted_embedding_sum / relation_weight_sum if relation_weight_sum > 0 else np.zeros(EMBEDDING_DIM)

    return {
        "relation_name": relation_name,
        "ignore_position": ignore_position,
        "relation_weight_sum": relation_weight_sum,
        "weighted_embedding_sum": weighted_embedding_sum,
        "normalized_component": normalized_component,
        "rows": rows,
    }


def write_relation_section(lines: list[str], section_name: str, info_dict: OrderedDict[str, dict], relation_result: dict, W_rel: np.ndarray):
    lines.append(f"## Relation: {section_name}")
    lines.append(f"- relation_name: `{relation_result['relation_name']}`")
    lines.append(f"- concept_count: `{len(info_dict)}`")
    lines.append(f"- ignore_position: `{relation_result['ignore_position']}`")
    lines.append("")
    lines.append("### Raw input")
    lines.append("| id | weight | timestamp | position_time | position_weight | embedding |")
    lines.append("|---|---:|---|---:|---:|---|")
    for cid, info in info_dict.items():
        extra = f" ({info['level']})" if 'level' in info else ""
        lines.append(
            f"| {cid}{extra} | {info['weight']:.4f} | {info['timestamp']} | {info['position_time']} | {info['position_weight']:.4f} | `{preview(info['unupdated_embedding'])}` |"
        )
    lines.append("")

    lines.append("### Updated embedding details")
    for row in relation_result["rows"]:
        cid = row["cid"]
        lines.append(f"#### {cid}")
        lines.append(f"- relation weight formula: `{row['relation_formula']}`")
        lines.append(f"- updated_embedding({cid}) = `{preview(row['updated_embedding'])}`")
        lines.append(
            f"- weighted term: `{row['relation_weight']:.4f} × {preview(row['updated_embedding'])} = {preview(row['weighted_term'])}`"
        )
        lines.append("")

    lines.append("### Relation component")
    lines.append(f"- relation_weight_sum = `{relation_result['relation_weight_sum']:.4f}`")
    lines.append(f"- weighted_embedding_sum = `{preview(relation_result['weighted_embedding_sum'])}`")
    lines.append(
        f"- relation_component = weighted_embedding_sum / relation_weight_sum = `{preview(relation_result['normalized_component'])}`"
    )
    lines.append(f"- W_rel_{section_name} =")
    lines.append("```text")
    lines.append(str(W_rel))
    lines.append("```")
    lines.append("")



def run_synthetic_test(append: bool = True) -> Path:
    synthetic_user = build_synthetic_user()
    updater = ConceptEmbeddingUpdater()

    dnu_info = updater.update_embeddings(synthetic_user["dnu"])
    interest_info = updater.update_embeddings(synthetic_user["interest"])
    engagement_info = updater.update_embeddings(synthetic_user["engagement"])

    dnu_component = compute_relation_component(dnu_info)
    interest_component = compute_relation_component(interest_info)
    engagement_component = compute_relation_component(engagement_info)

    dnu_term = W_REL_DNU.dot(dnu_component["normalized_component"])
    interest_term = W_REL_INTEREST.dot(interest_component["normalized_component"])
    engagement_term = W_REL_ENGAGEMENT.dot(engagement_component["normalized_component"])

    omega_total = (
        dnu_component["relation_weight_sum"]
        + interest_component["relation_weight_sum"]
        + engagement_component["relation_weight_sum"]
    )
    learner_model_embedding = (dnu_term + interest_term + engagement_term) / omega_total

    lines: list[str] = []
    lines.append("---")
    lines.append("# Synthetic Learner Model Equation Trace")
    lines.append(f"- user_id: `{synthetic_user['user_id']}`")
    lines.append(f"- embedding_dim: `{EMBEDDING_DIM}`")
    lines.append("- data_source: `synthetic / no database query`")
    lines.append("")
    lines.append("This file uses a fake user with:")
    lines.append("- 3 DNU concept interactions")
    lines.append("- 5 INTERESTED_IN concept interactions")
    lines.append("- 3 ENGAGED_IN course interactions with level = low / medium / high")
    lines.append("")

    write_relation_section(lines, "dnu", dnu_info, dnu_component, W_REL_DNU)
    write_relation_section(lines, "interest", interest_info, interest_component, W_REL_INTEREST)
    write_relation_section(lines, "engagement", engagement_info, engagement_component, W_REL_ENGAGEMENT)

    lines.append("## Final learner model equation")
    lines.append("`E_learner = (dnu_term + interest_term + engagement_term) / (ω_dnu_sum + ω_interest_sum + ω_engagement_sum)`")
    lines.append(f"- ω_dnu_sum = `{dnu_component['relation_weight_sum']:.4f}`")
    lines.append(f"- ω_interest_sum = `{interest_component['relation_weight_sum']:.4f}`")
    lines.append(f"- ω_engagement_sum = `{engagement_component['relation_weight_sum']:.4f}`")
    lines.append(f"- ω_total = `{omega_total:.4f}`")
    lines.append(f"- dnu_term = `W_rel_dnu × relation_component_dnu = {preview(dnu_term)}`")
    lines.append(f"- interest_term = `W_rel_interest × relation_component_interest = {preview(interest_term)}`")
    lines.append(f"- engagement_term = `W_rel_engagement × relation_component_engagement = {preview(engagement_term)}`")
    lines.append(
        f"- final learner embedding = `({preview(dnu_term)} + {preview(interest_term)} + {preview(engagement_term)}) / {omega_total:.4f} = {preview(learner_model_embedding)}`"
    )
    lines.append("")
    lines.append("### Final embedding (full)")
    lines.append("```text")
    lines.append(",".join(f"{x:.10f}" for x in learner_model_embedding.tolist()))
    lines.append("```")
    lines.append("")

    mode = "a" if append else "w"
    with open(REPORT_PATH, mode, encoding="utf-8") as f:
        f.write("\n".join(lines))
        f.write("\n")

    print(f"Synthetic report written to: {REPORT_PATH}")
    print(f"Final learner embedding: {preview(learner_model_embedding)}")
    return REPORT_PATH


if __name__ == "__main__":
    run_synthetic_test(append=True)
