"""
07_learner_training_data_statistic.py

Goal
----------------------------------------

Counts the statistics of the learner training data:

    1. Total number of users
    2. Number of users with empty training_courses
    3. Number of users with empty/non-empty training_concepts
    4. Average number of concepts (for users with non-empty concepts)
    5. Quality check for source_course_id:
    - Missing source_course_id count
    - Count of source_course_id not found in training_courses
    - Count of source course enroll_time != concept interest_time

Output:
    outputs/train/learner_training_statistic.txt
"""

"""
Run:
cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/MoocCube_Evaluation/ablation
python 07_learner_training_data_statistic.py
"""

import os
from config import *
from utils import *


def statistic_learner_training_data():
    print_info("Loading learner training data...")

    data = load_json(os.path.join(PROCESSED_DATA_DIR, "processed_learner_training.json"))

    total_users = len(data)
    empty_training_course_users = 0
    empty_concept_users = 0
    non_empty_concept_users = 0
    total_concept_count = 0

    # new addition: users with 1 course & 0 concept, users with 1 course & 1 concept, users with 1 course & multiple concepts, users with multiple courses & 1 concept
    users_1course_0concept = 0
    users_1course_1concept = 0
    users_1course_multi_concept = 0  # new addition
    users_multi_course_1concept = 0  # new addition

    # source_course_id 
    total_concept_items = 0
    missing_source_course_id_count = 0
    source_not_found_in_training_courses_count = 0
    source_time_mismatch_count = 0

    for user in data:
        concepts = user.get("training_concepts", [])
        training_courses = user.get("training_courses")
        if training_courses is None:
            training_courses = user.get("train_courses", [])

        num_courses = len(training_courses)
        num_concepts = len(concepts)

        
        if num_courses == 1 and num_concepts == 0:
            users_1course_0concept += 1
        elif num_courses == 1 and num_concepts == 1:
            users_1course_1concept += 1
        elif num_courses == 1 and num_concepts > 1:  # new addition
            users_1course_multi_concept += 1
        elif num_courses > 1 and num_concepts == 1:  # new addition
            users_multi_course_1concept += 1

        if num_courses == 0:
            empty_training_course_users += 1

        if num_concepts == 0:
            empty_concept_users += 1
        else:
            non_empty_concept_users += 1
            total_concept_count += num_concepts

 
        # construct a course_id -> enroll_time map for the current user
        course_time_map = {}
        for c in training_courses:
            cid = str(c.get("course_id", "")).strip()
            et = str(c.get("enroll_time", "")).strip()
            if cid:
                course_time_map[cid] = et

        # check each concept item 
        for item in concepts:
            total_concept_items += 1

            source_course_id = str(item.get("source_course_id", "")).strip()
            interest_time = str(item.get("interest_time", "")).strip()

            if not source_course_id:
                missing_source_course_id_count += 1
                continue

            if source_course_id not in course_time_map:
                source_not_found_in_training_courses_count += 1
                continue

            source_enroll_time = course_time_map[source_course_id]
            if source_enroll_time != interest_time:
                source_time_mismatch_count += 1

    avg_concepts = (
        total_concept_count / non_empty_concept_users
        if non_empty_concept_users > 0 else 0
    )

    # output statistics
    lines = []
    lines.append("Learner Training Data Statistics\n")
    lines.append("=" * 60 + "\n")
    lines.append(f"Total number of users: {total_users}\n")
    lines.append(f"Number of users with 0 training courses: {empty_training_course_users}\n")
    lines.append(f"Number of users with NO training concepts: {empty_concept_users}\n")
    lines.append(f"Number of users WITH training concepts: {non_empty_concept_users}\n")
    lines.append(f"Average number of training concepts (non-empty users): {avg_concepts:.2f}\n")

    lines.append("\n")
    lines.append("Special Cases\n")
    lines.append("-" * 60 + "\n")
    lines.append(f"Users with 1 course & 0 concepts: {users_1course_0concept}\n")
    lines.append(f"Users with 1 course & 1 concept: {users_1course_1concept}\n")
    lines.append(f"Users with 1 course & multiple concepts: {users_1course_multi_concept}\n")  # new addition
    lines.append(f"Users with multiple courses & 1 concept: {users_multi_course_1concept}\n")  # new addition

    lines.append("\n")
    lines.append("Source Course ID Quality Check\n")
    lines.append("-" * 60 + "\n")
    lines.append(f"Total training_concepts items: {total_concept_items}\n")
    lines.append(f"Missing source_course_id count: {missing_source_course_id_count}\n")
    lines.append(
        f"source_course_id not found in training_courses count: "
        f"{source_not_found_in_training_courses_count}\n"
    )
    lines.append(
        f"source course enroll_time != concept interest_time count: "
        f"{source_time_mismatch_count}\n"
    )

    output_dir = os.path.join(OUTPUT_DIR, "train")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "learner_training_statistic.txt")

    with open(output_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

    print_info(f"Saved statistics to: {output_path}")
    print("".join(lines))


def main():
    print_info("Running learner training data statistics...")
    statistic_learner_training_data()
    print_info("DONE ✅")


if __name__ == "__main__":
    main()