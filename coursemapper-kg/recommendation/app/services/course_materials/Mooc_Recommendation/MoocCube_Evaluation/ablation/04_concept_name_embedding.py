"""
04_concept_name.py

Goal:
------------
Generate SBERT embeddings for each concept_name in processed_concept.json

Steps:
------------
1. Load processed concepts
2. Encode concept_name using SBERT
3. Save:
   - concept_embeddings.npy
   - concept_id_to_index.json

Notes:
------------
- Embedding dimension = 768
- Model = multilingual SBERT (supports Chinese + English)
"""

"""
Output files:
- concept_name_embeddings.npy: shape (num_concepts, 768)
- concept_name_id_to_index.json: {concept_id: row_index_in_embedding_matrix}
"""

"""
    cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/MoocCube_Evaluation/ablation
    python 04_concept_name.py
"""

import numpy as np
from sentence_transformers import SentenceTransformer

from config import *
from utils import *


# ===============================
# Load Processed Concepts
# ===============================
def load_processed_concepts():
    print_info("Loading processed concepts...")
    concepts = load_json(PROCESSED_CONCEPT_JSON)
    print_info(f"Concept count: {len(concepts)}")
    return concepts


# ===============================
# Build Text List
# ===============================
def prepare_concept_texts(concepts):
    """
    Prepare concept names for embedding

    Output:
        texts: [concept_name, ...]
        ids:   [concept_id, ...]
    """
    texts = []
    ids = []

    for c in concepts:
        cid = str(c.get("concept_id", "")).strip()
        cname = str(c.get("concept_name", "")).strip()

        if not cid:
            continue

        # if concept_name is empty, use concept_id as fallback (to avoid empty embedding)
        if not cname:
            cname = cid

        ids.append(cid)
        texts.append(cname)

    return texts, ids


# ===============================
# Generate Embeddings
# ===============================
def generate_embeddings(texts):
    print_info("Loading SBERT model...")
    model = SentenceTransformer(SBERT_MODEL)

    print_info("Generating embeddings...")

    embeddings = model.encode(
        texts,
        batch_size=64,
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=False,  
    )

    print_info(f"Embedding shape: {embeddings.shape}")
    return embeddings


# ===============================
# Save Embeddings
# ===============================
def save_embeddings(embeddings, ids):
    """
    Save concept embeddings and concept-id mapping.

    保存两个文件：
    1. concept embedding matrix (.npy)
    2. concept_id -> row index mapping (.json)
    """
    print_info("Saving embeddings...")

    # Save embedding matrix
    np.save(CONCEPT_NAME_EMBEDDING_PATH, embeddings)

    # Save concept_id -> index mapping
    id_map = {cid: idx for idx, cid in enumerate(ids)}
    save_json(id_map, CONCEPT_NAME_ID_TO_INDEX_PATH)

    print_info(f"Saved embeddings to: {CONCEPT_NAME_EMBEDDING_PATH}")
    print_info(f"Saved id map to: {CONCEPT_NAME_ID_TO_INDEX_PATH}")


# ===============================
# Main
# ===============================
def main():
    print_info("Concept embedding generation started.")
    ensure_directories()
    print("Embedding dir:", EMBEDDING_DIR)

    concepts = load_processed_concepts()

    texts, ids = prepare_concept_texts(concepts)

    embeddings = generate_embeddings(texts)

    save_embeddings(embeddings, ids)

    print_info("Concept embedding generation DONE ✅")


if __name__ == "__main__":
    main()