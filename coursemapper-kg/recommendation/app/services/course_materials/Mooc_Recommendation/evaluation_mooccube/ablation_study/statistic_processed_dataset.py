"""
statistic_processed_dataset.py

Goal:
    Compute statistics for the processed MOOCCube dataset.

Input:
    dataset/processed/processed_users.jsonl
    dataset/processed/processed_courses.jsonl
    dataset/processed/processed_concepts.jsonl
    dataset/processed/processed_course_concepts.jsonl

Output:
    1. output/statistics/statistic_processed_dataset.txt
    2. output/statistics/user_train_test_distribution_light.png

Run:
    cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/evaluation_mooccube/ablation_study
    python statistic_processed_dataset.py
"""

from collections import Counter

from config import *
from utils import *

try:
    import matplotlib.pyplot as plt
    MATPLOTLIB_AVAILABLE = True
except ModuleNotFoundError:
    MATPLOTLIB_AVAILABLE = False


# ============================================================
# Function: load processed dataset
# ============================================================

def load_processed_data():
    """
    Load processed dataset files.
    """
    print_info("Loading processed dataset...")

    users = load_jsonl(PROCESSED_USERS_JSONL)
    courses = load_jsonl(PROCESSED_COURSES_JSONL)
    concepts = load_jsonl(PROCESSED_CONCEPTS_JSONL)
    course_concepts = load_jsonl(PROCESSED_COURSE_CONCEPTS_JSONL)

    print_info(f"Users: {len(users)}")
    print_info(f"Courses: {len(courses)}")
    print_info(f"Concepts: {len(concepts)}")
    print_info(f"Course-concept pairs: {len(course_concepts)}")

    return users, courses, concepts, course_concepts


# ============================================================
# Function: build course concept count distribution
# ============================================================

def build_course_concept_counter(courses):
    """
    Build concept count distribution per course.

    Output:
        Counter:
            key   = number of concepts in one course
            value = number of courses
    """
    concept_count_counter = Counter()

    for course in courses:
        concept_ids = course.get("concept_ids", []) or []
        concept_ids = [c for c in concept_ids if str(c).strip()]

        count = len(concept_ids)
        concept_count_counter[count] += 1

    return concept_count_counter


# ============================================================
# Function: build user training course distribution
# ============================================================

def build_user_train_distribution(users):
    """
    Build training course count distribution per user.
    """
    train_counter = Counter()

    for user in users:
        train_courses = user.get("train_courses", []) or []
        train_count = len(train_courses)
        train_counter[train_count] += 1

    return train_counter


# ============================================================
# Function: build user test course distribution
# ============================================================

def build_user_test_distribution(users):
    """
    Build test course count distribution per user.
    """
    test_counter = Counter()

    for user in users:
        test_courses = user.get("test_courses", []) or []
        test_count = len(test_courses)
        test_counter[test_count] += 1

    return test_counter


# ============================================================
# Function: compute processed dataset statistics
# ============================================================

def compute_statistics(users, courses, concepts, course_concepts):
    """
    Compute statistics for the processed dataset.

    Main analysis:
        1. Basic counts
        2. User train distribution
        3. User test distribution
        4. Course concept distribution
    """
    print_info("Computing processed dataset statistics...")

    user_count = len(users)
    course_count = len(courses)
    concept_count = len(concepts)
    course_concept_pair_count = len(course_concepts)

    train_distribution = build_user_train_distribution(users)
    test_distribution = build_user_test_distribution(users)
    course_concept_distribution = build_course_concept_counter(courses)

    return {
        "user_count": user_count,
        "course_count": course_count,
        "concept_count": concept_count,
        "course_concept_pair_count": course_concept_pair_count,
        "train_distribution": train_distribution,
        "test_distribution": test_distribution,
        "course_concept_distribution": course_concept_distribution,
        "courses": courses,
    }


# ============================================================
# Function: describe training distribution in text
# ============================================================

def describe_train_distribution(counter):
    """
    Convert train distribution into readable English sentences.
    """
    lines = []
    lines.append("[Train Course Distribution per User]")
    lines.append("=" * 60)

    for k in sorted(counter.keys()):
        count = counter[k]

        if k == 0:
            lines.append(f"There are {count} users who have no training courses.")
        elif k == 1:
            lines.append(f"There are {count} users who have exactly 1 training course.")
        else:
            lines.append(f"There are {count} users who have exactly {k} training courses.")

    lines.append("")
    return lines


# ============================================================
# Function: describe test distribution in text
# ============================================================

def describe_test_distribution(counter):
    """
    Convert test distribution into readable English sentences.
    """
    lines = []
    lines.append("[Test Course Distribution per User]")
    lines.append("=" * 60)

    for k in sorted(counter.keys()):
        count = counter[k]

        if k == 0:
            lines.append(f"There are {count} users who have no test courses.")
        elif k == 1:
            lines.append(f"There are {count} users who have exactly 1 test course.")
        else:
            lines.append(f"There are {count} users who have exactly {k} test courses.")

    lines.append("")
    return lines


# ============================================================
# Function: describe course concept distribution in text
# ============================================================

def describe_course_concept_distribution(counter, courses):
    """
    Convert course concept distribution into readable English sentences.

    This function also lists courses with 0 concepts.
    """
    lines = []
    lines.append("[Concept Count per Course Distribution]")
    lines.append("=" * 60)

    for k in sorted(counter.keys()):
        count = counter[k]

        if k == 0:
            lines.append(
                f"There are {count} courses that contain no concepts."
            )
        elif k == 1:
            lines.append(
                f"There are {count} courses where each course contains exactly 1 concept."
            )
        else:
            lines.append(
                f"There are {count} courses where each course contains exactly {k} concepts."
            )

    zero_concept_courses = []

    for course in courses:
        cid = str(course.get("course_id", "")).strip()
        cname = str(course.get("course_name", "")).strip()
        concept_ids = course.get("concept_ids", []) or []

        if len(concept_ids) == 0:
            zero_concept_courses.append((cid, cname))

    if zero_concept_courses:
        lines.append("")
        lines.append("WARNING:")
        lines.append(
            f"{len(zero_concept_courses)} courses do not have any associated concepts."
        )
        lines.append(
            "This may indicate missing mappings in course-concept.json or filtering issues."
        )
        lines.append("")

        lines.append("[List of Courses with No Concepts]")
        lines.append("-" * 60)

        for cid, cname in zero_concept_courses:
            lines.append(f"course_id: {cid} | course_name: {cname}")

    lines.append("")
    return lines


# ============================================================
# Function: save processed statistics as txt
# ============================================================

def save_statistics_txt(stats):
    """
    Save processed dataset statistics into a txt file.
    """
    lines = []

    lines.append("MOOCube Processed Dataset Statistics")
    lines.append("=" * 60)
    lines.append("")

    lines.append("[Basic Statistics]")
    lines.append("-" * 60)
    lines.append(f"There are {stats['user_count']} users in the processed dataset.")
    lines.append(f"There are {stats['course_count']} courses in the processed dataset.")
    lines.append(f"There are {stats['concept_count']} concepts in the processed dataset.")
    lines.append(f"There are {stats['course_concept_pair_count']} course-concept pairs in the processed dataset.")
    lines.append("")

    lines.extend(describe_train_distribution(stats["train_distribution"]))
    lines.extend(describe_test_distribution(stats["test_distribution"]))
    lines.extend(
        describe_course_concept_distribution(
            stats["course_concept_distribution"],
            stats["courses"],
        )
    )

    save_txt(lines, STATISTIC_PROCESSED_TXT)

    print_info("Processed statistics txt saved.")


# ============================================================
# Function: save training/test comparison figure
# ============================================================

def save_user_train_test_distribution_plot(train_counter, test_counter):
    """
    Generate the light-themed side-by-side plot:

        Left  : User Training Course Count Distribution
        Right : User Test Course Count Distribution

    The displayed x-axis range is 1 to 15 courses,
    which matches the original style and avoids long-tail clutter.
    """
    if not MATPLOTLIB_AVAILABLE:
        print_warning(
            "matplotlib is not installed, so user_train_test_distribution_light.png will NOT be generated."
        )
        return

    if not train_counter or not test_counter:
        print_warning("No train/test distribution data found. Skip visualization generation.")
        return

    main_range = list(range(1, 16))
    train_values = [train_counter.get(k, 0) for k in main_range]
    test_values = [test_counter.get(k, 0) for k in main_range]

    total_train_users = sum(train_counter.values())
    total_test_users = sum(test_counter.values())

    avg_train = (
        sum(k * count for k, count in train_counter.items()) / total_train_users
        if total_train_users > 0 else 0
    )

    avg_test = (
        sum(k * count for k, count in test_counter.items()) / total_test_users
        if total_test_users > 0 else 0
    )

    plt.style.use("default")
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5), facecolor="#f9fcfd")
    ax1.set_facecolor("#f5fafb")
    ax2.set_facecolor("#f5fafb")

    x = list(range(len(main_range)))

    # Left plot: training distribution
    ax1.bar(
        x,
        train_values,
        width=0.65,
        color="#a8d5f0",
        edgecolor="#5b98c9",
        linewidth=1.0,
    )
    ax1.set_title("User Training Course Count Distribution", fontsize=13, color="#2f4f4f", fontweight="bold")
    ax1.set_xlabel("Number of Training Courses per User", color="#4e6572")
    ax1.set_ylabel("Number of Users", color="#4e6572")
    ax1.set_xticks(x)
    ax1.set_xticklabels(main_range)
    ax1.grid(axis="y", color="#dceaf6", linewidth=0.8, alpha=0.7)
    ax1.set_axisbelow(True)
    for spine in ax1.spines.values():
        spine.set_color("#d5dde3")
    ax1.tick_params(colors="#58707f")

    stats_text = f"Total Users: {total_train_users}\nAvg Courses: {avg_train:.1f}"
    ax1.text(
        0.98,
        0.97,
        stats_text,
        transform=ax1.transAxes,
        fontsize=10,
        verticalalignment="top",
        horizontalalignment="right",
        bbox=dict(boxstyle="round", facecolor="#ffffff", edgecolor="#d5dde3", alpha=0.9),
    )

    # Right plot: test distribution
    ax2.bar(
        x,
        test_values,
        width=0.65,
        color="#b5dfa8",
        edgecolor="#6fa067",
        linewidth=1.0,
    )
    ax2.set_title("User Test Course Count Distribution", fontsize=13, color="#2f4f4f", fontweight="bold")
    ax2.set_xlabel("Number of Test Courses per User", color="#4e6572")
    ax2.set_ylabel("Number of Users", color="#4e6572")
    ax2.set_xticks(x)
    ax2.set_xticklabels(main_range)
    ax2.grid(axis="y", color="#dceaf6", linewidth=0.8, alpha=0.7)
    ax2.set_axisbelow(True)
    for spine in ax2.spines.values():
        spine.set_color("#d5dde3")
    ax2.tick_params(colors="#58707f")

    stats_text = f"Total Users: {total_test_users}\nAvg Courses: {avg_test:.1f}"
    ax2.text(
        0.98,
        0.97,
        stats_text,
        transform=ax2.transAxes,
        fontsize=10,
        verticalalignment="top",
        horizontalalignment="right",
        bbox=dict(boxstyle="round", facecolor="#ffffff", edgecolor="#d5dde3", alpha=0.9),
    )

    fig.suptitle(
        "User Training/Test Course Count Comparison (Range: 1-15 Courses)",
        fontsize=14,
        color="#2f4f4f",
        y=1.02,
    )

    plt.tight_layout()
    plt.savefig(USER_TRAIN_TEST_DISTRIBUTION_PNG, dpi=300, bbox_inches="tight")
    plt.close()

    print_info(f"Visualization saved: {USER_TRAIN_TEST_DISTRIBUTION_PNG}")


# ============================================================
# Main function
# ============================================================

def main():
    """
    Run processed dataset statistics generation.
    """
    print_info("Processed statistic generation started.")
    ensure_dirs()

    users, courses, concepts, course_concepts = load_processed_data()
    stats = compute_statistics(users, courses, concepts, course_concepts)

    save_statistics_txt(stats)
    save_user_train_test_distribution_plot(
        stats["train_distribution"],
        stats["test_distribution"],
    )

    print_info("Processed statistic generation DONE.")
    print_info(f"Output txt: {STATISTIC_PROCESSED_TXT}")
    print_info(f"Output png: {USER_TRAIN_TEST_DISTRIBUTION_PNG}")


if __name__ == "__main__":
    main()