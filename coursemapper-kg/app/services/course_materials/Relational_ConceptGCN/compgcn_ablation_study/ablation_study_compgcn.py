import pandas as pd
import torch
import numpy as np
from sklearn.model_selection import train_test_split
import os
import scipy.sparse as sp
from typing import Tuple
from sentence_transformers import SentenceTransformer
from scipy.sparse import coo_matrix
from sklearn.metrics.pairwise import cosine_similarity
from torch_geometric.nn.inits import glorot
import torch.nn.functional as F

current_dir = os.path.dirname(__file__)

class eva_compgcn:

    def __init__(self):
        self.adj_matrix = None
        self.prerequisite_matrix = None
        self.embedding_matrix = None
        self.adj_matrix_inverse = None
        self.final_embedding_matrix = None
        self.final_relation_embedding_matrix = None

        self.edges = []
        self.relatin_embedding_matrix = None

        # data load function
        self.data_load()

        # randomly initialize the weight matrix for  every layer
        weight_size = self.embedding_matrix.shape[1]
        self.weight_matrix_input_layer_1 = self.glorot_seed((weight_size,weight_size)).numpy()
        self.weight_matrix_output_layer_1 = self.glorot_seed((weight_size,weight_size)).numpy()
        self.weight_matrix_selfloop_layer_1 = self.glorot_seed((weight_size,weight_size)).numpy()

        self.weight_matrix_input_layer_2 = self.glorot_seed((weight_size,weight_size)).numpy()
        self.weight_matrix_output_layer_2 = self.glorot_seed((weight_size,weight_size)).numpy()
        self.weight_matrix_selfloop_layer_2 = self.glorot_seed((weight_size,weight_size)).numpy()

        self.weight_relation_layer_1 = self.glorot_seed((weight_size,weight_size)).numpy()


    def data_load(self):

        #  may choose a different SBERT model paraphrase-MiniLM-L12-v2 paraphrase-MiniLM-L6-v2 all-MiniLM-L6-v2 paraphrase-xlm-r-multilingual-v1
        # SBERT model, be used to generate the initial embedding for node and relation
        model = SentenceTransformer('paraphrase-MiniLM-L12-v2') 

        # load the eva data 
        data_path = os.path.join(current_dir, 'eva_data_short.txt')
        data = pd.read_csv(data_path, sep='\t', header=None, names=['node1', 'relation', 'node2'])
        # get all unique nodes and relation
        all_nodes = pd.concat([data['node1'], data['node2']]).unique()
        relations = data['relation'].unique()

        node_embeddings = {}
        relation_embeddings = {}
        
        # generate initial embedding for nodes and relations
        for node in all_nodes:
            node_text = str(node)  
            node_embeddings[node] = model.encode(node_text)  
        
        relation_embeddings = {relation: model.encode(relation) for relation in relations}

        # node to index
        node_to_index = {node: idx for idx, node in enumerate(all_nodes)}
        embedding_dim = len(next(iter(node_embeddings.values())))  
        num_nodes = len(all_nodes)

        """ 
            Construct embedding matrix
        """
        embedding_matrix = np.zeros((num_nodes, embedding_dim))
        for node, idx in node_to_index.items():
            embedding_matrix[idx] = node_embeddings[node]

        self.embedding_matrix = embedding_matrix
        

        """ 
            Construct adj matrix and relation embedding dict which used for storeing relation embedding
        """
        rows = []
        cols = []
        data_values = []
        relation_matrix = {}
        for _, row in data.iterrows():
            src_idx = node_to_index[row['node1']]
            tgt_idx = node_to_index[row['node2']]

            rows.append(src_idx)
            cols.append(tgt_idx)
            data_values.append(1)
            self.edges.append((src_idx,tgt_idx))

            # relation embedding
            relation_matrix[(src_idx, tgt_idx)] = relation_embeddings[row['relation']]

        adj_matrix = coo_matrix((data_values, (rows, cols)), shape=(num_nodes, num_nodes))
        # A->B
        self.adj_matrix = adj_matrix.toarray()
        # B->A
        self.adj_matrix_inverse = self.adj_matrix.T
        self.relatin_embedding_matrix = relation_matrix
  
    def compgcn_direction_weight (self, rel_transform_mode = 'sub'):
        """ 
            initialize variable
        """        

        adj_matrix = self.adj_matrix
        adj_matrix_inverse = self.adj_matrix_inverse
        embedding_matrix = self.embedding_matrix

        weight_relation_layer_1 = self.weight_relation_layer_1

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
        relation_embedding_matrix = self.relatin_embedding_matrix
        for edge in relation_embedding_matrix:
            relation_embedding_matrix[edge] =relation_embedding_matrix[edge] / np.linalg.norm(relation_embedding_matrix[edge], ord=1,keepdims=True) # L1 Normalization
        
        """ 
            Step 2: update the embedding of all nodes at the 1st. layer
        """
        #Iterate each row of embedding matrix
        for v in range(embedding_matrix.shape[0]):
            
            # be used for updating the embedding of node v
            new_embedding_v = np.zeros((1, embedding_matrix.shape[1]))
            #Iterate over the all neighbor of node v
            for u in range(embedding_matrix.shape[0]):
    
                #initialize variable
                adj_out = None # out direction of adj
                adj_in = None # In direction of adj
                self_loop = None # self loop direction

                # get the embedding of node v
                embedding_v = embedding_matrix [v]

                # if there is a adj edge between node v and it's neighbor u and this edge is in OUT direction
                if v!=u and adj_matrix[v,u] != 0 :
                    relation_embedding = relation_embedding_matrix[(v,u)]
                    adj_out = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)

                # if there is a adj edge between node v and it's neighbor and this edge is in IN direction
                if v!=u and adj_matrix_inverse[v,u] != 0:
                    relation_embedding = relation_embedding_matrix[(u,v)]
                    adj_in = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)
                
                # if there is a self loop edge of node v      
                if v==u and adj_matrix[v,u] != 0:
                    relation_embedding = relation_embedding_matrix[(v,u)]
                    self_loop = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)

                # sum
                if adj_out is not None:
                    new_embedding_v = new_embedding_v + np.dot(adj_out,weight_matrix_output_layer_1)
                if adj_in is not None:
                    new_embedding_v = new_embedding_v + np.dot(adj_in,weight_matrix_input_layer_1)
                if self_loop is not None:
                    new_embedding_v = new_embedding_v + np.dot(self_loop,weight_matrix_selfloop_layer_1)
            
            # means node v don't have any neighbors
            if np.all(new_embedding_v == 0 ):
                pass
            else:
                # update the embdding of node v
                embedding_matrix [v] = new_embedding_v
        embedding_matrix= embedding_matrix / np.linalg.norm(embedding_matrix, ord=1, axis=1, keepdims=True)
        """  
            Step 3: update the representation of edges        
        # """
        # update the embedding of adj edges
        for edge in relation_embedding_matrix:
            relation_embedding_matrix [edge] = np.dot(relation_embedding_matrix[edge], weight_relation_layer_1)
            relation_embedding_matrix[edge] =relation_embedding_matrix[edge] / np.linalg.norm(relation_embedding_matrix[edge], ord=1,keepdims=True)   #L1 normalization   
        # store the final relation embedding, it will be used for ablation study laterly
        self.final_relation_embedding_matrix = relation_embedding_matrix
        """  
            Step 4: update the representation of each nodes at layer 2      
        """        
        for v in range(embedding_matrix.shape[0]):
            # be used for updating the embedding of node v
            new_embedding_v = np.zeros((1, embedding_matrix.shape[1]))
            for u in range(embedding_matrix.shape[0]):
                adj_out = None
                adj_in = None
                self_loop = None
                embedding_v = embedding_matrix [v]

                if v!=u and adj_matrix[v,u] != 0 :
                    relation_embedding = relation_embedding_matrix[(v,u)]
                    adj_out = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)
                if v!=u and adj_matrix_inverse[v,u] != 0:
                    relation_embedding = relation_embedding_matrix[(u,v)]
                    adj_in = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)
                if v==u and adj_matrix[v,u] != 0:
                    relation_embedding = relation_embedding_matrix[(v,v)]
                    self_loop = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)

                if adj_out is not None:
                    new_embedding_v = new_embedding_v + np.dot(adj_out,weight_matrix_output_layer_2)
                if adj_in is not None:
                    new_embedding_v = new_embedding_v + np.dot(adj_in,weight_matrix_input_layer_2)
                if self_loop is not None:
                    new_embedding_v = new_embedding_v + np.dot(self_loop,weight_matrix_selfloop_layer_2)

            # means node v don't have any neighbors
            if np.all(new_embedding_v == 0 ):
                pass
            else:
                embedding_matrix [v] = new_embedding_v
        # self.final_embedding_matrix = embedding_matrix
        # self.final_embedding_matrix = embedding_matrix / np.linalg.norm(embedding_matrix, axis=1, keepdims=True)
        self.final_embedding_matrix = embedding_matrix / np.linalg.norm(embedding_matrix, ord=1, axis=1, keepdims=True)
        return embedding_matrix 
    
    def compgcn_without_direction_weight (self, rel_transform_mode = 'sub'):
        """ 
            initialize variable
        """        
        adj_matrix = self.adj_matrix

        weight_relation_layer_1 = self.weight_relation_layer_1

        adj_matrix_inverse = self.adj_matrix_inverse
        embedding_matrix = self.embedding_matrix

        """ 
            Step 1: initialize the representation of each edges
        """
        # Construct relation embedding dict to store the embedding of each edges
        relation_embedding_matrix = self.relatin_embedding_matrix       
        for edge in relation_embedding_matrix:
            relation_embedding_matrix[edge] =relation_embedding_matrix[edge] / np.linalg.norm(relation_embedding_matrix[edge], ord=1,keepdims=True) # L1 Normalization
        """ 
            Step 2: update the embedding of all nodes at the 1st. layer
        """
        #Iterate each row of embedding matrix
        for v in range(embedding_matrix.shape[0]):
            # be used for updating the embedding of node v
            new_embedding_v = np.zeros((1, embedding_matrix.shape[1]))
            #Iterate each neighbor of node v
            for u in range(embedding_matrix.shape[0]):

                #initialize variable
                adj_out = None # out direction of adj
                adj_in = None # In direction of adj
                self_loop = None # self loop direction

                # get the embedding of node v
                embedding_v = embedding_matrix [v]

                # if there is a adj edge between node v and it's neighbor and this edge is in OUT direction
                if v!=u and adj_matrix[v,u] != 0 :
                    relation_embedding = relation_embedding_matrix[(v,u)]
                    adj_out = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)

                # if there is a adj edge between node v and it's neighbor and this edge is in IN direction
                if v!=u and adj_matrix_inverse[v,u] != 0:
                    relation_embedding = relation_embedding_matrix[(u,v)]
                    adj_in = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)
                      
                # if there is a self loop edge of node v      
                if v==u and adj_matrix_inverse[v,u] != 0:
                    relation_embedding = relation_embedding_matrix[(v,v)]
                    self_loop = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)

                if adj_out is not None:
                    new_embedding_v = new_embedding_v + adj_out
                if adj_in is not None:
                    new_embedding_v = new_embedding_v + adj_in
                if self_loop is not None:
                    new_embedding_v = new_embedding_v + self_loop

            # means node v don't have any neighbors
            if np.all(new_embedding_v == 0 ):
                pass
            else:
                embedding_matrix [v] = new_embedding_v              
        embedding_matrix= embedding_matrix / np.linalg.norm(embedding_matrix, ord=1, axis=1, keepdims=True)
  
        """  
            Step 3: update the representation of edges        
        # """
        # update the embedding of adj edges
        for edge in relation_embedding_matrix:
            relation_embedding_matrix [edge] = np.dot(relation_embedding_matrix[edge], weight_relation_layer_1)
        self.final_relation_embedding_matrix = relation_embedding_matrix
        """  
            Step 4: update the representation of each nodes at layer 2      
        """        
        for v in range(embedding_matrix.shape[0]):
            new_embedding_v = np.zeros((1, embedding_matrix.shape[1]))
            for u in range(embedding_matrix.shape[0]):
                adj_out = None
                adj_in = None
                self_loop = None
                embedding_v = embedding_matrix [v]

                if v!=u and adj_matrix[v,u] != 0 :
                    relation_embedding = relation_embedding_matrix[(v,u)]
                    adj_out = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)
                if v!=u and adj_matrix_inverse[v,u] != 0:
                    relation_embedding = relation_embedding_matrix[(u,v)]
                    adj_in = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)
                if v==u and adj_matrix_inverse[v,u] != 0:
                    relation_embedding = relation_embedding_matrix[(v,v)]
                    self_loop = self.rel_transform(embedding_v,relation_embedding,rel_transform_mode)

                if adj_out is not None:
                    new_embedding_v = new_embedding_v + adj_out
                if adj_in is not None:
                    new_embedding_v = new_embedding_v + adj_in
                if self_loop is not None:
                    new_embedding_v = new_embedding_v + self_loop


            # means node v don't have any neighbors
            if np.all(new_embedding_v == 0 ):
                pass
            else:
                embedding_matrix [v] = new_embedding_v           
        self.final_embedding_matrix = embedding_matrix / np.linalg.norm(embedding_matrix, ord=1, axis=1, keepdims=True)
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

    def glorot_seed(
        self,
        shape: Tuple,
        seed: int = 42,
        dtype: torch.dtype = torch.float32,
    ):
        """Randomly generates a tensor based on a seed and Glorot initialization.

        Args:
            shape (Tuple):
                Desired shape of the tensor.

            device (torch.device or str, optional):
                Device to generate tensor on. Defaults to "cuda".

            seed (int, optional):
                The seed. Defaults to 42.

            dtype (torch.dtype, optional):
                Tensor type. Defaults to torch.float32.

        Returns:
            torch.Tensor: The randomly generated tensor
        """
        torch.manual_seed(seed)
        a = torch.zeros(shape, device=None, dtype=dtype)
        glorot(a)
        return a


"""
    follow code are not used
"""
# ConvE model
class ConvEScorer(torch.nn.Module):
    def __init__(self, embedding_dim, embedding_height, embedding_width):
        super(ConvEScorer, self).__init__()
        self.embedding_height = embedding_height
        self.embedding_width = embedding_width
        self.conv_layer = torch.nn.Conv2d(1, 32, (3, 3), stride=1, padding=1)
        self.fc_layer = torch.nn.Linear(32 * embedding_height * (2*embedding_width), embedding_dim)
    
    def forward(self, h_embedding, r_embedding, t_embedding):
        hr_embedding = torch.cat([h_embedding, r_embedding], dim=-1)
        hr_embedding = hr_embedding.view(-1, 1, self.embedding_height, 2 * self.embedding_width)
        x = self.conv_layer(hr_embedding)
        x = F.relu(x)
        x = x.view(x.shape[0], -1)
        x = self.fc_layer(x)
        score = torch.sum(x * t_embedding, dim=-1)
        return score
# Generate positive and negative samples
def generate_pos_neg_samples(edges, num_nodes):
    positive_samples = edges
    negative_samples = []
    while len(negative_samples) < len(positive_samples):
        i, j = np.random.randint(0, num_nodes, 2)
        if (i, j) not in edges and (j, i) not in edges:
            negative_samples.append((i, j))
    return positive_samples, negative_samples
""" 
    scoring function
"""
# TransE scoring function
def transE_score(h_embedding, r_embedding, t_embedding):
    return -np.linalg.norm(h_embedding + r_embedding - t_embedding)
#Dismult scoring function
def distmult_score(h_embedding, r_embedding, t_embedding):
    score =np.sum(np.abs(h_embedding) * np.abs(r_embedding) * np.abs(t_embedding))
    score = np.tanh(score)
    return score
# ConvE 
def convE_score(h_embedding, r_embedding, t_embedding, convE_model):
    with torch.no_grad():
        return convE_model(h_embedding, r_embedding, t_embedding).item()
# cosine score function    
def cosine_score(h_embedding, r_embeding, t_embedding):
    combined_embedding = h_embedding + r_embeding
    score = cosine_similarity([combined_embedding], [t_embedding])[0][0]
    return score

""" 
   link prediction 
"""
def evaluate_link_prediction(entity_embeddings, relation_embeddings, test_triples, scoring_function, convE_model=None,n=10):
    ranks = []
    hits = []
    num_entities = entity_embeddings.shape[0]

    for (h, t) in test_triples:
        # get the score of the positive triple 
        if scoring_function == convE_score:
            correct_score = scoring_function(
                torch.tensor(entity_embeddings[h]).unsqueeze(0).float(),
                torch.tensor(relation_embeddings[(h,t)]).unsqueeze(0).float(),
                torch.tensor(entity_embeddings[t]).unsqueeze(0).float(),
                convE_model
            )
        else:
            correct_score = scoring_function(entity_embeddings[h], relation_embeddings[(h,t)], entity_embeddings[t])
            # if correct_score<=0.4:
            #     print("+++++++++++++++++++++++++(h,t)+++++++++++++++++++++++++")
            #     print("the embedding of head:")
            #     print(h)
            #     print("the embedding of r:")
            #     print((h,t))
            #     print("the embedding of t:")
            #     print(t) 
            #     print("the embedding of score:")
            #     print(correct_score)
            #     print("+++++++++++++++++++++++++end+++++++++++++++++++++++++")
            #     print("                                                      ")
        # replace the head
        head_scores = []
        for h_prime in range(num_entities):
            if h_prime != h and (h_prime,t) not in test_triples:
                if scoring_function == convE_score:
                    score_h_prime = scoring_function(
                        torch.tensor(entity_embeddings[h_prime]).unsqueeze(0).float(),
                        torch.tensor(relation_embeddings[(h,t)]).unsqueeze(0).float(),
                        torch.tensor(entity_embeddings[t]).unsqueeze(0).float(),
                        convE_model
                    )
                else:
                    score_h_prime = scoring_function(entity_embeddings[h_prime], relation_embeddings[(h,t)], entity_embeddings[t])
                head_scores.append(score_h_prime)
        head_scores.append(correct_score)  # append the positive score
        head_ranks = np.argsort(head_scores)[::-1].tolist()  # rank form high score to low score
        correct_score_index = len(head_scores) - 1
        rank_head = head_ranks.index(correct_score_index)+1  # get then rank of positive sample

        # replace tail 
        tail_scores = []
        for t_prime in range(num_entities):
            if t_prime != t and (h,t_prime) not in test_triples:
                if scoring_function == convE_score:
                    score_t_prime = scoring_function(
                        torch.tensor(entity_embeddings[h]).unsqueeze(0).float(),
                        torch.tensor(relation_embeddings[h,t]).unsqueeze(0).float(),
                        torch.tensor(entity_embeddings[t_prime]).unsqueeze(0).float(),
                        convE_model
                    )
                else:
                    score_t_prime = scoring_function(entity_embeddings[h], relation_embeddings[(h,t)], entity_embeddings[t_prime])
                tail_scores.append(score_t_prime)
        tail_scores.append(correct_score)  # append the positive score
        tail_ranks = np.argsort(tail_scores)[::-1].tolist()  # rank from high to low
        correct_score_index = len(tail_scores) - 1
        rank_tail = tail_ranks.index(correct_score_index)+1 # get the rank of positive sample

        # 记录最小排名（头替换和尾替换的较小值）
        rank = min(rank_head,rank_tail)
        print(rank)
        ranks.append(rank)
        #ranks.append(rank_tail)
        # 记录 Hit@n
        hits.append(1 if rank <= n else 0)
        #hits.append(1 if rank_tail <= n else 0)
    # 计算 MR
    mr = np.mean(ranks)
    
    # 计算 MRR
    mrr = np.mean([1.0 / rank for rank in ranks])
    
    # 计算 Hit@n
    hit_n = np.mean(hits)

    return mr, mrr, hit_n


"""  
 Evaluation part begin here
"""

# step 1: data prepartion
eva = eva_compgcn()
eva.edges = list(set(eva.edges))

# step2: generate the embedding by using our model
# compGCN with direction weight and corr, mult or sub
eva.compgcn_without_direction_weight('sub')

# compGCN without direction weight and corr, mult or sub
# eva.compgcn_without_direction_weight('sub')

embedding_matrix = eva.final_embedding_matrix
relation_embedding_matrix =eva.final_relation_embedding_matrix
test_triples =set(eva.edges)

# step3 and step4 compute the score and evaluate
# params: embedding matrix, relation_embedding_matrix, test_triples(h,r,t), scoring_function(transE, distmult, cosine_score, Hit@n)
mr, mrr, hit_n = evaluate_link_prediction(embedding_matrix, relation_embedding_matrix, test_triples,scoring_function=distmult_score,n=10)
print(f"MR: {mr}, MRR: {mrr}, Hit@10: {hit_n}")
