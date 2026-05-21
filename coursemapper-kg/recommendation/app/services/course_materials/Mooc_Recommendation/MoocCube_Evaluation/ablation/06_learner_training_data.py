"""
06_learner_training_data.py

Goal
--------------------------------------------------
For each learner (user), construct a training data file that contains:

1. training_courses
   - course_id
   - enroll_time
   - enroll_position_time

2. training_concepts
   - concept_id
   - interest_time
   - interest_position_time
   - source_course_id   <-- New addition: record the source course of this concept

Core idea
--------------------------------------------------
(1) training_courses come directly from processed_user.json -> train_courses

(2) training_concepts are NOT directly given.
    They are selected from the user's training courses.

    For each training course c:
        - use course initial embedding: e_c^initial
        - compare it with each concept name embedding: e_k^name
        - compute cosine similarity
        - select Top-20 concepts for this course

    Then:
        - merge concepts from all training courses
        - deduplicate by concept_id
        - assign interest_time
        - assign interest_position_time
        - assign source_course_id (course that gives the chosen interest_time)

Important rules
--------------------------------------------------
1. Same enroll_time   -> same enroll_position_time
2. Same interest_time -> same interest_position_time

3. interest_time of a concept:
   - if concept comes from one course:
       interest_time = that course's enroll_time
   - if concept comes from multiple courses:
       interest_time = the latest enroll_time among those courses

4. source_course_id of a concept:
   - choose the course whose enroll_time == interest_time
   - if multiple courses share the same latest time:
       choose deterministically by sorting course_id (stable output)
"""

"""
Output file:
--------------------------------------------------
processed_learner_training.json

Each user record in the output file has the following structure:

{
    "user_id": "...",
    "training_courses": [
        {
            "course_id": "...",
            "enroll_time": "...",
            "enroll_position_time": ...
        },
        ...
    ],
    "training_concepts": [
        {
            "concept_id": "...",
            "interest_time": "...",
            "interest_position_time": ...,
            "source_course_id": "..."
        },
        ...
    ]
}
"""

"""
Run:
cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/MoocCube_Evaluation/ablation
python 06_learner_training_data.py
"""

import os
import json
import numpy as np
from collections import defaultdict
from datetime import datetime

from config import *
from utils import *


# ==========================================================
# Helper Function 1
# convert a time string into a datetime object.
# ==========================================================
def parse_time_string(time_str):
    """
    Convert a time string into a datetime object.
    将时间字符串（YYYY-MM-DD HH:MM:SS）转成 datetime。
    """
    return datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S")


# ==========================================================
# Helper Function 2
# generate position_time from a sorted time list
# ==========================================================
def build_position_time(sorted_time_list):
    """
    Build position_time from a sorted time list.

    Rule / 规则：
    - same time  -> same position_time
    - later time -> larger position_time
    - start from 0
    """
    position_list = []
    current_position = -1
    last_time = None

    for t in sorted_time_list:
        if t != last_time:
            current_position += 1
            last_time = t
        position_list.append(current_position)

    return position_list


# ==========================================================
# Step 1: Load all required data
# ==========================================================
def load_all_data():
    """
    Load all data needed for Step 06.
    """
    print_info("Loading all required data for learner training data construction...")

    # 1) processed users
    users = load_json(PROCESSED_USER_JSON)

    # 2) processed courses
    courses = load_json(PROCESSED_COURSE_JSON)

    # 3) build course_id -> concept_ids mapping
    course_to_concepts = {}
    for c in courses:
        course_id = str(c.get("course_id", "")).strip()
        concept_ids = c.get("concept_ids", []) or []

        if not course_id:
            continue

        concept_ids = [str(x).strip() for x in concept_ids if str(x).strip()]
        course_to_concepts[course_id] = concept_ids

    # 4) concept name embeddings
    concept_name_embedding_matrix = np.load(CONCEPT_NAME_EMBEDDING_PATH)
    with open(CONCEPT_NAME_ID_TO_INDEX_PATH, "r", encoding="utf-8") as f:
        concept_name_id_to_index = json.load(f)

    # 5) course initial embeddings
    course_initial_embedding_matrix = np.load(COURSE_INITIAL_EMBEDDING_PATH)
    with open(COURSE_INITIAL_ID_TO_INDEX_PATH, "r", encoding="utf-8") as f:
        course_initial_id_to_index = json.load(f)

    print_info(f"Processed user count: {len(users)}")
    print_info(f"Processed course count: {len(courses)}")
    print_info(f"Concept name embedding shape: {concept_name_embedding_matrix.shape}")
    print_info(f"Course initial embedding shape: {course_initial_embedding_matrix.shape}")

    return (
        users,
        course_to_concepts,
        concept_name_embedding_matrix,
        concept_name_id_to_index,
        course_initial_embedding_matrix,
        course_initial_id_to_index,
    )


# ==========================================================
# Step 2: Build training_courses for one user
# ==========================================================
def build_training_courses(train_courses):
    """
    Build training_courses for one user.

    输入 train_courses（来自 processed_user.json）
    输出 training_courses（带 enroll_position_time）
    """
    sorted_courses = sorted(
        train_courses,
        key=lambda x: parse_time_string(x["enroll_time"])
    )

    enroll_time_list = [c["enroll_time"] for c in sorted_courses]
    enroll_position_list = build_position_time(enroll_time_list)

    training_courses = []
    for i, c in enumerate(sorted_courses):
        training_courses.append({
            "course_id": c["course_id"],
            "enroll_time": c["enroll_time"],
            "enroll_position_time": enroll_position_list[i],
        })

    return training_courses


# ==========================================================
# Step 3: For one course, select Top-20 concepts
# ==========================================================
def select_top20_concepts_for_one_course(
    course_id,
    course_to_concepts,
    course_initial_embedding_matrix,
    course_initial_id_to_index,
    concept_name_embedding_matrix,
    concept_name_id_to_index,
):
    """
    For one course, select Top-20 concepts based on cosine similarity.
    """
    if course_id not in course_initial_id_to_index:
        return []

    course_index = course_initial_id_to_index[course_id]
    e_c_initial = course_initial_embedding_matrix[course_index]

    concept_ids = course_to_concepts.get(course_id, [])
    scored_concepts = []

    for concept_id in concept_ids:
        if concept_id not in concept_name_id_to_index:
            continue

        concept_index = concept_name_id_to_index[concept_id]
        e_k_name = concept_name_embedding_matrix[concept_index]

        score = cosine_similarity(e_c_initial, e_k_name)
        scored_concepts.append((concept_id, score))

    scored_concepts.sort(key=lambda x: x[1], reverse=True)
    top20 = scored_concepts[:20]

    return top20


# ==========================================================
# Step 4: Build training_concepts for one user
# ==========================================================
def build_training_concepts(
    training_courses,
    course_to_concepts,
    concept_name_embedding_matrix,
    concept_name_id_to_index,
    course_initial_embedding_matrix,
    course_initial_id_to_index,
):
    """
    Build training_concepts for one user.
    --------------------------------------------------
    for each concept, record source_course_id (the course that gives the concept its interest_time).
    """
    # concept_sources:
    # concept_id -> [{"course_id": "...", "enroll_time": "..."}, ...]
    concept_sources = defaultdict(list)

    for c in training_courses:
        course_id = c["course_id"]
        enroll_time = c["enroll_time"]

        top20_concepts = select_top20_concepts_for_one_course(
            course_id=course_id,
            course_to_concepts=course_to_concepts,
            course_initial_embedding_matrix=course_initial_embedding_matrix,
            course_initial_id_to_index=course_initial_id_to_index,
            concept_name_embedding_matrix=concept_name_embedding_matrix,
            concept_name_id_to_index=concept_name_id_to_index,
        )

        for concept_id, _score in top20_concepts:
            concept_sources[concept_id].append({
                "course_id": course_id,
                "enroll_time": enroll_time,
            })

    concept_list = []

    for concept_id, source_list in concept_sources.items():

        # first sort by course_id to ensure stable output when enroll_time is the same
        sorted_sources = sorted(
            source_list,
            key=lambda x: (parse_time_string(x["enroll_time"]), str(x["course_id"]))
        )

        # the latest time and its corresponding source course for this concept
        latest_source = sorted_sources[-1]
        latest_time = latest_source["enroll_time"]
        source_course_id = latest_source["course_id"]

        concept_list.append({
            "concept_id": concept_id,
            "interest_time": latest_time,
            "source_course_id": source_course_id, 
        })

    # sort by interest_time (from earliest to latest) to prepare for position_time assignment
    concept_list = sorted(
        concept_list,
        key=lambda x: parse_time_string(x["interest_time"])
    )

    # interest_position_time
    interest_time_list = [x["interest_time"] for x in concept_list]
    interest_position_list = build_position_time(interest_time_list)

    for i in range(len(concept_list)):
        concept_list[i]["interest_position_time"] = interest_position_list[i]

    return concept_list


# ==========================================================
# Step 5: Build learner training data for all users
# ==========================================================
def build_all_learner_training_data():
    """
    Build learner training data for all users.
    """
    (
        users,
        course_to_concepts,
        concept_name_embedding_matrix,
        concept_name_id_to_index,
        course_initial_embedding_matrix,
        course_initial_id_to_index,
    ) = load_all_data()

    all_user_training_data = []

    for idx, user in enumerate(users, start=1):
        user_id = user.get("user_id", "")
        train_courses = user.get("train_courses", []) or []

        training_courses = build_training_courses(train_courses)

        training_concepts = build_training_concepts(
            training_courses=training_courses,
            course_to_concepts=course_to_concepts,
            concept_name_embedding_matrix=concept_name_embedding_matrix,
            concept_name_id_to_index=concept_name_id_to_index,
            course_initial_embedding_matrix=course_initial_embedding_matrix,
            course_initial_id_to_index=course_initial_id_to_index,
        )

        all_user_training_data.append({
            "user_id": user_id,
            "training_courses": training_courses,
            "training_concepts": training_concepts,
        })

        if idx % 100 == 0:
            print_info(f"Processed {idx} users...")

    return all_user_training_data


# ==========================================================
# Step 6: Save output
# ==========================================================
def save_output(data):
    """
    Save learner training data to JSON file.
    """
    output_path = os.path.join(PROCESSED_DATA_DIR, "processed_learner_training.json")
    save_json(data, output_path)
    print_info(f"Saved learner training data to: {output_path}")


# ==========================================================
# Main
# ==========================================================
def main():
    """
    Main entrance of Step 06.
    """
    print_info("Learner training data construction started...")

    ensure_directories()

    all_user_training_data = build_all_learner_training_data()
    save_output(all_user_training_data)

    print_info("Learner training data construction DONE ✅")


if __name__ == "__main__":
    main()