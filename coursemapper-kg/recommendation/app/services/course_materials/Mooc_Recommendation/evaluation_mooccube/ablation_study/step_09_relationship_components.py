"""
step_09_relation_components.py

Goal:
------------
Provide helper functions for relation-level computation.

This file is used by Step 10.

This file does:
    1. generate or load relation-specific matrices
    2. select node weight
    3. compute weighted updated embedding sum
    4. apply relation-specific matrix
    5. apply inner normalization

This file does NOT save:
    1. relation components
    2. user embeddings
    3. recommendation results

Only relation-specific matrices are saved:
    output/relationship_info/relation_specific_matrices.npz

Run:
------------
    cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/evaluation_mooccube/ablation_study  
    python step_09_relationship_components.py
"""

import os
import numpy as np

from config import (
    EMBEDDING_DIM,
    RELATION_SPECIFIC_MATRICES_NPZ,
    ensure_directories,
)

from utils import print_info


# ============================================================
# 1. Relation-specific matrices
# ============================================================

def generate_relation_matrices(dim=EMBEDDING_DIM, seed=42):
    """
    Generate relation-specific random matrices with Glorot initialization.

    This follows the previous learner model setting.
    """
    import torch
    from torch_geometric.nn.inits import glorot

    torch.manual_seed(seed)

    E_enrolled = torch.empty((dim, dim), dtype=torch.float32)
    E_interested = torch.empty((dim, dim), dtype=torch.float32)

    glorot(E_enrolled)
    glorot(E_interested)

    return {
        "enrolled": E_enrolled.numpy(),
        "interested": E_interested.numpy(),
    }


def save_relation_matrices(matrices):
    """Save relation-specific matrices for reproducibility."""
    np.savez(
        RELATION_SPECIFIC_MATRICES_NPZ,
        E_enrolled=matrices["enrolled"],
        E_interested=matrices["interested"],
    )


def load_relation_matrices():
    """Load saved relation-specific matrices."""
    data = np.load(RELATION_SPECIFIC_MATRICES_NPZ)

    return {
        "enrolled": data["E_enrolled"],
        "interested": data["E_interested"],
    }


def get_relation_matrices():
    """
    Load relation-specific matrices if they exist.
    Otherwise, generate and save them.
    """
    if os.path.exists(RELATION_SPECIFIC_MATRICES_NPZ):
        return load_relation_matrices()

    matrices = generate_relation_matrices()
    save_relation_matrices(matrices)
    return matrices


# ============================================================
# 2. Node weight selector
# ============================================================

def select_node_weight(node, node_weight_mode):
    """
    Select node weight for different ablation variants.

    full_node_weight:
        use full node weight from Step 07

    first_weight_only:
        remove position weight

    position_weight_only:
        remove first weight component

    no_node_weight:
        remove all node weights
    """
    if node_weight_mode == "full_node_weight":
        return node["full_node_weight"]

    if node_weight_mode == "first_weight_only":
        return node["first_weight_component"]

    if node_weight_mode == "position_weight_only":
        return node["position_weight"]

    if node_weight_mode == "no_node_weight":
        return 1.0

    raise ValueError(f"Unknown node_weight_mode: {node_weight_mode}")


# ============================================================
# 3. Weighted updated embedding sum
# ============================================================

def compute_weighted_updated_embedding_sum(
    relation_info,
    updated_node_embeddings,
    node_weight_mode,
):
    """
    Compute:
        sum(node_weight * updated_node_embedding)

    The row order of updated_node_embeddings must be the same as:
        relation_info["nodes"]
    """
    nodes = relation_info["nodes"]

    weights = np.array(
        [select_node_weight(node, node_weight_mode) for node in nodes],
        dtype=np.float32,
    )

    return np.sum(updated_node_embeddings * weights[:, None], axis=0)


# ============================================================
# 4. Relation-specific matrix
# ============================================================

def apply_relation_matrix(vector, relation_matrix, use_relation_matrix):
    """
    Apply relation-specific matrix.

    If use_relation_matrix is False:
        return the original vector.
    """
    if not use_relation_matrix:
        return vector

    return np.dot(relation_matrix, vector)


# ============================================================
# 5. Inner normalization
# ============================================================

def apply_inner_normalization(vector, relation_info, use_inner_normalization):
    """
    Apply inner normalization inside one relation.

    If use_inner_normalization is True:
        divide by inner_weight_sum from Step 07.

    If use_inner_normalization is False:
        return the original vector.
    """
    if not use_inner_normalization:
        return vector

    return vector / relation_info["inner_weight_sum"]


# ============================================================
# 6. Relation-level computation
# ============================================================

def compute_relation_embedding(
    relation_info,
    updated_node_embeddings,
    node_weight_mode,
    use_relation_matrix,
    use_inner_normalization,
    relation_matrix=None,
):
    """
    Compute one relation-level embedding.

    This follows the inner part of the learner model formula:

        1 / omega_sum
        *
        [
            E_relation
            *
            sum(omega_node * updated_node_embedding)
        ]

    For variants without relation matrix:
        E_relation is not used.

    For variants without inner normalization:
        1 / omega_sum is not used.
    """
    vector = compute_weighted_updated_embedding_sum(
        relation_info,
        updated_node_embeddings,
        node_weight_mode,
    )

    vector = apply_relation_matrix(
        vector,
        relation_matrix,
        use_relation_matrix,
    )

    vector = apply_inner_normalization(
        vector,
        relation_info,
        use_inner_normalization,
    )

    return vector


# ============================================================
# 7. Outer weight sum helper
# ============================================================

def compute_outer_weight_sum(relation_infos):
    """
    Compute outer_weight_sum for Step 10.

    If a user has only one available relation:
        outer_weight_sum = 1.0

    If a user has two available relations:
        outer_weight_sum =
            inner_weight_sum_enrolled + inner_weight_sum_interested
    """
    if len(relation_infos) == 1:
        return 1.0

    return sum(info["inner_weight_sum"] for info in relation_infos)


# ============================================================
# Main
# ============================================================

def main():
    """
    Run Step 09.

    This only prepares relation-specific matrices.
    Actual relation-level embeddings are computed in Step 10.
    """
    ensure_directories()

    matrices = get_relation_matrices()

    print_info("Step 09 finished.")
    print_info(f"Relation matrix file: {RELATION_SPECIFIC_MATRICES_NPZ}")
    print_info(f"E_enrolled shape: {matrices['enrolled'].shape}")
    print_info(f"E_interested shape: {matrices['interested'].shape}")


if __name__ == "__main__":
    main()