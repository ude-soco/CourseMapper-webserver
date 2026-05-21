
"""
user_enroll_relation_dict = {
    "ENROLL": {
        "summary": {
            "relation_type": "ENROLL",          # relation type name
            "node_count": 3,                    # the number of course nodes under this relation
            "ignore_position": False,           # if position_weight is ignored, then node_weight = first_weight_component; otherwise, node_weight = (first_weight_component + position_weight) / 2
            "relation_weight_sum": 2.1458,      # the sum of node_weight for all nodes under this relation
            "has_enroll_relationship": True     # whether ENROLL relationship exists
        },
        "nodes": {
            "course_id_1": {
                "course_id": "course_id_1",                # course ID
                "enroll_time": "2017-08-16 10:32:24",      # enrollment time
                "position_time": 0,                        # position time index
                "position_weight": 0.0,                    # position weight
                "first_weight_component": 0.8123,          # first weight component
                "node_weight": 0.40615,                    # final node weight
                "course_final_embedding_index": 12,        # final embedding index
                "course_initial_embedding_index": 45       # initial embedding index
            },
            
        }
    }
}

Note: 
1. "summary" contains the overall statistics at the relation level.
2. "nodes" contains all the course nodes under the current ENROLL relation, keyed by
3. course_id. Only one node structure is shown above, and the rest of the nodes follow the same structure.
"""
"""
This file only does one thing:
Given a user_id, directly read data from file paths and build the user's ENROLL relationship dictionary.
"""


import numpy as np

from config import (
    LEARNER_TRAINING_DATA_PATH,
    USER_COURSE_FINAL_MAPPING_PATH,
    COURSE_INITIAL_ID_TO_INDEX_PATH,
    COURSE_INITIAL_EMBEDDING_PATH,
)
from utils import load_json, parse_time, cosine_similarity, save_json




def build_user_enroll_relation_dict(user_id):
    # Step 1: Read the required files from disk.
   
    learner_training_list = load_json(LEARNER_TRAINING_DATA_PATH)
    user_course_final_mapping = load_json(USER_COURSE_FINAL_MAPPING_PATH)
    course_initial_id_to_index = load_json(COURSE_INITIAL_ID_TO_INDEX_PATH)
    course_initial_embeddings = np.load(COURSE_INITIAL_EMBEDDING_PATH).astype(np.float32)

    # Step 2: Initialize an empty ENROLL dictionary for the current user.
    
    result = {
        "ENROLL": {
            "summary": {
                "relation_type": "ENROLL",
                "node_count": 0,
                "ignore_position": True,
                "relation_weight_sum": 0.0,
                "has_enroll_relationship": False,
            },
            "nodes": {}
        }
    }

    # Step 3: Find the training courses of the current user.
  
    training_courses = []
    for item in learner_training_list:
        if str(item.get("user_id", "")).strip() == str(user_id):
            training_courses = item.get("training_courses", [])
            break

    # Step 4: Build the learner initial embedding by averaging the initial embeddings of training courses.

    learner_course_vectors = []
    for item in training_courses:
        course_id = str(item.get("course_id", "")).strip()
        if course_id in course_initial_id_to_index:
            idx = int(course_initial_id_to_index[course_id])
            learner_course_vectors.append(course_initial_embeddings[idx])

    if len(learner_course_vectors) > 0:
        learner_initial_embedding = np.mean(np.array(learner_course_vectors, dtype=np.float32), axis=0)
    else:
        learner_initial_embedding = None

    # Step 5: Collect all course nodes under the ENROLL relation.
  
    raw_nodes = user_course_final_mapping.get(str(user_id), [])
    nodes = {}

    for item in raw_nodes:
        course_id = str(item.get("course_id", "")).strip()
        if not course_id:
            continue
        if course_id not in course_initial_id_to_index:
            continue

        nodes[course_id] = {
            "course_id": course_id,
            "enroll_time": item.get("enroll_time"),
            "position_time": 0,
            "position_weight": 0.0,
            "first_weight_component": None,
            "node_weight": None,
            "course_final_embedding_index": int(item.get("course_final_embedding_index")),
            "course_initial_embedding_index": int(course_initial_id_to_index[course_id]),
        }

    # Step 6: Update the relation-level summary information.
  
    node_count = len(nodes)
    result["ENROLL"]["summary"]["node_count"] = node_count
    result["ENROLL"]["summary"]["has_enroll_relationship"] = (node_count > 0)

    if node_count == 0:
        return result

    # Step 7: Decide whether position should be ignored, then compute position_time and position_weight.

    enroll_times = [nodes[cid]["enroll_time"] for cid in nodes]

    if node_count == 1 or len(set(enroll_times)) == 1:
        ignore_position = True
        for course_id in nodes:
            nodes[course_id]["position_time"] = 0
            nodes[course_id]["position_weight"] = 0.0
    else:
        ignore_position = False
        unique_times = sorted(set(enroll_times), key=parse_time)
        time_to_position = {}
        for i, t in enumerate(unique_times):
            time_to_position[t] = i

        for course_id in nodes:
            t = nodes[course_id]["enroll_time"]
            position_time = time_to_position[t]
            nodes[course_id]["position_time"] = position_time
            nodes[course_id]["position_weight"] = position_time / (node_count - 1)

        nodes = dict(sorted(nodes.items(), key=lambda x: (x[1]["position_time"], x[0])))

    result["ENROLL"]["summary"]["ignore_position"] = ignore_position

    # Step 8: Compute first_weight_component, node_weight, and relation_weight_sum.

    relation_weight_sum = 0.0

    for course_id in nodes:
        initial_idx = nodes[course_id]["course_initial_embedding_index"]
        course_initial_embedding = course_initial_embeddings[initial_idx]

        if learner_initial_embedding is None:
            first_weight_component = 0.0
        else:
            first_weight_component = cosine_similarity(learner_initial_embedding, course_initial_embedding)

        nodes[course_id]["first_weight_component"] = float(first_weight_component)

        if ignore_position:
            node_weight = first_weight_component
        else:
            node_weight = (first_weight_component + nodes[course_id]["position_weight"]) / 2

        nodes[course_id]["node_weight"] = float(node_weight)
        relation_weight_sum += float(node_weight)

    result["ENROLL"]["summary"]["relation_weight_sum"] = float(relation_weight_sum)
    result["ENROLL"]["nodes"] = nodes

    return result


# Helper function for quick saving and local checking.

def save_one_user_enroll_relation_dict(user_id, save_path):
    data = build_user_enroll_relation_dict(user_id)
    save_json(data, save_path)
    return data
