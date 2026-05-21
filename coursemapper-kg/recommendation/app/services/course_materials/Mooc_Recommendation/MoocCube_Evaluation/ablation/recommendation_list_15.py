import os
import numpy as np

from config import (
    COURSE_INITIAL_EMBEDDING_PATH,
    COURSE_INITIAL_ID_TO_INDEX_PATH,
    TEST_OUTPUT_DIR,
    ensure_directories,
)
from utils import load_json, save_json, print_info
from variant_store_13 import load_variant_embeddings
from negative_sample_14 import NEGATIVE_SAMPLE_OUTPUT_PATH, generate_negative_sample


"""
Fast recommendation list generator.


Main idea:
1. Normalize all course embeddings once.
2. Normalize learner embeddings once.
3. Use matrix multiplication to score all candidate courses of one user.


"""


def _normalize_rows(matrix):
    """L2-normalize rows"""
    matrix = np.array(matrix, dtype=np.float32)
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return matrix / norms


def _normalize_vector(vector):
    """L2-normalize one vector. """
    vector = np.array(vector, dtype=np.float32)
    norm = np.linalg.norm(vector)
    if norm == 0:
        return vector
    return vector / norm


def generate_recommendation_list(variant_id, top_k=20):
    """
    Generate one top-K recommendation list for each user under one variant.
    
    """
    if not os.path.exists(NEGATIVE_SAMPLE_OUTPUT_PATH):
        generate_negative_sample()

    learner_embeddings, user_id_to_index = load_variant_embeddings(variant_id)
    negative_sample_dict = load_json(NEGATIVE_SAMPLE_OUTPUT_PATH)
    course_initial_embeddings = np.load(COURSE_INITIAL_EMBEDDING_PATH).astype(np.float32)
    course_id_to_index = load_json(COURSE_INITIAL_ID_TO_INDEX_PATH)

    learner_embeddings = _normalize_rows(learner_embeddings)
    course_initial_embeddings = _normalize_rows(course_initial_embeddings)

    output = {}
    total_users = len(negative_sample_dict)

    for idx, (user_id, info) in enumerate(negative_sample_dict.items(), start=1):
        if user_id not in user_id_to_index:
            continue

        learner_embedding = learner_embeddings[int(user_id_to_index[user_id])]
        candidate_course_ids = info.get("candidate_course_ids", [])

        valid_course_ids = []
        valid_indices = []
        for course_id in candidate_course_ids:
            if course_id in course_id_to_index:
                valid_course_ids.append(course_id)
                valid_indices.append(int(course_id_to_index[course_id]))

        if not valid_indices:
            output[user_id] = {"top20_course_ids": []}
            continue

        candidate_matrix = course_initial_embeddings[np.array(valid_indices, dtype=np.int32)]
        scores = candidate_matrix @ _normalize_vector(learner_embedding)

        top_n = min(top_k, len(valid_course_ids))
        top_pos = np.argsort(scores)[::-1][:top_n]
        top_courses = [valid_course_ids[i] for i in top_pos]
        output[user_id] = {"top20_course_ids": top_courses}

        if idx % 1000 == 0 or idx == total_users:
            print_info(f"Variant {variant_id}: generated recommendations for {idx}/{total_users} users")

    ensure_directories()
    save_path = os.path.join(TEST_OUTPUT_DIR, f"recommendation_variant_{variant_id}.json")
    save_json(output, save_path)
    return output


if __name__ == "__main__":
    generate_recommendation_list(1, top_k=20)
