from neo4j import GraphDatabase
import pandas as pd

class DBConnection:
    def __init__(self, uri="bolt://localhost:7687",username="neo4j",password="password",):
        # Define the connection URI, username, and password
        self.uri = uri 
        self.username = username
        self.password = password
        
        self.concepts = []

    def extract_concepts(self,learning_material= "qwer"):
        self.learning_material = learning_material
        main_concepts = self.extract_main_concepts()
        for concept in main_concepts:
            self.extract_related_concepts(concept["name"])
            self.concepts.append(concept)

        self.concept_df = pd.DataFrame.from_dict(self.concepts)
        return self.concept_df
        

    def run_query(self):
        with GraphDatabase.driver(self.uri, auth=(self.username, self.password)) as driver:
            with driver.session() as session:
                result = session.run(self.cypher_query)
                return result.data()
            
    def extract_main_concepts(self):
        self.cypher_query = """MATCH (lm:LearningMaterial {name: '""" + self.learning_material +"""'})-[:LM_CONSISTS_OF]->(concept:Concept {type: 'main_concept'})RETURN concept"""
        concepts = []
        results = self.run_query()
        for record in results:
                concept = {
                "name": record["concept"]["name"],
                "uri": record["concept"]["uri"],
                "wikipedia": record["concept"]["wikipedia"],
                "abstract": record["concept"]["abstract"],
                "cid": record["concept"]["cid"],
                "type":record["concept"]["type"],
                "related_to": None
                }
                concepts.append(concept)
        return concepts

    def extract_related_concepts(self,name):
        # Define the Cypher query
        self.cypher_query = """MATCH (lm:LearningMaterial {name: '""" + self.learning_material +"""'})-[:LM_CONSISTS_OF]->(concept:Concept {name: '""" + name +"""'})-[:RELATED_TO*]->(related:Concept) RETURN concept,related"""

        
        results = self.run_query()
        for record in results:
            try:
                concept = {
                "name": record["related"]["name"],
                "uri": record["related"]["uri"],
                "wikipedia": record["related"]["wikipedia"],
                "abstract": record["related"]["abstract"],
                "cid": record["related"]["cid"],
                "type":record["related"]["type"],
                "related_to": name
                }
                self.concepts.append(concept)
            except:
                pass

    def add_prerequisite_connections(self,c1,c2,weighted_weight,unweighted_weight):
        self.cypher_query = """MERGE (concept1:Concept {name: '""" + c1 +"""'}) MERGE (concept2:Concept {name: '""" + c2 +"""'}) MERGE (concept1)-[:PREREQUISITE_TO {unweighted_weight: '""" + str(unweighted_weight) +"""',weighted_weight: '""" + str(weighted_weight) +"""'}]->(concept2)"""
        self.run_query()
        

