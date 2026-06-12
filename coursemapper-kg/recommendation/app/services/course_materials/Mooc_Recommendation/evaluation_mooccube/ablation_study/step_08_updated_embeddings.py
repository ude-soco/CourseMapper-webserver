"""
step_08_updated_embeddings.py

Goal:
------------
Dynamically update node embeddings based on temporal sequence information.

Main formula:
------------
updated_embedding_matrix = np.dot(sequential_matrix, unupdated_embedding_matrix)

Don't need to run this code file.
"""

import numpy as np


# ============================================================
# Embedding matrix
# ============================================================

def build_unupdated_embedding_matrix(nodes, embedding_matrix, id_to_index, node_id_field):
    """
    Build unupdated embedding matrix for one user-relation.

    For enrolled relation:
        node_id_field = "course_id"
        embedding_matrix = course_embeddings.npy

    For interested relation:
        node_id_field = "concept_id"
        embedding_matrix = concept_name_embeddings.npy

    The row order is the same as nodes.
    """
    embeddings = [
        embedding_matrix[id_to_index[node[node_id_field]]]
        for node in nodes
    ]

    return np.vstack(embeddings).astype(np.float32)


# ============================================================
# Correlation matrix
# ============================================================

def build_correlation_matrix(unupdated_embedding_matrix):
    """
    Build cosine similarity matrix between nodes.

    Diagonal values are 1.0.
    """
    num_nodes = unupdated_embedding_matrix.shape[0]
    correlation_matrix = np.zeros((num_nodes, num_nodes), dtype=np.float32)

    for i in range(num_nodes):
        for j in range(num_nodes):
            if i == j:
                correlation_matrix[i][j] = 1.0
                continue

            embedding_i = unupdated_embedding_matrix[i]
            embedding_j = unupdated_embedding_matrix[j]

            norm_i = np.linalg.norm(embedding_i)
            norm_j = np.linalg.norm(embedding_j)

            correlation_matrix[i][j] = (
                0.0
                if norm_i == 0 or norm_j == 0
                else np.dot(embedding_i, embedding_j) / (norm_i * norm_j)
            )

    return correlation_matrix


# ============================================================
# Mask matrix
# ============================================================

def build_mask_matrix(nodes):
    """
    Build mask matrix based on position_time.

    Keep the same i/j direction as the previous learner model code.

    Meaning:
        Past nodes can influence future nodes.
        Future nodes cannot influence past nodes.
    """
    positions = [node["position_time"] for node in nodes]
    num_nodes = len(nodes)

    mask_matrix = np.zeros((num_nodes, num_nodes), dtype=np.float32)

    for i in range(num_nodes):
        for j in range(num_nodes):
            if positions[i] <= positions[j]:
                mask_matrix[i][j] = 0.0
            else:
                mask_matrix[i][j] = -10.0

    return mask_matrix


# ============================================================
# Sequential matrix
# ============================================================

def build_sequential_matrix(correlation_matrix, mask_matrix):
    """
    If mask value is -10:
        the influence is removed and set to 0.

    Otherwise:
        keep the cosine similarity value.
    """
    return np.where(
        mask_matrix == -10.0,
        0.0,
        correlation_matrix + mask_matrix,
    )


# ============================================================
# Updated embeddings
# ============================================================

def compute_updated_node_embeddings(
    relation_info,
    embedding_matrix,
    id_to_index,
    node_id_field,
    debug=False,
):
    """
    Compute updated node embeddings for one user-relation.

    Inputs:
        relation_info:
            one record from enrolled_relation_info.jsonl
            or interested_relation_info.jsonl

        embedding_matrix:
            course_embeddings.npy for enrolled relation
            concept_name_embeddings.npy for interested relation

        id_to_index:
            course_id_to_index.json
            or concept_id_to_index.json

        node_id_field:
            "course_id" for enrolled relation
            "concept_id" for interested relation

    Output:
        updated_embedding_matrix

    Important:
        The output row order is the same as relation_info["nodes"].
    """
    nodes = relation_info["nodes"]

    unupdated_embedding_matrix = build_unupdated_embedding_matrix(
        nodes,
        embedding_matrix,
        id_to_index,
        node_id_field,
    )

    # If there is only one node, it does not need sequence update.
    if len(nodes) == 1:
        if debug:
            return unupdated_embedding_matrix, None, None, None
        return unupdated_embedding_matrix

    correlation_matrix = build_correlation_matrix(unupdated_embedding_matrix)
    mask_matrix = build_mask_matrix(nodes)
    sequential_matrix = build_sequential_matrix(correlation_matrix, mask_matrix)

    updated_embedding_matrix = np.dot(
        sequential_matrix,
        unupdated_embedding_matrix,
    )

    if debug:
        return (
            updated_embedding_matrix,
            correlation_matrix,
            mask_matrix,
            sequential_matrix,
        )

    return updated_embedding_matrix