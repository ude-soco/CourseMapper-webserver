"""
statistic_original_dataset.py

Goal:
    Compute statistics for the original MOOCCube dataset.

Input:
    dataset/original/user.json
    dataset/original/course.json
    dataset/original/concept.json
    dataset/original/course-concept.json

Output:
    output/statistics/statistic_original_dataset.txt

Run:
    cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/evaluation_mooccube/ablation_study
    python statistic_original_dataset.py
"""

from collections import Counter
from datetime import datetime

from config import *
from utils import *


# ============================================================
# Function: load original raw data
# ============================================================

def load_original_data():
    """
    Load the original raw dataset files.
    """
    print_info("Loading original dataset...")

    users = load_jsonl(USER_JSON)
    courses = load_jsonl(COURSE_JSON)
    concepts = load_jsonl(CONCEPT_JSON)
    course_concepts = load_course_concept_pairs(COURSE_CONCEPT_JSON)

    return users, courses, concepts, course_concepts


# ============================================================
# Function: compute original dataset statistics
# ============================================================

def compute_original_statistics(users, courses, concepts, course_concepts):
    """
    Compute statistics for the original dataset.

    Main analysis:
        1. Basic counts
        2. User enrolled course count distribution
        3. Whether course_order and enroll_time have the same length
        4. Whether enroll_time strings can be parsed correctly
    """
    enrolled_course_count_distribution = Counter()

    consistent_length_users = 0
    inconsistent_length_users = 0
    invalid_time_users = 0

    users_lt_4_courses = 0
    users_ge_4_courses = 0

    for user in users:
        course_order = user.get("course_order", []) or []
        enroll_time = user.get("enroll_time", []) or []

        course_count = len(course_order)
        enrolled_course_count_distribution[course_count] += 1

        if course_count < 4:
            users_lt_4_courses += 1
        else:
            users_ge_4_courses += 1

        if len(course_order) == len(enroll_time):
            consistent_length_users += 1
        else:
            inconsistent_length_users += 1
            continue

        has_invalid_time = False

        for time_str in enroll_time:
            try:
                datetime.strptime(str(time_str).strip(), "%Y-%m-%d %H:%M:%S")
            except Exception:
                has_invalid_time = True
                break

        if has_invalid_time:
            invalid_time_users += 1

    return {
        "raw_user_count": len(users),
        "raw_course_count": len(courses),
        "raw_concept_count": len(concepts),
        "raw_course_concept_pair_count": len(course_concepts),
        "users_lt_4_courses": users_lt_4_courses,
        "users_ge_4_courses": users_ge_4_courses,
        "consistent_length_users": consistent_length_users,
        "inconsistent_length_users": inconsistent_length_users,
        "invalid_time_users": invalid_time_users,
        "enrolled_course_count_distribution": enrolled_course_count_distribution,
    }


# ============================================================
# Function: save original statistics as txt
# ============================================================

def save_original_statistics_txt(stats):
    """
    Save original dataset statistics into a txt file.
    """
    lines = []

    lines.append("MOOCube Raw Dataset Statistics")
    lines.append("=" * 60)
    lines.append("")

    lines.append("[1] Basic Counts")
    lines.append("-" * 60)
    lines.append(f"Raw user count                    : {stats['raw_user_count']}")
    lines.append(f"Raw course count                  : {stats['raw_course_count']}")
    lines.append(f"Raw concept count                 : {stats['raw_concept_count']}")
    lines.append(f"Raw course-concept pair count     : {stats['raw_course_concept_pair_count']}")
    lines.append("")

    lines.append("[2] User Course Count Summary")
    lines.append("-" * 60)
    lines.append(f"Users with enrolled courses < 4   : {stats['users_lt_4_courses']}")
    lines.append(f"Users with enrolled courses >= 4  : {stats['users_ge_4_courses']}")
    lines.append("")

    lines.append("[3] course_order / enroll_time Consistency")
    lines.append("-" * 60)
    lines.append(f"Consistent length users           : {stats['consistent_length_users']}")
    lines.append(f"Inconsistent length users         : {stats['inconsistent_length_users']}")
    lines.append(f"Users with invalid time format    : {stats['invalid_time_users']}")
    lines.append("")

    lines.extend(
        summarize_counter(
            stats["enrolled_course_count_distribution"],
            "[4] Raw User Enrolled Course Count Distribution"
        )
    )

    save_txt(lines, STATISTIC_ORIGINAL_TXT)


# ============================================================
# Main function
# ============================================================

def main():
    """
    Run original dataset statistics generation.
    """
    ensure_dirs()

    users, courses, concepts, course_concepts = load_original_data()
    stats = compute_original_statistics(users, courses, concepts, course_concepts)
    save_original_statistics_txt(stats)

    print_info("Original dataset statistic generation DONE.")
    print_info(f"Output txt: {STATISTIC_ORIGINAL_TXT}")


if __name__ == "__main__":
    main()