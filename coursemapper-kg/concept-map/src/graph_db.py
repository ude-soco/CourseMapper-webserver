from neo4j import GraphDatabase, ManagedTransaction
from data import Graph, Node, Edge
import numpy as np

class GraphDB:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password), encrypted=False)

    def close(self):
        self.driver.close()

    def load_graph(self, material_id: str):
        graph = Graph()
        with self.driver.session() as session:
            node_records = session.run("MATCH (n {mid: $mid}) RETURN n", mid=material_id)
            edge_records = session.run("MATCH (a {mid: $mid})-[r]->(b) RETURN a, r, b", mid=material_id)

            for record in node_records:
                node = Node.from_dict(record["n"])
                graph.nodes.append(node)

            for record in edge_records:
                edge = Edge.from_dict(record["r"])
                graph.edges.append(edge)

        return graph

    def save_graph(self, graph: Graph):
        with self.driver.session() as session:
            session.write_transaction(_save_graph, graph)

    def get_node(self, material_id: str, node_id: str):
        records, _, _ = self.driver.execute_query(
            "MATCH (n {mid: $mid, uid: $uid}) RETURN n",
            mid=material_id, uid=node_id)
        if len(records) == 0:
            return None
        return Node.from_dict(records[0]['n'])

    def remove_node(self, material_id: str, node_id: str):
        self.driver.execute_query(
            "MATCH (n {mid: $mid, uid: $uid}) DETACH DELETE n ",
            mid=material_id, uid=node_id)

    def remove_concept_by_name(self, material_id: str, concept_name: str):
        self.driver.execute_query(
            "MATCH (n {mid: $mid, name: $name}) DETACH DELETE n ",
            mid=material_id, name=concept_name)

    def get_concept_by_name(self, material_id: str, concept_name: str):
        records, _, _ = self.driver.execute_query(
            "MATCH (n {mid: $mid, name: $name}) RETURN n",
            mid=material_id, name=concept_name)
        if len(records) == 0:
            return None
        return Node.from_dict(records[0]['n'])
    
    def update_concept_node(self, node):
        """
        Updates the given concept node in Neo4j by setting its isNew and isEditing properties to false.
        """
        self.driver.execute_query("MATCH (c {uid: $cid}) SET c.isNew = false, c.isEditing = false, c.lastEdited = false", cid=node.id)
                                  
    

def _save_graph(tx: ManagedTransaction, graph: Graph):
    # Find material node
    material_node = None
    for node in graph.nodes:
        if node.type == "material":
            material_node = node
            break

    if material_node is None:
        raise ValueError("No material node found")

    # Create nodes
    for node in graph.nodes:
        # Check if node already exists
        result = tx.run("MATCH (n {uid: $id}) RETURN n", id=node.id)
        if len(result.data()) > 0:
            if node.type == "material":
                # If node is a material, update is_draft
                tx.run("MATCH (n {uid: $id}) SET n.is_draft = $is_draft", id=node.id, is_draft=node.is_draft)
            else:
                continue

        if node.type == "material":
            
            tx.run("MERGE (m:LearningMaterial {uid: $mid, mid: $mid, name: $name, type: $type, text: $text, is_draft: $is_draft,isNew: $isNew, isEditing: $isEditing, lastEdited:$lastEdited, embedding_model: $embedding_model}) RETURN m",
                mid=node.id, name=node.name, type=node.type, text=node.text, is_draft=node.is_draft, isNew=node.isNew, isEditing=node.isEditing, lastEdited=False, embedding_model=node.embedding_model)
        elif node.type == "Slide":
            
            # Get slide concept edges
            slide_concept_edges = []
            for edge in graph.edges:
                if edge.source == node.id and edge.type == "CONSISTS_OF":
                    slide_concept_edges.append(edge.target)
            # Get slide concept nodes
            slide_concept_nodes = []
            for concept in graph.nodes:
                for concept_id in slide_concept_edges:
                    if concept.id == concept_id:
                        slide_concept_nodes.append(concept)
                        break
            # Calculate weighted embedding of slide
            sum_embeddings, sum_weights = 0, 0
            for slide_concept_node in slide_concept_nodes:
                if slide_concept_node.embedding is None:
                    continue
                sum_embeddings = (
                    sum_embeddings
                    + np.array(slide_concept_node.embedding) * slide_concept_node.weight
                )
                sum_weights = sum_weights + slide_concept_node.weight
            weighted_embedding_of_concept = np.divide(
                sum_embeddings, sum_weights
            ) if sum_weights > 0 else 0
            tx.run(
                """MERGE (c:Slide {name: $name, uid: $sid, sid: $sid, text: $text, mid: $mid,concepts: $concepts,
                initial_embedding:$initial_embedding,type:$type,
                final_embedding:$final_embedding,weighted_embedding_of_concept:$weighted_embedding_of_concept,isNew: $isNew, isEditing: $isEditing, lastEdited: $lastEdited})""",
                sid=node.id,
                name=node.name,
                text=node.text,
                mid=material_node.id,
                type=node.type,
                concepts=[slide_condept_node.name for slide_condept_node in slide_concept_nodes],
                initial_embedding=",".join(map(str, node.embedding)) if node.embedding is not None else "",
                final_embedding="",
                weighted_embedding_of_concept=weighted_embedding_of_concept,isNew=node.isNew, isEditing=node.isEditing, lastEdited=False)
        else:
            tx.run(
                """
                MERGE (c:Concept {uid: $cid})
                ON CREATE SET 
                c.name = $name,
                c.cid = $cid,
                c.uri = $uri,
                c.type = $type,
                c.mid = $mid,
                c.weight = $weight,
                c.wikipedia = $wikipedia,
                c.abstract = $abstract,
                c.initial_embedding = $initial_embedding,
                c.final_embedding = $final_embedding,
                c.keyphrases = $keyphrases,
                c.isNew = $isNew,
                c.isEditing = $isEditing,
                c.lastEdited = $lastEdited
                ON MATCH SET 
                c.name = $name,
                c.uri = $uri,
                c.type = $type,
                c.mid = $mid,
                c.weight = $weight,
                c.wikipedia = $wikipedia,
                c.abstract = $abstract,
                c.initial_embedding = $initial_embedding,
                c.final_embedding = $final_embedding,
                c.keyphrases = $keyphrases,
                c.isNew = $isNew,
                c.isEditing = $isEditing,
                c.lastEdited = $lastEdited
                RETURN c
                """,
                name=node.name,
                cid=node.id,
                uri=node.uri,
                type=node.type,
                mid=material_node.id,
                weight=node.weight,
                wikipedia=node.wikipedia,
                initial_embedding=",".join(map(str, node.embedding)) if node.embedding is not None else "",
                final_embedding="",
                abstract=node.text,
                keyphrases=node.keyphrases,
                isNew=node.isNew,        # This should be False after expansion for main concepts
                isEditing=node.isEditing,   # This should be False after expansion for main concepts
                lastEdited=node.lastEdited,
        
                )
            # Step 2: Update all other concept nodes for the same material, setting lastEdited to false.
            tx.run(
                    """
                    MATCH (c:Concept)
                    WHERE c.mid = $mid AND c.uid <> $cid AND c.lastEdited = true
                    SET c.lastEdited = false
                    RETURN c
                    """,
                    mid=material_node.id,
                    cid=node.id
                )
    # def update_concept_node(graph, node, material_node):
    # # Use the simpler query to update only the two properties
    #  tx.run(
    #         """
    #         MATCH (c:Concept {uid: $cid})
    #         SET c.isNew = false, c.isEditing = false, c.lastEdited = false
    #         RETURN c
    #         """,
    #         cid=node.id
    #     )        

            

    # Create edges
    for edge in graph.edges:
        if edge.weight is None:
            tx.run(
                """MATCH (a {uid: $source}), (b {uid: $target})
                MERGE (a)-[r:%s]->(b)""" % edge.type,
                source=edge.source,
                target=edge.target,
                relationship=edge.type)
        else:
            tx.run(
                """MATCH (a {uid: $source}), (b {uid: $target})
                MERGE (a)-[r:%s {weight: $weight}]->(b)""" % edge.type,
                source=edge.source,
                target=edge.target,
                relationship=edge.type,
                weight=edge.weight,
                disambiguated_weight=edge.disambiguated_weight)
# def update_concept_node(graph, node, material_node):
#     # Use a transaction to update only the isNew and isEditing properties for the given concept node.
#     with graph.driver.session() as session:
#         tx = session.begin_transaction()
#         tx.run(
#             """
#             MATCH (c:Concept {uid: $cid})
#             SET c.isNew = false, c.isEditing = false
#             RETURN c
#             """,
#             cid=node.id
#         )
#         tx.commit()