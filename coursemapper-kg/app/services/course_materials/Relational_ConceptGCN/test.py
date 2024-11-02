import numpy as np
# def compgcn_direction_weight_sub (self):
#     """ 
#         initialize variable
#     """        
#     final_embedding = None
#     adj_matrix = self.adj_matrix
#     prerequisite_matrix = self.prerequisite_matrix
#     weight_relation_initialize = self.weight_relation_initialize
#     weight_relation_layer_1 = self.weight_relation_layer_1
#     prerequisite_matrix_inverse = self.prerequisite_matrix_inverse
#     adj_matrix_inverse = self.adj_matrix_inverse
#     embedding_matrix = self.embedding_matrix

#     weight_matrix_input_layer_1=self.weight_matrix_input_layer_1
#     weight_matrix_output_layer_1=self.weight_matrix_output_layer_1
#     weight_matrix_selfloop_layer_1=self.weight_matrix_selfloop_layer_1

#     weight_matrix_input_layer_2=self.weight_matrix_input_layer_2
#     weight_matrix_output_layer_2=self.weight_matrix_output_layer_2
#     weight_matrix_selfloop_layer_2=self.weight_matrix_selfloop_layer_2

#     """ 
#         Step 1: initialize the representation of each edges
#     """
#     # Construct relation embedding dict to store the embedding of each edges
#     relation_embedding_matrix_adj = {}
#     relation_embedding_matrix_prerequisite = {}

#     # Iterate over the adjacency matrix and compute the embedding for each edge in rc relationtype
#     for i in range(adj_matrix.shape[0]):
#         for j in range(adj_matrix.shape[1]):
#             weight = adj_matrix[i,j]
#             if weight != 0:
#                 relation_embedding_matrix_adj[(i,j)]= np.dot(weight,weight_relation_initialize)
    
#     # Iterate over the prerequisite matrix and compute the embedding for each edge in prerequisite relationtype
#     for i in range(prerequisite_matrix.shape[0]):
#         for j in range(prerequisite_matrix.shape[1]):
#             weight = prerequisite_matrix[i,j]
#             if weight != 0:
#                 relation_embedding_matrix_prerequisite[(i,j)] = np.dot(weight,weight_relation_initialize)        
    
#     """ 
#         Step 2: update the embedding of all nodes at the 1st. layer
#     """
#     #Iterate each row of embedding matrix
#     for v in range(embedding_matrix.shape[0]):
#         new_embedding_v = np.zeros((1, embedding_matrix.shape[1]))
#         #Iterate each column of embedding matrix
#         for u in range(embedding_matrix.shape[0]):
#             #initialize variable
#             adj_out = None # out direction of adj
#             adj_in = None # In direction of adj
#             pre_out = None # out direction of pre
#             pre_in = None # In direction of pre
#             self_loop = None # self loop direction

#             # get the embedding of node v
#             embedding_v = embedding_matrix [v]

#             # if there is a adj edge between node v and it's neighbor and this edge is in OUT direction
#             if v!=u and adj_matrix[v,u] != 0 :
#                 relation_embedding = relation_embedding_matrix_adj[(v,u)]
#                 adj_out = self.rel_transform(embedding_v,relation_embedding)

#             # if there is a adj edge between node v and it's neighbor and this edge is in IN direction
#             if v!=u and adj_matrix_inverse[v,u] != 0:
#                 relation_embedding = relation_embedding_matrix_adj[(u,v)]
#                 adj_in = self.rel_transform(embedding_v,relation_embedding)
            
#             # if there is a pre edge between node v and it's neighbor and this edge is in OUT direction
#             if v!=u and prerequisite_matrix[v,u] !=0:
#                 relation_embedding = relation_embedding_matrix_prerequisite[(v,u)]
#                 pre_out = self.rel_transform(embedding_v,relation_embedding)

#             # if there is a pre edge between node v and it's neighbor and this edge is in IN direction           
#             if v!=u and prerequisite_matrix_inverse[v,u]!=0:                
#                 relation_embedding = relation_embedding_matrix_prerequisite[(u,v)]
#                 pre_in = self.rel_transform(embedding_v,relation_embedding)
            
#             # if there is a self loop edge of node v      
#             if v==u:
#                 relation_embedding = relation_embedding_matrix_adj[(v,v)]
#                 self_loop = self.rel_transform(embedding_v,relation_embedding)


#             if adj_out is not None:
#                 new_embedding_v = new_embedding_v + np.dot(adj_out,weight_matrix_output_layer_1)
#             if adj_in is not None:
#                 new_embedding_v = new_embedding_v + np.dot(adj_in,weight_matrix_input_layer_1)
#             if pre_out is not None:
#                 new_embedding_v = new_embedding_v + np.dot(pre_out,weight_matrix_output_layer_1)
#             if pre_in is not None:
#                 new_embedding_v = new_embedding_v + np.dot(pre_in,weight_matrix_input_layer_1)
#             if self_loop is not None:
#                 new_embedding_v = new_embedding_v + np.dot(self_loop,weight_matrix_selfloop_layer_1)

#         embedding_matrix [v] = new_embedding_v           


#     """  
#         Step 3: update the representation of edges        
#     """
#     # update the embedding of adj edges
#     for edge in relation_embedding_matrix_adj:
#         relation_embedding_matrix_adj [edge] = np.dot(relation_embedding_matrix_adj[edge], weight_relation_layer_1)

#     # update the embedding of prerequisite edges      
#     for edge in relation_embedding_matrix_prerequisite:
#         relation_embedding_matrix_prerequisite [edge] = np.dot(relation_embedding_matrix_prerequisite[edge], weight_relation_layer_1)

#     """  
#         Step 4: update the representation of each nodes at layer 2      
#     """        
#     for v in range(embedding_matrix.shape[0]):
#         new_embedding_v = np.zeros((1, embedding_matrix.shape[1]))
#         for u in range(embedding_matrix.shape[0]):
#             adj_out = None
#             adj_in = None
#             pre_out = None
#             pre_in = None
#             self_loop = None
#             embedding_v = embedding_matrix [v]

#             if v!=u and adj_matrix[v,u] != 0 :
#                 relation_embedding = relation_embedding_matrix_adj[(v,u)]
#                 adj_out = self.rel_transform(embedding_v,relation_embedding)
#             if v!=u and adj_matrix_inverse[v,u] != 0:
#                 relation_embedding = relation_embedding_matrix_adj[(u,v)]
#                 adj_in = self.rel_transform(embedding_v,relation_embedding)
#             if v!=u and prerequisite_matrix[v,u] !=0:
#                 relation_embedding = relation_embedding_matrix_prerequisite[(v,u)]
#                 pre_out = self.rel_transform(embedding_v,relation_embedding)     
#             if v!=u and prerequisite_matrix_inverse[v,u]!=0:                
#                 relation_embedding = relation_embedding_matrix_prerequisite[(u,v)]
#                 pre_in = self.rel_transform(embedding_v,relation_embedding)
#             if v==u:
#                 relation_embedding = relation_embedding_matrix_adj[(v,v)]
#                 self_loop = self.rel_transform(embedding_v,relation_embedding)

#             if adj_out is not None:
#                 new_embedding_v = new_embedding_v + np.dot(adj_out,weight_matrix_output_layer_2)
#             if adj_in is not None:
#                 new_embedding_v = new_embedding_v + np.dot(adj_in,weight_matrix_input_layer_2)
#             if pre_out is not None:
#                 new_embedding_v = new_embedding_v + np.dot(pre_out,weight_matrix_output_layer_2)
#             if pre_in is not None:
#                 new_embedding_v = new_embedding_v + np.dot(pre_in,weight_matrix_input_layer_2)
#             if self_loop is not None:
#                 new_embedding_v = new_embedding_v + np.dot(self_loop,weight_matrix_selfloop_layer_2)

#         embedding_matrix [v] = new_embedding_v           

#     return final_embedding

# 创建一些测试用的ndarray数组
all_zero_array = np.array([0, 0, 0, 0])
not_all_zero_array = np.array([0, 1, 0, 0])

# 使用np.all()方法进行测试
is_all_zero_1 = np.all(all_zero_array == 0)  # 期望结果为True
is_all_zero_2 = np.all(not_all_zero_array == 0)  # 期望结果为False

print(is_all_zero_1, is_all_zero_2)