"""
05_generate_course_initial_embedding.py

Goal
------------
Generate:
1. course name embeddings
2. course initial embeddings

Formula:
------------
For each course c:

    # e_c^initial = e_c^name ⊙ Σ_{k in K(c)} w_{c,k} e_k^name (do nt use this equation anymore, see next line)
    e_c^initial = (1/w_sum) * Σ_{k in K(c)} w_{c,k} e_k^name
where

    w_{c,k} = cos(e_c^name, e_k^name)
    w_sum = Σ_{k in K(c)} w_{c,k}

Explanation:
------------
- e_c^name      : course name embedding of course c
- e_k^name      : concept name embedding of concept k
- K(c)          : concept set contained in course c
- w_{c,k}       : cosine similarity between course c and concept k
#- ⊙             : element-wise multiplication

Special rule:
------------
If a course contains no valid concepts, then its course initial embedding
degenerates to its course name embedding:

    e_c^initial = e_c^name

"""

"""
Output files:
- course_name_embeddings.npy: shape (num_courses, 768)
- course_name_id_to_index.json: {course_id: row_index_in_course_name_embedding_matrix
- course_initial_embeddings.npy: shape (num_courses, 768)
- course_initial_id_to_index.json: {course_id: row_index_in_course_initial_embedding_matrix
"""
"""
Run:
    cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/MoocCube_Evaluation/ablation
    python 05_course_initial.py
"""


import numpy as np
from sentence_transformers import SentenceTransformer

from config import *
from utils import *


# ===============================
# Load processed courses
# ===============================
def load_processed_courses():
    """
    Load processed courses from processed_course.json
    each course record should contain:
    - course_id
    - course_name
    - concept_ids
    """
    print_info("Loading processed courses...")
    courses = load_json(PROCESSED_COURSE_JSON)
    print_info(f"Course count: {len(courses)}")
    return courses


# ===============================
# Load concept name embeddings
# ===============================
def load_concept_name_embeddings():
    """
    Load:
    1. concept embedding matrix
    2. concept_id -> row index mapping

    Read 2 files:
    1. concept name embedding matrix
    2. concept_id to row index mapping
    """
    print_info("Loading concept name embeddings...")

    concept_embedding_matrix = np.load(CONCEPT_NAME_EMBEDDING_PATH)
    concept_id_to_index = load_json(CONCEPT_NAME_ID_TO_INDEX_PATH)

    print_info(f"Concept embedding shape: {concept_embedding_matrix.shape}")
    print_info(f"Concept id map size: {len(concept_id_to_index)}")

    return concept_embedding_matrix, concept_id_to_index


# ===============================
# Prepare course texts
# ===============================
def prepare_course_texts(courses):
    """
    Prepare course names for SBERT encoding.

    Output:
        texts         : [course_name, ...]
        ids           : [course_id, ...]
        concept_lists : [[concept_id, ...], ...]
 
    Expalination:
    - texts is the list of course names to be fed into SBERT
    - ids is the list of corresponding course IDs
    """
    texts = []
    ids = []
    concept_lists = []

    for c in courses:
        course_id = str(c.get("course_id", "")).strip()
        course_name = str(c.get("course_name", "")).strip()
        concept_ids = c.get("concept_ids", []) or []

        if not course_id:
            continue

        # If course_name is empty, fall back to course_id
        if not course_name:
            course_name = course_id

        # macke sure all concept_ids are valid and exist in the concept embedding mapping
        concept_ids = [str(x).strip() for x in concept_ids if str(x).strip()]

        ids.append(course_id)
        texts.append(course_name)
        concept_lists.append(concept_ids)

    return texts, ids, concept_lists


# ===============================
# Generate course name embeddings
# ===============================
def generate_course_name_embeddings(texts):
    """
    Use SBERT to encode course names: e_c^name
    """
    print_info("Loading SBERT model for course names...")
    model = SentenceTransformer(SBERT_MODEL)

    print_info("Generating course name embeddings...")
    embeddings = model.encode(
        texts,
        batch_size=64,
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=False,
    )

    print_info(f"Course name embedding shape: {embeddings.shape}")
    return embeddings


# ===============================
# Build course initial embeddings
# ===============================
def build_course_initial_embeddings(
    course_name_embeddings,
    course_ids,
    course_concept_lists,
    concept_embedding_matrix,
    concept_id_to_index,
):
    """
    Build course initial embeddings strictly following the formula:

        e_c^initial = (1/w_sum) * Σ_{k in K(c)} w_{c,k} e_k^name
    where
        w_{c,k} = cos(e_c^name, e_k^name)
        w_sum = Σ_{k in K(c)} w_{c,k}
    Special rule:
        If a course contains no valid concepts, then its course initial embedding
        degenerates to its course name embedding:   
        e_c^initial = e_c^name  
    """
    print_info("Building course initial embeddings...")

    initial_embeddings = []

    # counts how many courses have no valid concepts
    no_concept_course_count = 0

    # count how many concept_ids cannot be found in the mapping (and thus skipped)
    missing_concept_count = 0

    for i, course_id in enumerate(course_ids):
        # --------------------------------------------------
        # 1. Get the course name embedding for the current course, which is e_c^name in the formula
        # --------------------------------------------------
        e_c_name = course_name_embeddings[i]

        # the set of concepts contained in the current course, i.e., K(c) in the formula
        concept_ids = course_concept_lists[i]

        # --------------------------------------------------
        # 2. Initialize weighted_sum to accumulate Σ w_{c,k} e_k^name
        #    Start with a zero vector   
        # --------------------------------------------------
        weighted_sum = np.zeros(EMBEDDING_DIM, dtype=np.float32)
        relation_weight_sum = 0.0

        # record the number of "valid concepts" for the current course
        valid_concept_num = 0

        # --------------------------------------------------
        # 3. For each concept k in K(c):
        # --------------------------------------------------
        for concept_id in concept_ids:
            # If the concept_id does not exist in the embedding mapping, skip it (and count it)
            if concept_id not in concept_id_to_index:
                missing_concept_count += 1
                continue
            
            concept_index = concept_id_to_index[concept_id] # Find the row index of this concept in the concept embedding matrix

            e_k_name = concept_embedding_matrix[concept_index] # Get the name embedding of concept k from the concept embedding matrix using the found index

            # --------------------------------------------------
            # 4. Calculate the cosine similarity between the course and the concept to get w_{c,k}
            # w_{c,k} = cos(e_c^name, e_k^name)
            # --------------------------------------------------
            w_ck = cosine_similarity(e_c_name, e_k_name)

            # --------------------------------------------------
            # 5. Calculate the weighted term and accumulate:
            #    weighted_sum += w_{c,k} * e_k^name
            # --------------------------------------------------
            weighted_sum += (w_ck * e_k_name).astype(np.float32)
            relation_weight_sum += w_ck
            valid_concept_num += 1

        # --------------------------------------------------
        # 6. Decide how to generate initial embedding based on whether there are valid concepts
        # --------------------------------------------------
        if valid_concept_num == 0:
            # specially, if a course has no valid concepts, it means it cannot connect to any other course through shared concepts.
            # In this case, we let its initial embedding degenerate to its course name embedding,
            # so that it can still have meaningful similarity with other courses based on name semantics, instead of being an isolated zero vector. 
            e_c_initial = e_c_name.astype(np.float32)
            no_concept_course_count += 1
        else:
            if relation_weight_sum != 0:
                e_c_initial = (1 / relation_weight_sum) * weighted_sum
            else:
                e_c_initial = np.zeros(EMBEDDING_DIM, dtype=np.float32)
            e_c_initial = e_c_initial.astype(np.float32)

        initial_embeddings.append(e_c_initial) 

    # ------------------------------------------------------
    # 7. Convert the list of initial embeddings to a matrix of shape (num_courses, embedding_dim)
    # ------------------------------------------------------
    initial_embeddings = np.array(initial_embeddings, dtype=np.float32)

    print_info(f"Course initial embedding shape: {initial_embeddings.shape}")
    print_info(f"Courses with no valid concepts: {no_concept_course_count}")
    print_info(f"Missing concept references skipped: {missing_concept_count}")

    return initial_embeddings


# ===============================
# Save embeddings and mappings
# ===============================
def save_all_embeddings(course_name_embeddings, course_initial_embeddings, course_ids):
    """
    Save:
    1. course name embedding matrix
    2. course name id->index mapping
    3. course initial embedding matrix
    4. course initial id->index mapping
    """
    print_info("Saving course name embeddings...")

    np.save(COURSE_NAME_EMBEDDING_PATH, course_name_embeddings)
    course_name_id_to_index = {cid: idx for idx, cid in enumerate(course_ids)}
    save_json(course_name_id_to_index, COURSE_NAME_ID_TO_INDEX_PATH)

    print_info(f"Saved course name embeddings to: {COURSE_NAME_EMBEDDING_PATH}")
    print_info(f"Saved course name id map to: {COURSE_NAME_ID_TO_INDEX_PATH}")

    print_info("Saving course initial embeddings...")

    np.save(COURSE_INITIAL_EMBEDDING_PATH, course_initial_embeddings)
    course_initial_id_to_index = {cid: idx for idx, cid in enumerate(course_ids)}
    save_json(course_initial_id_to_index, COURSE_INITIAL_ID_TO_INDEX_PATH)

    print_info(f"Saved course initial embeddings to: {COURSE_INITIAL_EMBEDDING_PATH}")
    print_info(f"Saved course initial id map to: {COURSE_INITIAL_ID_TO_INDEX_PATH}")


# ===============================
# Main
# ===============================
def main():
    print_info("Course initial embedding generation started.")
    ensure_directories()

    courses = load_processed_courses()
    concept_embedding_matrix, concept_id_to_index = load_concept_name_embeddings()

    course_texts, course_ids, course_concept_lists = prepare_course_texts(courses)

    # Step 1:
    # Generate e_c^name for all courses
    course_name_embeddings = generate_course_name_embeddings(course_texts)

    # Step 2:
    # Build e_c^initial strictly following the formula
    course_initial_embeddings = build_course_initial_embeddings(
        course_name_embeddings=course_name_embeddings,
        course_ids=course_ids,
        course_concept_lists=course_concept_lists,
        concept_embedding_matrix=concept_embedding_matrix,
        concept_id_to_index=concept_id_to_index,
    )

    # Step 3:
    # Save both global course name embeddings and course initial embeddings
    save_all_embeddings(
        course_name_embeddings=course_name_embeddings,
        course_initial_embeddings=course_initial_embeddings,
        course_ids=course_ids,
    )

    print_info("Course initial embedding generation DONE ✅")


if __name__ == "__main__":
    main()