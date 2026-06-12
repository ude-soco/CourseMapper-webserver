"""
step_04_course_embeddings.py

Goal:
------------
Generate final course embeddings based on all concepts connected to each course.

Formula:
------------
For each course c:

    w_c,k = cos(e_c_name, e_k_name)

    e_c_course =
        sum(w_c,k * e_k_name) / sum(w_c,k)

Special case:
------------
If a course has no valid concepts, then:

    e_c_course = e_c_name

Input:
------------
1. processed_courses.jsonl
2. concept_name_embeddings.npy
3. concept_id_to_index.json
4. course_name_embeddings.npy
5. course_id_to_index.json

Output:
------------
course_embeddings.npy

Note:
------------
course_embeddings.npy reuses the same course_id_to_index.json
generated in Step 03.


Run:
cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/evaluation_mooccube/ablation_study
python step_04_course_embeddings.py
"""

import numpy as np

from config import *
from utils import *


# ============================================================
# 1. Load input files
# ============================================================

def load_inputs():
    """Load processed courses and embedding files."""
    print_info("Loading input files for Step 04...")

    courses = load_jsonl(PROCESSED_COURSES_JSONL)

    concept_embeddings = load_npy(CONCEPT_NAME_EMBEDDINGS_PATH)
    concept_id_to_index = load_json(CONCEPT_ID_TO_INDEX_PATH)

    course_name_embeddings = load_npy(COURSE_NAME_EMBEDDINGS_PATH)
    course_id_to_index = load_json(COURSE_ID_TO_INDEX_PATH)

    print_info(f"Course count: {len(courses)}")
    print_info(f"Concept embedding shape: {concept_embeddings.shape}")
    print_info(f"Course name embedding shape: {course_name_embeddings.shape}")

    return (
        courses,
        concept_embeddings,
        concept_id_to_index,
        course_name_embeddings,
        course_id_to_index,
    )


# ============================================================
# 2. Build one course embedding
# ============================================================

def build_one_course_embedding(
    course,
    concept_embeddings,
    concept_id_to_index,
    course_name_embeddings,
    course_id_to_index,
):
    """
    Build final embedding for one course.

    If no valid concept exists, fallback to course name embedding.
    """
    course_id = str(course.get("course_id", "")).strip()
    concept_ids = course.get("concept_ids", []) or []

    if course_id not in course_id_to_index:
        return None, "missing_course"

    course_index = course_id_to_index[course_id]
    e_course_name = course_name_embeddings[course_index].astype(np.float32)

    weighted_sum = np.zeros(EMBEDDING_DIM, dtype=np.float32)
    weight_sum = 0.0
    valid_concept_count = 0
    missing_concept_count = 0

    for concept_id in concept_ids:
        concept_id = str(concept_id).strip()

        if not concept_id:
            continue

        if concept_id not in concept_id_to_index:
            missing_concept_count += 1
            continue

        concept_index = concept_id_to_index[concept_id]
        e_concept_name = concept_embeddings[concept_index].astype(np.float32)

        weight = cosine_similarity(e_course_name, e_concept_name)

        weighted_sum += weight * e_concept_name
        weight_sum += weight
        valid_concept_count += 1

    # Fallback 1: no valid concepts
    if valid_concept_count == 0:
        return e_course_name, "no_valid_concept"

    # Fallback 2: weight sum is zero
    if weight_sum == 0:
        return e_course_name, "zero_weight_sum"

    course_embedding = weighted_sum / weight_sum
    course_embedding = course_embedding.astype(np.float32)

    return course_embedding, {
        "valid_concept_count": valid_concept_count,
        "missing_concept_count": missing_concept_count,
    }


# ============================================================
# 3. Build all course embeddings
# ============================================================

def build_course_embeddings(
    courses,
    concept_embeddings,
    concept_id_to_index,
    course_name_embeddings,
    course_id_to_index,
):
    """
    Build final course embedding matrix.

    The row order follows course_id_to_index.json.
    """
    print_info("Building final course embeddings...")

    course_embeddings = np.zeros_like(course_name_embeddings, dtype=np.float32)

    no_valid_concept_count = 0
    zero_weight_sum_count = 0
    missing_course_count = 0
    missing_concept_total = 0

    for course in courses:
        course_id = str(course.get("course_id", "")).strip()

        embedding, status = build_one_course_embedding(
            course=course,
            concept_embeddings=concept_embeddings,
            concept_id_to_index=concept_id_to_index,
            course_name_embeddings=course_name_embeddings,
            course_id_to_index=course_id_to_index,
        )

        if embedding is None:
            missing_course_count += 1
            continue

        course_index = course_id_to_index[course_id]
        course_embeddings[course_index] = embedding

        if status == "no_valid_concept":
            no_valid_concept_count += 1
        elif status == "zero_weight_sum":
            zero_weight_sum_count += 1
        elif isinstance(status, dict):
            missing_concept_total += status["missing_concept_count"]

    print_info(f"Final course embedding shape: {course_embeddings.shape}")
    print_info(f"Courses with no valid concepts: {no_valid_concept_count}")
    print_info(f"Courses with zero weight sum: {zero_weight_sum_count}")
    print_info(f"Courses missing from course_id_to_index: {missing_course_count}")
    print_info(f"Missing concept references skipped: {missing_concept_total}")

    return course_embeddings


# ============================================================
# 4. Save output
# ============================================================

def save_course_embeddings(course_embeddings):
    """Save final course embedding matrix."""
    print_info("Saving final course embeddings...")

    save_npy(course_embeddings, COURSE_EMBEDDINGS_PATH)

    print_info(f"Saved course embeddings to: {COURSE_EMBEDDINGS_PATH}")
    print_info(f"Reused course id map: {COURSE_ID_TO_INDEX_PATH}")


# ============================================================
# Main
# ============================================================

def main():
    print_info("Step 04 started: final course embedding generation.")

    ensure_dirs()

    (
        courses,
        concept_embeddings,
        concept_id_to_index,
        course_name_embeddings,
        course_id_to_index,
    ) = load_inputs()

    course_embeddings = build_course_embeddings(
        courses=courses,
        concept_embeddings=concept_embeddings,
        concept_id_to_index=concept_id_to_index,
        course_name_embeddings=course_name_embeddings,
        course_id_to_index=course_id_to_index,
    )

    save_course_embeddings(course_embeddings)

    print_info("Step 04 finished: final course embedding generation DONE.")


if __name__ == "__main__":
    main()