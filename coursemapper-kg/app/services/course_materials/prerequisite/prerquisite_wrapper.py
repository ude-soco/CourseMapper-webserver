from course_materials import CourseMaterials
from data_cleaning import DataCleaning
import pandas as pd
from neo4j_connection import DBConnection
from prerequisite_relationship import PrerequisiteRelationship as Prerequisite

class Prerequisite:
    def __init__(self) -> None:
        pass
    def find_prerequisite(self,course_name = 'Deine mutter'):
        mongodb = CourseMaterials(course_name=course_name)
        learning_materials = mongodb.get_list_of_materials()

        concepts = pd.DataFrame()
        db = DBConnection()
        for _,lm in learning_materials.iterrows():
            concepts_one = db.extract_concepts(learning_material=lm["name"])
            concepts_one["createdAt"] = lm["createdAt"]
            concepts = pd.concat([concepts,concepts_one],ignore_index=True)
        
        clean_data = DataCleaning(concepts)
        concept_dict = clean_data.get_clean_data()
        related_relationships = clean_data.get_related_relationships()

        prerequisite = Prerequisite(concept_dict,related_relationships)
        prerequisite_relationships = prerequisite.get_prerequisite_relationships()


        for _,r in prerequisite_relationships.iterrows():
            db.add_prerequisite_connections(r["prerequisite_concept"],r["concept"],r["score_weighted"],r["score_unweighted"])