import logging
from log import LOG
from neo4j import GraphDatabase
from typing import List, Dict, Any, Optional, Set, Tuple
from config import Config

logger = LOG(name=__name__, level=logging.DEBUG)

class SubgraphExtractor:
	"""Subgraph extraction module"""

	def __init__(self):
		neo4j_uri = Config.NEO4J_URI
		neo4j_user = Config.NEO4J_USER
		neo4j_pass = Config.NEO4J_PASSWORD
		self.driver = GraphDatabase.driver(neo4j_uri,
                                           	   auth=(neo4j_user, neo4j_pass),
                                          	   encrypted=False)

	def close(self):
		self.driver.close()

	def extract_subgraph(self, uid, cid_list, strategy_extract = "method_1"):
		"""
		Extract subgraph based on strategy:
		  - "method_1": find paths from user to DNU to Recommended Concept (<=3 hops)
		  - "method_2": find 2-hop neighborhood of Recommended Concept
		  - "method_3": find paths from user to DNU to Recommended Concept (<=2 hops)
		"""
		if not uid:
			logger.info("No DNU Concepts!")
			return {}

		if not cid_list:
			logger.info("No Recommended Concepts!")
			return {}

		if strategy_extract == "method_1":
			paths = self.paths_n_hops(uid, cid_list, n_hops = 3)
		elif strategy_extract == "method_3":
			paths = self.paths_n_hops(uid, cid_list, n_hops = 2)
		elif strategy_extract == "method_2":
			paths = []
			for cid in cid_list:
				paths.extend(self.concept_two_hop_neighborhood(cid))
		else:
			logger.warning(f"Unknown extract strategy: {strategy_extract}, fallback to method_1")
			paths = self.paths_n_hops(uid, cid_list, n_hops = 3)

		# Group the extracted path records by cid of the recommended concept
		paths_by_cid = {}
		for record in paths:
			cid = record.pop("target_cid")
			paths_by_cid.setdefault(cid, []).append(record)

		return paths_by_cid

    # Extract Method 1/3
	# Fetch paths with cid, length, weights, nodes, edges for each path
	def paths_n_hops(self, uid, cid_list, n_hops = 3):
		logger.info(f"Batch extract paths for {len(cid_list)} concepts, max_hops={n_hops}")
		with self.driver.session() as session:
			result = session.run(f"""
                MATCH p = (u:User)-[r:dnu]->(c)-[*1..{n_hops}]-(d:Concept)
                WHERE u.uid = $uid AND d.cid IN $cids
					AND ALL(rel IN relationships(p)
                    		WHERE toFloat(COALESCE(rel.weight, rel.weighted_weight, 0.0)) > 0.1)
                RETURN d.cid AS target_cid,
                       length(p) AS length,
                       [e IN relationships(p) | toFloat(COALESCE(e.weight, e.weighted_weight, 0.0))] AS weights,
                       [n IN nodes(p) | {{id:id(n), name:n.name, uid:n.uid, cid:n.cid}}] AS nodes,
                       [e IN relationships(p) | {{start:id(startNode(e)), end:id(endNode(e)), type:type(e), weight:toFloat(COALESCE(e.weight, e.weighted_weight, 0.0))}}] AS edges
                """,
                uid = uid,
                cids = cid_list
            ).data()
		return result

	# def paths_two_hops(self, uid, cid):
	# 	logger.info("get road from DNU to Recommended Concept via related concepts in 1 to 2 hops")
	# 	with self.driver.session() as session:
	# 		result = session.run("""
	# 			MATCH p = (u:User)-[r:dnu]->(c:Concept)-[*1..2]->(d:Concept)
    #             WHERE u.uid = $uid AND d.cid = $cid
    #             RETURN length(p) AS length,
	# 					[e IN relationships(p) | e.weight] AS weights,
	# 					[n IN nodes(p) | {id:id(n), name:n.name, embedding:n.final_embedding}] AS nodes,
	# 					[e IN relationships(p) | {start:id(startNode(e)), end:id(endNode(e)), type:type(e), weight:e.weight}] AS edges
	# 					""",
    #                 uid = uid,
    #                 cid = cid).data()
	# 	# print("road",result )
	# 	return result

	# Extract Method 2
	# Fetch paths with cid, length, weights, nodes, edges for each path
	# Expand one hop to include user node
	def concept_two_hop_neighborhood(self, cid):
		logger.info("get all 2-hop neighbors of Recommended Concept")
		with self.driver.session() as session:
			result = session.run("""
				MATCH p = (c)-[*2..3]->(d:Concept)
				WHERE d.cid = $cid
					AND ALL(rel IN relationships(p)
							WHERE toFloat(COALESCE(rel.weight, rel.weighted_weight, 0.0)) > 0.1)
                RETURN d.cid AS target_cid,
                       length(p) AS length,
                       [e IN relationships(p) | toFloat(COALESCE(e.weight, e.weighted_weight, 0.0))] AS weights,
                       [n IN nodes(p) | {id:id(n), name:n.name, uid:n.uid, cid:n.cid}] AS nodes,
                       [e IN relationships(p) | {start:id(startNode(e)), end:id(endNode(e)), type:type(e), weight:toFloat(COALESCE(e.weight, e.weighted_weight, 0.0))}] AS edges
                """,
					cid = cid).data()
		return result

	# Additional method to fetch node embeddings
	def fetch_node_embeddings(self, node_ids):
		"""Batch fetch final_embedding for a list of Neo4j internal node IDs."""
		if not node_ids:
			return {}
		with self.driver.session() as session:
			result = session.run("""
				MATCH (n) WHERE id(n) IN $ids
				RETURN id(n) AS id, n.final_embedding AS embedding
				""", ids=node_ids).data()
		return {r["id"]: r["embedding"] for r in result}