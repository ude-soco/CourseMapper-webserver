from neo4j import GraphDatabase
import numpy as np
import scipy.sparse as sp
import os
from util import *

os.chdir("D:/study/Master_thesis/project/nave_dev/CourseMapper-webserver/coursemapper-kg")
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


def eva_data_process():
