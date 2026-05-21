"""
08_course_final.py

Goal: Construct "user-specific" course final embeddings for each learner.

For each learner (user):
    1. Read the user's training_courses
    2. Build the user's own course initial matrix V_course
    3. Build the correlation matrix C_enroll (pairwise cosine similarity of courses)
    4. Build the mask matrix I (determined by course enrollment order)
    5. Build the sequential matrix beta = C + I, and set negative values to 0
    6. Compute F_course_final = beta @ V_course
    7. Save the results as:
        - A global .npy embedding matrix
        - A mapping.json from user to embedding indices
Formulas:
    F_course_final = beta_course * V_course
    beta = C + I, with all negative values in beta set to 0


"""

"""
Run:
cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/MoocCube_Evaluation/ablation
python 08_learner_course_final.py   
"""

import os
import json
import numpy as np

from config import *
from utils import *


# ==========================================================
# load all necessary data for 08_file
# ==========================================================
def load_all_data():
    """
    Load all necessary data for 08_learner_course_final.py:
    1) Learner training data (processed_learner_training.json)
    2) Global course initial embeddings (course_initial_embeddings.npy)
    3) Course ID to index mapping (course_id_to_index.json) 
    """
    print_info("Loading learner training data...")
    learner_data = load_json(LEARNER_TRAINING_DATA_PATH)

    print_info("Loading global course initial embeddings...")
    course_initial_embedding_matrix = np.load(COURSE_INITIAL_EMBEDDING_PATH)

    with open(COURSE_INITIAL_ID_TO_INDEX_PATH, "r", encoding="utf-8") as f:
        course_initial_id_to_index = json.load(f)

    print_info(f"Learner count: {len(learner_data)}")
    print_info(f"Global course initial embedding shape: {course_initial_embedding_matrix.shape}")

    return learner_data, course_initial_embedding_matrix, course_initial_id_to_index


# ==========================================================
# construct user's own course initial matrix V_course
# ==========================================================
def build_user_course_initial_matrix(training_courses, global_course_initial_matrix, course_id_to_index):
    """
    Input:
        training_courses: 
            [
              {
                "course_id": "...",
                "enroll_time": "...",
                "enroll_position_time": ...
              },
              ...
            ]

    Output:
        course_records:only keep valid courses' meta info (for later mapping)
        V_course:      shape=(N, EMBEDDING_DIM)
    """
    course_records = []
    embedding_list = []

    for course in training_courses:
        # use get to avoid KeyError from dirty data, and strip to clean whitespace
        course_id = str(course.get("course_id", "")).strip()
        enroll_time = str(course.get("enroll_time", "")).strip()
        enroll_position_time = course.get("enroll_position_time", None)

        # lack key fields -> skip
        if not course_id or enroll_position_time is None:
            continue

        # course is not in global initial embedding mapping -> skip
        if course_id not in course_id_to_index:
            continue

        # get the global initial vector for this course
        idx = course_id_to_index[course_id]
        vec = global_course_initial_matrix[idx]


        # record the cleaned course_id and enroll_time, and the original enroll_position_time (which is numeric)
        course_records.append({
            "course_id": course_id,
            "enroll_time": enroll_time,
            "enroll_position_time": enroll_position_time,
        })
        embedding_list.append(vec)


    # no valid courses for this user -> return empty matrix and empty records
    if len(embedding_list) == 0:
        return course_records, np.zeros((0, EMBEDDING_DIM), dtype=np.float32)


    # stack into (N, d)
    V_course = np.array(embedding_list, dtype=np.float32)
    return course_records, V_course


# ==========================================================
# construct correlation matrix C_enroll based on cosine similarity of course vectors in V_course
# ==========================================================
def build_correlation_matrix(V_course):
    """
    C_ij = cos(v_i, v_j)
    input：V_course shape=(N, d)
    output：C shape=(N, N)
    """
    num_nodes = V_course.shape[0]

    if num_nodes == 0:
        return np.zeros((0, 0), dtype=np.float32)

    C = np.zeros((num_nodes, num_nodes), dtype=np.float32)

    for i in range(num_nodes):
        for j in range(num_nodes):
            C[i, j] = cosine_similarity(V_course[i], V_course[j])

    return C


# ==========================================================
# coonstruct mask matrix I based on enroll_position_time:
# ==========================================================
def build_mask_matrix(course_records):
    """
    According enroll_position_time to construct I：

    I_ij = 0    if t_i <= t_j
    I_ij = -10  if t_i > t_j
    """
    num_nodes = len(course_records)

    if num_nodes == 0:
        return np.zeros((0, 0), dtype=np.float32)

    I = np.zeros((num_nodes, num_nodes), dtype=np.float32)
    positions = [x["enroll_position_time"] for x in course_records]

    for i in range(num_nodes):
        for j in range(num_nodes):
            if positions[i] <= positions[j]:
                I[i, j] = 0.0
            else:
                I[i, j] = -10.0

    return I


# ==========================================================
# construct sequential matrix beta = C + I, and set negative values to 0
# ==========================================================
def build_sequential_matrix(C, I):

    if C.shape[0] == 0:
        return np.zeros((0, 0), dtype=np.float32)

    beta = C + I
    beta = np.where(beta < 0, 0.0, beta).astype(np.float32)
    return beta


# ==========================================================
# generate the final course embedding for a user
# ==========================================================
def update_user_course_embeddings(V_course, beta_course):
    """
    F_course_final = beta_course @ V_course

    input：
        V_course:    (N, d)
        beta_course: (N, N)
    output：
        F_course_final: (N, d)
    """
    if V_course.shape[0] == 0:
        return np.zeros((0, EMBEDDING_DIM), dtype=np.float32)

    F_course_final = np.dot(beta_course, V_course).astype(np.float32)
    return F_course_final


# ==========================================================
# Debug print switch for matrix statistics
# ==========================================================
DEBUG_PRINT_MATRIX_STATS = False
DEBUG_USER_LIMIT = 1  # print at most first few users to avoid flooding


def _print_matrix_stats(name, mat):
    
    # check if mat is empty to avoid errors in min/max
    if mat.size == 0:
        print_info(f"[DEBUG] {name}: empty")
        return
    neg_count = int((mat < 0).sum())
    print_info(
        f"[DEBUG] {name}: shape={mat.shape}, min={mat.min():.6f}, max={mat.max():.6f}, neg_count={neg_count}"
    )


# ==========================================================
# main process: build course final embedding for all users, and save results
# ==========================================================
def build_all_user_course_final_embeddings():
    learner_data, global_course_initial_matrix, course_id_to_index = load_all_data()

    all_embeddings = []      # global_course_final_embedding_matrix
    all_mapping = {}         # user_id -> [{course_id, ..., embedding_index}]
    current_global_index = 0 

    for user_idx, user in enumerate(learner_data, start=1):
        user_id = str(user.get("user_id", "")).strip()
        if not user_id:
            print_warning(f"Skip user at index={user_idx}: empty user_id")
            continue

        training_courses = user.get("training_courses", [])

        # Step 1: Build the user's course initial matrix
        course_records, V_course = build_user_course_initial_matrix(
            training_courses=training_courses,
            global_course_initial_matrix=global_course_initial_matrix,
            course_id_to_index=course_id_to_index,
        )


        # Step 2: Build the correlation matrix
        C = build_correlation_matrix(V_course)

  
        # Step 3: Build the mask matrix I based on enroll_position_time
        I = build_mask_matrix(course_records)

  
        # Step 4: Build the sequential matrix
        beta = build_sequential_matrix(C, I)

     
        # test print
        if DEBUG_PRINT_MATRIX_STATS and user_idx <= DEBUG_USER_LIMIT:
            print_info(f"[DEBUG] user_id={user_id}, course_count={len(course_records)}")
            _print_matrix_stats("C", C)
            _print_matrix_stats("I", I)
            _print_matrix_stats("beta", beta)

  
        # Step 5: Compute the final course embedding for this user
        F_course_final = update_user_course_embeddings(V_course, beta)

   
        # Step 6: Write to global results + user mapping
        user_mapping_list = []
        for local_idx, record in enumerate(course_records):
            global_idx = current_global_index

            # write the vector to global list
            all_embeddings.append(F_course_final[local_idx])

    
            # record the global embedding index for this course in the mapping
            user_mapping_list.append({
                "course_id": record["course_id"],
                "enroll_time": record["enroll_time"],
                "enroll_position_time": record["enroll_position_time"],
                "course_final_embedding_index": global_idx,
            })

            current_global_index += 1

        all_mapping[user_id] = user_mapping_list

        if user_idx % 100 == 0:
            print_info(f"Processed {user_idx} users...")


    if len(all_embeddings) == 0:
        final_matrix = np.zeros((0, EMBEDDING_DIM), dtype=np.float32)
    else:
        final_matrix = np.array(all_embeddings, dtype=np.float32)

    return final_matrix, all_mapping


# ==========================================================
# save results
# ==========================================================
def save_results(final_matrix, all_mapping):
    """
    keep：
    1) USER_COURSE_FINAL_EMBEDDING_PATH (.npy)
    2) USER_COURSE_FINAL_MAPPING_PATH   (.json)
    """
    os.makedirs(TRAIN_OUTPUT_DIR, exist_ok=True)

    np.save(USER_COURSE_FINAL_EMBEDDING_PATH, final_matrix)

    with open(USER_COURSE_FINAL_MAPPING_PATH, "w", encoding="utf-8") as f:
        json.dump(all_mapping, f, ensure_ascii=False, indent=2)

    print_info(f"Saved user course final embeddings to: {USER_COURSE_FINAL_EMBEDDING_PATH}")
    print_info(f"Saved user course final mapping to: {USER_COURSE_FINAL_MAPPING_PATH}")
    print_info(f"Final matrix shape: {final_matrix.shape}")


# ==========================================================
# Main
# ==========================================================
def main():
    print_info("Building user-specific course final embeddings...")

    ensure_directories()

    final_matrix, all_mapping = build_all_user_course_final_embeddings()

    save_results(final_matrix, all_mapping)

    print_info("Course final embedding construction DONE ✅")


if __name__ == "__main__":
    main()