from course_materials import CourseMaterials
from data_cleaning import DataCleaning
import pandas as pd
from neo4j_connection import DBConnection
from prerequisite_relationship import Prerequisite

class Prerequisite:
    def __init__(self,course_name = "precalc") -> None:
        self.course_name = course_name

    def find_prerequisite(self):
 
        print("get list of courses")
        mongodb = CourseMaterials(course_name=self.course_name)
        learning_materials = mongodb.get_list_of_materials()


        print("get concepts from neo4j")
        concepts = pd.DataFrame()
        db = DBConnection()
        for _,lm in learning_materials.iterrows():
            concepts_one = db.extract_concepts(learning_material=lm["name"])
            concepts_one["createdAt"] = lm["createdAt"]
            concepts = pd.concat([concepts,concepts_one],ignore_index=True)

        
        print("clean data")
        clean_data = DataCleaning(concepts)
        concept_dict = clean_data.get_clean_data()
        related_relationships = clean_data.get_related_relationships()


        print("find prerequisite")
        prerequisite = Prerequisite(concept_dict,related_relationships)
        prerequisite_relationships = prerequisite.get_prerequisite_relationships()


        print("Add relationships to graph")


        for _,r in prerequisite_relationships.iterrows():
            try:
                db.add_prerequisite_connections(r["prerequisite_concept"],r["concept"],r["score_weighted"],r["score_unweighted"])
            except Exception as e:
                print(e)