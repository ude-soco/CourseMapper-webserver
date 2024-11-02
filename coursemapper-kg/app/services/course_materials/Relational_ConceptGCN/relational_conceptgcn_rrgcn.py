from neo4j import GraphDatabase
import numpy as np
import scipy.sparse as sp
import os
from util import *


os.chdir("D:/study/Master_thesis/project/nave_dev/CourseMapper-webserver/coursemapper-kg")

class RRGCN:

    def __init__(self):

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

        """ 
          loadding data
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
        #the size of adj_matrix is (1274,1274)

        """ 
            Construct prerequisite matrix
        """
        self.prerequisite_matrix = glorot_seed((self.embedding_matrix.shape[0],  self.embedding_matrix.shape[0])).numpy()
        self.prerequisite_matrix = np.around(self.prerequisite_matrix, 2)

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


        # Construct Adjacency matrix
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

        #Construct prerequisite matrix
        self.prerequisite_matrix = glorot_seed((self.embedding_matrix.shape[0],  self.embedding_matrix.shape[0])).numpy()

        #the size of adj_matrix is (1274,1274)
        #print(self.adj_matrix.toarray().shape)
        self.adj_matrix = np.around(self.adj_matrix, 2)

    #第一种形态
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

        #self.load_data()
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
        adj_matrix= normalize(adj_matrix)+ sp.eye(adj_matrix.shape[0])
        adj_matrix = adj_matrix.toarray()

        """ 
            prerequsite_matrix
        """
        prerequsite_matrix = self.prerequisite_matrix
        prerequsite_matrix = np.around(prerequsite_matrix,2)
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

        final_embedding = rc_part_2 + pr_part_2

        return final_embedding
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

    # def self_loop_test(self):
    #     self.load_data()
    #     adj_matrix = self .adj_matrix.toarray()
    #     self_loop = sp.eye(adj_matrix.shape[0])
    #     self_loop = normalize(self_loop)
    #     self_loop = self_loop.toarray()

 
test_object = RRGCN()
embedding=test_object.rrgcn_1_1()
print("+++++++++++++++++++++++++original embedding++++++++++++++++++++++++++++++")
print(test_object.embedding_matrix.toarray())
print("+++++++++++++++++++++++++new embedding++++++++++++++++++++++++++++++")
print(embedding)
#test_object.self_loop_test()

