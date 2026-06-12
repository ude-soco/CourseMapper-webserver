"""
step_02_concept_name_embeddings.py

Goal:
------------
Generate SBERT embeddings for each concept_name in processed_concepts.jsonl.

Input:
------------
dataset/processed/processed_concepts.jsonl

Output:
------------
embeddings/concept_embeddings/concept_name_embeddings.npy
embeddings/concept_embeddings/concept_id_to_index.json

Notes:
------------
- Embedding dimension = 768
- Model = multilingual SBERT
- Each row in concept_name_embeddings.npy corresponds to one concept_id
- concept_id_to_index.json maps concept_id to row index in embedding matrix

Run:
------------
cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/evaluation_mooccube/ablation_study
python step_02_concept_name_embeddings.py
"""

import numpy as np
from sentence_transformers import SentenceTransformer

from config import *
from utils import *

# ============================================================
# 1. Load processed concepts
# ============================================================
def load_processed_concepts():
    """
    Load processed concepts from processed_concepts.jsonl.

    Each line should have this format:
    {
        "concept_id": "K_xxx",
        "concept_name": "机器学习"
    }
    """
    print_info("Loading processed concepts...")

    concepts = load_jsonl(PROCESSED_CONCEPTS_JSONL)

    print_info(f"Concept count: {len(concepts)}")
    return concepts


# ============================================================
# 2. Prepare concept texts
# ============================================================
def prepare_concept_texts(concepts):
    """
    Prepare concept names for SBERT embedding.

    Output:
        texts: [concept_name, ...]
        ids:   [concept_id, ...]

    Note:
        If concept_name is empty, concept_id is used as fallback.
    """
    texts = []
    ids = []
    seen_ids = set()

    for concept in concepts:
        concept_id = str(concept.get("concept_id", "")).strip()
        concept_name = str(concept.get("concept_name", "")).strip()

        if not concept_id:
            continue

        # Avoid duplicated concept_id
        if concept_id in seen_ids:
            continue

        seen_ids.add(concept_id)

        # Fallback: avoid empty text input
        if not concept_name:
            concept_name = concept_id

        ids.append(concept_id)
        texts.append(concept_name)

    print_info(f"Valid concept count for embedding: {len(ids)}")

    return texts, ids


# ============================================================
# 3. Generate SBERT embeddings
# ============================================================
def generate_embeddings(texts):
    """
    Generate SBERT embeddings for concept names.
    """
    if not texts:
        raise ValueError("No valid concept names found. Cannot generate embeddings.")

    print_info("Loading SBERT model...")
    print_info(f"SBERT model: {SBERT_MODEL}")

    model = SentenceTransformer(SBERT_MODEL)

    print_info("Generating concept name embeddings...")

    embeddings = model.encode(
        texts,
        batch_size=64,
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
def save_embeddings(embeddings, concept_ids):
    """
    Save:
    1. concept_name_embeddings.npy
    2. concept_id_to_index.json
    """
    print_info("Saving concept name embeddings...")

    np.save(CONCEPT_NAME_EMBEDDINGS_PATH, embeddings)

    concept_id_to_index = {
        concept_id: index
        for index, concept_id in enumerate(concept_ids)
    }

    save_json(concept_id_to_index, CONCEPT_ID_TO_INDEX_PATH)

    print_info(f"Saved embedding matrix to: {CONCEPT_NAME_EMBEDDINGS_PATH}")
    print_info(f"Saved concept id map to: {CONCEPT_ID_TO_INDEX_PATH}")


# ============================================================
# Main
# ============================================================
def main():
    print_info("Step 02 started: concept name embedding generation.")

    ensure_directories()

    print_info(f"Concept embedding directory: {CONCEPT_EMBEDDING_DIR}")

    concepts = load_processed_concepts()

    texts, concept_ids = prepare_concept_texts(concepts)

    embeddings = generate_embeddings(texts)

    save_embeddings(embeddings, concept_ids)

    print_info("Step 02 finished: concept name embedding generation DONE.")


if __name__ == "__main__":
    main()