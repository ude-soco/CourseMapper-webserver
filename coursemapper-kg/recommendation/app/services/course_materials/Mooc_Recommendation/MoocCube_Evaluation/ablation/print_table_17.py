"""
Run:
cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/MoocCube_Evaluation/ablation
python print_table_17.py
"""

import os

from config import METRICS_DIR, ensure_directories
from utils import save_txt, print_info
from variant_store_13 import save_all_variant_embeddings
from negative_sample_14 import generate_negative_sample
from recommendation_list_15 import generate_recommendation_list
from evaluation_16 import evaluate_one_variant


"""
Run the whole evaluation pipeline and print one final table.

"""


def run_all(force_variant=False):
    print_info("Step 1/4: build or load all variant embeddings")
    save_all_variant_embeddings(force=force_variant)

    print_info("Step 2/4: generate shared negative samples")
    generate_negative_sample()

    print_info("Step 3/4: build recommendation lists and compute metrics")
    results = []
    for variant_id in range(1, 8):
        print_info(f"Processing variant {variant_id}")
        generate_recommendation_list(variant_id, top_k=20)
        metrics = evaluate_one_variant(variant_id)
        results.append(metrics)

    print_info("Step 4/4: print final table")
    headers = [
        "Variant", "HRg@5", "HRg@10", "HRg@20",
        "HRu@5", "HRu@10", "HRu@20",
        "NDCG@5", "NDCG@10", "NDCG@20",
    ]
    line = " | ".join(headers)
    print(line)
    print("-" * len(line))

    lines = [line, "-" * len(line)]
    for m in results:
        row = [
            f"V{m['variant_id']}",
            f"{m['HR_ground_truth_level']['HR@5']:.4f}",
            f"{m['HR_ground_truth_level']['HR@10']:.4f}",
            f"{m['HR_ground_truth_level']['HR@20']:.4f}",
            f"{m['HR_user_level']['HR@5']:.4f}",
            f"{m['HR_user_level']['HR@10']:.4f}",
            f"{m['HR_user_level']['HR@20']:.4f}",
            f"{m['NDCG']['NDCG@5']:.4f}",
            f"{m['NDCG']['NDCG@10']:.4f}",
            f"{m['NDCG']['NDCG@20']:.4f}",
        ]
        row_text = " | ".join(row)
        print(row_text)
        lines.append(row_text)

    ensure_directories()
    save_txt(lines, os.path.join(METRICS_DIR, "metrics_table.txt"))


if __name__ == "__main__":
    run_all(force_variant=True)
