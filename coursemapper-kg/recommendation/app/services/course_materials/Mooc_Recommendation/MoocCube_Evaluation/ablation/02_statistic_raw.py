"""
Run:
    cd coursemapper-kg/recommendation
    python app/services/course_materials/Mooc_Recommendation/MoocCube_Evaluation/ablation/02_statistic_raw.py

    or

    cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/MoocCube_Evaluation/ablation
    python 02_statistic_raw.py
"""

"""
statistic_raw.py

Compute statistics for the raw MOOCube dataset and save them to statistic_raw.txt.
"""

from collections import Counter

from config import *
from utils import *


def load_raw_data_for_statistics():
    print_info("Loading raw data for raw statistics...")
    users = load_json(USER_JSON)
    courses = load_json(COURSE_JSON)
    concepts = load_json(CONCEPT_JSON)
    course_concepts = load_course_concept_tsv(COURSE_CONCEPT_JSON)
    return users, courses, concepts, course_concepts


def compute_raw_statistics(raw_users, raw_courses, raw_concepts, raw_course_concepts):
    enrolled_course_count_distribution = Counter()
    inconsistent_length_users = 0
    consistent_length_users = 0
    invalid_time_users = 0
    users_lt_4_courses = 0
    users_ge_4_courses = 0

    for user in raw_users:
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
                parse_time(str(time_str).strip())
            except Exception:
                has_invalid_time = True
                break
        if has_invalid_time:
            invalid_time_users += 1

    return {
        "raw_user_count": len(raw_users),
        "raw_course_count": len(raw_courses),
        "raw_concept_count": len(raw_concepts),
        "raw_course_concept_pair_count": len(raw_course_concepts),
        "users_lt_4_courses": users_lt_4_courses,
        "users_ge_4_courses": users_ge_4_courses,
        "consistent_length_users": consistent_length_users,
        "inconsistent_length_users": inconsistent_length_users,
        "invalid_time_users": invalid_time_users,
        "enrolled_course_count_distribution": enrolled_course_count_distribution,
    }


def save_raw_statistics_txt(stats):
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

    lines.extend(summarize_counter(
        stats["enrolled_course_count_distribution"],
        "[4] Raw User Enrolled Course Count Distribution"
    ))

    save_txt(lines, RAW_STATISTIC_TXT)


def main():
    ensure_directories()
    raw_users, raw_courses, raw_concepts, raw_course_concepts = load_raw_data_for_statistics()
    raw_stats = compute_raw_statistics(raw_users, raw_courses, raw_concepts, raw_course_concepts)
    save_raw_statistics_txt(raw_stats)
    print_info("Raw statistic generation DONE.")


if __name__ == "__main__":
    main()
