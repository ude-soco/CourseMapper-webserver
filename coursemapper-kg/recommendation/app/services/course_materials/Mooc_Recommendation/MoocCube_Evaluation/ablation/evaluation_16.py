import os
import math

from config import PROCESSED_USER_JSON, TEST_OUTPUT_DIR, METRICS_DIR, TOP_K_LIST, ensure_directories
from utils import load_json, save_json


"""
This file only does one thing:
Compute HR@K and NDCG@K for one variant.

"""



def build_ground_truth_dict():
    # Read the testing courses of each user.
  
    users = load_json(PROCESSED_USER_JSON)
    ground_truth = {}
    for item in users:
        user_id = str(item.get("user_id", "")).strip()
        if not user_id:
            continue
        test_course_ids = [str(x.get("course_id", "")).strip() for x in item.get("test_courses", []) if x.get("course_id")]
        ground_truth[user_id] = list(dict.fromkeys(test_course_ids))
    return ground_truth



def compute_hr_ground_truth_level(recommendation_dict, ground_truth_dict, k):
    # HR@K at ground-truth level:
    # sum of all hits divided by the total number of ground-truth items.

    total_hits = 0
    total_ground_truth = 0

    for user_id, gt_items in ground_truth_dict.items():
        rec_items = recommendation_dict.get(user_id, {}).get("top20_course_ids", [])[:k]
        total_hits += len(set(rec_items) & set(gt_items))
        total_ground_truth += len(gt_items)

    if total_ground_truth == 0:
        return 0.0
    return float(total_hits / total_ground_truth)



def compute_hr_user_level(recommendation_dict, ground_truth_dict, k):
    # HR@K at user level:
    # count whether a user has at least one hit in top-K.

    hit_user_count = 0
    user_count = 0

    for user_id, gt_items in ground_truth_dict.items():
        rec_items = recommendation_dict.get(user_id, {}).get("top20_course_ids", [])[:k]
        if len(gt_items) == 0:
            continue
        user_count += 1
        if len(set(rec_items) & set(gt_items)) > 0:
            hit_user_count += 1

    if user_count == 0:
        return 0.0
    return float(hit_user_count / user_count)



def compute_ndcg(recommendation_dict, ground_truth_dict, k):
    # NDCG@K with binary relevance.
   
    total_ndcg = 0.0
    user_count = 0

    for user_id, gt_items in ground_truth_dict.items():
        if len(gt_items) == 0:
            continue

        rec_items = recommendation_dict.get(user_id, {}).get("top20_course_ids", [])[:k]
        gt_set = set(gt_items)

        dcg = 0.0
        for rank, course_id in enumerate(rec_items, start=1):
            rel = 1 if course_id in gt_set else 0
            dcg += (2 ** rel - 1) / math.log2(rank + 1)

        ideal_hits = min(len(gt_items), k)
        idcg = 0.0
        for rank in range(1, ideal_hits + 1):
            idcg += 1.0 / math.log2(rank + 1)

        if idcg == 0:
            continue

        total_ndcg += dcg / idcg
        user_count += 1

    if user_count == 0:
        return 0.0
    return float(total_ndcg / user_count)



def evaluate_one_variant(variant_id):
    # Step 1: Read recommendation list and ground truth.

    recommendation_path = os.path.join(TEST_OUTPUT_DIR, f"recommendation_variant_{variant_id}.json")
    recommendation_dict = load_json(recommendation_path)
    ground_truth_dict = build_ground_truth_dict()

    # Step 2: Compute all HR@K and NDCG@K scores.
  
    metrics = {
        "variant_id": variant_id,
        "HR_ground_truth_level": {},
        "HR_user_level": {},
        "NDCG": {},
    }

    for k in TOP_K_LIST:
        metrics["HR_ground_truth_level"][f"HR@{k}"] = compute_hr_ground_truth_level(recommendation_dict, ground_truth_dict, k)
        metrics["HR_user_level"][f"HR@{k}"] = compute_hr_user_level(recommendation_dict, ground_truth_dict, k)
        metrics["NDCG"][f"NDCG@{k}"] = compute_ndcg(recommendation_dict, ground_truth_dict, k)

    # Step 3: Save the evaluation result.

    ensure_directories()
    save_path = os.path.join(METRICS_DIR, f"variant_{variant_id}_metrics.json")
    save_json(metrics, save_path)
    return metrics
