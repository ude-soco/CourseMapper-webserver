"""
step_10_user_embeddings.py

Goal:
------------
Generate user embedding matrices for 7 ablation variants.

This file is the final execution file for learner/user embedding construction.

Main workflow:
------------
1. Read weighted relation information from Step 07.
2. Read course and concept embedding matrices.
3. Read relation-specific matrices from Step 09.
4. For each user:
    - compute updated node embeddings using Step 08
    - compute relation-level embeddings using Step 09
    - combine enrolled / interested relation embeddings
5. Save one user embedding matrix for each variant.

Outputs:
------------
output/embeddings/user_embeddings/variant_xxx/
    user_embeddings.npy
    user_id_to_index.json

Run:
------------
    cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/evaluation_mooccube/ablation_study
    python step_10_user_embeddings.py
"""

import os
import numpy as np

from config import (
    ENROLLED_RELATION_INFO_JSONL,
    INTERESTED_RELATION_INFO_JSONL,
    COURSE_EMBEDDINGS_PATH,
    FINAL_COURSE_ID_TO_INDEX_PATH,
    CONCEPT_NAME_EMBEDDINGS_PATH,
    CONCEPT_ID_TO_INDEX_PATH,
    USER_EMBEDDING_DIR,
    ensure_directories,
)

from utils import (
    load_json,
    save_json,
    load_jsonl,
    load_npy,
    save_npy,
    print_info,
)

from step_08_updated_embeddings import compute_updated_node_embeddings

from step_09_relationship_components import (
    get_relation_matrices,
    compute_relation_embedding,
    compute_outer_weight_sum,
)


# ============================================================
# 1. Variant settings
# ============================================================

VARIANTS = {
    "variant_1_full": {
        "use_relation_matrix": True,
        "node_weight_mode": "full_node_weight",
        "use_inner_normalization": True,
        "use_outer_normalization": True,
    },
    "variant_2_no_relation_matrix": {
        "use_relation_matrix": False,
        "node_weight_mode": "full_node_weight",
        "use_inner_normalization": True,
        "use_outer_normalization": True,
    },
    "variant_3_no_node_weight": {
        "use_relation_matrix": True,
        "node_weight_mode": "no_node_weight",
        "use_inner_normalization": True,
        "use_outer_normalization": True,
    },
    "variant_4_no_position_weight": {
        "use_relation_matrix": True,
        "node_weight_mode": "first_weight_only",
        "use_inner_normalization": True,
        "use_outer_normalization": True,
    },
    "variant_5_no_first_weight": {
        "use_relation_matrix": True,
        "node_weight_mode": "position_weight_only",
        "use_inner_normalization": True,
        "use_outer_normalization": True,
    },
    "variant_6_no_normalization": {
        "use_relation_matrix": True,
        "node_weight_mode": "full_node_weight",
        "use_inner_normalization": False,
        "use_outer_normalization": False,
    },
    "variant_7_no_normalization_no_matrix": {
        "use_relation_matrix": False,
        "node_weight_mode": "full_node_weight",
        "use_inner_normalization": False,
        "use_outer_normalization": False,
    },
}


# ============================================================
# 2. Basic helper functions
# ============================================================

# ------------------------------------------------------------
# Build a dictionary for fast user_id lookup.
# ------------------------------------------------------------
def build_user_relation_dict(relation_infos):
    """
    Convert a list of relation records into a dictionary.

    Input:
        [
            {"user_id": "U1", "relation_name": "enrolled", ...},
            {"user_id": "U2", "relation_name": "enrolled", ...}
        ]

    Output:
        {
            "U1": {"user_id": "U1", "relation_name": "enrolled", ...},
            "U2": {"user_id": "U2", "relation_name": "enrolled", ...}
        }

    Purpose:
        Step 10 needs to frequently query relation_info by user_id.
    """
    return {record["user_id"]: record for record in relation_infos}


# ------------------------------------------------------------
# Get output file paths for one variant.
# ------------------------------------------------------------
def get_variant_output_paths(variant_name):
    """
    Get output paths for one variant.

    Each variant has its own folder:
        output/embeddings/user_embeddings/variant_xxx/
    """
    variant_dir = os.path.join(USER_EMBEDDING_DIR, variant_name)

    user_embedding_path = os.path.join(variant_dir, "user_embeddings.npy")
    user_index_path = os.path.join(variant_dir, "user_id_to_index.json")

    return user_embedding_path, user_index_path


# ============================================================
# 3. Updated node embeddings
# ============================================================

# ------------------------------------------------------------
# Compute updated node embeddings for one user.
# ------------------------------------------------------------
def compute_user_updated_embeddings(
    user_id,
    enrolled_dict,
    interested_dict,
    course_embeddings,
    course_id_to_index,
    concept_embeddings,
    concept_id_to_index,
):
    """
    Compute updated node embeddings for one user.

    Important:
        Updated node embeddings are independent of variants.
        Therefore, for each user, we only compute them once.

    Enrolled relation:
        node = course
        raw embedding = final course embedding

    Interested relation:
        node = concept
        raw embedding = concept name embedding

    Output:
        {
            "enrolled": updated enrolled node embeddings,
            "interested": updated interested node embeddings
        }
    """
    updated_embeddings = {}

    enrolled_info = enrolled_dict.get(user_id)
    interested_info = interested_dict.get(user_id)

    # Compute updated course embeddings for enrolled relation.
    if enrolled_info:
        updated_embeddings["enrolled"] = compute_updated_node_embeddings(
            relation_info=enrolled_info,
            embedding_matrix=course_embeddings,
            id_to_index=course_id_to_index,
            node_id_field="course_id",
        )

    # Compute updated concept embeddings for interested relation.
    if interested_info:
        updated_embeddings["interested"] = compute_updated_node_embeddings(
            relation_info=interested_info,
            embedding_matrix=concept_embeddings,
            id_to_index=concept_id_to_index,
            node_id_field="concept_id",
        )

    return updated_embeddings


# ============================================================
# 4. Relation-level embeddings
# ============================================================

# ------------------------------------------------------------
# Compute relation-level embeddings for available relations.
# ------------------------------------------------------------
def compute_available_relation_embeddings(
    user_id,
    variant_config,
    enrolled_dict,
    interested_dict,
    updated_embeddings,
    relation_matrices,
):
    """
    Compute relation-level embeddings for one user under one variant.
    --------------------------------
    One user may have different available relations.
    Case 1:
        The user has only enrolled relation.
        Then:
            relation_embeddings = [enrolled_embedding]
            relation_infos = [enrolled_info]

    Case 2:
        The user has both enrolled and interested relations.
        Then:
            relation_embeddings = [enrolled_embedding, interested_embedding]
            relation_infos = [enrolled_info, interested_info]

    Important:
    --------------------------------
    The two lists have the same order.
    For example:
        relation_embeddings[0] corresponds to relation_infos[0]
        relation_embeddings[1] corresponds to relation_infos[1]

    Why relation_embeddings is needed:
    --------------------------------
    It stores the relation-level embedding vectors.
    Later, these vectors will be summed to build the final user embedding.

    Why relation_infos is needed:
    --------------------------------
    It stores the corresponding relation information.
    Later, relation_infos will be used to compute outer_weight_sum.

    Output:
    --------------------------------
    relation_embeddings:
        A list of available relation-level embedding vectors.

    relation_infos:
        A list of corresponding relation_info records.
    """
    relation_embeddings = []
    relation_infos = []

    # --------------------------------------------------------
    # Enrolled relation part
    # --------------------------------------------------------
    if user_id in enrolled_dict:
        enrolled_info = enrolled_dict[user_id]

        enrolled_embedding = compute_relation_embedding(
            relation_info=enrolled_info,
            updated_node_embeddings=updated_embeddings["enrolled"],
            node_weight_mode=variant_config["node_weight_mode"],
            use_relation_matrix=variant_config["use_relation_matrix"],
            use_inner_normalization=variant_config["use_inner_normalization"],
            relation_matrix=relation_matrices["enrolled"],
        )

        relation_embeddings.append(enrolled_embedding)
        relation_infos.append(enrolled_info)

    # --------------------------------------------------------
    # Interested relation part
    # Some users may not have interested relation.
    # --------------------------------------------------------
    if user_id in interested_dict:
        interested_info = interested_dict[user_id]

        interested_embedding = compute_relation_embedding(
            relation_info=interested_info,
            updated_node_embeddings=updated_embeddings["interested"],
            node_weight_mode=variant_config["node_weight_mode"],
            use_relation_matrix=variant_config["use_relation_matrix"],
            use_inner_normalization=variant_config["use_inner_normalization"],
            relation_matrix=relation_matrices["interested"],
        )

        relation_embeddings.append(interested_embedding)
        relation_infos.append(interested_info)

    return relation_embeddings, relation_infos


# ============================================================
# 5. Final user embedding
# ============================================================

# ------------------------------------------------------------
# Combine relation-level embeddings into final user embedding.
# ------------------------------------------------------------
def combine_relation_embeddings(
    relation_embeddings,
    relation_infos,
    use_outer_normalization,
):
    """
    Combine available relation-level embeddings.

    If outer normalization is not used:
        user_embedding = sum(relation embeddings)

    If outer normalization is used:
        user_embedding = sum(relation embeddings) / outer_weight_sum

    If the user has only one relation:
        outer_weight_sum = 1.0
    """
    # Sum enrolled relation embedding and interested relation embedding.
    user_embedding = np.sum(relation_embeddings, axis=0)

    # Variants 6 and 7 do not use outer normalization.
    if not use_outer_normalization:
        return user_embedding

    # Compute outer weight sum from available relation infos.
    outer_weight_sum = compute_outer_weight_sum(relation_infos)

    return user_embedding / outer_weight_sum


# ------------------------------------------------------------
# Compute final user embedding for one user and one variant.
# ------------------------------------------------------------
def compute_user_embedding(
    user_id,
    variant_config,
    enrolled_dict,
    interested_dict,
    updated_embeddings,
    relation_matrices,
):
    """
    Compute final user embedding for one user under one variant.

    Main steps:
        1. Compute enrolled / interested relation-level embeddings.
        2. Combine available relation-level embeddings.
        3. Apply outer normalization if needed.
    """
    relation_embeddings, relation_infos = compute_available_relation_embeddings(
        user_id,
        variant_config,
        enrolled_dict,
        interested_dict,
        updated_embeddings,
        relation_matrices,
    )

    user_embedding = combine_relation_embeddings(
        relation_embeddings,
        relation_infos,
        variant_config["use_outer_normalization"],
    )

    return user_embedding


# ============================================================
# 6. Save variant output
# ============================================================

# ------------------------------------------------------------
# Save user embedding matrix and user_id_to_index for one variant.
# ------------------------------------------------------------
def save_variant_user_embeddings(
    variant_name,
    user_embeddings,
    user_id_to_index,
):
    """
    Save outputs for one variant.

    user_embeddings.npy:
        matrix with shape:
        number_of_users x embedding_dim

    user_id_to_index.json:
        maps user_id to row index in user_embeddings.npy
    """
    embedding_path, index_path = get_variant_output_paths(variant_name)

    save_npy(user_embeddings, embedding_path)
    save_json(user_id_to_index, index_path)


# ============================================================
# 7. Main execution
# ============================================================

def main():
    """
    Run Step 10.

    This function generates user embedding matrices for all variants.
    """
    ensure_directories()

    print_info("Step 10: generating user embeddings...")

    # --------------------------------------------------------
    # Load weighted relation information from Step 07.
    # --------------------------------------------------------
    enrolled_infos = load_jsonl(ENROLLED_RELATION_INFO_JSONL)
    interested_infos = load_jsonl(INTERESTED_RELATION_INFO_JSONL)

    # --------------------------------------------------------
    # Convert relation info lists into user_id lookup dictionaries.
    # --------------------------------------------------------
    enrolled_dict = build_user_relation_dict(enrolled_infos)
    interested_dict = build_user_relation_dict(interested_infos)

    # --------------------------------------------------------
    # User order is based on enrolled relation records.
    # This order is shared by all variants.
    # --------------------------------------------------------
    user_ids = [record["user_id"] for record in enrolled_infos]
    user_id_to_index = {
        user_id: index
        for index, user_id in enumerate(user_ids)
    }

    # --------------------------------------------------------
    # Load embedding matrices.
    # enrolled relation uses final course embeddings.
    # interested relation uses concept name embeddings.
    # --------------------------------------------------------
    course_embeddings = load_npy(COURSE_EMBEDDINGS_PATH)
    concept_embeddings = load_npy(CONCEPT_NAME_EMBEDDINGS_PATH)

    # --------------------------------------------------------
    # Load id_to_index mappings for embedding matrix lookup.
    # --------------------------------------------------------
    course_id_to_index = load_json(FINAL_COURSE_ID_TO_INDEX_PATH)
    concept_id_to_index = load_json(CONCEPT_ID_TO_INDEX_PATH)

    # --------------------------------------------------------
    # Load relation-specific matrices from Step 09.
    # --------------------------------------------------------
    relation_matrices = get_relation_matrices()

    # --------------------------------------------------------
    # Prepare containers for user embeddings of each variant.
    #
    # We need to generate 7 different user embedding matrices. Therefore, we prepare one empty list for each variant.
    #
    # Example:
    #     variant_embeddings = {
    #         "variant_1_full": [],
    #         "variant_2_no_relation_matrix": [],
    #         ...
    #     }
    #
    # During the main loop, each list will store all users'embeddings under that specific variant.
    #
    # Example after computing two users:
    #     variant_embeddings["variant_1_full"] = [ user_1_embedding_under_variant_1, user_2_embedding_under_variant_1]
    #
    # Finally, each list will be converted into one matrix:
    #     number_of_users x embedding_dim
    # --------------------------------------------------------
    variant_embeddings = {
        variant_name: []
        for variant_name in VARIANTS
    }

    # --------------------------------------------------------
    # Main loop:
    # For each user, compute updated node embeddings once,
    # then reuse them across all variants.
    # --------------------------------------------------------
    for user_id in user_ids:
        updated_embeddings = compute_user_updated_embeddings(
            user_id,
            enrolled_dict,
            interested_dict,
            course_embeddings,
            course_id_to_index,
            concept_embeddings,
            concept_id_to_index,
        )

        # ----------------------------------------------------
        # Compute user embedding under each variant.
        # ----------------------------------------------------
        for variant_name, variant_config in VARIANTS.items():
            user_embedding = compute_user_embedding(
                user_id,
                variant_config,
                enrolled_dict,
                interested_dict,
                updated_embeddings,
                relation_matrices,
            )

            variant_embeddings[variant_name].append(
                user_embedding.astype(np.float32)
            )

    # --------------------------------------------------------
    # Save one user embedding matrix for each variant.
    # --------------------------------------------------------
    for variant_name, embeddings in variant_embeddings.items():
        user_embedding_matrix = np.vstack(embeddings).astype(np.float32)

        save_variant_user_embeddings(
            variant_name,
            user_embedding_matrix,
            user_id_to_index,
        )

        print_info(
            f"{variant_name}: saved user_embeddings with shape "
            f"{user_embedding_matrix.shape}"
        )

    print_info("Step 10 finished.")


if __name__ == "__main__":
    main()