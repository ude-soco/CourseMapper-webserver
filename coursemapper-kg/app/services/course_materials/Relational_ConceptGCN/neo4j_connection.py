from neo4j import GraphDatabase
import pandas as pd
import os
import numpy as np
from bson import ObjectId
from pymongo import MongoClient
from sentence_transformers import util
from collections import defaultdict, deque
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
                """
                MATCH (n:Concept)
                WHERE NOT EXISTS {MATCH (u:User)-[r]->(n:Concept) where u.uid = $uid}
                AND NOT EXISTS {MATCH (u:User)-[r]->(m:Concept) where u.uid =$uid and n.initial_embedding =m.initial_embedding} 
                AND n.type <> $type
                AND n.mid = $mid
                AND EXISTS {
                    MATCH (p1:Concept)-[:PREREQUISITE_TO]-(p2:Concept)
                    WHERE n = p1 OR n = p2
                }
                return n
                """,
                uid=user_id,
                mid = mid,
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
    
    def build_adjacency_matrix(self,list_of_cids):
        # 创建数据库连接
        driver = self.driver
        
        query = """
        MATCH p=(u:Concept)-[r:PREREQUISITE_TO]->(c:Concept) 
        WHERE u.cid IN $cids AND c.cid IN $cids
        RETURN u.cid AS source, c.cid AS target, r.weighted_weight AS weight
        """

        # 查询节点之间的关系
        def fetch_relationships(tx, cids):
            result = tx.run(query, cids=cids)
            return [(record["source"], record["target"], record["weight"]) for record in result]

        relationships = []
        with driver.session() as session:
            relationships = session.read_transaction(fetch_relationships, list_of_cids)

        #print(len(relationships))

        # 关闭连接
        driver.close()

        # 创建 cid 到索引的映射
        cid_to_index = {cid: idx for idx, cid in enumerate(list_of_cids)}
        n = len(list_of_cids)
        
        # 初始化邻接矩阵
        adjacency_matrix = np.zeros((n, n))

        # 填充邻接矩阵
        for source, target, weight in relationships:
            if source in cid_to_index and target in cid_to_index:
                i, j = cid_to_index[source], cid_to_index[target]
                adjacency_matrix[i][j] = 1

        rows, cols = np.where(adjacency_matrix == 1)
        for row, col in zip(rows, cols):
            source_cid = list_of_cids[row]
            target_cid = list_of_cids[col]
            #print(f"{source_cid} 和 {target_cid} 之间有连接")
        
        return adjacency_matrix, cid_to_index
    
    def find_disjoint_paths(self, adj_matrix, cid_list, cid_to_index):
        # Generate `cid` from `cidtoindex` to ensure mapping from indices to IDs
        cid = list(cid_to_index.keys())

        # Initialize variables
        visited = set()
        connected_components = []
        explanations = []

        # Helper function for DFS
        def dfs(node, component, path):
            visited.add(node)
            component.append(node)
            for neighbor, is_connected in enumerate(adj_matrix[node]):
                if is_connected and neighbor not in visited:
                    path.append(f"{cid[node]} -> {cid[neighbor]}")
                    dfs(neighbor, component, path)

        # Convert cid_list to indices
        indices = [cid_to_index[c] for c in cid_list]

        # Find connected components
        for idx in indices:
            if idx not in visited:
                component = []
                path = []
                dfs(idx, component, path)
                connected_components.append(component)
                explanations.append(path)

        # Filter components to include only nodes in `cid_list`
        filtered_components = []
        filtered_explanations = []

        for component, explanation in zip(connected_components, explanations):
            # Convert indices to cids
            filtered_component = [cid[i] for i in component if cid[i] in cid_list]
            if filtered_component:  # Only add non-empty components
                filtered_components.append(filtered_component)

                # Filter explanation to include only paths within `cid_list`
                filtered_explanation = [path for path in explanation if all(node in cid_list for node in path.split(" -> "))]
                filtered_explanations.append(filtered_explanation)

        return filtered_components, filtered_explanations
    
    def find_paths_from_node(self,adj_matrix, start_node):
        """
        Find all paths starting from a given node using DFS.
        """
        num_nodes = adj_matrix.shape[0]
        paths = []  # Store all paths

        def dfs(current_node, path):
            path.append(current_node)
            has_next = False
            for neighbor, is_connected in enumerate(adj_matrix[current_node]):
                if is_connected and neighbor not in path:  # Prevent cycles
                    has_next = True
                    dfs(neighbor, path.copy())  # Recursive search
            if not has_next:  # If no further nodes, this is a valid path
                paths.append(path)

        dfs(start_node, [])
        return paths

    def find_paths_to_node(self,adj_matrix, end_node):
        """
        Find all paths ending at a given node by transposing the matrix and using DFS.
        """
        # Transpose the adjacency matrix to reverse the direction of edges
        adj_matrix_transposed = adj_matrix.T
        return self.find_paths_from_node(adj_matrix_transposed, end_node)
    
    def get_road(self,cid_to_name,cid_list):
        """
        """
        print("get_groupedPaths_and_isolatedNodes")
        with self.driver.session() as session:
            result = session.run(
                """
                WITH $cid AS targetCIDs

                // Find the starting node
                MATCH (startNode)
                WHERE startNode.cid IN targetCIDs

                // Find all paths connected by PREREQUISITE_TO
                OPTIONAL MATCH path = (startNode)-[:PREREQUISITE_TO*]->(midNode)-[:RELATED_TO*0..1]-(midNode2)-[:PREREQUISITE_TO*]->(endNode)
                WHERE endNode.cid IN targetCIDs

                // Collect the target node CID in the path
                WITH collect([node IN nodes(path) WHERE node.cid IN targetCIDs | node.cid]) AS groupedPaths, targetCIDs
                // Remove duplicate paths
                WITH apoc.coll.toSet(groupedPaths) AS groupedPaths, targetCIDs
                //calculate the isolated nodes
                WITH groupedPaths, apoc.coll.flatten(groupedPaths) AS connectedCIDs, targetCIDs
                WITH groupedPaths, apoc.coll.subtract(targetCIDs, connectedCIDs) AS isolatedNodes

                // Returns the result with the CIDs in the path and the CIDs of the isolated nodes
                RETURN groupedPaths, isolatedNodes
                """,
                cid=cid_list,
        ).data()
           # print("get_road_user_c_related_concept", result)
        # print("road same rc",result )
        result = list(result)
        groupedPaths = result[0]['groupedPaths']
        isolatedNodes = result[0]['isolatedNodes']
        with self.driver.session() as session:
            isolated_result = session.run(
                """
                WITH $isolatedNodes_list AS isolatedNodeCID

                // 找到孤立节点
                MATCH (isoNode)
                WHERE isoNode.cid IN isolatedNodeCID

                // 前向路径和后向路径
                OPTIONAL MATCH forwardPath = (isoNode)-[:PREREQUISITE_TO*]->(forwardNode)
                OPTIONAL MATCH backwardPath = (backwardNode)-[:PREREQUISITE_TO*]->(isoNode)

                // 先收集路径中的节点信息
                WITH isoNode, 
                    [node IN nodes(forwardPath) | {cid: node.cid, name: node.name}] AS forwardPathsNodes,
                    [node IN nodes(backwardPath) | {cid: node.cid, name: node.name}] AS backwardPathsNodes

                // 对前向路径和后向路径分别进行聚合
                WITH isoNode, 
                    collect(forwardPathsNodes) AS forwardPaths,
                    collect(backwardPathsNodes) AS backwardPaths

                // 将前向路径和后向路径合并
                WITH isoNode, forwardPaths + backwardPaths AS allPaths

                // 处理没有路径的孤立节点
                RETURN isoNode.cid AS isolatedNodeCID, 
                    isoNode.name AS isolatedNodeName, 
                    CASE WHEN size(allPaths) > 0 THEN allPaths ELSE [[{cid: isoNode.cid, name: isoNode.name}]] END AS allPaths
                """,
                isolatedNodes_list=isolatedNodes,
            ).data()
        isolated_sequence = []  
        for i in range(len(isolated_result)):
            isolated_path=isolated_result[i]['allPaths']
            isolated_path = self.deduplicate_by_name(isolated_path)
            isolated_sequence = isolated_sequence+isolated_path
        grouped_sequence = []
        for path in groupedPaths:
            transformed_path = []
            for cid in path:
                transformed_path.append({'name': cid_to_name.get(cid),'cid': cid})
            grouped_sequence.append(transformed_path)
        grouped_sequence = self.deduplicate_by_name(grouped_sequence)
        final_sequence = grouped_sequence+isolated_sequence
        return final_sequence

    def deduplicate_by_name(self,data):
        seen = set()  # 用于存储已经出现过的名字组合
        result = []
        
        for path in data:
            # 提取当前路径的名字组合，转为集合
            names = frozenset(node['name'] for node in path)
            if names not in seen:
                seen.add(names)  # 标记为已处理
                result.append(path)  # 保留原始子列表
                
        return result
    def sequence_recommend(self,sequence_concept_list,user,top_n):
        #get user_id
        user_id = user[0]["u"]["uid"]

        #get_user_embedding and convert str to array
        user_embedding_str = user[0]["u"]["embedding"].split(',')
        list2 = []
        for j in user_embedding_str:
            list2.append(float(j))
        user_embedding = np.array(list2)

        #get the sequence candidate concept list 
        list_of_cids = []
        for concept in sequence_concept_list:
             concept_embedding_str = concept["n"]["final_embedding"].split(',')
             list_of_cids.append(concept["n"]["cid"])
             list2 = []
             for j in concept_embedding_str:
                list2.append(float(j))
             concept_embedding= np.array(list2)
             concept["n"]["score"] = self.compute_cos_sim_score(concept_embedding, user_embedding)
        
        #get the top-n sequence recommended concept
        top_n_concepts = sorted(sequence_concept_list, key=lambda x: x["n"]["score"], reverse=True)[0:top_n]
        
        top_n_cid_list = []
        top_cid_to_name_dict = {}
        for topn_concept in top_n_concepts:
            cid = topn_concept["n"]["cid"]
            name = topn_concept["n"]["name"]
            top_n_cid_list.append(cid)
            top_cid_to_name_dict[cid]=name
        # get path 
        print(top_n_cid_list)         
        sequence_recommended=self.get_road(top_cid_to_name_dict,top_n_cid_list)
        return sequence_recommended
    
    def _get_concept_recommendation(self, user_id='66e07565733de02be8699540', mid='673885ff3947b4186d3cf1a3'):
        # Get concepts that doesn't interact with user
        # related to candidate concept
        concept_list = self.get_concept_has_not_read(user_id, mid)
        #sequence recommendation candidate concept set
        sequence_concept_list = self.get_prerequisite_concept_has_not_read(user_id, mid)
        user = self.get_user(user_id)

        # compute the similarity between user and concepts with cos-similarity and select top-5 recommendation concept
        recommend_concepts = self.recommendation.recommend(concept_list, user, top_n=5)
        sequence_path = self.sequence_recommend(sequence_concept_list, user, top_n=5)

        for i in recommend_concepts:
            info = i["n"]["name"] + " : " + str(i["n"]["score"])
            logger.info(info)

        # # Use paths for interpretability
        recommend_concepts = self._get_road(recommend_concepts, user_id, mid)

        resp = get_serialized_concepts_data(recommend_concepts)
        return resp,sequence_path

test = DBConnection()
test._get_concept_recommendation()
