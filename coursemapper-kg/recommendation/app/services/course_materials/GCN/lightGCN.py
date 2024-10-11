# from turtle import end_fill
from neo4j import GraphDatabase
import numpy as np
import scipy.sparse as sp

from config import Config

# import torch
import os
import logging
from log import LOG

logger = LOG(name=__name__, level=logging.DEBUG)


class LightGCN:
    def __init__(self):
        neo4j_uri = Config.NEO4J_URI
        neo4j_user = Config.NEO4J_USER
        neo4j_pass = Config.NEO4J_PASSWORD
        
        self.driver = GraphDatabase.driver(neo4j_uri,
                                           auth=(neo4j_user, neo4j_pass),
                                           encrypted=False)
        # NEO4J_URI = os.environ.get("NEO4J_URI")
        # NEO4J_URI = "bolt://localhost:7687"
        # NEO4J_USER = os.environ.get("NEO4J_USER")
        # NEO4J_USER = "neo4j"
        # NEO4J_PASSWORD = os.environ.get("NEO4J_PW")
        # NEO4J_PASSWORD = "root"

    def load_data(self, variant=False):
        logger.info("start")
        idx_features = np.genfromtxt("idfeature.txt", dtype=np.dtype(str))
        logger.info(idx_features.shape[0])
        # Construct initial embedding matrix
        features = sp.csr_matrix(idx_features[:, 2:], dtype=np.float32)
        # logger.info(features.A)

        # Construct Adjacency matrix
        edges1 = np.genfromtxt("relation.txt", dtype=np.float32)
        idx = np.array(idx_features[:, 0], dtype=np.float32)
        idx_map = {j: i for i, j in enumerate(idx)}

        edges_row = np.array(list(map(idx_map.get, edges1[:, 0].flatten())))
        edges_column = np.array(list(map(idx_map.get, edges1[:, 2].flatten())))
        adj = sp.coo_matrix(
            (np.ones(edges1.shape[0]), (edges_row[:], edges_column[:])),
            shape=(features.shape[0], features.shape[0]),
            dtype=np.float32,
        )

        adj = adj + adj.T.multiply(adj.T > adj) - adj.multiply(adj.T > adj)
        adj = self.normalize(adj)
        # logger.info(adj.A)
        # GCN Multiply Adjacency matrix and initial embedding matrix
        if variant:
            output_1 = np.dot(adj, features)
            output_2 = np.dot(adj, output_1)
            final_embeddings = output_2.A
            logger.info(final_embeddings)
        else:
            output_1 = np.dot(adj, features)
            output_2 = np.dot(adj, output_1)
            # Weight: weight is 1/(K+1),K is the number of layers
            output_1_weight = np.dot(output_1, 1 / (1 + 1))
            output_2_weight = np.dot(output_2, 1 / (2 + 1))
            final_embeddings = (output_1_weight + output_2_weight).A
            logger.info(final_embeddings)

        # Extract original ids of nodes
        idx = np.array(idx_features[:, 1], dtype=np.dtype(str))
        for i in range(final_embeddings.shape[0]):
            id = idx[i]
            f_embedding = final_embeddings[i]
            embedding = ",".join(str(i) for i in f_embedding)
            # Find a node in neo4j by its original id and save its final embedding into its "final_embedding" property
            with self.driver.session() as session:
                session.run("""MATCH (n) WHERE n.cid= $id or n.sid= $id
                        set n.final_embedding = $embedding""",
                    id=id,
                    embedding=embedding)
        logger.info("end")

    def normalize(self, adj_mat):
        rowsum = np.array(adj_mat.sum(1))
        d_inv = np.power(rowsum, -0.5).flatten()
        d_inv[np.isinf(d_inv)] = 0.0
        d_mat_inv = sp.diags(d_inv)
        norm_adj = d_mat_inv.dot(adj_mat)
        norm_adj = norm_adj.dot(d_mat_inv)
        return norm_adj
