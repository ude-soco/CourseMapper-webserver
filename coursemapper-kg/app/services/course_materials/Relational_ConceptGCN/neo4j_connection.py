from neo4j import GraphDatabase
import pandas as pd
import os
import numpy as np
from bson import ObjectId
from pymongo import MongoClient
from sentence_transformers import util
class DBConnection:
    def __init__(self, uri='bolt://localhost:7687', username='neo4j', password='1234qwer!'):
        self.driver = GraphDatabase.driver(uri,
                                    auth=(username, password),
                                    encrypted=False)
        # Define the connection URI, username, and password
        # self.uri = uri 
        # self.username = username
        # self.password = password
        
        # self.concepts = []

    def prerequisite_relation(self,mid='66eee5b2d002dc3075b6c37d'):
        session = self.driver.session()
        tx = session.begin_transaction()
        #Get relationships between nodes (concept-related concept, concept-category)
        relations = tx.run("""MATCH p=(u)-[r:PREREQUISITE_TO]->(c) where u.mid = $mid and c.mid =$mid RETURN u.cid as source, u.type as stype, r.weighted_weight as weight, c.cid as target, c.type as ttype""",mid=mid)
        relations = list(relations)
        prerequisite_relationships = []
        for relation in relations:
            if float(relation["weight"])!=0.0 and relation["weight"]!=None:
                r = {
                    "source": relation["source"],
                    "target": relation["target"],             
                    # "source": hash(relation["source"] + relation["stype"]),
                    # "target": hash(relation["target"] + relation["ttype"]),
                    "weight": round(float(relation["weight"]),2)
                    }
                prerequisite_relationships.append(r)

        print(prerequisite_relationships)
        #Save relationships between nodes in text
        #first column is source node, second column is weight of prerequisite, third column is target node
        # with open("./coursemapper-kg/prerequisite.txt", "w") as f:
        #     # absolute_path = os.path.abspath(f.name)
        #     # print("absolute path of file:", absolute_path)
        #     for relationship in prerequisite_relationships:
        #         f.write(str(relationship["source"]) + " " + str(relationship["weight"]) 
        #                 + " " + str(relationship["target"])+ "\n")
                

    def relation(self, mid='66e997b58ea301d5fbfbd91c'):
        # Get relationships between nodes (concept-related concept, concept-category)
        print("+++++++++++++++++++++++++++++++++++mid = "+str(mid))
        with self.driver.session() as session:
            concept_result = session.run(
                """MATCH p=(u:Concept)-[r]->(c:Concept) where u.mid = $mid and c.mid =$mid RETURN u.cid as source, u.type as stype, r.weight as weight, c.cid as target, c.type as ttype""",
                mid=mid).data()
            # Get relationships between nodes (slide-concept)
            slide_result = session.run(
                """MATCH p=(u:Slide)-[r]->(c:Concept) where u.mid = $mid and c.mid = $mid RETURN u.sid as source, u.type as stype, r.weight as weight, c.cid as target, c.type as ttype""",
                mid=mid).data()
        relations = list(concept_result) + list(slide_result)


        relationships = []
        for relation in relations:
            if relation["weight"] is not None:
                r = {
                    "source": hash(relation["source"] + relation["stype"]),
                    "target": hash(relation["target"] + relation["ttype"]),
                    "weight": round(relation["weight"], 2)
                }
                relationships.append(r)
        # Save relationships between nodes in text
        # first column is source node, second column is weight of relationship, third column is target node
        with open("relation.txt", "w") as f:
            for relationship in relationships:
                f.write(str(relationship["source"]) + " " + str(relationship["weight"])
                        + " " + str(relationship["target"]) + "\n")


    def relation_prerequisite(self,mid='66e997b58ea301d5fbfbd91c'):
        # Get relationships between nodes (concept-related concept, concept-category)
        with self.driver.session() as session:
            concept_result = session.run(
                """MATCH p=(u:Concept)-[r]->(c:Concept) where u.mid = $mid and c.mid =$mid AND NOT r:PREREQUISITE_TO RETURN u.cid as source, u.type as stype, r.weight as weight, c.cid as target, c.type as ttype""",
                mid=mid).data()
            # Get relationships between nodes (slide-concept)
            slide_result = session.run(
                """MATCH p=(u:Slide)-[r]->(c:Concept) where u.mid = $mid and c.mid = $mid AND NOT r:PREREQUISITE_TO RETURN u.sid as source, u.type as stype, r.weight as weight, c.cid as target, c.type as ttype""",
                mid=mid).data()
            concept_prerequisite_result = session.run(
                """MATCH p=(u:Concept)-[r]->(c:Concept) where u.mid = $mid and c.mid =$mid AND r:PREREQUISITE_TO RETURN u.cid as source, u.type as stype, r.weighted_weight as weight, c.cid as target, c.type as ttype""",
                mid=mid).data()
            # Get relationships between nodes (slide-concept)
            slide_prerequisite_result = session.run(
                """MATCH p=(u:Slide)-[r]->(c:Concept) where u.mid = $mid and c.mid = $mid AND r:PREREQUISITE_TO RETURN u.sid as source, u.type as stype, r.weighted_weight as weight, c.cid as target, c.type as ttype""",
                mid=mid).data()
        relations = list(concept_result) + list(slide_result)
        prerequisites = list(concept_prerequisite_result) + list(slide_prerequisite_result)
        relationships = []
        prerequisite_relationships = []
        for relation in relations:
            if relation["weight"] is not None:
                r = {
                    "source": hash(relation["source"] + relation["stype"]),
                    "target": hash(relation["target"] + relation["ttype"]),
                    "weight": round(relation["weight"], 2)
                }
                relationships.append(r)
        for prerequisite in prerequisites:
            r = {
                "source": hash(prerequisite["source"] + prerequisite["stype"]),
                "target": hash(prerequisite["target"] + prerequisite["ttype"]),
                "weight": round(float(prerequisite["weight"]), 2)
            }
            prerequisite_relationships.append(r)
        # Save relationships between nodes in text
        # first column is source node, second column is weight of relationship, third column is target node
        with open("relation.txt", "w") as f:
            for relationship in relationships:
                f.write(str(relationship["source"]) + " " + str(relationship["weight"])
                        + " " + str(relationship["target"]) + "\n")
        with open("prerequisite.txt", "w") as f:
            for prerequisite_relationship in prerequisite_relationships:
                f.write(str(prerequisite_relationship["source"]) + " " + str(prerequisite_relationship["weight"])
                        + " " + str(prerequisite_relationship["target"]) + "\n")


    def get_user_embedding_bak(self,user_id, mid):
        # connect to Neo4j
        session = self.driver.session()
        tx = session.begin_transaction()

        # connect to MongoDB
        client = MongoClient("mongodb://localhost:27017/")
        db = client["coursemapper_v2"]  # the name of database
        users_collection = db["users"]  # the name of table
        user_doc = users_collection.find_one({"_id": ObjectId(user_id)}) #query the information belongs to user (user_id)

        #initialize the concept_timestamps
        concept_timestamps = None

        # get the all(include different materials) dnu concept timestamps for user_id
        # concept_timestamps is dict, key is the id of dnu concept, value is the timestamps
        if user_doc and "conceptTimestamps" in user_doc and len(user_doc["conceptTimestamps"]) > 0:
            concept_timestamps = user_doc["conceptTimestamps"]
            # set the default timestamp to the timestamp of the first concept, if the concept don't have any timestamp, it will use the default time stamp
            default_timestamp = next(iter(concept_timestamps.values()))
        print("Getting User embeddings")

        # Find concept embeddings that user doesn't understand
        results = tx.run(
            """MATCH p=(u)-[r:dnu]->(c) where u.uid=$uid and c.mid=$mid RETURN c.cid as dnu_concept_id, c.final_embedding as embedding, c.weight as weight""",
            uid=user_id,
            mid=mid)
        embeddings = list(results)

        # If the user does not have DNU concepts , the list will be empty
        if not embeddings:
            # tx.run("""MATCH (u:User) WHERE u.uid=$uid set u.embedding=$embedding""",
            #     uid=user_id,
            #     embedding="")
            print("reset user embedding")
        # If the user has only one dnu concept, it don't need any time information, just perform what like ConceptGCN do
        elif len(embeddings) == 1 :
            sum_embeddings = 0
            sum_weights = 0
            # Convert string type to array type 'np.array'
            # Sum and average these concept embeddings to get user embedding
            for embedding in embeddings:
                list1 = embedding["embedding"].split(',')
                list2 = []
                for j in list1:
                    list2.append(float(j))
                arr = np.array(list2)
                sum_embeddings = sum_embeddings + arr * embedding["weight"]
                sum_weights = sum_weights + embedding["weight"]
            # The weighted average of final embeddings of all dnu concepts
            average = np.divide(sum_embeddings, sum_weights)
            embedding=','.join(str(i) for i in average)
            tx.run("""MATCH (u:User) WHERE u.uid=$uid set u.embedding=$embedding""",
                uid=user_id,
                embedding=','.join(str(i) for i in average))
            print("get user embedding")
        # If the number of dnu concept is more than one dnu, we will consider the order of dnu
        else:

            #"id1": {"embedding": [0.1, 0.2, 0.3], "weight": 0.5}
            dnu_concept_mid={}
            dnu_concept_ids_list=[]

            #store the embedding and weight for each dnu id in dnu_concept_mid
            for embedding in embeddings:
                dnu_concept_ids=embedding['dnu_concept_id']
                dnu_concept_ids_list.append(dnu_concept_ids)
                # convert STR to ARRAY of embedding
                list1 = embedding["embedding"].split(',')
                list2 = []
                for j in list1:
                    list2.append(float(j))
                arr = np.array(list2)
                dnu_concept_mid[dnu_concept_ids]={
                    "embedding": arr,  # store embedding array
                    "weight": embedding["weight"],        # store weight between this concept and E_lm
                }

            """
                get the position of each dnu concept
                dnu_position(dict,key is id of concept, value is position) : give each dnu concepts a position value according to the timestamps
            """
            # filter concept_timestamps, we only need timestamp of dnu concept which belongs to mid 
            filtered_timestamps = {
                id_: concept_timestamps.get(id_, default_timestamp) for id_ in dnu_concept_ids_list
            }
            # sort them according to timestamp, if the timestamp is same, according to the load order
            sorted_timestamps = sorted(filtered_timestamps.items(), key=lambda x: x[1])
            # assign position value for each dnu concept
            dnu_position = {id_: position for position, (id_, _) in enumerate(sorted_timestamps)}

            """
                Begin to construct user model
            """
            """
                1. update dnu embeddings
            """
            # step 1: Calculate sequential weight matrix

            embeddings = [np.array(dnu_concept_mid[node]["embedding"]) for node in dnu_concept_ids_list]
            num_nodes = len(dnu_concept_ids_list)
            dnu_weight_matrix = np.zeros((num_nodes, num_nodes))
            # get the weight among the dnu concept
            for i in range(num_nodes):
                for j in range(num_nodes):
                    if i == j:
                        dnu_weight_matrix[i][j] = 1.0  # The diagonal is 1
                    else:
                        # calculate cosine similarity weight
                        dot_product = np.dot(embeddings[i], embeddings[j])  
                        norm_i = np.linalg.norm(embeddings[i])  
                        norm_j = np.linalg.norm(embeddings[j])  
                        dnu_weight_matrix[i][j] = dot_product / (norm_i * norm_j)

            #step 2: Calculate mask matrix
            positions = [dnu_position[node] for node in dnu_concept_ids_list]
            mask_matrix = np.zeros((num_nodes, num_nodes))  # initialize mask matrix
            for i in range(num_nodes):
                for j in range(num_nodes):
                    if positions[i] <= positions[j]:
                        mask_matrix[i][j] = 0  # ti<=tj, 0
                    else:
                        mask_matrix[i][j] = -10  # ti>tj , -10

            #step 3: Calculate sequential matrix
            sequential_matrix = np.where(mask_matrix == -10, 0, dnu_weight_matrix + mask_matrix) # if the value of mask matrix is -10, then the value of sequential_matrix will be 0 

            #step 4: update the dnu_embedding matrix
            embedding_matrix = np.vstack(embeddings) # construct dnu embedding matrix
            new_dnu_embeddings= np.dot(sequential_matrix,embedding_matrix) #update dnu embedding
            

            for idx, concept_id in enumerate(dnu_concept_ids_list):
                dnu_concept_mid[concept_id]["embedding"] = new_dnu_embeddings[idx]
                
            """
                construct the embedding of user 
            """
            # Extract the list of all dnu concept IDs
            dnu_ids = list(dnu_concept_mid.keys())

            # Extract embedding and weight information according to dnu concept IDs
            dnu_embeddings = [dnu_concept_mid[id]["embedding"] for id in dnu_ids]
            weights = [dnu_concept_mid[id]["weight"] for id in dnu_ids] 
            
            # Extract positions
            dnu_positions = [dnu_position[id] for id in dnu_ids] 

            # Step 1: calculate w_c
            w_c_list = []
            for i in range(num_nodes):
                W_cos = weights[i]  # calculate W_cos
                # calculate W_pos
                W_pos = dnu_positions[i] / (num_nodes - 1)  
                # calculate W_c
                w_c = 0.5 * (W_cos + W_pos)  # 权重公式
                w_c_list.append(w_c)
            # Step 2: get W_sum
            W_sum = sum(w_c_list)
            # Step 3: get e_L
            embeddings_sum = np.zeros_like(dnu_embeddings[0]) 
            for i in range(num_nodes):
                embeddings_sum += w_c_list[i] * dnu_embeddings[i] 
            e_L = embeddings_sum / W_sum  

            # write user embedding into neo4j
            tx.run("""MATCH (u:User) WHERE u.uid=$uid set u.embedding=$embedding""",
                uid=user_id,
                embedding=','.join(str(i) for i in e_L))

    
    
    def get_user_embedding(self, user_id='66e07565733de02be8699540', mid='66e997b58ea301d5fbfbd91c'):
        """
        """
        session = self.driver.session()
        tx = session.begin_transaction()
        print("Getting User embeddings")
        # Find concept embeddings that user doesn't understand
        results = tx.run(
            """MATCH p=(u)-[r:dnu]->(c) where u.uid=$uid and c.mid=$mid RETURN c.final_embedding as embedding, c.weight as weight""",
            uid=user_id,
            mid=mid)
        embeddings = list(results)
        # If the user does not have concepts that he does not understand, the list is empty
        if not embeddings:
            # tx.run("""MATCH (u:User) WHERE u.uid=$uid set u.embedding=$embedding""",
            #     uid=user_id,
            #     embedding="")
            print("reset user embedding")
        else:
            sum_embeddings = 0
            sum_weights = 0
            # Convert string type to array type 'np.array'
            # Sum and average these concept embeddings to get user embedding
            for embedding in embeddings:
                list1 = embedding["embedding"].split(',')
                list2 = []
                for j in list1:
                    list2.append(float(j))
                arr = np.array(list2)
                sum_embeddings = sum_embeddings + arr * embedding["weight"]
                sum_weights = sum_weights + embedding["weight"]
            # The weighted average of final embeddings of all dnu concepts
            average = np.divide(sum_embeddings, sum_weights)
            print(average.shape)
            embedding=','.join(str(i) for i in average)
            tx.run("""MATCH (u:User) WHERE u.uid=$uid set u.embedding=$embedding""",
                uid=user_id,
                embedding=','.join(str(i) for i in average))
            print("get user embedding")

    """
        MATCH (n:Concept) 匹配节点
        WHERE NOT EXISTS {MATCH (u:User)-[r]->(n:Concept) where u.uid = $uid} 排除与该user有连接的节点
        AND NOT EXISTS {MATCH (u:User)-[r]->(m:Concept) where u.uid =$uid and n.initial_embedding =m.initial_embedding} 
        如果当前节点 n 的嵌入（initial_embedding）已经与某用户（uid）连接的其他 Concept 节点相同，则排除它
        AND n.mid =$mid 
        AND n.type <> $type
        return n
    """
    def get_concept_has_not_read(self, user_id, mid):
        print("Get concept")
        with self.driver.session() as session:
            result = session.run(
                """MATCH (n:Concept)
                    WHERE NOT EXISTS {MATCH (u:User)-[r]->(n:Concept) where u.uid = $uid}
                    AND NOT EXISTS {MATCH (u:User)-[r]->(m:Concept) where u.uid =$uid and n.initial_embedding =m.initial_embedding}
                    AND n.mid =$mid 
                    AND n.type <> $type
                    AND NOT EXISTS {
                        MATCH (p1:Concept)-[:PREREQUISITE_TO]-(p2:Concept)
                        WHERE n = p1 OR n = p2
                    }
                    return n
                    """,
                uid=user_id,
                mid=mid,
                type="category"
            ).data()

        return list(result)
    def get_prerequisite_concept_has_not_read(self, user_id, mid):
        print("Get concept")
        with self.driver.session() as session:
            result = session.run(
                """MATCH (n:Concept)
                    WHERE NOT EXISTS {MATCH (u:User)-[r]->(n:Concept) where u.uid = $uid}
                    AND NOT EXISTS {MATCH (u:User)-[r]->(m:Concept) where u.uid =$uid and n.initial_embedding =m.initial_embedding}
                    AND n.mid =$mid 
                    AND n.type <> $type
                    AND EXISTS {
                        MATCH (p1:Concept)-[:PREREQUISITE_TO]-(p2:Concept)
                        WHERE n = p1 OR n = p2
                    }
                    return n
                    """,
                uid=user_id,
                mid=mid,
                type="category"
            ).data()

        return list(result)

    def get_user(self, user_id):
        print("Get user")
        with self.driver.session() as session:
            result = session.run(
                "MATCH (u:User) WHERE u.uid = $uid RETURN u",
                uid=user_id).data()

        return list(result)
    
    def compute_cos_sim_score(self, embedding1, embedding2):
        """ 
        """
        # cos_sim = util.cos_sim(embedding1, embedding2)
        # score = round(cos_sim.item(), 2)

        return util.cos_sim(embedding1, embedding2).item()
    
    def sequence_recommend(self,sequence_concept_list,user,top_n):
        
        user_embedding_str = user[0]["u"]["embedding"].split(',')
        list2 = []
        for j in user_embedding_str:
            list2.append(float(j))
        user_embedding = np.array(list2)
        print(type(sequence_concept_list))
        for concept in sequence_concept_list:
             concept_embedding_str = concept["n"]["final_embedding"].split(',')
             list2 = []
             for j in concept_embedding_str:
                 list2.append(float(j))
             concept_embedding= np.array(list2)
             concept["n"]["score"] = self.compute_cos_sim_score(concept_embedding, user_embedding)
        top_n_concept = sorted(sequence_concept_list, key=lambda x: x["n"]["score"], reverse=True)[0:top_n]
        print(top_n_concept)
        # return sorted(concept_list, key=lambda x: x["n"]["score"], reverse=True)[0:top_n]
    
    def _get_concept_recommendation(self, user_id='66e07565733de02be8699540', mid='66eee5b2d002dc3075b6c37d'):
        # Get concepts that doesn't interact with user
        # related to candidate concept
        concept_list = self.get_concept_has_not_read(user_id, mid)
        #sequence recommendation candidate concept set
        sequence_concept_list = self.get_prerequisite_concept_has_not_read(user_id, mid)
        user = self.get_user(user_id)

        # compute the similarity between user and concepts with cos-similarity and select top-5 recommendation concept
        # recommend_concepts = self.recommendation.recommend(concept_list, user, top_n=5)
        sequence_recommend_concepts = self.sequence_recommend(sequence_concept_list, user, top_n=5)
        # for i in recommend_concepts:
        #     info = i["n"]["name"] + " : " + str(i["n"]["score"])
        #     logger.info(info)

        # # Use paths for interpretability
        # recommend_concepts = self._get_road(recommend_concepts, user_id, mid)

        # resp = get_serialized_concepts_data(recommend_concepts)
        # return resp

test = DBConnection()
test._get_concept_recommendation()
