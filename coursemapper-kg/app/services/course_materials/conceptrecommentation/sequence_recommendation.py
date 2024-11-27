import numpy as np
from sentence_transformers import util
import logging
from log import LOG
from neo4j import GraphDatabase
from config import Config
logger = LOG(name=__name__, level=logging.DEBUG)

class Sequence_recommendation:
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

    def sequence_recommend(self,sequence_concept_list,user,top_n):

        #get_user_embedding and convert str to array
        user_embedding_str = user[0]["u"]["embedding"].split(',')
        list2 = []
        for j in user_embedding_str:
            list2.append(float(j))
        user_embedding = np.array(list2)

        #get the CIDs of sequence candidate concept list 
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
        
        # get top_n_concept cid list and cid_to_name dict
        top_n_cid_list = []
        top_cid_to_name_dict = {}
        for topn_concept in top_n_concepts:
            cid = topn_concept["n"]["cid"]
            name = topn_concept["n"]["name"]
            top_n_cid_list.append(cid)
            top_cid_to_name_dict[cid]=name
        
        # get path 
        logger.info(top_n_cid_list)       
        logger.info("Star sequence recommendation")
        sequence_recommended=self.get_road(top_cid_to_name_dict,top_n_cid_list)
        return sequence_recommended

    def compute_cos_sim_score(self, embedding1, embedding2):
        """ 
        """
        # cos_sim = util.cos_sim(embedding1, embedding2)
        # score = round(cos_sim.item(), 2)

        return util.cos_sim(embedding1, embedding2).item()
    
    def get_road(self,cid_to_name,cid_list):
        """
        """
        logger.info("get_groupedPaths_and_isolatedNodes")
        with self.driver.session() as session:
            result = session.run(
                """
                WITH $cid AS targetCIDs

                // Find the starting node
                MATCH (startNode)
                WHERE startNode.cid IN targetCIDs

                // Find all paths connected by PREREQUISITE_TO
                OPTIONAL MATCH path = (startNode)-[:PREREQUISITE_TO*]->(endNode)
                WHERE endNode.cid IN targetCIDs

                // Collect the target node CID in the path
                WITH collect([node IN nodes(path) WHERE node.cid IN targetCIDs | node.cid]) AS groupedPaths, targetCIDs

                // Remove duplicate paths (mimic apoc.coll.toSet using DISTINCT)
                UNWIND groupedPaths AS path
                WITH DISTINCT path AS uniquePaths, targetCIDs
                WITH collect(uniquePaths) AS groupedPaths, targetCIDs

                // Flatten groupedPaths and calculate the isolated nodes
                WITH groupedPaths, [cid IN targetCIDs WHERE NOT cid IN REDUCE(flat=[], x IN groupedPaths | flat + x)] AS isolatedNodes

                // Return the result with the CIDs in the path and the CIDs of the isolated nodes
                RETURN groupedPaths, isolatedNodes
                """,
                cid=cid_list,
        ).data()

        result = list(result)
        # get groupedPaths,the concept in groupedPaths are all in top_n_recommended_concepts
        groupedPaths = result[0]['groupedPaths']
        # The nodes in the isolated nodes are part of the recommended top_n nodes, but they are not connected to other top_n nodes and need to be processed separately.
        isolatedNodes = result[0]['isolatedNodes']

        isolated_sequence = []  
        for cid in isolatedNodes:
            if cid in cid_to_name:
                isolated_sequence.append([{'name': cid_to_name.get(cid),'cid': cid}])

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
        # seen = set()  # Used to store combinations of names that have already appeared
        # result = []
        
        # for path in data:
        #     # Extract the name combination of the current path to a collection
        #     names = frozenset(node['name'] for node in path)
        #     if names not in seen:
        #         seen.add(names)  # Marked as processed
        #         result.append(path)  # Preserve the original sub-list
        seen_combinations = set()  # Store combinations of names already seen
        result = []
        
        for path in data:
            # Remove duplicates in sublist
            unique_path = []
            seen_names = set()
            for node in path:
                if node['name'] not in seen_names:
                    unique_path.append(node)
                    seen_names.add(node['name'])
            
            # If all names in the sublist are the same, skip it directly
            if len(set(node['name'] for node in unique_path)) == 1:
                continue
            
            # Remove duplicates between sublists
            name_combination = frozenset(node['name'] for node in unique_path)
            if name_combination not in seen_combinations:
                seen_combinations.add(name_combination)
                result.append(unique_path)
    
        return result