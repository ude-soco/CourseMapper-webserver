from neo4j import GraphDatabase
import numpy as np
import scipy.sparse as sp
import os
from .util import *
from config import Config
import logging
from log import LOG

logger = LOG(name=__name__, level=logging.DEBUG)

class RRGCN:

    def __init__(self):
        neo4j_uri = Config.NEO4J_URI
        neo4j_user = Config.NEO4J_USER
        neo4j_pass = Config.NEO4J_PASSWORD    
        self.driver = GraphDatabase.driver(neo4j_uri,
                                           auth=(neo4j_user, neo4j_pass),
                                           encrypted=False)

        # initialize global variant
        self.embedding_matrix = None
        self.adj_matrix = None
        self.prerequisite_matrix = None
        
        self.weight_matrix_rc_1 = None
        self.weight_matrix_pr_1 = None
        self.weight_matrix_self_1 = None
        self.weight_matrix_rc_2 = None
        self.weight_matrix_pr_2 = None
        self.weight_matrix_self_2 = None
        self.idx_features=None
        """ 
          loadding data
        """

        # Read ids and initial embeddings of nodes from idfeature.text
        # The structure of text: first column is new id of node(type:int), the second column is the original id (type:string), and the rest is the initial embedding
        idx_features = np.genfromtxt("idfeature.txt", dtype=np.dtype(str))
        self.idx_features=idx_features
        # Extract new id of node
        idx = np.array(idx_features[:, 0], dtype=np.float32)
        # Replace id with row number
        # row0: id1 initial_embedding1  -> 0 initial_embedding1
        # row1: id2 initial_embedding2  -> 1 initial_embedding2
        # row2: id3 initial_embedding3  -> 2 initial_embedding3
        idx_map = {j: i for i, j in enumerate(idx)} 

        # Construct initial embedding matrix
        # Extract initial embedding starts from the third column
        self.embedding_matrix = sp.csr_matrix(idx_features[:, 2:], dtype=np.float32)


        """ 
            Construct Adjacency matrix
        """

        # Read normal relationships of nodes from relation.text
        relation1 = np.genfromtxt("relation.txt", dtype=np.float32)        
        adj_row = np.array(list(map(idx_map.get, relation1[:, 0].flatten())))
        adj_column = np.array(list(map(idx_map.get, relation1[:, 2].flatten())))

        #coo_matrix((data, (row, col)), shape=(m, n))
        #relation1[:, 1] the value
        self.adj_matrix = sp.coo_matrix(
            (relation1[:, 1], (adj_row[:], adj_column[:])),
            shape=( self.embedding_matrix.shape[0],  self.embedding_matrix.shape[0]),
            dtype=np.float32,
        )
        self.adj_matrix = np.around(self.adj_matrix, 2)        
        self.adj_matrix = self.adj_matrix + self.adj_matrix.T.multiply(self.adj_matrix.T > self.adj_matrix) - self.adj_matrix.multiply(self.adj_matrix.T > self.adj_matrix)
        self.adj_matrix= normalize(self.adj_matrix)
        self.adj_matrix = self.adj_matrix.toarray()


        """ 
            Construct prerequisite matrix
        """
        relation2 = np.genfromtxt("prerequisite.txt", dtype=np.float32)
        if relation2.size == 0:
            logger.info("prerequisite.txt is empty")
            self.prerequisite_matrix = sp.coo_matrix(
                (self.embedding_matrix.shape[0], self.embedding_matrix.shape[0]),
                dtype=np.float32
            )
        else:
            prerequisite_row = np.array(list(map(idx_map.get, relation2[:, 0].flatten())))
            prerequisite_column = np.array(list(map(idx_map.get, relation2[:, 2].flatten())))
            self.prerequisite_matrix = sp.coo_matrix(
                (relation2[:, 1], (prerequisite_row[:], prerequisite_column[:])),
                shape=( self.embedding_matrix.shape[0],  self.embedding_matrix.shape[0]),
                dtype=np.float32,
            )
        self.prerequisite_matrix =self.prerequisite_matrix.toarray()
        self.prerequisite_matrix = np.around(self.prerequisite_matrix, 2)
        neighbor_counts =np.sum(self.prerequisite_matrix != 0, axis=1) 
        # Avoid dividing by zero and deal with isolated nodes
        neighbor_counts[neighbor_counts == 0] = 1
        # Normalized adjacency matrix
        normalized_adj_matrix = self.prerequisite_matrix / neighbor_counts[:, None]
        self.prerequisite_matrix = normalized_adj_matrix

        """ 
            generate relationships weight for every type of relationships
        """
        #the size of weight_matrix is the size of embedding (768,768)
        weight_size = self.embedding_matrix.shape[1]
        self.weight_matrix_rc_1 = glorot_seed((weight_size,weight_size)).numpy()
        self.weight_matrix_pr_1 = glorot_seed((weight_size,weight_size)).numpy()
        self.weight_matrix_self_1 = glorot_seed((weight_size,weight_size)).numpy()

        self.weight_matrix_rc_2 = glorot_seed((weight_size,weight_size)).numpy()
        self.weight_matrix_pr_2 = glorot_seed((weight_size,weight_size)).numpy()
        self.weight_matrix_self_2 = glorot_seed((weight_size,weight_size)).numpy()


    #embedding matri, adj_matrix and prerequisite_matrix
    def load_data(self):

        print(os.getcwd())  # print current work path

        # Read ids and initial embeddings of nodes from idfeature.text
        # The structure of text: first column is new id of node(type:int), the second column is the original id (type:string), and the rest is the initial embedding
        idx_features = np.genfromtxt("idfeature.txt", dtype=np.dtype(str))
        #print(idx_features[:3, :5])
        # Extract new id of node
        idx = np.array(idx_features[:, 0], dtype=np.float32)

        # Replace id with row number
        # row0: id1 initial_embedding1  -> 0 initial_embedding1
        # row1: id2 initial_embedding2  -> 1 initial_embedding2
        # row2: id3 initial_embedding3  -> 2 initial_embedding3
        idx_map = {j: i for i, j in enumerate(idx)}      
        
        # Construct initial embedding matrix
        # Extract initial embedding starts from the third column
        self.embedding_matrix = sp.csr_matrix(idx_features[:, 2:], dtype=np.float32)
        #the size of embedding_matrix is (1274,768)
        #print(embedding_matrix.toarray().shape)


        """
            Construct adjacency matrix
        """
        # Read normal relationships of nodes from relation.text
        relation1 = np.genfromtxt("relation.txt", dtype=np.float32)
        #print("normal relationships")
        #print(relation1)    
        adj_row = np.array(list(map(idx_map.get, relation1[:, 0].flatten())))
        adj_column = np.array(list(map(idx_map.get, relation1[:, 2].flatten())))
        #coo_matrix((data, (row, col)), shape=(m, n))
        #relation1[:, 1] the value
        self.adj_matrix = sp.coo_matrix(
            (relation1[:, 1], (adj_row[:], adj_column[:])),
            shape=( self.embedding_matrix.shape[0],  self.embedding_matrix.shape[0]),
            dtype=np.float32,
        )

        """
            Construct prerequisite matrix
        """
        #Construct prerequisite matrix
        relation2 = np.genfromtxt("prerequisite.txt", dtype=np.float32)
        prerequisite_row = np.array(list(map(idx_map.get, relation2[:, 0].flatten())))
        prerequisite_column = np.array(list(map(idx_map.get, relation2[:, 2].flatten())))
        self.prerequisite_matrix = sp.coo_matrix(
        (relation2[:, 1], (prerequisite_row[:], prerequisite_column[:])),
        shape=( self.embedding_matrix.shape[0],  self.embedding_matrix.shape[0]),
        dtype=np.float32,
        )
        self.prerequisite_matrix = np.around(self.prerequisite_matrix, 2)
        self.prerequisite_matrix =self.prerequisite_matrix.toarray()
        self.prerequisite_matrix_inverse = self.prerequisite_matrix.T

        #the size of adj_matrix is (1274,1274)
        #print(self.adj_matrix.toarray().shape)
        self.adj_matrix = np.around(self.adj_matrix, 2)

    # rrgcn_A_B, A=1 means with self loop, A=2 means without self loop; B=1
    def rrgcn_1_1(self):

        #self.load_data()
        """ 
            embedding_matrix
        """
        embedding_matrix = self.embedding_matrix.toarray()
        
        """ 
            adj_matrix
        """
        adj_matrix = self.adj_matrix


        weight_matrix_rc_1 = self.weight_matrix_rc_1
        weight_matrix_pr_1 = self.weight_matrix_pr_1
        weight_matrix_self_1 = self.weight_matrix_self_1

        """ 
            prerequsite_matrix
        """
        prerequsite_matrix = self.prerequisite_matrix

        """  
            the first layer
        """
        #RC Part
        rc_part_1=np.dot(adj_matrix,embedding_matrix)
        rc_part = np.dot(rc_part_1,weight_matrix_rc_1)

        #PR Part
        pr_part_1 = np.dot(prerequsite_matrix,embedding_matrix)
        pr_part = np.dot(pr_part_1,weight_matrix_pr_1)

        #self loop
        self_loop_adj= sp.eye(adj_matrix.shape[0])
        self_loop_adj = normalize(self_loop_adj)
        self_loop_adj = self_loop_adj.toarray()

        #because the pre_self_loop is zero so that ignore it
        self_loop_part1 = np.dot(self_loop_adj,embedding_matrix)
        self_loop_part = np.dot(self_loop_part1,weight_matrix_self_1)
    

        #new final embedding
        embedding_first_layer = self_loop_part + rc_part + pr_part

        """ 
         the second layer
        """

        weight_matrix_rc_second_layer = self.weight_matrix_rc_2
        weight_matrix_pr_second_layer = self.weight_matrix_pr_2
        weight_matrix_self_second_layer = self.weight_matrix_self_2

        #RC Part at second layer
        rc_part_second_layer=np.dot(adj_matrix,embedding_first_layer)
        rc_part_second_layer=np.dot(rc_part_second_layer,weight_matrix_rc_second_layer)

        #PR Part
        pr_part_second_layer = np.dot(prerequsite_matrix,embedding_first_layer)
        pr_part_second_layer = np.dot(pr_part_second_layer,weight_matrix_pr_second_layer)     

        #because the pre_self_loop is zero so that ignore it
        self_loop_part_second_layer = np.dot(self_loop_adj,embedding_first_layer)
        self_loop_part_second_layer = np.dot(self_loop_part_second_layer,weight_matrix_self_second_layer)

        new_final_embedding = self_loop_part_second_layer + rc_part_second_layer + pr_part_second_layer

        return new_final_embedding
    #self_loop + adj or pre matrix
    def rrgcn_1_2(self):
        logger.info("Hong_rrgcn_model START")
        """ 
            embedding_matrix
        """
        embedding_matrix = self.embedding_matrix.toarray()
        
        """ 
            adj_matrix
        """
        adj_matrix = self.adj_matrix
        # adj_matrix = np.around(adj_matrix, 2)
        # adj_matrix = adj_matrix + adj_matrix.T.multiply(adj_matrix.T > adj_matrix) - adj_matrix.multiply(adj_matrix.T > adj_matrix)
        # adj_matrix= normalize(adj_matrix)+ sp.eye(adj_matrix.shape[0])
        # adj_matrix = adj_matrix.toarray()

        """ 
            prerequsite_matrix
        """
        prerequsite_matrix = self.prerequisite_matrix
        # prerequsite_matrix = np.around(prerequsite_matrix,2)
        """  
            the first layer
        """
        #RC Part
        rc_part_1 = np.dot(adj_matrix,embedding_matrix)

        #PR Part
        pr_part_1 = np.dot(prerequsite_matrix,embedding_matrix)

        #new final embedding
        embedding_of_firstLayer = rc_part_1 + pr_part_1

        """  
            the second layer
        """
        #RC Part
        rc_part_2 = np.dot(adj_matrix,embedding_of_firstLayer)
        pr_part_2 = np.dot(prerequsite_matrix,embedding_of_firstLayer)

        final_embeddings = rc_part_2 + pr_part_2
        # Extract original ids of nodes
        idx_features = self.idx_features
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
        logger.info("Hong_rrgcn_model END")
    
    def rrgcn_1_3(self):
        """ 
            embedding_matrix
        """
        embedding_matrix = self.embedding_matrix.toarray()
        

        weight_matrix_rc_1 = self.weight_matrix_rc_1
        weight_matrix_pr_1 = self.weight_matrix_pr_1
        weight_matrix_self_1 = self.weight_matrix_self_1

        weight_matrix_rc_2 = self.weight_matrix_rc_2
        weight_matrix_pr_2 = self.weight_matrix_pr_2
        weight_matrix_self_2 = self.weight_matrix_self_2

        """  
            the first layer
        """
        #RC Part
        self_loop_1 = np.dot(embedding_matrix,weight_matrix_self_1)
        rc_part_1 = np.dot(embedding_matrix,weight_matrix_rc_1)
        pr_part_1 = np.dot(embedding_matrix,weight_matrix_pr_1)

        embedding_of_firstLayer = self_loop_1 + rc_part_1 + pr_part_1

        """  
            the second layer
        """                     
        self_loop_2 = np.dot(embedding_of_firstLayer,weight_matrix_self_2)
        rc_part_2 = np.dot(embedding_of_firstLayer,weight_matrix_rc_2)
        pr_part_2 = np.dot(embedding_of_firstLayer,weight_matrix_pr_2)


        final_embedding = self_loop_2 + rc_part_2 + pr_part_2

        return final_embedding
    def rrgcn_2_1(self):
        """ 
            embedding_matrix
        """
        embedding_matrix = self.embedding_matrix.toarray()
        
        """ 
            adj_matrix
        """
        adj_matrix = self.adj_matrix
        adj_matrix = np.around(adj_matrix, 2)        
        adj_matrix = adj_matrix + adj_matrix.T.multiply(adj_matrix.T > adj_matrix) - adj_matrix.multiply(adj_matrix.T > adj_matrix)
        adj_matrix= normalize(adj_matrix)
        adj_matrix = adj_matrix.toarray()

        weight_matrix_rc_1 = self.weight_matrix_rc_1
        weight_matrix_pr_1 = self.weight_matrix_pr_1

        """ 
            prerequsite_matrix
        """
        prerequsite_matrix = self.prerequisite_matrix
        prerequsite_matrix = np.around(prerequsite_matrix,2)        

        
        """  
            the first layer
        """
        #RC Part
        rc_part_1=np.dot(adj_matrix,embedding_matrix)
        rc_part = np.dot(rc_part_1,weight_matrix_rc_1)

        #PR Part
        pr_part_1 = np.dot(prerequsite_matrix,embedding_matrix)
        pr_part = np.dot(pr_part_1,weight_matrix_pr_1)

        embedding_of_firstLayer = rc_part + pr_part      

        """  
            the second layer
        """       
        #RC Part
        rc_part_2=np.dot(adj_matrix,embedding_of_firstLayer)
        rc_part_second = np.dot(rc_part_2,weight_matrix_rc_1)

        #PR Part
        pr_part_2 = np.dot(prerequsite_matrix,embedding_of_firstLayer)
        pr_part_second = np.dot(pr_part_2,weight_matrix_pr_1)

        final_embedding = rc_part_second + pr_part_second
        return final_embedding
    def rrgcn_2_2(self):
        """ 
            embedding_matrix
        """
        embedding_matrix = self.embedding_matrix.toarray()
        
        """ 
            adj_matrix
        """
        adj_matrix = self.adj_matrix
        adj_matrix = np.around(adj_matrix, 2)        
        adj_matrix = adj_matrix + adj_matrix.T.multiply(adj_matrix.T > adj_matrix) - adj_matrix.multiply(adj_matrix.T > adj_matrix)
        adj_matrix= normalize(adj_matrix)
        adj_matrix = adj_matrix.toarray()

        """ 
            prerequsite_matrix
        """
        prerequsite_matrix = self.prerequisite_matrix
        prerequsite_matrix = np.around(prerequsite_matrix,2)

        #RC Part
        rc_part_1 = np.dot(adj_matrix,embedding_matrix)

        #PR Part
        pr_part_1 = np.dot(prerequsite_matrix,embedding_matrix)

        #new final embedding
        embedding_of_firstLayer = rc_part_1 + pr_part_1

        """  
            the second layer
        """
        #RC Part
        rc_part_2 = np.dot(adj_matrix,embedding_of_firstLayer)
        pr_part_2 = np.dot(prerequsite_matrix,embedding_of_firstLayer)

        final_embedding = rc_part_2 + pr_part_2

        return final_embedding
    def rrgcn_2_3(self):
        """ 
            embedding_matrix
        """
        embedding_matrix = self.embedding_matrix.toarray()
        

        weight_matrix_rc_1 = self.weight_matrix_rc_1
        weight_matrix_pr_1 = self.weight_matrix_pr_1


        weight_matrix_rc_2 = self.weight_matrix_rc_2
        weight_matrix_pr_2 = self.weight_matrix_pr_2


        """  
            the first layer
        """
        #RC Part
        rc_part_1 = np.dot(embedding_matrix,weight_matrix_rc_1)
        pr_part_1 = np.dot(embedding_matrix,weight_matrix_pr_1)

        embedding_of_firstLayer =  rc_part_1 + pr_part_1

        """  
            the second layer
        """                     
        rc_part_2 = np.dot(embedding_of_firstLayer,weight_matrix_rc_2)
        pr_part_2 = np.dot(embedding_of_firstLayer,weight_matrix_pr_2)


        final_embedding =  rc_part_2 + pr_part_2
        logger.info("end")

        return final_embedding        

 