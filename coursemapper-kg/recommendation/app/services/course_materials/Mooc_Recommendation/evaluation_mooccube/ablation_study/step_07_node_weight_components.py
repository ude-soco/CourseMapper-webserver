"""
step_07_node_weight_components.py

Goal:
------------
    Compute node-level weight components for enrolled and interested relations.

Inputs:
------------
    1. raw_enrolled_relationship_dictionary.jsonl
    2. raw_interested_relationship_dictionary.jsonl
    3. course_embeddings.npy
    4. concept_name_embeddings.npy

Outputs:
------------
    1. enrolled_relation_info.jsonl
    2. interested_relation_info.jsonl
    3. node_weight_statistics.json

Run:
    cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/evaluation_mooccube/ablation_study
    python step_07_node_weight_components.py
"""

import numpy as np

from config import (
    RAW_ENROLLED_RELATIONSHIP_DICTIONARY_JSONL,
    RAW_INTERESTED_RELATIONSHIP_DICTIONARY_JSONL,
    ENROLLED_RELATION_INFO_JSONL,
    INTERESTED_RELATION_INFO_JSONL,
    NODE_WEIGHT_STATISTICS_JSON,
    COURSE_EMBEDDINGS_PATH,
    FINAL_COURSE_ID_TO_INDEX_PATH,
    CONCEPT_NAME_EMBEDDINGS_PATH,
    CONCEPT_ID_TO_INDEX_PATH,
    ensure_directories,
)

from utils import (
    load_json,
    save_json,
    load_jsonl,
    save_jsonl,
    load_npy,
    cosine_similarity,
    print_info,
)


# ============================================================
# Basic helpers
# ============================================================

def get_embedding(embedding_matrix, id_to_index, item_id):
    """Get one embedding vector by id."""
    return embedding_matrix[id_to_index[item_id]]

# calculate position_time and position_weight for nodes in a relation
def add_position_weights(nodes, sort_keys):
    """
    Add position_time and position_weight.

    If position is not available:
        position_weight = 1.0
    """

    nodes = sorted(nodes, key=lambda x: tuple(x[k] for k in sort_keys))

    timestamps = [node["timestamp"] for node in nodes]
    unique_timestamps = sorted(set(timestamps))

    node_number = len(nodes)
    position_available = node_number > 1 and len(unique_timestamps) > 1

    if not position_available:
        for node in nodes:
            node["position_time"] = 0
            node["position_weight"] = 1.0
        return nodes, position_available
    
    # Same timestamp -> same group id.
    timestamp_to_group_id = {
        timestamp: i for i, timestamp in enumerate(unique_timestamps)
    }


    for node in nodes:
        group_id = timestamp_to_group_id[node["timestamp"]]
        node["position_time"] = group_id
        node["position_weight"] = group_id / (node_number - 1)

    return nodes, position_available


def add_full_node_weights(nodes, position_available):
    """
    Add full_node_weight.

    If position is not available:
        full_node_weight = first_weight_component
    Otherwise:
        full_node_weight = 0.5 * first_weight_component + 0.5 * position_weight
    """
    for node in nodes:
        first_weight = node["first_weight_component"]
        position_weight = node["position_weight"]

        node["full_node_weight"] = (
            first_weight
            if not position_available
            else 0.5 * first_weight + 0.5 * position_weight
        )

    return nodes


# ============================================================
# Enrolled relation
# ============================================================

def build_enrolled_relation_info(record, course_embeddings, course_id_to_index):
    """
    Build weighted enrolled relation info for one user.

    first_weight_component:
        cos(final course embedding, learner initial embedding)
    """
    nodes, position_available = add_position_weights(
        record["nodes"],
        sort_keys=["timestamp", "course_id"],
    )

    course_vectors = [
        get_embedding(course_embeddings, course_id_to_index, node["course_id"])
        for node in nodes
    ]

    learner_initial_embedding = np.mean(course_vectors, axis=0)

    for node in nodes:
        course_embedding = get_embedding(
            course_embeddings,
            course_id_to_index,
            node["course_id"],
        )

        node["first_weight_component"] = cosine_similarity(
            course_embedding,
            learner_initial_embedding,
        )

    nodes = add_full_node_weights(nodes, position_available)
    inner_weight_sum = sum(node["full_node_weight"] for node in nodes)

    return {
        "user_id": record["user_id"],
        "relation_name": "enrolled",
        "node_count": len(nodes),
        "position_available": position_available,
        "inner_weight_sum": float(inner_weight_sum),
        "nodes": nodes,
    }


# ============================================================
# Interested relation
# ============================================================

def build_interested_relation_info(
    record,
    concept_embeddings,
    concept_id_to_index,
    course_embeddings,
    course_id_to_index,
):
    """
    Build weighted interested relation info for one user.

    first_weight_component:
        cos(concept name embedding, source course final embedding)
    """
    nodes, position_available = add_position_weights(
        record["nodes"],
        sort_keys=["timestamp", "source_course_id", "concept_id"],
    )

    for node in nodes:
        concept_embedding = get_embedding(
            concept_embeddings,
            concept_id_to_index,
            node["concept_id"],
        )

        source_course_embedding = get_embedding(
            course_embeddings,
            course_id_to_index,
            node["source_course_id"],
        )

        node["first_weight_component"] = cosine_similarity(
            concept_embedding,
            source_course_embedding,
        )

    nodes = add_full_node_weights(nodes, position_available)
    inner_weight_sum = sum(node["full_node_weight"] for node in nodes)

    return {
        "user_id": record["user_id"],
        "relation_name": "interested",
        "node_count": len(nodes),
        "position_available": position_available,
        "inner_weight_sum": float(inner_weight_sum),
        "nodes": nodes,
    }


# ============================================================
# Statistics
# ============================================================

def collect_node_values(records, field):
    """Collect one node-level field from relation info records."""
    return [node[field] for record in records for node in record["nodes"]]


def safe_min(values):
    """Return min value or None."""
    return float(min(values)) if values else None


def safe_max(values):
    """Return max value or None."""
    return float(max(values)) if values else None


def count_negative(values):
    """Count negative values."""
    return sum(1 for value in values if value < 0)


def build_statistics(enrolled_infos, interested_infos):
    """Build simple statistics for weight checking."""
    enrolled_first = collect_node_values(enrolled_infos, "first_weight_component")
    interested_first = collect_node_values(interested_infos, "first_weight_component")

    full_weights = (
        collect_node_values(enrolled_infos, "full_node_weight")
        + collect_node_values(interested_infos, "full_node_weight")
    )

    inner_sums = (
        [record["inner_weight_sum"] for record in enrolled_infos]
        + [record["inner_weight_sum"] for record in interested_infos]
    )

    return {
        "enrolled_first_weight_min": safe_min(enrolled_first),
        "enrolled_first_weight_max": safe_max(enrolled_first),
        "enrolled_first_weight_negative_count": count_negative(enrolled_first),

        "interested_first_weight_min": safe_min(interested_first),
        "interested_first_weight_max": safe_max(interested_first),
        "interested_first_weight_negative_count": count_negative(interested_first),

        "full_node_weight_min": safe_min(full_weights),
        "full_node_weight_max": safe_max(full_weights),
        "full_node_weight_negative_count": count_negative(full_weights),

        "inner_weight_sum_min": safe_min(inner_sums),
        "inner_weight_sum_zero_or_near_zero_count": sum(
            1 for value in inner_sums if abs(value) < 1e-8
        ),
    }


# ============================================================
# Main
# ============================================================

def main():
    """Run Step 07."""
    ensure_directories()

    print_info("Step 07: computing node weight components...")

    enrolled_records = load_jsonl(RAW_ENROLLED_RELATIONSHIP_DICTIONARY_JSONL)
    interested_records = load_jsonl(RAW_INTERESTED_RELATIONSHIP_DICTIONARY_JSONL)

    course_embeddings = load_npy(COURSE_EMBEDDINGS_PATH)
    concept_embeddings = load_npy(CONCEPT_NAME_EMBEDDINGS_PATH)

    course_id_to_index = load_json(FINAL_COURSE_ID_TO_INDEX_PATH)
    concept_id_to_index = load_json(CONCEPT_ID_TO_INDEX_PATH)

    enrolled_infos = [
        build_enrolled_relation_info(record, course_embeddings, course_id_to_index)
        for record in enrolled_records
    ]

    interested_infos = [
        build_interested_relation_info(
            record,
            concept_embeddings,
            concept_id_to_index,
            course_embeddings,
            course_id_to_index,
        )
        for record in interested_records
    ]

    statistics = build_statistics(enrolled_infos, interested_infos)

    save_jsonl(enrolled_infos, ENROLLED_RELATION_INFO_JSONL)
    save_jsonl(interested_infos, INTERESTED_RELATION_INFO_JSONL)
    save_json(statistics, NODE_WEIGHT_STATISTICS_JSON)

    print_info("Step 07 finished.")
    print_info(f"Enrolled relation info records: {len(enrolled_infos)}")
    print_info(f"Interested relation info records: {len(interested_infos)}")


if __name__ == "__main__":
    main()