import numpy as np
import pandas as pd
import torch
import os
import random
from torch_geometric.nn.inits import glorot
from sentence_transformers import SentenceTransformer
import scipy.sparse as sp
from typing import Tuple
from scipy.sparse import coo_matrix
from sklearn.metrics.pairwise import cosine_similarity
from torch_geometric.datasets import RelLinkPredDataset
import torch.nn.functional as F
from torch.nn import Parameter

current_dir = os.path.dirname(__file__)

class ablation_study_rrgcn:
    def __init__(self):
        self.adj_matrix = None
        self.embedding_matrix = None
        self.final_embedding_matrix = None
        self.num_relationtypes = None
        self.relations=None
        self.data = None
        self.relation_embedding_matrix = None
        self.edges = []
        self.data_load()

        pass

    def data_load(self):
        #  may choose a different SBERT model paraphrase-MiniLM-L12-v2 paraphrase-MiniLM-L6-v2 all-MiniLM-L6-v2 paraphrase-xlm-r-multilingual-v1
        # SBERT model, be used to generate the initial embedding for node and relation
        model = SentenceTransformer('paraphrase-MiniLM-L12-v2') 

        # load the eva data 
        data_path = os.path.join(current_dir, '.\data\eva_data_version_1.txt')
        data = pd.read_csv(data_path, sep='\t', header=None, names=['node1', 'relation','node2'])
        self.data = data
        # get all unique nodes and relation
        all_nodes = pd.concat([data['node1'], data['node2']]).unique()
        self.relations = data['relation'].unique()
        self.num_relationtypes = len(self.relations)

     
        # generate the node to index mapping, the idx is begin from 0
        node_to_idx = {node: idx for idx, node in enumerate(all_nodes)}
        idx_to_node = {idx: node for node, idx in node_to_idx.items()}

        relation_embeddings = {relation: model.encode(relation) for relation in self.relations}
        relation_embedding_matrix={}
        for _, row in data.iterrows():
            src_idx = node_to_idx[row['node1']]
            tgt_idx = node_to_idx[row['node2']]
            self.edges.append((src_idx,tgt_idx))
            relation_embedding_matrix[(src_idx, tgt_idx)] = relation_embeddings[row['relation']]/np.linalg.norm(relation_embeddings[row['relation']], keepdims=True)
        self.relation_embedding_matrix=relation_embedding_matrix
        # generate initial embedding for nodes
        node_features = {}
        for node in all_nodes:
            node_text = str(node)
            idx =  node_to_idx[node]
            node_features[idx] = model.encode(node_text)


        """ 
            Construct embedding matrix
        """
        num_nodes = len(all_nodes)
        embedding_dim = len(next(iter(node_features.values())))
        # print("embedding_dim"+str(embedding_dim))
        embedding_matrix = np.zeros((num_nodes, embedding_dim))
        for idx, node  in node_features.items():
            embedding_matrix[idx] = node_features[idx]
        self.embedding_matrix = embedding_matrix
        # generate relation_data
        relation_data = {}

        for relation in self.relations:
            # Retrieve all edges of a specific relationship type
            relation_edges = data[data['relation'] == relation][['node1', 'node2']].values
            print (relation_edges)
            edges_with_similarity = []

            for node1, node2 in relation_edges:
                idx1 = node_to_idx[node1]
                idx2 = node_to_idx[node2]
                # print(str(idx1)+"--->"+str(idx2))

                # calculate the cosine_similarity between this two node
                cos_sim = cosine_similarity([node_features[idx1]], [node_features[idx2]])[0, 0]
                # print(cos_sim)
                # Save the result to the edge list of the current relation
                edges_with_similarity.append((idx1, idx2, cos_sim))

            # Add the edge list to the relation_data dictionary
            relation_data[relation] = list(set(edges_with_similarity))

        # Initialize a dictionary to store the sparse adjacency matrix for each relationship type
        adj_matrices = {}
        for relation_type, edges in relation_data.items():
            # Explode into rows, columns, and lists of data
            rows = [edge[0] for edge in edges]
            cols = [edge[1] for edge in edges]
            data = [edge[2] for edge in edges]
            data = np.around(data, 2)
            # Constructing a sparse adjacency matrix
            adj_matrix = sp.coo_matrix((data, (rows, cols)), shape=(len(all_nodes), len(all_nodes)))
            adj_matrix = adj_matrix.toarray()
            neighbor_counts =np.sum(adj_matrix != 0, axis=1)
            # neighbor_counts = np.array(adj_matrix.sum(axis=1)).flatten()
            # Avoid division by zero and handle isolated nodes
            neighbor_counts[neighbor_counts == 0] = 1
            # Normalize adjacency matrix
            normalized_adj_matrix = adj_matrix / neighbor_counts[:, None]
            adj_matrices[relation_type] = normalized_adj_matrix
        self.adj_matrix = adj_matrices


    def create_weight_matrices(self, relation_list, weight_size):
        """
        Create a weight matrix of size (x, y) from each element in relation_list and return a dictionary containing these matrices.
        
        参数:
        relation_list (list): A list containing relationship names that will be used as dictionary keys.
        x (int): The number of rows in the weight matrix embedding_matrix.shape[1]。
        y (int): The number of columns in the weight matrix。embedding_matrix.shape[1]
        
        return:
        dict: A dictionary containing the relationship name as key and the corresponding weight matrix as value。
        """
        weight_matrices = {}
        
        for relation in relation_list:
            # Create a random weight matrix of size (x, y)
            weight_matrix = self.glorot_seed((weight_size,weight_size)).numpy()
            # Add the matrix to the dictionary with relation as key
            weight_matrices[relation] = weight_matrix
        
        return weight_matrices
    """
        with self loop
    """
    # A*H*W
    def rrgcn_1_1(self):

        #self.load_data()
        """ 
            embedding_matrix
        """
        embedding_matrix = self.embedding_matrix
        
        """ 
            adj_matrix: dict key(relationtypes), value(adj_matrix)
        """
        adj_matrix = self.adj_matrix

        """ 
            weight_matrix: dict key(relationtypes), value(weight_matrix)
        """
        weight_size = embedding_matrix.shape[1]
        weight_matrix = self.create_weight_matrices(self.relations,weight_size )
        weight_matrix_layer_2 = self.create_weight_matrices(self.relations,weight_size )

        """  
            the first layer
        """
        embedding_first_layer = np.zeros((embedding_matrix.shape[0], embedding_matrix.shape[1]))
        #self loop part
        self_loop_part = None
        selfloop_weight_layer_1 = self.glorot_seed((weight_size,weight_size)).numpy()
        for relation in self.relations:
            self_loop_adj= sp.eye(adj_matrix[relation].shape[0])
            self_loop_adj = self_loop_adj.toarray()
            self_loop_part_1 = np.dot(self_loop_adj,embedding_matrix)
            self_loop_part = np.dot(self_loop_part_1,selfloop_weight_layer_1)
            embedding_first_layer = embedding_first_layer + self_loop_part

        # relation part
        relation_part = None
        for relation in self.relations:
            relation_adj_matrix = adj_matrix[relation]
            Wr_layer_1 = weight_matrix[relation]
            relatin_part_1 = np.dot(relation_adj_matrix,embedding_matrix)
            relation_part = np.dot(relatin_part_1, Wr_layer_1)
            embedding_first_layer=embedding_first_layer+relation_part
        embedding_first_layer = embedding_first_layer / np.linalg.norm(embedding_first_layer, axis=1, keepdims=True)
        # embedding_first_layer = embedding_first_layer / np.linalg.norm(embedding_matrix, axis=1, keepdims=True)
        """  
            the second layer
        """
        final_embedding = np.zeros((embedding_matrix.shape[0], embedding_matrix.shape[1]))
        self_loop_part = None
        selfloop_weight_layer_2 = self.glorot_seed((weight_size,weight_size)).numpy()
        for relation in self.relations:
            self_loop_adj= sp.eye(adj_matrix[relation].shape[0])
            self_loop_adj = self_loop_adj.toarray()
            self_loop_part_1 = np.dot(self_loop_adj,embedding_first_layer)
            self_loop_part = np.dot(self_loop_part_1,selfloop_weight_layer_2)
            final_embedding = final_embedding + self_loop_part

        # relation part
        relation_part = None
        for relation in self.relations:
            relation_adj_matrix = adj_matrix[relation]
            Wr_layer_2 = weight_matrix_layer_2[relation]
            relatin_part_1 = np.dot(relation_adj_matrix,embedding_first_layer)
            relation_part = np.dot(relatin_part_1, Wr_layer_2)
            final_embedding=final_embedding+relation_part
        final_embedding = final_embedding / np.linalg.norm(final_embedding, axis=1, keepdims=True)
        return final_embedding

    #A*H
    def rrgcn_1_2(self):

        #self.load_data()
        """ 
            embedding_matrix
        """
        embedding_matrix = self.embedding_matrix
        
        """ 
            adj_matrix: dict key(relationtypes), value(adj_matrix)
        """
        adj_matrix = self.adj_matrix

        """  
            the first layer
        """
        #self loop part
    
        embedding_first_layer = np.zeros((embedding_matrix.shape[0], embedding_matrix.shape[1]))
        # relation part
        relation_part = None
        for relation in self.relations:
            relation_adj_matrix = adj_matrix[relation]
            # if np.any(relation_adj_matrix != 0):
            #     print("Matrix contains non-zero values")
            #     # Extract and print all non-zero values
            #     non_zero_values = relation_adj_matrix[relation_adj_matrix != 0]
            #     print("Non-zero value:", non_zero_values)
            # else:
            #     print("The matrix contains no non-zero values")
            relation_adj_matrix = relation_adj_matrix + sp.eye(relation_adj_matrix.shape[0])
            # relation_adj_matrix = relation_adj_matrix.toarray()
            # relation_adj_matrix=relation_adj_matrix + sp.eye(relation_adj_matrix.shape[0])
            relation_part = np.dot(relation_adj_matrix,embedding_matrix)
            embedding_first_layer=embedding_first_layer+relation_part
        embedding_first_layer = embedding_first_layer / np.linalg.norm(embedding_matrix, axis=1, keepdims=True)
        """  
            the second layer
        """
        final_embedding = np.zeros((embedding_matrix.shape[0], embedding_matrix.shape[1]))
        # relation part
        relation_part = None
        for relation in self.relations:
            relation_adj_matrix = adj_matrix[relation]
            relation_adj_matrix = relation_adj_matrix + sp.eye(relation_adj_matrix.shape[0])
            # relation_adj_matrix = relation_adj_matrix.toarray()
            # relation_adj_matrix=relation_adj_matrix + sp.eye(relation_adj_matrix.shape[0])
            relation_part = np.dot(relation_adj_matrix,embedding_first_layer)
            final_embedding=final_embedding+relation_part
        final_embedding = final_embedding / np.linalg.norm(final_embedding, axis=1, keepdims=True)
        return final_embedding.A

    #H*W
    def rrgcn_1_3(self):

        #self.load_data()
        """ 
            embedding_matrix
        """
        embedding_matrix = self.embedding_matrix
        
        """ 
            weight_matrix: dict key(relationtypes), value(weight_matrix)
        """
        weight_size = embedding_matrix.shape[1]
        weight_matrix = self.create_weight_matrices(self.relations,weight_size )
        weight_matrix_layer_2 = self.create_weight_matrices(self.relations,weight_size )


        """  
            the first layer
        """
        #self loop part
        embedding_first_layer = np.zeros((embedding_matrix.shape[0], embedding_matrix.shape[1]))
        #because the pre_self_loop is zero so that ignore it
        # self_loop_part1 = np.dot(self_loop_adj,embedding_matrix)
        # self_loop_part = np.dot(self_loop_part1,weight_matrix_self_1)
        self_loop_part = None
        selfloop_weight_layer_1 = self.glorot_seed((weight_size,weight_size)).numpy()

        for relation in self.relations:
            self_loop_part = np.dot(embedding_matrix,selfloop_weight_layer_1)
            embedding_first_layer = embedding_first_layer + self_loop_part
        # relation part
        relation_part = None
        for relation in self.relations:
            Wr_layer_1 = weight_matrix[relation]
            relation_part = np.dot(embedding_matrix, Wr_layer_1)
            embedding_first_layer=embedding_first_layer + relation_part
        embedding_first_layer = embedding_first_layer / np.linalg.norm(embedding_matrix, axis=1, keepdims=True)
        """  
            the second layer
        """

        self_loop_part = None
        selfloop_weight_layer_2 = self.glorot_seed((weight_size,weight_size)).numpy()
        final_embedding = np.zeros((embedding_matrix.shape[0], embedding_matrix.shape[1]))
        for relation in self.relations:
            self_loop_part = np.dot(embedding_first_layer,selfloop_weight_layer_2)
            final_embedding = final_embedding + self_loop_part

        # relation part
        relation_part = None
        for relation in self.relations:
            Wr_layer_2 = weight_matrix_layer_2[relation]
            relation_part = np.dot(embedding_first_layer, Wr_layer_2)
            final_embedding=final_embedding+relation_part
        final_embedding = final_embedding / np.linalg.norm(final_embedding, axis=1, keepdims=True)
        return final_embedding
    
    """
        without self loop
    """    
    # A*H*W
    def rrgcn_2_1(self):

        #self.load_data()
        """ 
            embedding_matrix
        """
        embedding_matrix = self.embedding_matrix
        
        """ 
            adj_matrix: dict key(relationtypes), value(adj_matrix)
        """
        adj_matrix = self.adj_matrix

        """ 
            weight_matrix: dict key(relationtypes), value(weight_matrix)
        """
        weight_size = embedding_matrix.shape[1]
        weight_matrix = self.create_weight_matrices(self.relations,weight_size )
        weight_matrix_layer_2 = self.create_weight_matrices(self.relations,weight_size )


        """  
            the first layer
        """
        embedding_first_layer = np.zeros((embedding_matrix.shape[0], embedding_matrix.shape[1]))

        # relation part
        relation_part = None
        for relation in self.relations:
            relation_adj_matrix = adj_matrix[relation]
            Wr_layer_1 = weight_matrix[relation]
            relatin_part_1 = relation_adj_matrix @ embedding_matrix
            relation_part = relatin_part_1 @ Wr_layer_1
            embedding_first_layer=embedding_first_layer+relation_part
        embedding_first_layer = embedding_first_layer
        """  
            the second layer
        """
        final_embedding = np.zeros((embedding_matrix.shape[0], embedding_matrix.shape[1]))
        # relation part
        relation_part = None
        for relation in self.relations:
            relation_adj_matrix = adj_matrix[relation]
            if np.any(relation_adj_matrix != 0):
                print("Matrix contains non-zero values")
                # Extract and print all non-zero values
                non_zero_values = relation_adj_matrix[relation_adj_matrix != 0]
                print("Non-zero value:", non_zero_values)
            else:
                print("The matrix contains no non-zero values")
            Wr_layer_2 = weight_matrix_layer_2[relation]
            print(type(relation_adj_matrix))
            print(type(embedding_first_layer))
            relatin_part_1 = relation_adj_matrix@embedding_first_layer
            if np.any(relatin_part_1 != 0):
                print("The matrix contains nonzero values.")
                # Extract and print all non-zero values
                non_zero_values = relatin_part_1[relatin_part_1 != 0]
                print("Non-zero value:", non_zero_values)
            else:
                print("The matrix contains no non-zero values。")
            relation_part = relatin_part_1@ Wr_layer_2
            final_embedding=final_embedding+relation_part
        #final_embedding = final_embedding / np.linalg.norm(final_embedding, axis=1, keepdims=True)
        return final_embedding
    
    
    def normalize_adj_matrix(self, adj_matrix):
        row_sum = np.array(adj_matrix.sum(1))
        d_inv_sqrt = np.power(row_sum, -0.5).flatten()
        d_inv_sqrt[np.isinf(d_inv_sqrt)] = 0.
        d_mat_inv_sqrt = sp.diags(d_inv_sqrt)
        return d_mat_inv_sqrt.dot(adj_matrix).dot(d_mat_inv_sqrt)
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


class DistMultDecoder(torch.nn.Module):
    def __init__(self, in_dim, num_relations, hidden_channels):
        super().__init__()
        self.pre_lin = torch.nn.Linear(in_dim, hidden_channels)
        self.lin = torch.nn.Linear(hidden_channels, hidden_channels)
        self.lin1 = torch.nn.Linear(hidden_channels, hidden_channels)
        self.lin2 = torch.nn.Linear(hidden_channels, hidden_channels)
        self.rel_emb = Parameter(torch.Tensor(num_relations, hidden_channels))
        self.reset_parameters()

    def reset_parameters(self):
        torch.nn.init.xavier_uniform_(self.rel_emb)

    def forward(self, z, edge_index, edge_type):
        z = F.relu(self.pre_lin(z))
        z = F.relu(self.lin(z))
        z = F.relu(self.lin1(z))
        z = F.relu(self.lin2(z))
        z_src, z_dst = z[edge_index[0]], z[edge_index[1]]
        rel = self.rel_emb[edge_type]
        return torch.sum(z_src * rel * z_dst, dim=1)

""" 
    scoring function
"""
# TransE scoring function
def transE_score(h_embedding, r_embedding, t_embedding):
    return -np.linalg.norm(h_embedding + r_embedding - t_embedding)
#Dismult scoring function
def distmult_score(h_embedding, r_embedding, t_embedding):
    score =np.sum(np.abs(h_embedding) *np.abs( r_embedding) * np.abs(t_embedding))
    return score
# ConvE 
def convE_score(h_embedding, r_embedding, t_embedding, convE_model):
    with torch.no_grad():
        return convE_model(h_embedding, r_embedding, t_embedding).item()
# cosine score function    
def cosine_score(h_embedding, r_embeding, t_embedding):
    combined_embedding = h_embedding+r_embeding
    score = cosine_similarity([combined_embedding], [t_embedding])[0][0]
    return score

""" 
   link prediction 
"""
def evaluate_link_prediction(entity_embeddings, relation_embeddings, test_triples, scoring_function, convE_model=None,n=10):
    ranks = []
    hits = []
    num_entities = entity_embeddings.shape[0]

    for (h, t) in test_triples:
        # get the score of the positive triple 
        correct_score = scoring_function(entity_embeddings[h], relation_embeddings[(h,t)], entity_embeddings[t])
        # print(correct_score)
        # if correct_score<=0.4:
        #     print("+++++++++++++++++++++++++(h,t)+++++++++++++++++++++++++")
        #     print("the embedding of head:")
        #     print(h)
        #     print("the embedding of r:")
        #     print((h,t))
        #     print("the embedding of t:")
        #     print(t) 
        #     print("the embedding of score:")
        #     print(correct_score)
        #     print("+++++++++++++++++++++++++end+++++++++++++++++++++++++")
        #     print("                                                      ")
        # replace the head
        head_scores = []
        for h_prime in range(num_entities):
            if h_prime != h and (h_prime,t) not in test_triples:
                score_h_prime = scoring_function(entity_embeddings[h_prime], relation_embeddings[(h,t)], entity_embeddings[t])
                head_scores.append(score_h_prime)

        head_scores.append(correct_score)  # append the positive score
        head_ranks = np.argsort(head_scores)[::-1].tolist()  # rank form high score to low score
        correct_score_index = len(head_scores) - 1
        rank_head = head_ranks.index(correct_score_index)+1  # get then rank of positive sample

        # replace tail 
        tail_scores = []
        for t_prime in range(num_entities):
            if t_prime != t and (h,t_prime) not in test_triples:
                score_t_prime = scoring_function(entity_embeddings[h], relation_embeddings[(h,t)], entity_embeddings[t_prime])
                tail_scores.append(score_t_prime)

        tail_scores.append(correct_score)  # append the positive score
        tail_ranks = np.argsort(tail_scores)[::-1].tolist()  # rank from high to low
        correct_score_index = len(tail_scores) - 1
        rank_tail = tail_ranks.index(correct_score_index)+1 # get the rank of positive sample

        # 记录最小排名（头替换和尾替换的较小值）
        rank = min(rank_head,rank_tail)
        print(rank)
        ranks.append(rank)
        #ranks.append(rank_tail)
        # 记录 Hit@n
        hits.append(1 if rank <= n else 0)
        #hits.append(1 if rank_tail <= n else 0)
    # 计算 MR
    mr = np.mean(ranks)
    
    # 计算 MRR
    mrr = np.mean([1.0 / rank for rank in ranks])
    
    # 计算 Hit@n
    hit_n = np.mean(hits)

    return mr, mrr, hit_n


"""  
 Evaluation part begin here
"""
# step 1: data prepartion
rrgcn = ablation_study_rrgcn()

print(type(rrgcn.embedding_matrix))
print(rrgcn.embedding_matrix.shape)
print(rrgcn.embedding_matrix[12].shape)
print(rrgcn.embedding_matrix[468].shape)
score = cosine_similarity([rrgcn.embedding_matrix[12]], [rrgcn.embedding_matrix[468]])[0][0]
print("++++++++++++++++++++++++"+str(score)+"++++++++++++++++++++++++++++++")
# step2: generate the embedding by using our model
embedding_matrix = rrgcn.rrgcn_2_1()
print(type(embedding_matrix))
print(embedding_matrix.shape)
print(embedding_matrix[12].shape)
print(embedding_matrix[468].shape)
# embedding_matrix =rrgcn.embedding_matrix
score2 = cosine_similarity([embedding_matrix[12]], [embedding_matrix[468]])[0][0]
print("++++++++++++++++++++++++"+str(score2)+"++++++++++++++++++++++++++++++")

relation_embedding_matrix =rrgcn.relation_embedding_matrix
test_triples =set(rrgcn.edges)

# step3 and step4 compute the score and evaluate
# params: embedding matrix, relation_embedding_matrix, test_triples(h,r,t), scoring_function(transE, distmult, cosine_score, Hit@n)
mr, mrr, hit_n = evaluate_link_prediction(embedding_matrix, relation_embedding_matrix, test_triples,scoring_function=transE_score,n=10)
print(f"MR: {mr}, MRR: {mrr}, Hit@10: {hit_n}")

def normalize_adjacency_matrix(adj_matrix):
    """
    Normalize the adjacency matrix to prevent division by zero errors and smooth node neighbor contributions
    
    parameter:
    adj_matrix (numpy.ndarray): Sparse adjacency matrix

    return:
    numpy.ndarray: Normalized adjacency matrix
    """
    # Count the number of neighbors of each node (i.e. the number of non-zero elements in each row)
    neighbor_counts = np.sum(adj_matrix != 0, axis=1)
    
    # Set the number of neighbors of isolated nodes to 1 to avoid division by zero
    neighbor_counts[neighbor_counts == 0] = 1
    
    # Normalized adjacency matrix
    normalized_adj_matrix = adj_matrix / neighbor_counts[:, None]
    
    return normalized_adj_matrix
