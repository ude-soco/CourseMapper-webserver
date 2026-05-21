"""
09_learner_concept_final.py

Goal:
--------------------------------------------------
Construct "user-specific" concept final embeddings for each learner (user).
For each learner (user):
1. Read the user's training_concepts
2. If empty, skip (since we won't consider learner-interest-concept relationships)
3. Build the user's own concept initial matrix V_concept
4. Build the correlation matrix C_interest (cosine similarity between concepts)
5. Build the mask matrix I (determined by concept interest time)
6. Build the sequential matrix beta = C + I, and set negative values to 0
7. Compute F_concept_final = beta @ V_concept
8. Save the results as:
    - A global .npy embedding matrix
    - A mapping.json from user to embedding indices 

Formulas:
--------------------------------------------------
F_concept_final = beta_concept * V_concept
beta = C + I, with all negative values in beta set to 0


"""
"""
Run:
cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/MoocCube_Evaluation/ablation
python 09_learner_concept_final.py
"""

import os
import json
import numpy as np

from config import *
from utils import *


# ==========================================================
# Load all necessary data
# ==========================================================
def load_all_data():
  
    """
    Load all necessary data:
    1) Learner training data (processed_learner_training.json)
    2) Global concept name embedding matrix (.npy)
    3) concept_id -> index mapping (.json)
    """
    print_info("Loading learner training data...")
    learner_data = load_json(LEARNER_TRAINING_DATA_PATH)

    print_info("Loading global concept name embeddings...")
    concept_initial_embedding_matrix = np.load(CONCEPT_NAME_EMBEDDING_PATH)

    with open(CONCEPT_NAME_ID_TO_INDEX_PATH, "r", encoding="utf-8") as f:
        concept_initial_id_to_index = json.load(f)

    print_info(f"Learner count: {len(learner_data)}")
    print_info(f"Global concept name embedding shape: {concept_initial_embedding_matrix.shape}")

    return learner_data, concept_initial_embedding_matrix, concept_initial_id_to_index


# ==========================================================
# Construct the user's own concept initial matrix V_concept
# ==========================================================
def build_user_concept_initial_matrix(training_concepts, global_concept_initial_matrix, concept_id_to_index):
    """
    input：
        training_concepts: 
            [
              {
                "concept_id": "...",
                "interest_time": "...",
                "interest_position_time": ...
              },
              ...
            ]

    output：
        concept_records: 
        V_concept:       shape=(N, EMBEDDING_DIM)
    """
    concept_records = []
    embedding_list = []

    for concept in training_concepts:
        # use get to avoid KeyError from dirty data, and strip to clean whitespace
        concept_id = str(concept.get("concept_id", "")).strip()
        interest_time = str(concept.get("interest_time", "")).strip()
        interest_position_time = concept.get("interest_position_time", None)
        source_course_id = str(concept.get("source_course_id", "")).strip()  # 新增：先定义

        # lack key fields -> skip
        if not concept_id or interest_position_time is None:
            continue

        # concept is not in the global initial embedding mapping -> skip
        if concept_id not in concept_id_to_index:
            continue

        # get the global initial vector for this concept
        idx = concept_id_to_index[concept_id]
        vec = global_concept_initial_matrix[idx]

     
        # record the concept meta info for later use in building C, I, and the final mapping
        concept_records.append({
            "concept_id": concept_id,
            "interest_time": interest_time,
            "interest_position_time": interest_position_time,
            "source_course_id": source_course_id,
        })
        embedding_list.append(vec)


    # no valid concepts for this user
    if len(embedding_list) == 0:
        return concept_records, np.zeros((0, EMBEDDING_DIM), dtype=np.float32)


    # stack into (N, d)
    V_concept = np.array(embedding_list, dtype=np.float32)
    return concept_records, V_concept


# ==========================================================
# construct the correlation matrix C_interest
# ==========================================================
def build_correlation_matrix(V_concept):
    """
    C_ij = cos(v_i, v_j)
    input：V_concept shape=(N, d)
    output：C shape=(N, N)
    """
    num_nodes = V_concept.shape[0]

    if num_nodes == 0:
        return np.zeros((0, 0), dtype=np.float32)

    C = np.zeros((num_nodes, num_nodes), dtype=np.float32)

    for i in range(num_nodes):
        for j in range(num_nodes):
            C[i, j] = cosine_similarity(V_concept[i], V_concept[j])

    return C


# ==========================================================
# construct the mask matrix I based on interest_position_time
# ==========================================================
def build_mask_matrix(concept_records):
    """
    according interest_position_time to constrcut I：

    I_ij = 0    if t_i <= t_j
    I_ij = -10  if t_i > t_j
    """
    num_nodes = len(concept_records)

    if num_nodes == 0:
        return np.zeros((0, 0), dtype=np.float32)

    I = np.zeros((num_nodes, num_nodes), dtype=np.float32)
    positions = [x["interest_position_time"] for x in concept_records]

    for i in range(num_nodes):
        for j in range(num_nodes):
            if positions[i] <= positions[j]:
                I[i, j] = 0.0
            else:
                I[i, j] = -10.0

    return I


# ==========================================================
# construct the sequential matrix beta
# ==========================================================
def build_sequential_matrix(C, I):

    if C.shape[0] == 0:
        return np.zeros((0, 0), dtype=np.float32)

    beta = C + I
    beta = np.where(beta < 0, 0.0, beta).astype(np.float32)
    return beta


# ==========================================================
# generate the final concept embedding for a user
# ==========================================================
def update_user_concept_embeddings(V_concept, beta_concept):
    """
    F_concept_final = beta_concept @ V_concept

    input：
        V_concept:    (N, d)
        beta_concept: (N, N)
    output：
        F_concept_final: (N, d)
    """
    if V_concept.shape[0] == 0:
        return np.zeros((0, EMBEDDING_DIM), dtype=np.float32)

    F_concept_final = np.dot(beta_concept, V_concept).astype(np.float32)
    return F_concept_final


# ==========================================================
# test print
# ==========================================================
DEBUG_PRINT_MATRIX_STATS = False
DEBUG_USER_LIMIT = 1  


def _print_matrix_stats(name, mat):
    
    if mat.size == 0:
        print_info(f"[DEBUG] {name}: empty")
        return
    neg_count = int((mat < 0).sum())
    print_info(
        f"[DEBUG] {name}: shape={mat.shape}, min={mat.min():.6f}, max={mat.max():.6f}, neg_count={neg_count}"
    )


# ==========================================================
# main process: build concept final embedding for all users
# ==========================================================
def build_all_user_concept_final_embeddings():
    learner_data, global_concept_initial_matrix, concept_id_to_index = load_all_data()

    all_embeddings = []      
    all_mapping = {}         # user_id -> [{concept_id, ..., concept_final_embedding_index}]
    current_global_index = 0 
    skipped_empty_users = 0  

    for user_idx, user in enumerate(learner_data, start=1):
        user_id = str(user.get("user_id", "")).strip()
        if not user_id:
            print_warning(f"Skip user at index={user_idx}: empty user_id")
            continue

        training_concepts = user.get("training_concepts", [])

        if not training_concepts:
            skipped_empty_users += 1
            continue

        # Step 1: Build the user's own concept initial matrix
        concept_records, V_concept = build_user_concept_initial_matrix(
            training_concepts=training_concepts,
            global_concept_initial_matrix=global_concept_initial_matrix,
            concept_id_to_index=concept_id_to_index,
        )

        if len(concept_records) == 0:
            skipped_empty_users += 1
            continue


        # Step 2: Build the correlation matrix
        C = build_correlation_matrix(V_concept)

    
        # Step 3: Build the mask matrix I
        I = build_mask_matrix(concept_records)

        # Step 4: Construct beta
        beta = build_sequential_matrix(C, I)

        # 可选调试打印test print
        if DEBUG_PRINT_MATRIX_STATS and user_idx <= DEBUG_USER_LIMIT:
            print_info(f"[DEBUG] user_id={user_id}, concept_count={len(concept_records)}")
            _print_matrix_stats("C", C)
            _print_matrix_stats("I", I)
            _print_matrix_stats("beta", beta)

    
        # Step 5: Compute the final concept embedding for this user
        F_concept_final = update_user_concept_embeddings(V_concept, beta)

        # Step 6: Write to global results + user mapping
        user_mapping_list = []
        for local_idx, record in enumerate(concept_records):
            global_idx = current_global_index

        
            # write the vector to global list
            all_embeddings.append(F_concept_final[local_idx])

            # record the global embedding index for this concept in the mapping
            user_mapping_list.append({
                "concept_id": record["concept_id"],
                "interest_time": record["interest_time"],
                "interest_position_time": record["interest_position_time"],
                "source_course_id": record.get("source_course_id"),  # 新增
                "concept_final_embedding_index": global_idx,
            })

            current_global_index += 1

        all_mapping[user_id] = user_mapping_list

        if user_idx % 100 == 0:
            print_info(f"Processed {user_idx} users...")


    if len(all_embeddings) == 0:
        final_matrix = np.zeros((0, EMBEDDING_DIM), dtype=np.float32)
    else:
        final_matrix = np.array(all_embeddings, dtype=np.float32)

    print_info(f"Skipped users with empty training_concepts: {skipped_empty_users}")

    return final_matrix, all_mapping


# ==========================================================
# Save results
# ==========================================================
def save_results(final_matrix, all_mapping):
    """
    save results:
    1) USER_CONCEPT_FINAL_EMBEDDING_PATH (.npy)
    2) USER_CONCEPT_FINAL_MAPPING_PATH   (.json)
    """
    os.makedirs(TRAIN_OUTPUT_DIR, exist_ok=True)

    np.save(USER_CONCEPT_FINAL_EMBEDDING_PATH, final_matrix)

    with open(USER_CONCEPT_FINAL_MAPPING_PATH, "w", encoding="utf-8") as f:
        json.dump(all_mapping, f, ensure_ascii=False, indent=2)

    print_info(f"Saved user concept final embeddings to: {USER_CONCEPT_FINAL_EMBEDDING_PATH}")
    print_info(f"Saved user concept final mapping to: {USER_CONCEPT_FINAL_MAPPING_PATH}")
    print_info(f"Final matrix shape: {final_matrix.shape}")


# ==========================================================
# Main
# ==========================================================
def main():
    print_info("Building user-specific concept final embeddings...")

    ensure_directories()

    final_matrix, all_mapping = build_all_user_concept_final_embeddings()

    save_results(final_matrix, all_mapping)

    print_info("Concept final embedding construction DONE ✅")


if __name__ == "__main__":
    main()