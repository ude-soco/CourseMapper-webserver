"""
step_01_dataset_process.py

Goal:
    Process the original MOOCCube dataset into clean processed JSONL files.

Input:
    dataset/original/user.json
    dataset/original/course.json
    dataset/original/concept.json
    dataset/original/course-concept.json

Output:
    dataset/processed/processed_users.jsonl
    dataset/processed/processed_courses.jsonl
    dataset/processed/processed_concepts.jsonl
    dataset/processed/processed_course_concepts.jsonl

Important:
    This script follows the old preprocessing logic.
    The train/test end dates are parsed as datetime at 00:00:00.

Run:
    cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/evaluation_mooccube/ablation_study
    python step_01_dataset_process.py
"""

from config import *
from utils import *

from datetime import datetime

# # Basic filtering settings.
# MIN_COURSE_PER_USER = 4

# # Use datetime, not date.
# # This keeps the same boundary behavior as the old code.
# TRAIN_START = datetime.strptime("2016-10-01", "%Y-%m-%d")
# TRAIN_END = datetime.strptime("2017-12-30", "%Y-%m-%d")
# TEST_START = datetime.strptime("2018-01-01", "%Y-%m-%d")
# TEST_END = datetime.strptime("2018-03-31", "%Y-%m-%d")

# Parse date strings from config.py.
# Keep all experiment time settings in config.py as the single source of truth.
TRAIN_START = datetime.strptime(TRAIN_START_DATE, "%Y-%m-%d")
TRAIN_END = datetime.strptime(TRAIN_END_DATE, "%Y-%m-%d")

TEST_START = datetime.strptime(TEST_START_DATE, "%Y-%m-%d")
TEST_END = datetime.strptime(TEST_END_DATE, "%Y-%m-%d")


def build_course_concept_map(course_concept_pairs):
    """
    Build a course-to-concepts dictionary.

    Output:
        {
            course_id: [concept_id_1, concept_id_2, ...]
        }
    """
    course_concept_map = {}

    for course_id, concept_id in course_concept_pairs:
        course_concept_map.setdefault(course_id, []).append(concept_id)

    return course_concept_map


def output_processed_concepts(concepts, course_concept_map):
    """
    Create processed_concepts.jsonl.

    Only concepts appearing in course-concept relations are kept.

    Return:
        valid_concept_ids
    """
    used_concept_ids = set()
    for concept_ids in course_concept_map.values():
        used_concept_ids.update(concept_ids)

    processed_concepts = [
        {"concept_id": c["id"], "concept_name": c["name"]}
        for c in concepts
        if c["id"] in used_concept_ids
    ]

    save_jsonl(processed_concepts, PROCESSED_CONCEPTS_JSONL)
    print("processed_concepts:", len(processed_concepts))

    return set(c["concept_id"] for c in processed_concepts)


def output_processed_courses(courses, course_concept_map, valid_concept_ids):
    """
    Create processed_courses.jsonl.

    Each course keeps:
        course_id
        course_name
        concept_ids

    Return:
        processed_courses
    """
    processed_courses = []

    for course in courses:
        course_id = course["id"]
        concept_ids = [cid for cid in course_concept_map.get(course_id, []) if cid in valid_concept_ids]

        processed_courses.append({
            "course_id": course_id,
            "course_name": course["name"],
            "concept_ids": concept_ids,
        })

    save_jsonl(processed_courses, PROCESSED_COURSES_JSONL)
    print("processed_courses:", len(processed_courses))

    return processed_courses


def output_processed_course_concepts(processed_courses):
    """
    Create processed_course_concepts.jsonl.

    This file saves course-concept pairs explicitly.
    """
    processed_course_concepts = []

    for course in processed_courses:
        for concept_id in course["concept_ids"]:
            processed_course_concepts.append({
                "course_id": course["course_id"],
                "concept_id": concept_id,
            })

    save_jsonl(processed_course_concepts, PROCESSED_COURSE_CONCEPTS_JSONL)
    print("processed_course_concepts:", len(processed_course_concepts))


def output_processed_users(users):
    """
    Create processed_users.jsonl.

    Old preprocessing logic:
        1. Remove users with fewer than MIN_COURSE_PER_USER raw courses.
        2. Remove users whose course_order and enroll_time lengths are different.
        3. Parse enroll_time.
        4. Sort courses by enroll_time.
        5. Split courses into train/test by datetime range.
        6. Remove users without train courses or without test courses.

    Note:
        This function does not use date_obj = time_obj.date().
        It compares datetime directly, so the whole boundary day is not included.
    """
    processed_users = []

    for user in users:
        course_order = user.get("course_order", []) or []
        enroll_time = user.get("enroll_time", []) or []

        if len(course_order) != len(enroll_time):
            continue

        if len(course_order) < MIN_COURSE_PER_USER:
            continue

        pairs = []

        for course_id, time_str in zip(course_order, enroll_time):
            time_obj = datetime.strptime(str(time_str).strip(), "%Y-%m-%d %H:%M:%S")
            pairs.append((course_id, time_obj))

        pairs.sort(key=lambda x: x[1])

        train_courses = []
        test_courses = []

        for course_id, time_obj in pairs:
            record = {"course_id": course_id, "enroll_time": time_obj.strftime("%Y-%m-%d %H:%M:%S")}

            if TRAIN_START <= time_obj <= TRAIN_END:
                train_courses.append(record)
            elif TEST_START <= time_obj <= TEST_END:
                test_courses.append(record)

        if len(train_courses) == 0 or len(test_courses) == 0:
            continue

        processed_users.append({
            "user_id": user["id"],
            "user_name": user.get("name", ""),
            "train_courses": train_courses,
            "test_courses": test_courses,
        })

    save_jsonl(processed_users, PROCESSED_USERS_JSONL)
    print("processed_users:", len(processed_users))


def main():
    """
    Run Step 01 dataset processing.
    """
    ensure_dirs()

    print("Loading raw data...")
    users = load_jsonl(USER_JSON)
    courses = load_jsonl(COURSE_JSON)
    concepts = load_jsonl(CONCEPT_JSON)
    course_concept_pairs = load_course_concept_pairs(COURSE_CONCEPT_JSON)

    print("Building course-concept map...")
    course_concept_map = build_course_concept_map(course_concept_pairs)

    print("Saving processed concepts...")
    valid_concept_ids = output_processed_concepts(concepts, course_concept_map)

    print("Saving processed courses...")
    processed_courses = output_processed_courses(courses, course_concept_map, valid_concept_ids)

    print("Saving processed course-concept pairs...")
    output_processed_course_concepts(processed_courses)

    print("Saving processed users...")
    output_processed_users(users)

    print("Step 01 dataset process finished.")


if __name__ == "__main__":
    main()