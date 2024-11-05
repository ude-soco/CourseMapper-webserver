from neo4j import GraphDatabase
import pandas as pd
import os


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
        #Save relationships between nodes in text
        #first column is source node, second column is weight of prerequisite, third column is target node
        with open("./coursemapper-kg/prerequisite.txt", "w") as f:
            # absolute_path = os.path.abspath(f.name)
            # print("absolute path of file:", absolute_path)
            for relationship in prerequisite_relationships:
                f.write(str(relationship["source"]) + " " + str(relationship["weight"]) 
                        + " " + str(relationship["target"])+ "\n")
                


test = DBConnection()
test.prerequisite_relation()
