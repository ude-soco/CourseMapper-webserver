"""
config.py (Clean + Scalable Version)

Organized configuration for MOOCube evaluation pipeline
"""

import os

# ========================
# Base Paths
# ========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

DATA_DIR = os.path.join(ROOT_DIR, "data")
RAW_DATA_DIR = os.path.join(DATA_DIR, "raw")
PROCESSED_DATA_DIR = os.path.join(DATA_DIR, "processed")

OUTPUT_DIR = os.path.join(ROOT_DIR, "outputs")

# ========================
# Raw Data
# ========================
USER_JSON = os.path.join(RAW_DATA_DIR, "user.json")
COURSE_JSON = os.path.join(RAW_DATA_DIR, "course.json")
CONCEPT_JSON = os.path.join(RAW_DATA_DIR, "concept.json")
COURSE_CONCEPT_JSON = os.path.join(RAW_DATA_DIR, "course-concept.json")

# ========================
# Processed Data
# ========================
PROCESSED_USER_JSON = os.path.join(PROCESSED_DATA_DIR, "processed_user.json")
PROCESSED_COURSE_JSON = os.path.join(PROCESSED_DATA_DIR, "processed_course.json")
PROCESSED_CONCEPT_JSON = os.path.join(PROCESSED_DATA_DIR, "processed_concept.json")

# 
PROCESSED_USER_CONCEPT_JSON = os.path.join(PROCESSED_DATA_DIR, "processed_user_concept.json")
PROCESSED_USER_CONCEPT_LIMIT_JSON = os.path.join(PROCESSED_DATA_DIR, "processed_user_concept_limit.json")

# ========================
# Statistics
# ========================
STAT_DIR = PROCESSED_DATA_DIR

PROCESSED_STATISTIC_TXT = os.path.join(STAT_DIR, "statistic_processed.txt")
# TRAIN_SET_EMPTY_TXT = os.path.join(STAT_DIR, "train_set_empty.txt")
# TEST_SET_EMPTY_TXT = os.path.join(STAT_DIR, "test_set_empty.txt")

# ========================
# Embeddings
# ========================
EMBEDDING_DIR = os.path.join(OUTPUT_DIR, "embeddings")

# Concept Embedding Output
CONCEPT_NAME_EMBEDDING_PATH = os.path.join(EMBEDDING_DIR, "concept_name_embeddings.npy")
CONCEPT_NAME_ID_TO_INDEX_PATH = os.path.join(EMBEDDING_DIR, "concept_name_id_to_index.json")

# Course
COURSE_NAME_EMBEDDING_PATH = os.path.join(EMBEDDING_DIR, "course_name_embeddings.npy")
COURSE_NAME_ID_TO_INDEX_PATH = os.path.join(EMBEDDING_DIR, "course_name_id_to_index.json")
COURSE_INITIAL_EMBEDDING_PATH = os.path.join(EMBEDDING_DIR, "course_initial_embeddings.npy")
COURSE_INITIAL_ID_TO_INDEX_PATH = os.path.join(EMBEDDING_DIR, "course_initial_id_to_index.json")


# Learner
LEARNER_INITIAL_EMBEDDING_PATH = os.path.join(EMBEDDING_DIR, "learner_initial_embeddings.npy")
LEARNER_FINAL_EMBEDDING_PATH = os.path.join(EMBEDDING_DIR, "learner_final_embeddings.npy")

# ========================
# Train Output
# ========================
TRAIN_OUTPUT_DIR = os.path.join(OUTPUT_DIR, "train")

LEARNER_TRAINING_DATA_PATH = os.path.join(PROCESSED_DATA_DIR, "processed_learner_training.json")

USER_COURSE_FINAL_EMBEDDING_PATH = os.path.join(TRAIN_OUTPUT_DIR, "user_course_final_embeddings.npy")
USER_COURSE_FINAL_MAPPING_PATH = os.path.join(TRAIN_OUTPUT_DIR, "user_course_final_mapping.json")

USER_CONCEPT_FINAL_EMBEDDING_PATH = os.path.join(TRAIN_OUTPUT_DIR, "user_concept_final_embeddings.npy")
USER_CONCEPT_FINAL_MAPPING_PATH = os.path.join(TRAIN_OUTPUT_DIR, "user_concept_final_mapping.json")


# ========================
# Metrics / Evaluation
# ========================
METRICS_DIR = os.path.join(OUTPUT_DIR, "metrics")

METRICS_SUMMARY_CSV = os.path.join(METRICS_DIR, "summary.csv")


# ========================
# Test / Debug Outputs
# ========================
TEST_OUTPUT_DIR = os.path.join(OUTPUT_DIR, "test")


# ========================
# Variant Experiments 
# ========================
VARIANT_DIR = os.path.join(OUTPUT_DIR, "variants")

def get_variant_metric_path(variant_name):
    return os.path.join(VARIANT_DIR, f"{variant_name}_metrics.json")

# Example:
# get_variant_metric_path("variant1")
# get_variant_metric_path("LM-GNN")

# ========================
# Experiment Parameters
# ========================
MIN_COURSE_PER_USER = 4

TRAIN_START = "2016-10-01"
TRAIN_END = "2017-12-30"
TEST_START = "2018-01-01"
TEST_END = "2018-03-31"

NEGATIVE_SAMPLE_SIZE = 99
TOP_K_LIST = [5, 10, 20]

SBERT_MODEL = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
EMBEDDING_DIM = 768

RANDOM_SEED = 42


TOP_CONCEPT_LIMIT = 20


# ========================
# Utils
# ========================
def ensure_directories():
    dirs = [
        RAW_DATA_DIR,
        PROCESSED_DATA_DIR,
        OUTPUT_DIR,
        EMBEDDING_DIR,
        METRICS_DIR,
        VARIANT_DIR,
        TRAIN_OUTPUT_DIR,
        TEST_OUTPUT_DIR
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)