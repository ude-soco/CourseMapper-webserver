# from turtle import end_fill
from neo4j import GraphDatabase
import numpy as np
import scipy.sparse as sp
from flask import current_app


# import torch
import os
import logging
from log import LOG

logger = LOG(name=__name__, level=logging.DEBUG)


class GCN:
    def __init__(self):
        neo4j_uri = current_app.config.get("NEO4J_URI")  # type: ignore
        neo4j_user = current_app.config.get("NEO4J_USER")  # type: ignore
        neo4j_pass = current_app.config.get("NEO4J_PASSWORD")  # type: ignore

        self.driver = GraphDatabase.driver(neo4j_uri,
                                           auth=(neo4j_user, neo4j_pass),
                                           encrypted=False)
        # NEO4J_URI = os.environ.get("NEO4J_URI")
        # NEO4J_URI = "bolt://localhost:7687"
        # NEO4J_USER = os.environ.get("NEO4J_USER")
        # NEO4J_USER = "neo4j"
        # NEO4J_PASSWORD = os.environ.get("NEO4J_PW")
        # NEO4J_PASSWORD = "root"

    def load_data(self):
        logger.info("start")
        # Read ids and initial embeddings of nodes from idfeature.text
        # The structure of text: first column is new id of node(type:int), the second column is the original id (type:string), and the rest is the initial embedding
        idx_features = np.genfromtxt("idfeature.txt", dtype=np.dtype(str))
        logger.info(idx_features.shape[0])
        # Construct initial embedding matrix
        # Extract initial embedding starts from the third column
        features = sp.csr_matrix(idx_features[:, 2:], dtype=np.float32)
        logger.info(features.A)

        # Construct Adjacency matrix

        # Read relationships of nodes from relation.text
        edges1 = np.genfromtxt("relation.txt", dtype=np.float32)
        # Extract new id of node
        idx = np.array(idx_features[:, 0], dtype=np.float32)
        # Replace id with row number
        # row0: id1 initial_embedding1  -> 0 initial_embedding1
        # row1: id2 initial_embedding2  -> 1 initial_embedding2
        # row2: id3 initial_embedding3  -> 2 initial_embedding3
        idx_map = {j: i for i, j in enumerate(idx)}

        # Replace data in edge1 with row numer for id and weight for weight.
        # id1 0.8 id2 -> 0 0.8 1
        # id2 0.7 id3 -> 1 0.7 2
        # id4 0.6 id5 -> 3 0.6 4
        edges_row = np.array(list(map(idx_map.get, edges1[:, 0].flatten())))
        edges_column = np.array(list(map(idx_map.get, edges1[:, 2].flatten())))
        # edges_row means number of row, edges_column means number of column, edges1[:,1] means value.
        # 0 0.8 1 means the value in the first column of row zero is 0.8. i.e. the relationship weight of id1 and id2 is 0.8
        adj = sp.coo_matrix(
            (edges1[:, 1], (edges_row[:], edges_column[:])),
            shape=(features.shape[0], features.shape[0]),
            dtype=np.float32,
        )
        adj = np.around(adj, 2)
        # matrix plus its unit matrix and transpose matrix to obtain the complete adjacency matrix
        adj = adj + adj.T.multiply(adj.T > adj) - adj.multiply(adj.T > adj)

        adj = self.normalize(adj) + sp.eye(adj.shape[0])
        logger.info(adj.A)
        # GCN Multiply Adjacency matrix and initial embedding matrix
        # mutiply Adjacency matrix and initial embedding matrix, output is new embedding matrix
        # The new embedding of a node is obtained by aggregating the embeddings of its first hop neighbours
        output = np.dot(adj, features)
        # mutiply Adjacency matrix and new embedding matrix, output is final embedding matrix
        # The final embedding of a node is obtained by aggregating the embeddings of its first and second hop neighbours
        output = np.dot(adj, output)
        final_embeddings = output.A
        logger.info(final_embeddings)

        # Extract original ids of nodes
        idx = np.array(idx_features[:, 1], dtype=np.dtype(str))
        with self.driver.session() as session:
            for i in range(final_embeddings.shape[0]):
                id = idx[i]
                f_embedding = final_embeddings[i]
                embedding = ",".join(str(i) for i in f_embedding)
                # Find a node in neo4j by its original id and save its final embedding into its "final_embedding" property
                result = session.run("""MATCH (n) WHERE n.cid= $id or n.sid= $id
                        set n.final_embedding = $embedding RETURN n""",
                    id=id,
                    embedding=embedding)
        logger.info("end")

        # features = normalize(features)
        # adj = normalize(adj + sp.eye(adj.shape[0]))

        # features = torch.FloatTensor(np.array(features.todense()))
        # adj = self.sparse_mx_to_torch_sparse_tensor(adj)

        # output = torch.spmm(adj, features)
        # output = torch.spmm(adj, output)

        # final_embeddings = output.tolist()
        # with open("final.txt","w") as f:
        #     for final_embedding in final_embeddings:
        #         f.write(str(final_embedding) + "\n")
        # self.db.concept_final_embedding(output,idx)
        # logger.info("finish final embedding")

    # def normalize(self,mx):
    #     """Row-normalize sparse matrix"""
    #     rowsum = np.array(mx.sum(1))
    #     r_inv = np.power(rowsum, -1).flatten()
    #     r_inv[np.isinf(r_inv)] = 0.
    #     r_mat_inv = sp.diags(r_inv)
    #     mx = r_mat_inv.dot(mx)
    #     return mx

    def normalize(self, mx):
        rowsum = np.array(mx.sum(1))
        d_inv = np.power(rowsum, -0.5).flatten()
        d_inv[np.isinf(d_inv)] = 0.0
        d_mat_inv = sp.diags(d_inv)
        norm_adj = d_mat_inv.dot(mx)
        norm_adj = norm_adj.dot(d_mat_inv)
        return norm_adj

    # def sparse_mx_to_torch_sparse_tensor(self,sparse_mx):
    #     """Convert a scipy sparse matrix to a torch sparse tensor."""
    #     sparse_mx = sparse_mx.tocoo().astype(np.float32)
    #     indices = torch.from_numpy(
    #         np.vstack((sparse_mx.row, sparse_mx.col)).astype(np.int64))
    #     values = torch.from_numpy(sparse_mx.data)
    #     shape = torch.Size(sparse_mx.shape)
    #     return torch.sparse.FloatTensor(indices, values, shape)
