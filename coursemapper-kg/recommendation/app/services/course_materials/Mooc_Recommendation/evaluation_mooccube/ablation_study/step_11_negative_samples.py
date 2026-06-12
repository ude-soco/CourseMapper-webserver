"""
step_11_negative_samples.py

Goal:
------------
Generate user-level negative samples for MOOCCube evaluation.

Main logic:
------------
For each user:

    1. Read the user's train courses.
    2. Read the user's test courses.
    3. Build the negative candidate pool:
           all courses - this user's train courses - this user's test courses
    4. For each test course:
           treat it as one positive target course, and randomly sample 99 negative courses from the negative candidate pool.
    5. Merge all negative courses of the same user.
       If duplicated negative courses appear across different positive targets, keep only one copy.
    6. Save one user-level record:
           user_id
           test_course_ids
           negative_course_ids

Output format:
------------
Each line in negative_samples.jsonl is one user:

{
    "user_id": "...",
    "test_course_ids": ["...", "..."],
    "negative_course_ids": ["...", "..."],
    "num_test_courses": 2,
    "num_negative_courses": 180
}

Run:
    cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/evaluation_mooccube/ablation_study
    python step_11_negative_samples.py
"""

import random

from config import (
    PROCESSED_USERS_JSONL,
    PROCESSED_COURSES_JSONL,
    NEGATIVE_SAMPLES_JSONL,
    NEGATIVE_SAMPLE_SIZE_PER_POSITIVE,
    RANDOM_SEED,
    ensure_directories,
)

from utils import (
    load_jsonl,
    save_jsonl,
    print_info,
)


# ============================================================
# 1. Load all course ids
# ============================================================

def load_course_ids():
    """
    Load all course ids from processed_courses.jsonl.

    The result is the global course pool.
    Later, for each user, we remove this user's train courses and test courses from this global course pool to get the negative candidate pool.
    """
    course_records = load_jsonl(PROCESSED_COURSES_JSONL)
    course_ids = []

    for course in course_records:
        course_ids.append(str(course["course_id"]))

    # Use sorted list to make the result stable.
    return sorted(course_ids)


# ============================================================
# 2. Extract course ids from train_courses or test_courses
# ============================================================

def extract_course_ids(course_list):

    course_ids = []

    for course in course_list:
        course_ids.append(str(course["course_id"]))

    return course_ids


# ============================================================
# 3. Sample negative courses for one user
# ============================================================

def sample_negative_courses_for_user(
    all_course_ids,
    train_course_ids,
    test_course_ids,
    rng,
):
    """
    Sample negative courses for one user.
    For each positive target course in test_course_ids:
        sample 99 negative courses from the negative candidate pool.
    Important:
        1. A user's train courses cannot be negative samples.
        2. A user's test courses cannot be negative samples.
        3. If different positive targets sample the same negative course, we keep it only once in the final user-level negative list.
    """
    all_course_set = set(all_course_ids)
    train_course_set = set(train_course_ids)
    test_course_set = set(test_course_ids)

    negative_candidate_pool = all_course_set - train_course_set - test_course_set
    negative_candidate_pool = sorted(negative_candidate_pool)

    user_negative_course_ids = set()

    for target_course_id in test_course_ids:
        sample_size = min(
            NEGATIVE_SAMPLE_SIZE_PER_POSITIVE,
            len(negative_candidate_pool),
        )

        sampled_negative_ids = rng.sample(
            negative_candidate_pool,
            sample_size,
        )

        user_negative_course_ids.update(sampled_negative_ids)

    return sorted(user_negative_course_ids)


# ============================================================
# 4. Generate negative samples for all users
# ============================================================

def generate_negative_samples():
    """
    Generate user-level negative samples for all users.

    This function:
        1. loads all courses,
        2. loads all processed users,
        3. generates negative samples for each user,
        4. saves the final user-level negative sample file,
        5. prints simple statistics.
    """
    ensure_directories()

    # rng = random.Random(RANDOM_SEED)
    rng = random.Random()

    all_course_ids = load_course_ids()
    user_records = load_jsonl(PROCESSED_USERS_JSONL)

    negative_sample_records = []
    negative_count_list = []
    test_count_list = []

    for user in user_records:
        user_id = str(user["user_id"])

        train_course_ids = extract_course_ids(user["train_courses"])
        test_course_ids = extract_course_ids(user["test_courses"])

        negative_course_ids = sample_negative_courses_for_user(
            all_course_ids=all_course_ids,
            train_course_ids=train_course_ids,
            test_course_ids=test_course_ids,
            rng=rng,
        )

        record = {
            "user_id": user_id,
            "test_course_ids": test_course_ids,
            "negative_course_ids": negative_course_ids,
            "num_test_courses": len(test_course_ids),
            "num_negative_courses": len(negative_course_ids),
        }

        negative_sample_records.append(record)

        test_count_list.append(len(test_course_ids))
        negative_count_list.append(len(negative_course_ids))

    save_jsonl(
        negative_sample_records,
        NEGATIVE_SAMPLES_JSONL,
    )

    print_info("Step 11 negative sampling finished.")
    print_info(f"Total courses: {len(all_course_ids)}")
    print_info(f"Total users: {len(user_records)}")
    print_info(f"Saved user-level records: {len(negative_sample_records)}")
    print_info(f"Negative samples saved to: {NEGATIVE_SAMPLES_JSONL}")

    print_info("-" * 60)
    print_info("Test courses per user:")
    print_info(f"Min: {min(test_count_list)}")
    print_info(f"Max: {max(test_count_list)}")
    print_info(f"Average: {sum(test_count_list) / len(test_count_list):.4f}")

    print_info("-" * 60)
    print_info("Negative courses per user after deduplication:")
    print_info(f"Min: {min(negative_count_list)}")
    print_info(f"Max: {max(negative_count_list)}")
    print_info(f"Average: {sum(negative_count_list) / len(negative_count_list):.4f}")


# ============================================================
# Main
# ============================================================

if __name__ == "__main__":
    generate_negative_samples()