"""
This file only does one thing:
Given a user_id, directly read data from file paths and build the user's INTEREST relationship dictionary.

"""

import numpy as np

from config import (
    LEARNER_TRAINING_DATA_PATH,
    USER_CONCEPT_FINAL_MAPPING_PATH,
    CONCEPT_NAME_ID_TO_INDEX_PATH,
    CONCEPT_NAME_EMBEDDING_PATH,
    COURSE_INITIAL_ID_TO_INDEX_PATH,
    COURSE_INITIAL_EMBEDDING_PATH,
)
from utils import load_json, parse_time, cosine_similarity, save_json





def build_user_interest_relation_dict(user_id):
    # Step 1: Read the required files from disk.

    learner_training_list = load_json(LEARNER_TRAINING_DATA_PATH)
    user_concept_final_mapping = load_json(USER_CONCEPT_FINAL_MAPPING_PATH)
    concept_name_id_to_index = load_json(CONCEPT_NAME_ID_TO_INDEX_PATH)
    concept_name_embeddings = np.load(CONCEPT_NAME_EMBEDDING_PATH).astype(np.float32)
    course_initial_id_to_index = load_json(COURSE_INITIAL_ID_TO_INDEX_PATH)
    course_initial_embeddings = np.load(COURSE_INITIAL_EMBEDDING_PATH).astype(np.float32)

    # Step 2: Initialize an empty INTEREST dictionary for the current user.
  
    result = {
        "INTEREST": {
            "summary": {
                "relation_type": "INTEREST",
                "node_count": 0,
                "ignore_position": True,
                "relation_weight_sum": 0.0,
                "has_interest_relationship": False,
            },
            "nodes": {}
        }
    }

    # Step 3: Find the training concepts of the current user.

    training_concepts = []
    for item in learner_training_list:
        if str(item.get("user_id", "")).strip() == str(user_id):
            training_concepts = item.get("training_concepts", [])
            break

    # Step 4: Collect all concept nodes under the INTEREST relation.

    raw_nodes = user_concept_final_mapping.get(str(user_id), [])
    nodes = {}

    for item in raw_nodes:
        concept_id = str(item.get("concept_id", "")).strip()
        source_course_id = str(item.get("source_course_id", "")).strip()

        if not concept_id:
            continue
        if concept_id not in concept_name_id_to_index:
            continue
        if source_course_id not in course_initial_id_to_index:
            continue

        nodes[concept_id] = {
            "concept_id": concept_id,
            "interest_time": item.get("interest_time"),
            "source_course_id": source_course_id,
            "position_time": 0,
            "position_weight": 0.0,
            "first_weight_component": None,
            "node_weight": None,
            "concept_final_embedding_index": int(item.get("concept_final_embedding_index")),
            "concept_name_embedding_index": int(concept_name_id_to_index[concept_id]),
            "source_course_initial_embedding_index": int(course_initial_id_to_index[source_course_id]),
        }

    # Step 5: Update the relation-level summary information.
    # 第五步：更新关系层面的统计信息。
    node_count = len(nodes)
    result["INTEREST"]["summary"]["node_count"] = node_count
    result["INTEREST"]["summary"]["has_interest_relationship"] = (node_count > 0)

    if node_count == 0:
        return result

    # Step 6: Decide whether position should be ignored, then compute position_time and position_weight.

    interest_times = [nodes[cid]["interest_time"] for cid in nodes]

    if node_count == 1 or len(set(interest_times)) == 1:
        ignore_position = True
        for concept_id in nodes:
            nodes[concept_id]["position_time"] = 0
            nodes[concept_id]["position_weight"] = 0.0
    else:
        ignore_position = False
        unique_times = sorted(set(interest_times), key=parse_time)
        time_to_position = {}
        for i, t in enumerate(unique_times):
            time_to_position[t] = i

        for concept_id in nodes:
            t = nodes[concept_id]["interest_time"]
            position_time = time_to_position[t]
            nodes[concept_id]["position_time"] = position_time
            nodes[concept_id]["position_weight"] = position_time / (node_count - 1)

        nodes = dict(sorted(nodes.items(), key=lambda x: (x[1]["position_time"], x[0])))

    result["INTEREST"]["summary"]["ignore_position"] = ignore_position

    # Step 7: Compute first_weight_component, node_weight, and relation_weight_sum.

    relation_weight_sum = 0.0

    for concept_id in nodes:
        concept_idx = nodes[concept_id]["concept_name_embedding_index"]
        course_idx = nodes[concept_id]["source_course_initial_embedding_index"]

        concept_name_embedding = concept_name_embeddings[concept_idx]
        source_course_initial_embedding = course_initial_embeddings[course_idx]

        first_weight_component = cosine_similarity(
            concept_name_embedding,
            source_course_initial_embedding,
        )
        nodes[concept_id]["first_weight_component"] = float(first_weight_component)

        if ignore_position:
            node_weight = first_weight_component
        else:
            node_weight = (first_weight_component + nodes[concept_id]["position_weight"]) / 2

        nodes[concept_id]["node_weight"] = float(node_weight)
        relation_weight_sum += float(node_weight)

    result["INTEREST"]["summary"]["relation_weight_sum"] = float(relation_weight_sum)
    result["INTEREST"]["nodes"] = nodes

    return result


# Helper function for quick saving and local checking.

def save_one_user_interest_relation_dict(user_id, save_path):
    data = build_user_interest_relation_dict(user_id)
    save_json(data, save_path)
    return data
