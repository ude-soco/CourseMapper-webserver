"""
step_05_selected_concepts.py

Goal:
------------
Select top-K concepts for each course based on cosine similarity.

Formula:
------------
For each course c and concept k in K(c):

    score(c, k) = cos(e_c_name, e_k_name)

Then select top-K concepts with the highest scores.

Input:
------------
1. processed_courses.jsonl
2. course_embeddings.npy
3. course_id_to_index.json
4. concept_name_embeddings.npy
5. concept_id_to_index.json

Output:
------------
selected_concepts/course_top20_concepts.jsonl

Note:
------------
This step is only used to reduce the number of concepts
for the later User --interested--> Concept relation.
It is not used to build final course embeddings.

Run:
    cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/evaluation_mooccube/ablation_study
    python step_05_selected_concepts.py
"""

from config import *
from utils import *


# ============================================================
# 1. Load input files
# ============================================================

def load_inputs():
    """Load courses and embedding files."""
    print_info("Loading input files for Step 05...")

    courses = load_jsonl(PROCESSED_COURSES_JSONL)

    # course_name_embeddings = load_npy(COURSE_NAME_EMBEDDINGS_PATH)
    course_embeddings = load_npy(COURSE_EMBEDDINGS_PATH)
    course_id_to_index = load_json(COURSE_ID_TO_INDEX_PATH)

    concept_name_embeddings = load_npy(CONCEPT_NAME_EMBEDDINGS_PATH)
    concept_id_to_index = load_json(CONCEPT_ID_TO_INDEX_PATH)

    print_info(f"Course count: {len(courses)}")
    print_info(f"Course embedding shape: {course_embeddings.shape}")
    print_info(f"Concept name embedding shape: {concept_name_embeddings.shape}")

    return (
        courses,
        course_embeddings,
        course_id_to_index,
        concept_name_embeddings,
        concept_id_to_index,
    )


# ============================================================
# 2. Select top concepts for one course
# ============================================================

def select_top_concepts_for_one_course(
    course,
    course_embeddings,
    course_id_to_index,
    concept_name_embeddings,
    concept_id_to_index,
):
    """
    Select top-K concepts for one course.

    If the course has fewer than TOP_K_CONCEPTS valid concepts,
    keep all valid concepts.
    """
    course_id = str(course.get("course_id", "")).strip()
    concept_ids = course.get("concept_ids", []) or []

    if course_id not in course_id_to_index:
        return {
            "course_id": course_id,
            "top_concepts": [],
            "note": "course_id_not_found"
        }

    course_index = course_id_to_index[course_id]
    e_course = course_embeddings[course_index]

    scored_concepts = []
    missing_concept_count = 0

    for concept_id in concept_ids:
        concept_id = str(concept_id).strip()

        if not concept_id:
            continue

        if concept_id not in concept_id_to_index:
            missing_concept_count += 1
            continue

        concept_index = concept_id_to_index[concept_id]
        e_concept_name = concept_name_embeddings[concept_index]

        score = cosine_similarity(e_course, e_concept_name)

        scored_concepts.append({
            "concept_id": concept_id,
            "score": score,
        })

    # Sort by cosine similarity from high to low
    scored_concepts.sort(key=lambda x: x["score"], reverse=True)

    # Keep top-K concepts
    top_concepts = scored_concepts[:TOP_K_CONCEPTS]

    # Add rank
    for rank, item in enumerate(top_concepts, start=1):
        item["rank"] = rank

    result = {
        "course_id": course_id,
        "top_concepts": top_concepts,
    }

    if missing_concept_count > 0:
        result["missing_concept_count"] = missing_concept_count

    return result


# ============================================================
# 3. Select top concepts for all courses
# ============================================================

def select_top_concepts_for_all_courses(
    courses,
    course_embeddings,
    course_id_to_index,
    concept_name_embeddings,
    concept_id_to_index,
):
    """Select top-K concepts for every course."""
    print_info("Selecting top concepts for all courses...")

    results = []

    no_top_concept_count = 0
    course_not_found_count = 0
    total_missing_concept_count = 0

    for course in courses:
        result = select_top_concepts_for_one_course(
            course=course,
            course_embeddings=course_embeddings,
            course_id_to_index=course_id_to_index,
            concept_name_embeddings=concept_name_embeddings,
            concept_id_to_index=concept_id_to_index,
        )

        results.append(result)

        if len(result["top_concepts"]) == 0:
            no_top_concept_count += 1

        if result.get("note") == "course_id_not_found":
            course_not_found_count += 1

        total_missing_concept_count += result.get("missing_concept_count", 0)

    print_info(f"Output course count: {len(results)}")
    print_info(f"Courses with no selected concepts: {no_top_concept_count}")
    print_info(f"Courses missing from course_id_to_index: {course_not_found_count}")
    print_info(f"Missing concept references skipped: {total_missing_concept_count}")

    return results


# ============================================================
# 4. Save output
# ============================================================

def save_selected_concepts(results):
    """Save selected top concepts as JSONL."""
    print_info("Saving selected top concepts...")

    save_jsonl(results, COURSE_TOP20_CONCEPTS_JSONL)

    print_info(f"Saved selected concepts to: {COURSE_TOP20_CONCEPTS_JSONL}")


# ============================================================
# Main
# ============================================================

def main():
    print_info("Step 05 started: selected top concepts.")

    ensure_dirs()

    (
        courses,
        course_embeddings,
        course_id_to_index,
        concept_name_embeddings,
        concept_id_to_index,
    ) = load_inputs()

    results = select_top_concepts_for_all_courses(
        courses=courses,
        course_embeddings=course_embeddings,
        course_id_to_index=course_id_to_index,
        concept_name_embeddings=concept_name_embeddings,
        concept_id_to_index=concept_id_to_index,
    )

    save_selected_concepts(results)

    print_info("Step 05 finished: selected top concepts DONE.")


if __name__ == "__main__":
    main()