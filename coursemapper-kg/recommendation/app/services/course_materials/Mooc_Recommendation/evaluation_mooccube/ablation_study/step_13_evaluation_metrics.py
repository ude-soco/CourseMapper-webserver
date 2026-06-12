"""
step_13_evaluation_metrics.py

Goal:
------------
Compute HR@K and NDCG@K for all learner model variants.

Input:
------------
Step 12 recommendation results:

output/recommendation_results/variant_xxx/recommendation_results.jsonl

Each recommendation item has:
    course_id
    score
    label

label = 1 means test positive course.
label = 0 means negative sampled course.

Metrics:
------------
1. HR@K Eq.1: Ground-truth level
   Count how many positive test courses are retrieved in Top-K.

2. HR@K Eq.2: User level
   Count whether each user has at least one hit in Top-K.

3. NDCG@K:
   Measure whether positive courses are ranked high.

Output:
------------
1. output/metrics/evaluation_metrics.json
2. output/metrics/metrics_summary.txt

Run:
cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/evaluation_mooccube/ablation_study
python step_13_evaluation_metrics.py

"""

import os
import math

from config import (
    RECOMMENDATION_RESULT_DIR,
    METRICS_DIR,
    EVALUATION_K_LIST,
    EVALUATION_METRICS_JSON,
    METRICS_SUMMARY_TXT,
    ensure_directories,
)

from utils import (
    load_jsonl,
    save_json,
    save_txt,
    print_info,
)


# ============================================================
# Variant names
# ============================================================

VARIANT_NAMES = [
    "variant_1_full",
    "variant_2_no_relation_matrix",
    "variant_3_no_node_weight",
    "variant_4_no_position_weight",
    "variant_5_no_first_weight",
    "variant_6_no_normalization",
    "variant_7_no_normalization_no_matrix",
]


# ============================================================
# 1. HR@K Eq.1: ground-truth level
# ============================================================

def compute_hr_eq1(records, k):
    """
    Compute HR@K Eq.1 at ground-truth level.

    Formula:
        HR@K = total_hits_at_k / total_ground_truth_items

    Here:
        total_hits_at_k:
            number of positive courses appearing in Top-K

        total_ground_truth_items:
            total number of test positive courses
    """
    total_hits = 0
    total_ground_truth = 0

    for record in records:
        top_k_items = record["recommendations"][:k]

        hits = sum(
            1 for item in top_k_items
            if item["label"] == 1
        )

        total_hits += hits
        total_ground_truth += record["num_positive_courses"]

    if total_ground_truth == 0:
        return 0.0

    return total_hits / total_ground_truth


# ============================================================
# 2. HR@K Eq.2: user level
# ============================================================

def compute_hr_eq2(records, k):
    """
    Compute HR@K Eq.2 at user level.

    Formula:
        HR@K = number_of_hit_users / number_of_users

    A user is counted as a hit user if at least one positive course
    appears in this user's Top-K recommendation list.
    """
    hit_users = 0
    total_users = len(records)

    for record in records:
        top_k_items = record["recommendations"][:k]

        hits = sum(
            1 for item in top_k_items
            if item["label"] == 1
        )

        if hits > 0:
            hit_users += 1

    if total_users == 0:
        return 0.0

    return hit_users / total_users


# ============================================================
# 3. NDCG@K
# ============================================================

def compute_dcg_at_k(recommendations, k):
    """
    Compute DCG@K for one user.

    We use binary relevance:
        label = 1 means relevant
        label = 0 means not relevant
    """
    dcg = 0.0

    top_k_items = recommendations[:k]

    for rank, item in enumerate(top_k_items, start=1):
        rel = item["label"]

        dcg += (2 ** rel - 1) / math.log2(rank + 1)

    return dcg


def compute_idcg_at_k(num_positive_courses, k):
    """
    Compute ideal DCG@K for one user.

    The ideal ranking puts all positive courses at the top.
    """
    ideal_positive_count = min(num_positive_courses, k)

    idcg = 0.0

    for rank in range(1, ideal_positive_count + 1):
        idcg += 1 / math.log2(rank + 1)

    return idcg


def compute_ndcg_at_k(records, k):
    """
    Compute average NDCG@K over all users.
    """
    ndcg_sum = 0.0
    total_users = len(records)

    for record in records:
        dcg = compute_dcg_at_k(
            recommendations=record["recommendations"],
            k=k,
        )

        idcg = compute_idcg_at_k(
            num_positive_courses=record["num_positive_courses"],
            k=k,
        )

        if idcg == 0:
            ndcg = 0.0
        else:
            ndcg = dcg / idcg

        ndcg_sum += ndcg

    if total_users == 0:
        return 0.0

    return ndcg_sum / total_users


# ============================================================
# 4. Compute all metrics for one variant
# ============================================================

def compute_metrics_for_variant(variant_name):
    """
    Compute HR@K Eq.1, HR@K Eq.2, and NDCG@K for one variant.
    """
    input_path = os.path.join(
        RECOMMENDATION_RESULT_DIR,
        variant_name,
        "recommendation_results.jsonl",
    )

    records = load_jsonl(input_path)

    metrics = {}

    for k in EVALUATION_K_LIST:
        metrics[f"HR@{k}_Eq1"] = compute_hr_eq1(records, k)
        metrics[f"HR@{k}_Eq2"] = compute_hr_eq2(records, k)
        metrics[f"NDCG@{k}"] = compute_ndcg_at_k(records, k)

    return metrics


# ============================================================
# 5. Format metrics table
# ============================================================

def format_percent(value):
    """
    Convert a decimal metric value into percentage text.
    """
    return f"{value * 100:.2f}%"


def build_metrics_table(all_metrics):
    """
    Build a readable metrics summary table.
    """
    lines = []

    lines.append("Comparison of LM-GNN Variants")
    lines.append("=" * 120)

    header_1 = (
        f"{'Methods':<38}"
        f"{'HR@5':^18}"
        f"{'HR@10':^18}"
        f"{'HR@20':^18}"
        f"{'NDCG@5':>12}"
        f"{'NDCG@10':>12}"
        f"{'NDCG@20':>12}"
    )

    header_2 = (
        f"{'':<38}"
        f"{'Eq.1':>9}{'Eq.2':>9}"
        f"{'Eq.1':>9}{'Eq.2':>9}"
        f"{'Eq.1':>9}{'Eq.2':>9}"
        f"{'':>12}"
        f"{'':>12}"
        f"{'':>12}"
    )

    lines.append(header_1)
    lines.append(header_2)
    lines.append("-" * 120)

    for variant_name in VARIANT_NAMES:
        metrics = all_metrics[variant_name]

        line = (
            f"{variant_name:<38}"
            f"{format_percent(metrics['HR@5_Eq1']):>9}"
            f"{format_percent(metrics['HR@5_Eq2']):>9}"
            f"{format_percent(metrics['HR@10_Eq1']):>9}"
            f"{format_percent(metrics['HR@10_Eq2']):>9}"
            f"{format_percent(metrics['HR@20_Eq1']):>9}"
            f"{format_percent(metrics['HR@20_Eq2']):>9}"
            f"{format_percent(metrics['NDCG@5']):>12}"
            f"{format_percent(metrics['NDCG@10']):>12}"
            f"{format_percent(metrics['NDCG@20']):>12}"
        )

        lines.append(line)

    lines.append("=" * 120)

    return lines


# ============================================================
# 6. Evaluate all variants
# ============================================================

def evaluate_all_variants():
    """
    Evaluate all variants and save the final metrics table.
    """
    ensure_directories()
    os.makedirs(METRICS_DIR, exist_ok=True)

    all_metrics = {}

    for variant_name in VARIANT_NAMES:
        print_info(f"Computing metrics for {variant_name}")

        metrics = compute_metrics_for_variant(variant_name)
        all_metrics[variant_name] = metrics

    save_json(
        all_metrics,
        EVALUATION_METRICS_JSON,
    )

    table_lines = build_metrics_table(all_metrics)

    save_txt(
        table_lines,
        METRICS_SUMMARY_TXT,
    )

    print_info("-" * 60)
    print_info("Step 13 evaluation finished.")
    print_info(f"Metrics JSON saved to: {EVALUATION_METRICS_JSON}")
    print_info(f"Metrics table saved to: {METRICS_SUMMARY_TXT}")
    print_info("-" * 60)

    for line in table_lines:
        print(line)


# ============================================================
# Main
# ============================================================

if __name__ == "__main__":
    evaluate_all_variants()