from sentence_transformers import SentenceTransformer
import pandas as pd
import numpy as np
import random
import scipy.sparse as sp
from scipy.sparse import csr_matrix
import os
import torch
from typing import Tuple, Union
from torch_geometric.nn.inits import glorot
#from course_materials.prerequisite import prerequisite_relationship
# model = SentenceTransformer('paraphrase-MiniLM-L6-v2')  # You may choose a different SBERT model.
current_dir = os.path.dirname(__file__)

class data_process:
    def __init__(self):
        self.embedding_matrix = None
        self.adj_matrix = None
        self.prerequisite_matrix = None
        self.adj_matrix_inverse = None
        self.prerequisite_matrix_inverse = None
        self.data_load()

    def data_load(self):
        model = SentenceTransformer('paraphrase-MiniLM-L6-v2')  # You may choose a different SBERT model.
        # Read the data file
        data_path = os.path.join(current_dir, 'modified_eva_data.txt')
        data = pd.read_csv(data_path, sep='\t', header=None, names=['node1', 'relation', 'node2'])

        # get all unique nodes
        all_nodes = pd.concat([data['node1'], data['node2']]).unique()

        # Generate SBERT embeddings for node IDs
        node_embeddings = {}
        for node in all_nodes:
            node_text = str(node)  # Convert the node ID to string format
            node_embeddings[node] = model.encode(node_text)  # Generate Embedding

        # Convert to an embedding matrix
        embedding_matrix = np.array([node_embeddings[node] for node in all_nodes])
        self.embedding_matrix = embedding_matrix

        # Create a mapping from node IDs to indices.
        node_index = {node: i for i, node in enumerate(all_nodes)}
        # Calculate the number of nodes
        num_nodes = embedding_matrix.shape[0]

        # The data format of a sparse matrix
        # row_indices = []
        # col_indices = []
        # data_values = []
        

        # # Calculate the weighted values (cosine similarity) for pairs of nodes with edges.
        # for _, row in data.iterrows():
        #     node1, node2 = row['node1'], row['node2']
        #     idx1, idx2 = node_index[node1], node_index[node2]

        #     # Calculate only the lower triangular part
        #     if idx1 > idx2:
        #         # Calculate the cosine similarity for node pairs
        #         embedding1 = node_embeddings[node1]
        #         embedding2 = node_embeddings[node2]
        #         cosine_similarity = np.dot(embedding1, embedding2) / (np.linalg.norm(embedding1) * np.linalg.norm(embedding2))
        #         # Add the similarity values to the lower triangular part of the sparse matrix.
        #         row_indices.append(idx1)
        #         col_indices.append(idx2)
        #         data_values.append(cosine_similarity)

        # # Construct the sparse matrix in COO format.
        # adjacency_matrix = csr_matrix((data_values, (row_indices, col_indices)), shape=(num_nodes, num_nodes))
        # # Symmetrically populate the uper triangular part
        # adjacency_matrix = np.around(adjacency_matrix, 2)  
        # adjacency_matrix = adjacency_matrix + adjacency_matrix.T.multiply(adjacency_matrix.T > adjacency_matrix) - adjacency_matrix.multiply(adjacency_matrix.T > adjacency_matrix)
        # adjacency_matrix= self.normalize(adjacency_matrix) + sp.eye(adjacency_matrix.shape[0])
        # adjacency_matrix = adjacency_matrix.toarray()
        # self.adj_matrix = adjacency_matrix
        # self.adj_matrix_inverse = self.adj_matrix.T

        # """ 
        #     Construct prerequisite matrix
        # """
        # matrix_size = self.embedding_matrix.shape[0]
        # num_values = 100
        # # Randomly select row and column indices.
        # rows = np.random.choice(matrix_size, num_values, replace=True)
        # cols = np.random.choice(matrix_size, num_values, replace=True)
        # # Generate random values, rounded to two decimal places
        # data = np.round(np.random.uniform(0, 1, num_values), 2)

        # prerequisite_matrix = csr_matrix((data, (rows, cols)), shape=(matrix_size, matrix_size))
        # self.prerequisite_matrix = prerequisite_matrix.toarray()
        # self.prerequisite_matrix_inverse = self.prerequisite_matrix.T

        """ 
            generate relationships weight for every type of relationships
        """
        #the size of weight_matrix is the size of embedding
        weight_size = self.embedding_matrix.shape[1]
        self.weight_matrix_input_layer_1 = self.glorot_seed((weight_size,weight_size)).numpy()
        self.weight_matrix_output_layer_1 = self.glorot_seed((weight_size,weight_size)).numpy()
        self.weight_matrix_selfloop_layer_1 = self.glorot_seed((weight_size,weight_size)).numpy()

        self.weight_matrix_input_layer_2 = self.glorot_seed((weight_size,weight_size)).numpy()
        self.weight_matrix_output_layer_2 = self.glorot_seed((weight_size,weight_size)).numpy()
        self.weight_matrix_selfloop_layer_2 = self.glorot_seed((weight_size,weight_size)).numpy()

        self.weight_relation_initialize = self.glorot_seed((1,weight_size)).numpy()
        self.weight_relation_layer_1 = self.glorot_seed((weight_size,weight_size)).numpy()
        self.weight_relation_layer_2 = self.glorot_seed((weight_size,weight_size)).numpy() 
    
    def normalize(self,mx):
        rowsum = np.array(mx.sum(1))
        d_inv = np.power(rowsum, -0.5).flatten()
        d_inv[np.isinf(d_inv)] = 0.0
        d_mat_inv = sp.diags(d_inv)
        norm_adj = d_mat_inv.dot(mx)
        norm_adj = norm_adj.dot(d_mat_inv)
        return norm_adj
    
    def glorot_seed(
        self,
        shape: Tuple,
        seed: int = 42,
        dtype: torch.dtype = torch.float32,
    ):
        """Randomly generates a tensor based on a seed and Glorot initialization.

        Args:
            shape (Tuple):
                Desired shape of the tensor.

            device (torch.device or str, optional):
                Device to generate tensor on. Defaults to "cuda".

            seed (int, optional):
                The seed. Defaults to 42.

            dtype (torch.dtype, optional):
                Tensor type. Defaults to torch.float32.

        Returns:
            torch.Tensor: The randomly generated tensor
        """
        seed = random.randint(0, 100) 
        torch.manual_seed(seed)
        a = torch.zeros(shape, device=None, dtype=dtype)
        glorot(a)
        return a








