import pandas as pd
import torch
import numpy as np
from sklearn.model_selection import train_test_split
import os
from data_process import data_process
import scipy.sparse as sp
import os


class eva_compgcn:
    def __init__(self):
        data = data_process()
        self.adj_matrix = data.adj_matrix
        self.prerequisite_matrix = data.prerequisite_matrix
        self.embedding_matrix = data.embedding_matrix
        self.adj_matrix_inverse = data.adj_matrix_inverse
        self.prerequisite_matrix_inverse = data.prerequisite_matrix_inverse

        self.weight_matrix_input_layer_1 = data.weight_matrix_input_layer_1
        self.weight_matrix_output_layer_1 = data.weight_matrix_output_layer_1
        self.weight_matrix_selfloop_layer_1 = data.weight_matrix_selfloop_layer_1

        self.weight_matrix_input_layer_2 = data.weight_matrix_input_layer_2
        self.weight_matrix_output_layer_2 = data.weight_matrix_output_layer_2
        self.weight_matrix_selfloop_layer_2 = data.weight_matrix_selfloop_layer_2

        self.weight_relation_initialize = data.weight_relation_initialize
        self.weight_relation_layer_1 = data.weight_relation_layer_1
        self.weight_relation_layer_2 = data.weight_matrix_output_layer_2

    def compgcn_direction_weight (self, rel_transform_mode = 'sub'):
        """ 
            initialize variable
        """        

        adj_matrix = self.adj_matrix
        prerequisite_matrix = self.prerequisite_matrix
        weight_relation_initialize = self.weight_relation_initialize
        weight_relation_layer_1 = self.weight_relation_layer_1
        prerequisite_matrix_inverse = self.prerequisite_matrix_inverse
        adj_matrix_inverse = self.adj_matrix_inverse
        embedding_matrix = self.embedding_matrix

        weight_matrix_input_layer_1=self.weight_matrix_input_layer_1
        weight_matrix_output_layer_1=self.weight_matrix_output_layer_1
        weight_matrix_selfloop_layer_1=self.weight_matrix_selfloop_layer_1

        weight_matrix_input_layer_2=self.weight_matrix_input_layer_2
        weight_matrix_output_layer_2=self.weight_matrix_output_layer_2
        weight_matrix_selfloop_layer_2=self.weight_matrix_selfloop_layer_2

        """ 
            Step 1: initialize the representation of each edges
        """
        # Construct relation embedding dict to store the embedding of each edges
        relation_embedding_matrix_adj = {}
        relation_embedding_matrix_prerequisite = {}

        # Iterate over the adjacency matrix and compute the embedding for each edge in rc relationtype
        for i in range(adj_matrix.shape[0]):
            for j in range(adj_matrix.shape[1]):
                weight = adj_matrix[i,j]
                if weight != 0:
                    relation_embedding_matrix_adj[(i,j)]= np.dot(weight,weight_relation_initialize)
        
        # Iterate over the prerequisite matrix and compute the embedding for each edge in prerequisite relationtype
        for i in range(prerequisite_matrix.shape[0]):
            for j in range(prerequisite_matrix.shape[1]):
                weight = prerequisite_matrix[i,j]
                if weight != 0:
                    relation_embedding_matrix_prerequisite[(i,j)] = np.dot(weight,weight_relation_initialize)        
        
        """ 
            Step 2: update the embedding of all nodes at the 1st. layer
        """
        #Iterate each row of embedding matrix
        for v in range(embedding_matrix.shape[0]):
            new_embedding_v = np.zeros((1, embedding_matrix.shape[1]))
            #Iterate each column of embedding matrix
            for u in range(embedding_matrix.shape[0]):
                #initialize variable
                adj_out = None # out direction of adj
                adj_in = None # In direction of adj
                pre_out = None # out direction of pre
                pre_in = None # In direction of pre
                self_loop = None # self loop direction

                # get the embedding of node v
                embedding_v = embedding_matrix [v]

                # if there is a adj edge between node v and it's neighbor and this edge is in OUT direction
                if v!=u and adj_matrix[v,u] != 0 :
                    relation_embedding = relation_embedding_matrix_adj[(v,u)]
                    adj_out = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)

                # if there is a adj edge between node v and it's neighbor and this edge is in IN direction
                if v!=u and adj_matrix_inverse[v,u] != 0:
                    relation_embedding = relation_embedding_matrix_adj[(u,v)]
                    adj_in = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)
                
                # if there is a pre edge between node v and it's neighbor and this edge is in OUT direction
                if v!=u and prerequisite_matrix[v,u] !=0:
                    relation_embedding = relation_embedding_matrix_prerequisite[(v,u)]
                    pre_out = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)

                # if there is a pre edge between node v and it's neighbor and this edge is in IN direction           
                if v!=u and prerequisite_matrix_inverse[v,u]!=0:                
                    relation_embedding = relation_embedding_matrix_prerequisite[(u,v)]
                    pre_in = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)
                
                # if there is a self loop edge of node v      
                if v==u:
                    relation_embedding = relation_embedding_matrix_adj[(v,v)]
                    self_loop = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)


                if adj_out is not None:
                    new_embedding_v = new_embedding_v + np.dot(adj_out,weight_matrix_output_layer_1)
                if adj_in is not None:
                    new_embedding_v = new_embedding_v + np.dot(adj_in,weight_matrix_input_layer_1)
                if pre_out is not None:
                    new_embedding_v = new_embedding_v + np.dot(pre_out,weight_matrix_output_layer_1)
                if pre_in is not None:
                    new_embedding_v = new_embedding_v + np.dot(pre_in,weight_matrix_input_layer_1)
                if self_loop is not None:
                    new_embedding_v = new_embedding_v + np.dot(self_loop,weight_matrix_selfloop_layer_1)

            # means node v don't have any neighbors
            if np.all(new_embedding_v == 0 ):
                pass
            else:
                embedding_matrix [v] = new_embedding_v            


        """  
            Step 3: update the representation of edges        
        # """
        # update the embedding of adj edges
        for edge in relation_embedding_matrix_adj:
            relation_embedding_matrix_adj [edge] = np.dot(relation_embedding_matrix_adj[edge], weight_relation_layer_1)

        # update the embedding of prerequisite edges      
        for edge in relation_embedding_matrix_prerequisite:
            relation_embedding_matrix_prerequisite [edge] = np.dot(relation_embedding_matrix_prerequisite[edge], weight_relation_layer_1)

        """  
            Step 4: update the representation of each nodes at layer 2      
        """        
        for v in range(embedding_matrix.shape[0]):
            new_embedding_v = np.zeros((1, embedding_matrix.shape[1]))
            for u in range(embedding_matrix.shape[0]):
                adj_out = None
                adj_in = None
                pre_out = None
                pre_in = None
                self_loop = None
                embedding_v = embedding_matrix [v]

                if v!=u and adj_matrix[v,u] != 0 :
                    relation_embedding = relation_embedding_matrix_adj[(v,u)]
                    adj_out = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)
                if v!=u and adj_matrix_inverse[v,u] != 0:
                    relation_embedding = relation_embedding_matrix_adj[(u,v)]
                    adj_in = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)
                if v!=u and prerequisite_matrix[v,u] !=0:
                    relation_embedding = relation_embedding_matrix_prerequisite[(v,u)]
                    pre_out = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)     
                if v!=u and prerequisite_matrix_inverse[v,u]!=0:                
                    relation_embedding = relation_embedding_matrix_prerequisite[(u,v)]
                    pre_in = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)
                if v==u:
                    relation_embedding = relation_embedding_matrix_adj[(v,v)]
                    self_loop = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)

                if adj_out is not None:
                    new_embedding_v = new_embedding_v + np.dot(adj_out,weight_matrix_output_layer_2)
                if adj_in is not None:
                    new_embedding_v = new_embedding_v + np.dot(adj_in,weight_matrix_input_layer_2)
                if pre_out is not None:
                    new_embedding_v = new_embedding_v + np.dot(pre_out,weight_matrix_output_layer_2)
                if pre_in is not None:
                    new_embedding_v = new_embedding_v + np.dot(pre_in,weight_matrix_input_layer_2)
                if self_loop is not None:
                    new_embedding_v = new_embedding_v + np.dot(self_loop,weight_matrix_selfloop_layer_2)

            # means node v don't have any neighbors
            if np.all(new_embedding_v == 0 ):
                pass
            else:
                embedding_matrix [v] = new_embedding_v               

        return embedding_matrix 
    
    def compgcn_without_direction_weight (self, rel_transform_mode = 'sub'):
        """ 
            initialize variable
        """        
        adj_matrix = self.adj_matrix
        prerequisite_matrix = self.prerequisite_matrix
        weight_relation_initialize = self.weight_relation_initialize
        weight_relation_layer_1 = self.weight_relation_layer_1
        prerequisite_matrix_inverse = self.prerequisite_matrix_inverse
        adj_matrix_inverse = self.adj_matrix_inverse
        embedding_matrix = self.embedding_matrix

        """ 
            Step 1: initialize the representation of each edges
        """
        # Construct relation embedding dict to store the embedding of each edges
        relation_embedding_matrix_adj = {}
        relation_embedding_matrix_prerequisite = {}

        # Iterate over the adjacency matrix and compute the embedding for each edge in rc relationtype
        for i in range(adj_matrix.shape[0]):
            for j in range(adj_matrix.shape[1]):
                weight = adj_matrix[i,j]
                if weight != 0:
                    relation_embedding_matrix_adj[(i,j)]= np.dot(weight,weight_relation_initialize)
        
        # Iterate over the prerequisite matrix and compute the embedding for each edge in prerequisite relationtype
        for i in range(prerequisite_matrix.shape[0]):
            for j in range(prerequisite_matrix.shape[1]):
                weight = prerequisite_matrix[i,j]
                if weight != 0:
                    relation_embedding_matrix_prerequisite[(i,j)] = np.dot(weight,weight_relation_initialize)        
        
        """ 
            Step 2: update the embedding of all nodes at the 1st. layer
        """
        #Iterate each row of embedding matrix
        for v in range(embedding_matrix.shape[0]):
            new_embedding_v = np.zeros((1, embedding_matrix.shape[1]))
            #Iterate each column of embedding matrix
            for u in range(embedding_matrix.shape[0]):
                #initialize variable
                adj_out = None # out direction of adj
                adj_in = None # In direction of adj
                pre_out = None # out direction of pre
                pre_in = None # In direction of pre
                self_loop = None # self loop direction

                # get the embedding of node v
                embedding_v = embedding_matrix [v]

                # if there is a adj edge between node v and it's neighbor and this edge is in OUT direction
                if v!=u and adj_matrix[v,u] != 0 :
                    relation_embedding = relation_embedding_matrix_adj[(v,u)]
                    adj_out = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)

                # if there is a adj edge between node v and it's neighbor and this edge is in IN direction
                if v!=u and adj_matrix_inverse[v,u] != 0:
                    relation_embedding = relation_embedding_matrix_adj[(u,v)]
                    adj_in = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)
              
                # if there is a pre edge between node v and it's neighbor and this edge is in OUT direction
                if v!=u and prerequisite_matrix[v,u] !=0:
                    relation_embedding = relation_embedding_matrix_prerequisite[(v,u)]
                    pre_out = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)

                # if there is a pre edge between node v and it's neighbor and this edge is in IN direction           
                if v!=u and prerequisite_matrix_inverse[v,u]!=0:                
                    relation_embedding = relation_embedding_matrix_prerequisite[(u,v)]
                    pre_in = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)
                
                # if there is a self loop edge of node v      
                if v==u:
                    relation_embedding = relation_embedding_matrix_adj[(v,v)]
                    self_loop = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)


                if adj_out is not None:
                    new_embedding_v = new_embedding_v + adj_out
                if adj_in is not None:
                    new_embedding_v = new_embedding_v + adj_in
                if pre_out is not None:
                    new_embedding_v = new_embedding_v + pre_out
                if pre_in is not None:
                    new_embedding_v = new_embedding_v + pre_in
                if self_loop is not None:
                    new_embedding_v = new_embedding_v + self_loop

            # means node v don't have any neighbors
            if np.all(new_embedding_v == 0 ):
                pass
            else:
                embedding_matrix [v] = new_embedding_v              

  
        """  
            Step 3: update the representation of edges        
        # """
        # update the embedding of adj edges
        for edge in relation_embedding_matrix_adj:
            relation_embedding_matrix_adj [edge] = np.dot(relation_embedding_matrix_adj[edge], weight_relation_layer_1)

        # update the embedding of prerequisite edges      
        for edge in relation_embedding_matrix_prerequisite:
            relation_embedding_matrix_prerequisite [edge] = np.dot(relation_embedding_matrix_prerequisite[edge], weight_relation_layer_1)

        """  
            Step 4: update the representation of each nodes at layer 2      
        """        
        for v in range(embedding_matrix.shape[0]):
            new_embedding_v = np.zeros((1, embedding_matrix.shape[1]))
            for u in range(embedding_matrix.shape[0]):
                adj_out = None
                adj_in = None
                pre_out = None
                pre_in = None
                self_loop = None
                embedding_v = embedding_matrix [v]

                if v!=u and adj_matrix[v,u] != 0 :
                    relation_embedding = relation_embedding_matrix_adj[(v,u)]
                    adj_out = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)
                if v!=u and adj_matrix_inverse[v,u] != 0:
                    relation_embedding = relation_embedding_matrix_adj[(u,v)]
                    adj_in = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)
                if v!=u and prerequisite_matrix[v,u] !=0:
                    relation_embedding = relation_embedding_matrix_prerequisite[(v,u)]
                    pre_out = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)     
                if v!=u and prerequisite_matrix_inverse[v,u]!=0:                
                    relation_embedding = relation_embedding_matrix_prerequisite[(u,v)]
                    pre_in = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)
                if v==u:
                    relation_embedding = relation_embedding_matrix_adj[(v,v)]
                    self_loop = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)

                if adj_out is not None:
                    new_embedding_v = new_embedding_v + adj_out
                if adj_in is not None:
                    new_embedding_v = new_embedding_v + adj_in
                if pre_out is not None:
                    new_embedding_v = new_embedding_v + pre_out
                if pre_in is not None:
                    new_embedding_v = new_embedding_v + pre_in
                if self_loop is not None:
                    new_embedding_v = new_embedding_v + self_loop

            # means node v don't have any neighbors
            if np.all(new_embedding_v == 0 ):
                pass
            else:
                embedding_matrix [v] = new_embedding_v           

        return embedding_matrix
    
    def rel_transform(self, ent_embed, rel_embed,rel_transform_mode = 'sub'):
        if   rel_transform_mode == 'corr': 	trans_embed  = self.ccorr(ent_embed, rel_embed)
        elif rel_transform_mode == 'sub': 	trans_embed  = ent_embed - rel_embed
        elif rel_transform_mode == 'mult': 	trans_embed  = ent_embed * rel_embed
        else: raise NotImplementedError

        return trans_embed

    def ccorr(self,ent_embed, rel_embed):
        tensor = self.corr(ent_embed, rel_embed)
        # convert tensor to numpy
        embedding = tensor.cpu().numpy()
        return embedding

    def corr(self,ent_embed, rel_embed):

        # convert ndarray to tensor
        ent_embed = torch.tensor(ent_embed)
        rel_embed = torch.tensor(rel_embed)
        ent_embed = torch.fft.fft(ent_embed) # Perform FFT on ent_embed
        rel_embed_conj = torch.conj(torch.fft.fft(rel_embed)) # Perform FFT on y and take the conjugate
        correlation = torch.fft.ifft(ent_embed * rel_embed_conj)  # Perform inverse FFT after multiplication
        return correlation.real

    def normalize(self,mx):
        rowsum = np.array(mx.sum(1))
        d_inv = np.power(rowsum, -0.5).flatten()
        d_inv[np.isinf(d_inv)] = 0.0
        d_mat_inv = sp.diags(d_inv)
        norm_adj = d_mat_inv.dot(mx)
        norm_adj = norm_adj.dot(d_mat_inv)
        return norm_adj   
# def transE_score(head, relation, tail):
#     """
#     use TransE to calculate score
#     - head: the embedding of head
#     - relation: the embedding of relation
#     - tail: the embedding of tail
#     """
#     return np.linalg.norm(head + relation - tail, ord=1)  # L1范数


# Generate positive and negative samples
def generate_pos_neg_samples(edges, num_nodes):
    positive_samples = edges
    negative_samples = []
    while len(negative_samples) < len(positive_samples):
        i, j = np.random.randint(0, num_nodes, 2)
        if (i, j) not in edges and (j, i) not in edges:
            negative_samples.append((i, j))
    return positive_samples, negative_samples

# Calculate the similarity scores for node pairs
def compute_similarity_score(embedding, pair):
    return np.dot(embedding[pair[0]], embedding[pair[1]])

# Evaluate link prediction
def evaluate_link_prediction(pos_scores, neg_scores):
    scores = np.array(pos_scores + neg_scores)
    labels = np.array([1] * len(pos_scores) + [0] * len(neg_scores))
    sorted_indices = np.argsort(-scores)
    sorted_labels = labels[sorted_indices]

    # Mean Rank (MR)
    pos_ranks = np.where(sorted_labels == 1)[0] + 1
    print("++++++++++++++++++++++++++++++++")
    print(len(pos_ranks))
    MR = np.mean(pos_ranks)
    
    # Mean Reciprocal Rank (MRR)
    MRR = np.mean(1 / pos_ranks)
    
    # Hit@10
    Hit_10 = np.mean(pos_ranks <= 10)

    return MR, MRR, Hit_10

current_dir = os.path.dirname(__file__)

data_path = os.path.join(current_dir, 'eva_data.txt')
data = []

# 解析三元组文件，每行是 "节点1 关系 节点2"
# Parse the triples file, where each line is in the format: "node1 relation node2
with open(data_path, 'r') as file:
    for line in file:
        parts = line.strip().split('\t')
        if len(parts) == 3:
            data.append((parts[0], parts[2]))
    

# Map nodes to integer IDs
all_nodes = set([item[0] for item in data] + [item[1] for item in data])
node_map = {node: idx for idx, node in enumerate(all_nodes)}
num_nodes = len(node_map)

edges = [(node_map[pair[0]], node_map[pair[1]]) for pair in data]

positive_samples, negative_samples = generate_pos_neg_samples(edges, num_nodes)
print("++++++++++++++++++++++++++positive_samples++++++++++++++++++++++++++++++++++++++++++")
print(len(positive_samples))




# Generate node embeddings using the CompGCN model
test = eva_compgcn()
node_embeddings = test.compgcn_without_direction_weight('corr')

# Calculate scores for positive and negative samples.
positive_scores = [compute_similarity_score(node_embeddings, pair) for pair in positive_samples]
negative_scores = [compute_similarity_score(node_embeddings, pair) for pair in negative_samples]

# Calculate scores for positive and negative samples.
# positive_scores = [
#     transE_score(node_embeddings[head], relation_embedding[relation], node_embeddings[tail])
#     for head, relation, tail in positive_samples
# ]
# negative_scores = [
#     transE_score(node_embeddings[head], relation_embedding[relation], node_embeddings[tail])
#     for head, relation, tail in negative_samples
# ]




MR, MRR, Hit_10 = evaluate_link_prediction(positive_scores, negative_scores)
print(f'Mean Rank (MR): {MR}')
print(f'Mean Reciprocal Rank (MRR): {MRR}')
print(f'Hit@10: {Hit_10}')