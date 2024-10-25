from neo4j import GraphDatabase
import numpy as np
import scipy.sparse as sp
import logging
from log import LOG
from config import Config

logger = LOG(name=__name__, level=logging.DEBUG)

class RRGCN:
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
    
    def load_data(self):
        logger.info("start")
        # Read ids and initial embeddings of nodes from idfeature.text
        # The structure of text: first column is new id of node(type:int), the second column is the original id (type:string), and the rest is the initial embedding
        idx_features = np.genfromtxt("idfeature.txt", dtype=np.dtype(str))
        logger.info(idx_features.shape[0])

    