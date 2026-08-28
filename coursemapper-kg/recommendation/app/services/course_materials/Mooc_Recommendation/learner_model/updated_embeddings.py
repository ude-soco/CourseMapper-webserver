"""
relationship_type_info structure:
{
    cid: {
        "relation": str,
        "unupdated_embedding": numpy_array,
        "first_weight_component": float, 1st weight component for each relationship e.g: is W^DNU_c: the cosine similarity between the concept embedding and the learner model embedding
        "timestamp": datetime,
        "position_weight": float,
        "position_time": int,
        "updated_embedding": numpy_array; means the New embedding: New= B*V^T
    }
}


Goal: Update the concept embeddings and course embeddings based on the relationships and their temporal order.

Update formula: updated_embedding matrix = sequential matrix * unupdated_embedding matrix
unupdated_embedding is the embedding of concepts from rrgcn

"""

import numpy as np


class NodeEmbeddingUpdater:

    def update_embeddings(self, relation_info, debug=False):

        if not relation_info:
            return relation_info
        
        cids = list(relation_info.keys())
        num_nodes = len(cids)


        # If there is only one node, then updated_embedding is unupdated_embedding and does not need to be updated.
        if num_nodes == 1:
            cid = cids[0]
            relation_info[cid]["updated_embedding"] = relation_info[cid]["unupdated_embedding"]
            return relation_info

        # ------------------------------------------------
        # Step 1: build embedding matrix from offline phase(i.e., unupdated_embedding)
        # ------------------------------------------------
        embeddings = [relation_info[cid]["unupdated_embedding"] for cid in cids]
        embedding_matrix = np.vstack(embeddings)

        # ------------------------------------------------
        # Step 2: correlation matrix (cosine similarity)
        # ------------------------------------------------
        weight_matrix = np.zeros((num_nodes, num_nodes))

        for i in range(num_nodes):
            for j in range(num_nodes):

                if i == j:
                    weight_matrix[i][j] = 1.0
                else:
                    dot = np.dot(embeddings[i], embeddings[j])
                    norm_i = np.linalg.norm(embeddings[i])
                    norm_j = np.linalg.norm(embeddings[j])
                    if norm_i == 0 or norm_j == 0:
                        weight_matrix[i][j] = 0.0
                    else:
                        weight_matrix[i][j] = dot / (norm_i * norm_j)

        # ------------------------------------------------
        # Step 3: mask matrix (time order)
        # ------------------------------------------------
        positions = [relation_info[cid]["position_time"] for cid in cids]

        mask_matrix = np.zeros((num_nodes, num_nodes))

        for i in range(num_nodes):
            for j in range(num_nodes):

                if positions[i] <= positions[j]:
                    mask_matrix[i][j] = 0
                else:
                    mask_matrix[i][j] = -10

        # ------------------------------------------------
        # Step 4: sequential matrix
        # ------------------------------------------------
        sequential_matrix = np.where(mask_matrix == -10, 0, weight_matrix + mask_matrix)

        # ------------------------------------------------
        # Step 5: update embeddings
        # ------------------------------------------------
        updated_matrix = np.dot(sequential_matrix, embedding_matrix)

        # ------------------------------------------------
        # Step 6: write back
        # ------------------------------------------------
        for idx, cid in enumerate(cids):
            relation_info[cid]["updated_embedding"] = updated_matrix[idx]


        if debug:
            return relation_info, weight_matrix, mask_matrix, sequential_matrix, updated_matrix


        return relation_info