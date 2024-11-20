from neo4j import GraphDatabase
import numpy as np
import scipy.sparse as sp
import os
from .util import *
from config import Config

# os.chdir("D:/study/Master_thesis/project/nave_dev/CourseMapper-webserver/coursemapper-kg")
import logging
from log import LOG

logger = LOG(name=__name__, level=logging.DEBUG)

class relational_conceptgcn_compgcn:
    def __init__(self):
        neo4j_uri = Config.NEO4J_URI
        neo4j_user = Config.NEO4J_USER
        neo4j_pass = Config.NEO4J_PASSWORD
        # neo4j_uri = 'bolt://localhost:7687'
        # neo4j_user = 'neo4j'
        # neo4j_pass = '1234qwer!'
    
        self.driver = GraphDatabase.driver(neo4j_uri,
                                           auth=(neo4j_user, neo4j_pass),
                                           encrypted=False)
        # initialize global variant
        self.embedding_matrix = None
        self.adj_matrix = None
        self.prerequisite_matrix = None
        self.adj_matrix_inverse = None
        self.prerequisite_matrix_inverse = None
        self.idx_features = None
        """ 
          construct embedding matrix
        """

        # Read ids and initial embeddings of nodes from idfeature.text
        # The structure of text: first column is new id of node(type:int), the second column is the original id (type:string), and the rest is the initial embedding
        idx_features = np.genfromtxt("idfeature.txt", dtype=np.dtype(str))
        self.idx_features = idx_features
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
        self.embedding_matrix = self.embedding_matrix.toarray()

        """ 
            construct adjacency matrix only related concepts
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
        self.adj_matrix= normalize(self.adj_matrix) + sp.eye(self.adj_matrix.shape[0])
        self.adj_matrix = self.adj_matrix.toarray()
        self.adj_matrix_inverse = self.adj_matrix.T
    
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
        # 避免除以零，处理孤立节点
        neighbor_counts[neighbor_counts == 0] = 1
        # 归一化邻接矩阵
        normalized_adj_matrix = self.prerequisite_matrix / neighbor_counts[:, None]
        self.prerequisite_matrix = normalized_adj_matrix
        self.prerequisite_matrix_inverse = self.prerequisite_matrix.T

        """ 
            generate relationships weight for every type of relationships
        """
        #the size of weight_matrix is the size of embedding (768,768)
        weight_size = self.embedding_matrix.shape[1]
        self.weight_matrix_input_layer_1 = glorot_seed((weight_size,weight_size)).numpy()
        self.weight_matrix_output_layer_1 = glorot_seed((weight_size,weight_size)).numpy()
        self.weight_matrix_selfloop_layer_1 = glorot_seed((weight_size,weight_size)).numpy()

        self.weight_matrix_input_layer_2 = glorot_seed((weight_size,weight_size)).numpy()
        self.weight_matrix_output_layer_2 = glorot_seed((weight_size,weight_size)).numpy()
        self.weight_matrix_selfloop_layer_2 = glorot_seed((weight_size,weight_size)).numpy()

        self.weight_relation_initialize = glorot_seed((1,weight_size)).numpy()
        self.weight_relation_layer_1 = glorot_seed((weight_size,weight_size)).numpy()
        self.weight_relation_layer_2 = glorot_seed((weight_size,weight_size)).numpy()                               

    def compgcn_direction_weight (self, rel_transform_mode = 'sub'):
        """ 
            initialize variable with direction weight slide 12
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
        logger.info("Hong_compgcn_model start")
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
        final_embeddings = embedding_matrix
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
        logger.info("Hong_compgcn_model END")
    
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

