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
            print(concept["name"])
            self.extract_related_concepts(concept["name"])
            self.concepts.append(concept)

        self.concept_df = pd.DataFrame.from_dict(self.concepts)
        return self.concept_df
        

    def run_query(self):
        with GraphDatabase.driver(self.uri, auth=(self.username, self.password)) as driver:
            with driver.session() as session:
                result = session.run(self.cypher_query)
                return result.data()

            
    def extract_main_concepts_query(self, tx,lm):
        result = tx.run("""MATCH (lm:LearningMaterial {name: $name})-[:LM_CONSISTS_OF]->(concept:Concept {type: 'main_concept'})RETURN concept""",name=self.learning_material)
        return list(result)
    
    def extract_main_concepts(self):
        self.learning_material = self.learning_material.replace("'", "\\'")
        concepts = []
        try:
            with GraphDatabase.driver(self.uri, auth=(self.username, self.password)) as driver:
                with driver.session() as session:
                    results = session.execute_read(self.extract_main_concepts_query,self.learning_material)
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
        except Exception as e:
            print(e)
            return None
    
    def extract_related_concepts_query(self,tx,name,lm):
        result = tx.run("""MATCH (lm:LearningMaterial {name: $lm})-[:LM_CONSISTS_OF]->(concept:Concept {name: $name})-[:RELATED_TO]->(related:Concept) RETURN concept,related""",lm=self.learning_material,name=name)
        return list(result)

    def extract_related_concepts(self,name):
        # Define the Cypher query
        self.learning_material = self.learning_material.replace("'", "\\'")
        name = name.replace("'", "\\'")

        with GraphDatabase.driver(self.uri, auth=(self.username, self.password)) as driver:
            with driver.session() as session:
                results = session.execute_read(self.extract_related_concepts_query,name,self.learning_material)
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

    def add_prerequisite_connections_query(self,tx,c1,c2,unweighted_weight,weighted_weight):
        unweighted_weight = str(unweighted_weight)
        weighted_weight = str(weighted_weight)
        result = tx.run("""
            MATCH (concept1:Concept {name: $c1})-[r:PREREQUISITE_TO]->(concept2:Concept {name: $c2})
            RETURN r
            """, c1=c1, c2=c2)

        # If no relationship exists, create one
        if not result.single(): 
            tx.run("""
            MERGE (concept1:Concept {name: $c1})
            MERGE (concept2:Concept {name: $c2})
            MERGE (concept1)-[:PREREQUISITE_TO {unweighted_weight: $unweighted_weight, weighted_weight: $weighted_weight}]->(concept2)
            """, c1=c1, c2=c2, unweighted_weight=unweighted_weight, weighted_weight=weighted_weight)
    
    def add_prerequisite_connections(self,c1,c2,weighted_weight,unweighted_weight):
        c1 = c1.replace("'", "\\'")
        c2 = c2.replace("'", "\\'")
        with GraphDatabase.driver(self.uri, auth=(self.username, self.password)) as driver:
            with driver.session() as session:
                session.execute_write(self.add_prerequisite_connections_query,c1,c2,unweighted_weight,weighted_weight)
        

