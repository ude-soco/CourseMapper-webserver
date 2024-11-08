from neo4j import GraphDatabase
import numpy as np
import scipy.sparse as sp
import os
from util import *
import sys
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from torch_geometric.datasets import FB15k_237

dataset = FB15k_237(root='path/to/dataset')
data = dataset[0]
for i in range(10):
    head = data.edge_index[0][i].item()  # Head entity
    tail = data.edge_index[1][i].item()  # Tail entity
    
    # Check if relation types are stored in a separate attribute, like edge_type
    if hasattr(data, 'edge_type'):
        relation = data.edge_type[i].item()  # Relation type if available
        print(f"Triple {i+1}: Head = {head}, Relation = {relation}, Tail = {tail}")
    else:
        # If relation information is not available
        print(f"Triple {i+1}: Head = {head}, Tail = {tail} (Relation info not available)")
def test():
    """ 
    construct embedding matrix
    """

    # Read ids and initial embeddings of nodes from idfeature.text
    # The structure of text: first column is new id of node(type:int), the second column is the original id (type:string), and the rest is the initial embedding
    idx_features = np.genfromtxt("idfeature.txt", dtype=np.dtype(str))
    # Extract new id of node
    idx = np.array(idx_features[:, 0], dtype=np.float32)
    # Replace id with row number
    # row0: id1 initial_embedding1  -> 0 initial_embedding1
    # row1: id2 initial_embedding2  -> 1 initial_embedding2
    # row2: id3 initial_embedding3  -> 2 initial_embedding3
    idx_map = {j: i for i, j in enumerate(idx)} 
    # Construct initial embedding matrix
    # Extract initial embedding starts from the third column
    embedding_matrix = sp.csr_matrix(idx_features[:, 2:], dtype=np.float32)
    embedding_matrix = embedding_matrix.toarray()

    """ 
    construct adjacency matrix only related concepts
    """
    # Read normal relationships of nodes from relation.text
    relation1 = np.genfromtxt("relation.txt", dtype=np.float32)        
    adj_row = np.array(list(map(idx_map.get, relation1[:, 0].flatten())))
    adj_column = np.array(list(map(idx_map.get, relation1[:, 2].flatten())))

    #coo_matrix((data, (row, col)), shape=(m, n))
    #relation1[:, 1] the value
    adj_matrix = sp.coo_matrix(
    (relation1[:, 1], (adj_row[:], adj_column[:])),
    shape=( embedding_matrix.shape[0],  embedding_matrix.shape[0]),
    dtype=np.float32,
    )

    adj_matrix = np.around(adj_matrix, 2)  
    adj_matrix = adj_matrix + adj_matrix.T.multiply(adj_matrix.T > adj_matrix) - adj_matrix.multiply(adj_matrix.T > adj_matrix)
    adj_matrix= normalize(adj_matrix) + sp.eye(adj_matrix.shape[0])
    adj_matrix = adj_matrix.toarray()
    adj_matrix_inverse = adj_matrix.T

    """ 
    Construct prerequisite matrix
    """
    relation2 = np.genfromtxt("prerequisite.txt", dtype=np.float32)
    prerequisite_row = np.array(list(map(idx_map.get, relation2[:, 0].flatten())))
    prerequisite_column = np.array(list(map(idx_map.get, relation2[:, 2].flatten())))
    prerequisite_matrix = sp.coo_matrix(
    (relation2[:, 1], (prerequisite_row[:], prerequisite_column[:])),
    shape=( embedding_matrix.shape[0],  embedding_matrix.shape[0]),
    dtype=np.float32,
    )
    prerequisite_matrix = np.around(prerequisite_matrix, 2)
    prerequisite_matrix =prerequisite_matrix.toarray()
    prerequisite_matrix_inverse = prerequisite_matrix.T

    # id_map = {row[1]: int(row[0]) for row in idx_features}

    # prereq_converted = [
    # [id_map[row[0]], row[1], id_map[row[2]]] 
    # for row in relation2 
    # if row[0] in id_map and row[2] in id_map 
    # ]

    # with open("prerequisite.txt", "w") as f:
    #     for row in prereq_converted:
    #         absolute_path = os.path.abspath(f.name)
    #         print("absolute path of file:", absolute_path)
    #         f.write(str(row[0]) + " " + str(row[1]) 
    #                 + " " + str(row[2])+ "\n")

def test2():
    model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
    text1 = '/award/award_category/winners'
    text2 = '/award/award_category/winners'

    embedding1= model.encode(text1)
    embedding2= model.encode(text2)
    similarity1_2 = cosine_similarity([embedding1], [embedding2])[0][0]
    print("句子 1 和 句子 2 的相似度:", similarity1_2)


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


# current_dir = os.path.dirname(__file__)

# data_path = os.path.join(current_dir, 'modified_eva_data.txt')
# data = []

# # 解析三元组文件，每行是 "节点1 关系 节点2"
# # Parse the triples file, where each line is in the format: "node1 relation node2
# with open(data_path, 'r') as file:
#     for line in file:
#         parts = line.strip().split('\t')
#         if len(parts) == 3:
#             data.append((parts[0], parts[2]))
    

# # Map nodes to integer IDs
# all_nodes = set([item[0] for item in data] + [item[1] for item in data])
# node_map = {node: idx for idx, node in enumerate(all_nodes)}
# num_nodes = len(node_map)

# edges = [(node_map[pair[0]], node_map[pair[1]]) for pair in data]

# positive_samples, negative_samples = generate_pos_neg_samples(edges, num_nodes)
# print("++++++++++++++++++++++++++positive_samples++++++++++++++++++++++++++++++++++++++++++")
# print(len(positive_samples))

# # Generate node embeddings using the CompGCN model
# test = eva_compgcn()
# node_embeddings = test.compgcn_direction_weight('corr')

# # Calculate scores for positive and negative samples.

# positive_scores = [compute_similarity_score(node_embeddings, pair) for pair in positive_samples]
# print(positive_scores)
# negative_scores = [compute_similarity_score(node_embeddings, pair) for pair in negative_samples]
# print(negative_scores)
# # Calculate scores for positive and negative samples.
# # positive_scores = [
# #     transE_score(node_embeddings[head], relation_embedding[relation], node_embeddings[tail])
# #     for head, relation, tail in positive_samples
# # ]
# # negative_scores = [
# #     transE_score(node_embeddings[head], relation_embedding[relation], node_embeddings[tail])
# #     for head, relation, tail in negative_samples
# # ]

# # MR, MRR, Hit_10 = evaluate_link_prediction(positive_scores, negative_scores)
# # print(f'Mean Rank (MR): {MR}')
# # print(f'Mean Reciprocal Rank (MRR): {MRR}')
# # print(f'Hit@10: {Hit_10}')