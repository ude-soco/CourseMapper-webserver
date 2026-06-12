"""
step_03_course_name_embeddings.py

Goal:
------------
Generate SBERT embeddings for each course_name in processed_courses.jsonl.

Input:
------------
dataset/processed/processed_courses.jsonl

Output:
------------
embeddings/course_embeddings/course_name_embeddings.npy
embeddings/course_embeddings/course_id_to_index.json

Important:
------------
The course_id_to_index.json generated in this step will also be reused by
Step 04 final course embeddings.

That means:
course_name_embeddings.npy[index] and course_embeddings.npy[index]
must refer to the same course_id.

Run:
------------
cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/evaluation_mooccube/ablation_study
python step_03_course_name_embeddings.py

"""

import numpy as np
from sentence_transformers import SentenceTransformer

from config import *
from utils import *

# ============================================================
# 1. Load processed courses
# ============================================================

def load_processed_courses():
    """
    Load processed courses from processed_courses.jsonl.

    Each line should have this format:
    {
        "course_id": "C_xxx",
        "course_name": "大学计算机基础",
        "concept_ids": ["K_xxx", "K_yyy"]
    }
    """
    print_info("Loading processed courses...")

    courses = load_jsonl(PROCESSED_COURSES_JSONL)

    print_info(f"Course count: {len(courses)}")
    return courses


# ============================================================
# 2. Prepare course texts
# ============================================================

def prepare_course_texts(courses):
    """
    Prepare course names for SBERT embedding.

    Output:
        texts: [course_name, ...]
        ids:   [course_id, ...]

    Note:
        If course_name is empty, course_id is used as fallback.
    """
    texts = []
    ids = []
    seen_ids = set()

    for course in courses:
        course_id = str(course.get("course_id", "")).strip()
        course_name = str(course.get("course_name", "")).strip()

        if not course_id:
            continue

        # Avoid duplicated course_id
        if course_id in seen_ids:
            continue

        seen_ids.add(course_id)

        # Fallback: avoid empty text input
        if not course_name:
            course_name = course_id

        ids.append(course_id)
        texts.append(course_name)

    print_info(f"Valid course count for embedding: {len(ids)}")

    return texts, ids


# ============================================================
# 3. Generate SBERT embeddings
# ============================================================

def generate_embeddings(texts):
    """
    Generate SBERT embeddings for course names.
    """
    if not texts:
        raise ValueError("No valid course names found. Cannot generate embeddings.")

    print_info("Loading SBERT model...")
    print_info(f"SBERT model: {SBERT_MODEL}")

    model = SentenceTransformer(SBERT_MODEL)

    print_info("Generating course name embeddings...")

    embeddings = model.encode(
        texts,
        batch_size=SBERT_BATCH_SIZE,
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=False,
    )

    embeddings = embeddings.astype(np.float32)

    print_info(f"Embedding shape: {embeddings.shape}")

    return embeddings


# ============================================================
# 4. Save embeddings
# ============================================================

def save_embeddings(embeddings, course_ids):
    """
    Save:
    1. course_name_embeddings.npy
    2. course_id_to_index.json
    """
    print_info("Saving course name embeddings...")

    np.save(COURSE_NAME_EMBEDDINGS_PATH, embeddings)

    course_id_to_index = {
        course_id: index
        for index, course_id in enumerate(course_ids)
    }

    save_json(course_id_to_index, COURSE_ID_TO_INDEX_PATH)

    print_info(f"Saved embedding matrix to: {COURSE_NAME_EMBEDDINGS_PATH}")
    print_info(f"Saved course id map to: {COURSE_ID_TO_INDEX_PATH}")


# ============================================================
# Main
# ============================================================

def main():
    print_info("Step 03 started: course name embedding generation.")

    ensure_dirs()

    print_info(f"Course embedding directory: {COURSE_EMBEDDING_DIR}")

    courses = load_processed_courses()

    texts, course_ids = prepare_course_texts(courses)

    embeddings = generate_embeddings(texts)

    save_embeddings(embeddings, course_ids)

    print_info("Step 03 finished: course name embedding generation DONE.")


if __name__ == "__main__":
    main()