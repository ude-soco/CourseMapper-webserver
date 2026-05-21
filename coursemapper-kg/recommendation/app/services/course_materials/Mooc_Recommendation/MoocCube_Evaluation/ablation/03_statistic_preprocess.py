"""
03_statistic_preprocess.py (Enhanced Version)

Goals:
------
1. Compute statistics on processed data:
   - User count
   - Course count
   - Concept count

2. User training set distribution:
   - Course count distribution per user

3. Course concept distribution:
   - How many concepts per course
   - Including courses with 0 concepts

Output:
-------
- statistic_processed.txt

How to run:
    cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/MoocCube_Evaluation/ablation
    python 03_statistic_preprocess.py
"""

from collections import Counter
import os

from config import *
from utils import *

try:
    import matplotlib.pyplot as plt
    MATPLOTLIB_AVAILABLE = True
except ModuleNotFoundError:
    MATPLOTLIB_AVAILABLE = False


USER_TRAIN_TEST_DISTRIBUTION_PNG = os.path.join(
    STAT_DIR,
    "user_train_test_distribution_light.png",
)


# ===============================
# Load Data
# ===============================
def load_processed_data():
    print_info("Loading processed data...")

    users = load_json(PROCESSED_USER_JSON)
    courses = load_json(PROCESSED_COURSE_JSON)
    concepts = load_json(PROCESSED_CONCEPT_JSON)

    print_info(f"Users: {len(users)}")
    print_info(f"Courses: {len(courses)}")
    print_info(f"Concepts: {len(concepts)}")

    return users, courses, concepts


# ===============================
# Build Course -> Concept Count
# ===============================
def build_course_concept_counter(courses):
    """
    Build course concept count distribution.

    Output:
        Counter:
            key = concept count
            value = number of courses
    """
    concept_count_counter = Counter()

    for course in courses:
        concept_ids = course.get("concept_ids", []) or []
        concept_ids = [c for c in concept_ids if str(c).strip()]

        count = len(concept_ids)

        concept_count_counter[count] += 1

    return concept_count_counter


# ===============================
# User Train Distribution
# ===============================
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


# ===============================
# Main Statistics Logic
# ===============================
def compute_statistics(users, courses, concepts):
    print_info("Computing statistics...")

    # Basic statistics
    user_count = len(users)
    course_count = len(courses)
    concept_count = len(concepts)

    # User training distribution
    train_distribution = build_user_train_distribution(users)
    test_distribution = build_user_test_distribution(users)

    # Course concept distribution
    course_concept_distribution = build_course_concept_counter(courses)

    return {
        "user_count": user_count,
        "course_count": course_count,
        "concept_count": concept_count,
        "train_distribution": train_distribution,
        "test_distribution": test_distribution,
        "course_concept_distribution": course_concept_distribution,
        "courses": courses,   # Pass course list for further analysis
    }


def describe_train_distribution(counter):
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


def describe_test_distribution(counter):
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

def describe_course_concept_distribution(counter, courses):
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

    # ===============================
    # Find courses with 0 concepts
    # ===============================
    zero_concept_courses = []

    for course in courses:
        cid = str(course.get("course_id", "")).strip()
        cname = str(course.get("course_name", "")).strip()
        concept_ids = course.get("concept_ids", []) or []

        if len(concept_ids) == 0:
            zero_concept_courses.append((cid, cname))

    # ===============================
    # WARNING + List courses
    # ===============================
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


def save_statistics_txt(stats):
    lines = []

    lines.append("MOOCube Processed Dataset Statistics")
    lines.append("=" * 60)
    lines.append("")

    # 基础统计
    lines.append("[Basic Statistics]")
    lines.append("-" * 60)
    lines.append(f"There are {stats['user_count']} users in the processed dataset.")
    lines.append(f"There are {stats['course_count']} courses in the processed dataset.")
    lines.append(f"There are {stats['concept_count']} concepts in the processed dataset.")
    lines.append("")

    # 用户训练分布（英文解释）
    lines.extend(describe_train_distribution(stats["train_distribution"]))
    lines.extend(describe_test_distribution(stats["test_distribution"]))

    # 课程概念分布（英文解释）
    lines.extend(
        describe_course_concept_distribution(
            stats["course_concept_distribution"],
            stats["courses"],   # 👈 新增
        )
    )
    save_txt(lines, PROCESSED_STATISTIC_TXT)

    print_info("Statistics saved.")


def save_user_train_test_distribution_plot(train_counter, test_counter):
    """
    Generate a clear light-themed side-by-side visualization:
    - Left plot: User training course count distribution
    - Right plot: User test course count distribution
    - Display main range (1-15 courses) to avoid long-tail clutter
    - Include statistics (mean, max, etc.)
    """
    if not MATPLOTLIB_AVAILABLE:
        print_warning(
            "matplotlib is not installed, so user_train_test_distribution_light.png will NOT be generated."
        )
        return

    if not train_counter or not test_counter:
        print_warning("No train/test distribution data found. Skip visualization generation.")
        return

    # Display main range (1-15 courses) to avoid long-tail clutter
    main_range = list(range(1, 16))
    train_values = [train_counter.get(k, 0) for k in main_range]
    test_values = [test_counter.get(k, 0) for k in main_range]

    # Compute statistics
    total_train_users = sum(train_counter.values())
    total_test_users = sum(test_counter.values())
    avg_train = sum(k * count for k, count in train_counter.items()) / total_train_users if total_train_users > 0 else 0
    avg_test = sum(k * count for k, count in test_counter.items()) / total_test_users if total_test_users > 0 else 0

    # Create side-by-side plots
    plt.style.use("default")
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5), facecolor="#f9fcfd")
    ax1.set_facecolor("#f5fafb")
    ax2.set_facecolor("#f5fafb")

    x = list(range(len(main_range)))
    
    # Left plot: Training course distribution
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
    
    # Add statistics text on left plot
    stats_text = f"Total Users: {total_train_users}\nAvg Courses: {avg_train:.1f}"
    ax1.text(0.98, 0.97, stats_text, transform=ax1.transAxes, fontsize=10,
             verticalalignment="top", horizontalalignment="right",
             bbox=dict(boxstyle="round", facecolor="#ffffff", edgecolor="#d5dde3", alpha=0.9))

    # Right plot: Test course distribution
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
    
    # Add statistics text on right plot
    stats_text = f"Total Users: {total_test_users}\nAvg Courses: {avg_test:.1f}"
    ax2.text(0.98, 0.97, stats_text, transform=ax2.transAxes, fontsize=10,
             verticalalignment="top", horizontalalignment="right",
             bbox=dict(boxstyle="round", facecolor="#ffffff", edgecolor="#d5dde3", alpha=0.9))

    fig.suptitle("User Training/Test Course Count Comparison (Range: 1-15 Courses)", fontsize=14, color="#2f4f4f", y=1.02)
    
    plt.tight_layout()
    plt.savefig(USER_TRAIN_TEST_DISTRIBUTION_PNG, dpi=300, bbox_inches="tight")
    plt.close()

    print_info(f"Visualization saved: {USER_TRAIN_TEST_DISTRIBUTION_PNG}")

# ===============================
# Main
# ===============================
def main():
    print_info("Statistic generation started.")
    ensure_directories()

    users, courses, concepts = load_processed_data()

    stats = compute_statistics(users, courses, concepts)

    save_statistics_txt(stats)
    save_user_train_test_distribution_plot(
        stats["train_distribution"],
        stats["test_distribution"],
    )

    print_info("Statistic generation DONE.")


if __name__ == "__main__":
    main()