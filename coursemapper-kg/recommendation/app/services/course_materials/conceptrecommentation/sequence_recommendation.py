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
        # Get_user_embedding and convert str to array
        user_embedding_str = user[0]["u"]["embedding"].split(',')
        list2 = []
        for j in user_embedding_str:
            list2.append(float(j))
        user_embedding = np.array(list2)

        # Get the CIDs of sequence candidate concept list
        list_of_cids = []
        for concept in sequence_concept_list:
             concept_embedding_str = concept["n"]["final_embedding"].split(',')
             list_of_cids.append(concept["n"]["cid"])
             list2 = []
             for j in concept_embedding_str:
                list2.append(float(j))
             concept_embedding= np.array(list2)
             concept["n"]["score"] = self.compute_cos_sim_score(concept_embedding, user_embedding)

        # Get the top-n sequence recommended concept
        top_n_concepts = sorted(sequence_concept_list, key=lambda x: x["n"]["score"], reverse=True)[0:top_n]

        # Get top_n_concept cid list and cid_to_name dict
        top_n_cid_list = []
        top_cid_info = {}
        for topn_concept in top_n_concepts:
            cid = topn_concept["n"]["cid"]
            name = topn_concept["n"]["name"]
            score = topn_concept["n"]["score"]
            type = topn_concept["n"]["type"]
            uri = topn_concept["n"]["uri"]
            wiki = topn_concept["n"]["wikipedia"]
            abstract = topn_concept["n"]["abstract"]
            top_n_cid_list.append(cid)
            top_cid_info[cid]={
                "name":name,
                "score":score,
                "type":type,
                "uri":uri,
                "wiki":wiki,
                "abstract":abstract
            }

        # Get path
        # logger.info(top_n_cid_list)
        logger.info("Start sequence recommendation")
        sequence_recommended=self.get_road(top_cid_info,top_n_cid_list)
        return sequence_recommended

    def compute_cos_sim_score(self, embedding1, embedding2):
        """
        """
        # cos_sim = util.cos_sim(embedding1, embedding2)
        # score = round(cos_sim.item(), 2)

        return util.cos_sim(embedding1, embedding2).item()

    def get_road(self,top_cid_info,cid_list):
        """
        """
        logger.info("get_groupedPaths_and_isolatedNodes")
        with self.driver.session() as session:
            result = session.run(
                """
                // Accept a list of CIDs as input
                WITH $cid AS targetCIDs

                // Unwind and filter for real nodes
                UNWIND targetCIDs AS startCID
                MATCH (startNode:Concept {cid: startCID})

                // Traverse only from those nodes to connected nodes via PREREQUISITE_TO
                OPTIONAL MATCH path = (startNode)-[:PREREQUISITE_TO*1..3]->(endNode:Concept)
                WHERE endNode.cid IN targetCIDs

                // Get only cids from paths
                WITH collect(DISTINCT [n IN nodes(path) WHERE n.cid IN targetCIDs | n.cid]) AS groupedPaths, targetCIDs

                // Flatten & deduplicate all found CIDs
                WITH groupedPaths, REDUCE(flat=[], p IN groupedPaths | flat + p) AS allPathCIDs, targetCIDs
                UNWIND allPathCIDs AS cid
                WITH groupedPaths, collect(DISTINCT cid) AS allConnectedCIDs, targetCIDs

                // Identify isolated nodes (in targetCIDs but not in any path)
                WITH groupedPaths, [cid IN targetCIDs WHERE NOT cid IN allConnectedCIDs] AS isolatedNodes

                RETURN groupedPaths, isolatedNodes

                """,
                cid=cid_list,
        ).data()

        result = list(result)
        # logger.info(result)
        if not result:
            print("No data returned from the query.")
            groupedPaths = []
            isolatedNodes = cid_list
        else:
            # Get groupedPaths,the concept in groupedPaths are all in top_n_recommended_concepts
            groupedPaths = result[0]['groupedPaths']
            # The nodes in the isolated nodes are part of the recommended top_n nodes, but they are not connected to other top_n nodes and need to be processed separately.
            isolatedNodes = result[0]['isolatedNodes']

        # For isolated nodes, directly convert to the final output format
        isolated_sequence = []
        for cid in isolatedNodes:
            if cid in top_cid_info:
                isolated_sequence.append([{'name': top_cid_info[cid].get("name"),'cid': cid,'score':top_cid_info[cid].get("score"),'type':top_cid_info[cid].get("type"),'uri':top_cid_info[cid].get("uri"),'wiki':top_cid_info[cid].get("wiki"),"abstract": top_cid_info[cid].get("abstract")}])

        # For recommended sequence, first deduplicate by name and remove subpaths, then convert to the final output format
        grouped_sequence = []
        for path in groupedPaths:
            transformed_path = []
            for cid in path:
                transformed_path.append({'name': top_cid_info[cid].get("name"),'cid': cid,'score':top_cid_info[cid].get("score"),'type':top_cid_info[cid].get("type"),'uri':top_cid_info[cid].get("uri"),'wiki':top_cid_info[cid].get("wiki"),"abstract": top_cid_info[cid].get("abstract")})
            grouped_sequence.append(transformed_path)
        # Deduplicate and prune overlapping paths
        grouped_sequence = self.deduplicate_by_name(grouped_sequence)
        grouped_sequence = self.remove_subpaths(grouped_sequence)

        final_sequence = grouped_sequence + isolated_sequence
        output = {"nodes": []}
        for group in final_sequence:
            node_data = {"data": [{"cid": item["cid"], "name": item["name"],"score": item["score"],"type": item["type"],"uri": item["uri"],"wikipedia": item["wiki"],"abstract": item["abstract"]} for item in group]}
            output["nodes"].append(node_data)
        # print(output)
        return output

    # Remove duplicate nodes within paths and duplicate path-name sets
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

    # Remove paths that are sub-sequences of longer paths
    def remove_subpaths(self, grouped_sequence):
        if not grouped_sequence:
            return grouped_sequence

        # Sort by length descending so longer paths come first
        sorted_paths = sorted(grouped_sequence, key = len, reverse = True)
        result = []
        seen_edges = set()

        for path in sorted_paths:
            path_names = [node['name'] for node in path]
            is_subpath = False
            for longer in result:
                longer_names = [node['name'] for node in longer]
                if self.is_subsequence(path_names, longer_names):
                    is_subpath = True
                    break
            if is_subpath:
                continue

            # Remove path if it contains any edge already used
            path_edges = [(path_names[i], path_names[i + 1]) for i in range(len(path_names) - 1)]
            if any(edge in seen_edges for edge in path_edges):
                continue

            result.append(path)
            seen_edges.update(path_edges)

        return result

    # Check if 'short' is a contiguous sub-sequence of 'long'
    @staticmethod
    def is_subsequence(short, long):
        if len(short) >= len(long):
            return False
        for i in range(len(long) - len(short) + 1):
            if long[i:i + len(short)] == short:
                return True
        return False