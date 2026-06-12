"""
step_12_recommendation.py

Goal:
------------
Generate Top-20 recommendation results for each learner model variant.

Main logic:
------------
1. Load negative samples from Step 11.
2. Load final course embeddings from Step 04.
3. Load user embeddings from Step 10.
4. For each user, build candidate courses:
       test positive courses + negative sampled courses.
5. Compute cosine similarity between the user embedding and each candidate course embedding.
6. Save Top-20 recommendation results for each variant.

Output:
------------
output/recommendation_results/variant_xxx/recommendation_results.jsonl

Run:
cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/evaluation_mooccube/ablation_study
python step_12_recommendation.py
"""

import os

from config import (
    COURSE_EMBEDDINGS_PATH,
    FINAL_COURSE_ID_TO_INDEX_PATH,
    USER_EMBEDDING_DIR,
    NEGATIVE_SAMPLES_JSONL,
    RECOMMENDATION_RESULT_DIR,
    RECOMMENDATION_TOP_K,
    ensure_directories,
)

from utils import (
    load_json,
    load_jsonl,
    load_npy,
    save_jsonl,
    cosine_similarity,
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
# 1. Load user embeddings for one variant
# ============================================================

def load_variant_user_embeddings(variant_name):
    """
    Load user embeddings and user_id_to_index for one variant.
    """
    variant_dir = os.path.join(USER_EMBEDDING_DIR, variant_name)

    user_embeddings_path = os.path.join(
        variant_dir,
        "user_embeddings.npy",
    )

    user_id_to_index_path = os.path.join(
        variant_dir,
        "user_id_to_index.json",
    )

    user_embeddings = load_npy(user_embeddings_path)
    user_id_to_index = load_json(user_id_to_index_path)

    return user_embeddings, user_id_to_index


# ============================================================
# 2. Build recommendation results for one user
# ============================================================

def build_user_recommendations(
    user_embedding,
    test_course_ids,
    negative_course_ids,
    course_embeddings,
    course_id_to_index,
):
    """
    Build Top-20 recommendations for one user.

    Positive courses come from test_course_ids.
    Negative courses come from negative_course_ids.
    The ranking score is cosine similarity.
    """
    positive_course_set = set(test_course_ids)

    candidate_course_ids = test_course_ids + negative_course_ids

    # Remove duplicated candidates.
    candidate_course_ids = list(dict.fromkeys(candidate_course_ids))

    recommendations = []

    for course_id in candidate_course_ids:
        course_index = course_id_to_index[course_id]
        course_embedding = course_embeddings[course_index]

        score = cosine_similarity(
            user_embedding,
            course_embedding,
        )

        label = 1 if course_id in positive_course_set else 0

        recommendations.append(
            {
                "course_id": course_id,
                "score": score,
                "label": label,
            }
        )

    recommendations.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    return recommendations[:RECOMMENDATION_TOP_K]


# ============================================================
# 3. Generate recommendations for one variant
# ============================================================

def generate_recommendations_for_variant(
    variant_name,
    negative_sample_records,
    course_embeddings,
    course_id_to_index,
):
    """
    Generate Top-20 recommendation results for one variant.
    """
    print_info("-" * 60)
    print_info(f"Generating recommendations for {variant_name}")

    user_embeddings, user_id_to_index = load_variant_user_embeddings(
        variant_name
    )

    recommendation_records = []

    for record in negative_sample_records:
        user_id = str(record["user_id"])

        user_index = user_id_to_index[user_id]
        user_embedding = user_embeddings[user_index]

        test_course_ids = record["test_course_ids"]
        negative_course_ids = record["negative_course_ids"]

        recommendations = build_user_recommendations(
            user_embedding=user_embedding,
            test_course_ids=test_course_ids,
            negative_course_ids=negative_course_ids,
            course_embeddings=course_embeddings,
            course_id_to_index=course_id_to_index,
        )

        recommendation_records.append(
            {
                "user_id": user_id,
                "recommendations": recommendations,
                "num_positive_courses": len(test_course_ids),
                "num_negative_courses": len(negative_course_ids),
                "top_k": RECOMMENDATION_TOP_K,
            }
        )

    output_path = os.path.join(
        RECOMMENDATION_RESULT_DIR,
        variant_name,
        "recommendation_results.jsonl",
    )

    save_jsonl(
        recommendation_records,
        output_path,
    )

    print_info(f"Saved records: {len(recommendation_records)}")
    print_info(f"Output path: {output_path}")


# ============================================================
# 4. Generate recommendations for all variants
# ============================================================

def generate_all_recommendations():
    """
    Generate Top-20 recommendation results for all variants.
    """
    ensure_directories()

    print_info("Loading negative samples...")
    negative_sample_records = load_jsonl(NEGATIVE_SAMPLES_JSONL)

    print_info("Loading final course embeddings...")
    course_embeddings = load_npy(COURSE_EMBEDDINGS_PATH)

    print_info("Loading course_id_to_index...")
    course_id_to_index = load_json(FINAL_COURSE_ID_TO_INDEX_PATH)

    print_info(f"Negative sample records: {len(negative_sample_records)}")
    print_info(f"Course embeddings shape: {course_embeddings.shape}")
    print_info(f"Recommendation Top-K: {RECOMMENDATION_TOP_K}")

    for variant_name in VARIANT_NAMES:
        generate_recommendations_for_variant(
            variant_name=variant_name,
            negative_sample_records=negative_sample_records,
            course_embeddings=course_embeddings,
            course_id_to_index=course_id_to_index,
        )

    print_info("-" * 60)
    print_info("Step 12 recommendation generation finished.")


# ============================================================
# Main
# ============================================================

if __name__ == "__main__":
    generate_all_recommendations()