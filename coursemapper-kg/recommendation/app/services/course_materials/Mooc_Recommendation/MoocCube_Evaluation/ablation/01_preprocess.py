"""
01_preprocess.py

Goal:
------------
1. Read raw data (user, course, concept, course-concept)
2. Filter users:
   - At least MIN_COURSE_PER_USER courses
   - Sort by time
   - Split into train/test
   - Ensure train/test are not empty
3. Output:
   - processed_user.json
   - processed_course.json
   - processed_concept.json

"""
"""
Run:
    cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/MoocCube_Evaluation/ablation
    python 01_preprocess.py
"""

import os

from config import *
from utils import *


# ===============================
# Load Raw Data
# ===============================
def load_raw_data():
    print_info("Loading raw data...")

    users = load_json(USER_JSON)
    courses = load_json(COURSE_JSON)
    concepts = load_json(CONCEPT_JSON)
    course_concepts = load_course_concept_tsv(COURSE_CONCEPT_JSON)

    print_info(f"Users loaded: {len(users)}")
    print_info(f"Courses loaded: {len(courses)}")
    print_info(f"Concepts loaded: {len(concepts)}")
    print_info(f"Course-Concept pairs: {len(course_concepts)}")

    return users, courses, concepts, course_concepts


# ===============================
# Build Course -> Concept Map
# ===============================
def build_course_concept_map(course_concepts):
    """
    input:
        [(course_id, concept_id), ...]

    output:
        {
            course_id: [concept_id, ...]
        }
    """
    print_info("Building course-concept map...")

    course_map = {}

    for course_id, concept_id in course_concepts:
        course_id = str(course_id).strip()
        concept_id = str(concept_id).strip()

        if not course_id or not concept_id:
            continue

        course_map.setdefault(course_id, []).append(concept_id)

    # remove duplicates and keep order
    for k in course_map:
        course_map[k] = deduplicate_keep_order(course_map[k])

    print_info(f"Courses with concepts: {len(course_map)}")
    return course_map


# ===============================
# Process Concepts(only keep those used by courses and with specific ID patterns)
# ===============================
def process_concepts(concepts, course_map):
    """
    only keep concepts that are:
    - used by courses (i.e., appear in course_map)
    - have IDs starting with "K_" or "K_T_"
    """

    print_info("Processing concepts...")

    # all concepts used by courses
    used_concepts = set()
    for concept_list in course_map.values():
        used_concepts.update(concept_list)

    processed = {}

    for c in concepts:
        cid = str(c.get("id", "")).strip()
        cname = str(c.get("name", "")).strip()

        if not cid:
            continue

        # filter 
        if cid not in used_concepts:
            continue

        if not (cid.startswith("K_") or cid.startswith("K_T_")):
            continue

        processed[cid] = {
            "concept_id": cid,
            "concept_name": cname,
        }

    print_info(f"Final concepts: {len(processed)}")
    return processed


# ===============================
# Process Courses
# ===============================
def process_courses(courses, course_map):
    print_info("Processing courses...")

    processed = {}

    for c in courses:
        cid = str(c.get("id", "")).strip()
        cname = str(c.get("name", "")).strip()

        if not cid:
            continue

        processed[cid] = {
            "course_id": cid,
            "course_name": cname,
            "concept_ids": course_map.get(cid, []),
        }

    print_info(f"Processed courses: {len(processed)}")
    return processed


# ===============================
# Process Users
# ===============================
def process_users(users, processed_courses):
    print_info("Processing users...")

    train_start = parse_date(TRAIN_START)
    train_end = parse_date(TRAIN_END)
    test_start = parse_date(TEST_START)
    test_end = parse_date(TEST_END)

    processed_users = []

    for u in users:
        user_id = str(u.get("id", "")).strip()
        user_name = str(u.get("name", "")).strip()

        course_order = u.get("course_order", []) or []
        enroll_time = u.get("enroll_time", []) or []

        # check the lengths match
        if len(course_order) != len(enroll_time):
            continue

        # check minimum courses
        if len(course_order) < MIN_COURSE_PER_USER:
            continue

        pairs = []
        valid = True

        for cid, t in zip(course_order, enroll_time):
            try:
                dt = parse_time(str(t).strip())
                pairs.append((str(cid).strip(), dt))
            except Exception:
                valid = False
                break

        if not valid:
            continue

        # order by enroll_time
        pairs.sort(key=lambda x: x[1])

        train = []
        test = []

        for cid, dt in pairs:
            record = {
                "course_id": cid,
                "enroll_time": dt.strftime("%Y-%m-%d %H:%M:%S"),
            }

            if train_start <= dt <= train_end:
                train.append(record)
            elif test_start <= dt <= test_end:
                test.append(record)

        # must have at least one course in train and one in test
        if len(train) == 0 or len(test) == 0:
            continue

        processed_users.append({
            "user_id": user_id,
            "user_name": user_name,
            "train_courses": train,
            "test_courses": test,
        })

    print_info(f"Final users: {len(processed_users)}")
    return processed_users


# ===============================
# Save
# ===============================
def save_all(users, courses, concepts):
    save_json(users, PROCESSED_USER_JSON)
    save_json(list(courses.values()), PROCESSED_COURSE_JSON)
    save_json(list(concepts.values()), PROCESSED_CONCEPT_JSON)

    print_info("All processed data saved.")


# ===============================
# Main
# ===============================
def main():
    ensure_directories()

    users, courses, concepts, course_concepts = load_raw_data()

    course_map = build_course_concept_map(course_concepts)

    processed_concepts = process_concepts(concepts, course_map)
    processed_courses = process_courses(courses, course_map)
    processed_users = process_users(users, processed_courses)

    save_all(processed_users, processed_courses, processed_concepts)

    print_info("Preprocess DONE ✅")


if __name__ == "__main__":
    main()