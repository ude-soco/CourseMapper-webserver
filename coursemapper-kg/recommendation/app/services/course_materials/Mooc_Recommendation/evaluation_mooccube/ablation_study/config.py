"""
config.py

Path configuration for MOOCCube evaluation.

This file defines:
- dataset paths
- output paths
- embedding paths
- relationship information paths
- experiment settings
"""

import os


# ============================================================
# Basic folders
# ============================================================

# Current folder: evaluation_mooccube/ablation_study
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Root folder: evaluation_mooccube
ROOT_DIR = os.path.dirname(BASE_DIR)

DATASET_DIR = os.path.join(ROOT_DIR, "dataset")
ORIGINAL_DIR = os.path.join(DATASET_DIR, "original")
PROCESSED_DIR = os.path.join(DATASET_DIR, "processed")

# All generated results are saved under output/.
OUTPUT_DIR = os.path.join(ROOT_DIR, "output")

STATISTICS_DIR = os.path.join(OUTPUT_DIR, "statistics")

EMBEDDINGS_DIR = os.path.join(OUTPUT_DIR, "embeddings")
CONCEPT_EMBEDDING_DIR = os.path.join(EMBEDDINGS_DIR, "concept_embeddings")
COURSE_EMBEDDING_DIR = os.path.join(EMBEDDINGS_DIR, "course_embeddings")
USER_EMBEDDING_DIR = os.path.join(EMBEDDINGS_DIR, "user_embeddings")

SELECTED_CONCEPT_DIR = os.path.join(OUTPUT_DIR, "selected_concepts")
RELATIONSHIP_INFO_DIR = os.path.join(OUTPUT_DIR, "relationship_info")

NEGATIVE_SAMPLE_DIR = os.path.join(OUTPUT_DIR, "negative_samples")
RECOMMENDATION_RESULT_DIR = os.path.join(OUTPUT_DIR, "recommendation_results")
METRICS_DIR = os.path.join(OUTPUT_DIR, "metrics")


# ============================================================
# Original dataset files
# ============================================================

USER_JSON = os.path.join(ORIGINAL_DIR, "user.json")
COURSE_JSON = os.path.join(ORIGINAL_DIR, "course.json")
CONCEPT_JSON = os.path.join(ORIGINAL_DIR, "concept.json")
COURSE_CONCEPT_JSON = os.path.join(ORIGINAL_DIR, "course-concept.json")


# ============================================================
# Step 01: processed dataset files
# ============================================================

PROCESSED_USERS_JSONL = os.path.join(PROCESSED_DIR, "processed_users.jsonl")
PROCESSED_COURSES_JSONL = os.path.join(PROCESSED_DIR, "processed_courses.jsonl")
PROCESSED_CONCEPTS_JSONL = os.path.join(PROCESSED_DIR, "processed_concepts.jsonl")

PROCESSED_COURSE_CONCEPTS_JSONL = os.path.join(
    PROCESSED_DIR,
    "processed_course_concepts.jsonl",
)


# ============================================================
# Statistics files
# ============================================================

STATISTIC_ORIGINAL_TXT = os.path.join(
    STATISTICS_DIR,
    "statistic_original_dataset.txt",
)

STATISTIC_PROCESSED_TXT = os.path.join(
    STATISTICS_DIR,
    "statistic_processed_dataset.txt",
)

USER_TRAIN_TEST_DISTRIBUTION_PNG = os.path.join(
    STATISTICS_DIR,
    "user_train_test_distribution_light.png",
)


# ============================================================
# Step 02: concept name embeddings
# ============================================================

CONCEPT_NAME_EMBEDDINGS_PATH = os.path.join(
    CONCEPT_EMBEDDING_DIR,
    "concept_name_embeddings.npy",
)

CONCEPT_ID_TO_INDEX_PATH = os.path.join(
    CONCEPT_EMBEDDING_DIR,
    "concept_id_to_index.json",
)


# ============================================================
# Step 03: course name embeddings
# ============================================================

COURSE_NAME_EMBEDDINGS_PATH = os.path.join(
    COURSE_EMBEDDING_DIR,
    "course_name_embeddings.npy",
)

COURSE_ID_TO_INDEX_PATH = os.path.join(
    COURSE_EMBEDDING_DIR,
    "course_id_to_index.json",
)

# ============================================================
# Step 04: final course embeddings
# ============================================================

COURSE_EMBEDDINGS_PATH = os.path.join(
    COURSE_EMBEDDING_DIR,
    "course_embeddings.npy",
)

FINAL_COURSE_ID_TO_INDEX_PATH = COURSE_ID_TO_INDEX_PATH


# ============================================================
# Step 05: selected top-20 course concepts
# ============================================================

COURSE_TOP20_CONCEPTS_JSONL = os.path.join(
    SELECTED_CONCEPT_DIR,
    "course_top20_concepts.jsonl",
)


# ============================================================
# Step 06: raw relationship dictionaries
# ============================================================

# Raw enrolled relation dictionary.
# Each line is one user:
# user_id -> enrolled course nodes from train_courses.
RAW_ENROLLED_RELATIONSHIP_DICTIONARY_JSONL = os.path.join(
    RELATIONSHIP_INFO_DIR,
    "raw_enrolled_relationship_dictionary.jsonl",
)

# Raw interested relation dictionary.
# Each line is one user:
# user_id -> interested concept nodes inferred from train_courses and top-20 concepts.
RAW_INTERESTED_RELATIONSHIP_DICTIONARY_JSONL = os.path.join(
    RELATIONSHIP_INFO_DIR,
    "raw_interested_relationship_dictionary.jsonl",
)


# ============================================================
# Step 07: weighted relation information
# ============================================================

# Enrolled relation info with position weight, first weight component,
# full node weight, and inner weight sum.
ENROLLED_RELATION_INFO_JSONL = os.path.join(
    RELATIONSHIP_INFO_DIR,
    "enrolled_relation_info.jsonl",
)

# Interested relation info with position weight, first weight component,
# full node weight, and inner weight sum.
INTERESTED_RELATION_INFO_JSONL = os.path.join(
    RELATIONSHIP_INFO_DIR,
    "interested_relation_info.jsonl",
)

# Statistics for checking negative weights and near-zero weight sums.
NODE_WEIGHT_STATISTICS_JSON = os.path.join(
    RELATIONSHIP_INFO_DIR,
    "node_weight_statistics.json",
)


# ============================================================
# Step 09: relation-specific matrices
# ============================================================

# Random relation-specific matrices for enrolled and interested relations.
# Saved for reproducibility.
RELATION_SPECIFIC_MATRICES_NPZ = os.path.join(
    RELATIONSHIP_INFO_DIR,
    "relation_specific_matrices.npz",
)

# ============================================================
# Step 11: negative sampling settings
# ============================================================

RANDOM_SEED = 42

NEGATIVE_SAMPLE_SIZE_PER_POSITIVE = 99

NEGATIVE_SAMPLES_JSONL = os.path.join(
    NEGATIVE_SAMPLE_DIR,
    "negative_samples.jsonl",
)

# ============================================================
# Step 12: recommendation settings
# ============================================================

RECOMMENDATION_TOP_K = 20

# ============================================================
# Step 13: evaluation metrics
# ============================================================

EVALUATION_K_LIST = [5, 10, 20]

EVALUATION_METRICS_JSON = os.path.join(
    METRICS_DIR,
    "evaluation_metrics.json",
)

METRICS_SUMMARY_TXT = os.path.join(
    METRICS_DIR,
    "metrics_summary.txt",
)


# ============================================================
# Model settings for Step 02 and Step 03
# ============================================================

SBERT_MODEL = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
EMBEDDING_DIM = 768
SBERT_BATCH_SIZE = 64


# ============================================================
# Experiment settings for Step 01 to Step 05
# ============================================================

MIN_COURSE_PER_USER = 4
TOP_K_CONCEPTS = 20

TRAIN_START_DATE = "2016-10-01"
TRAIN_END_DATE = "2017-12-30"

TEST_START_DATE = "2018-01-01"
TEST_END_DATE = "2018-03-31"



# ============================================================
# Directory creation
# ============================================================

def ensure_dirs():
    """
    Create folders needed by the MOOCCube evaluation pipeline.
    """
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(STATISTICS_DIR, exist_ok=True)

    os.makedirs(EMBEDDINGS_DIR, exist_ok=True)
    os.makedirs(CONCEPT_EMBEDDING_DIR, exist_ok=True)
    os.makedirs(COURSE_EMBEDDING_DIR, exist_ok=True)
    os.makedirs(USER_EMBEDDING_DIR, exist_ok=True)

    os.makedirs(SELECTED_CONCEPT_DIR, exist_ok=True)
    os.makedirs(RELATIONSHIP_INFO_DIR, exist_ok=True)

    os.makedirs(NEGATIVE_SAMPLE_DIR, exist_ok=True)
    os.makedirs(RECOMMENDATION_RESULT_DIR, exist_ok=True)
    os.makedirs(METRICS_DIR, exist_ok=True)


def ensure_directories():
    """
    Alias for old code compatibility.
    """
    ensure_dirs()