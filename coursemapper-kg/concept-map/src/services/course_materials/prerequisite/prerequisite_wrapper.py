import pandas as pd
import pymongo
from bson.objectid import ObjectId

from config import Config
from .course_materials import CourseMaterials
from .data_cleaning import DataCleaning
from .neo4j_connection import DBConnection
from .prerequisite_relationship import PrerequisiteRelationship

class Prerequisite:
    def __init__(self,course_name = None, course_id = None) -> None:
        self.course_name = course_name
        self.course_id = course_id
        self.db = DBConnection()
        self.concepts = pd.DataFrame()

    def find_prerequisite_course(self):
        print("get list of courses")
        mongodb = CourseMaterials(course_id=self.course_id,course_name=self.course_name)
        learning_materials = mongodb.get_list_of_materials()


        print("get concepts from neo4j")
       
        
        for _,lm in learning_materials.iterrows():
            self.find_prerequisite_one(lm)
        
        self.find_prerequsite_all()

    
    def find_prerequisite_lm(self,lm=None):
        self.find_prerequisite_one(lm)
        self.find_prerequsite_all()

    def find_prerequisite_one(self,lm):
        concepts_one = self.db.extract_concepts(learning_material=lm["id"])
        concepts_one["createdAt"] = lm["createdAt"]
        self.concepts = pd.concat([self.concepts,concepts_one],ignore_index=True)
        print("concepts", self.concepts)

    
    def find_prerequsite_all(self):

        print("clean data")
        clean_data = DataCleaning(self.concepts)
        print("clean_data= concepts", clean_data)
        concept_dict = clean_data.get_clean_data()
        print("concept_dict", concept_dict)



        related_relationships = clean_data.get_related_relationships()
        print("related_relationships", related_relationships)

        concept_dict.to_csv("clean_data_simple.csv")
        concept_dict = pd.read_csv("clean_data_simple.csv", index_col=0)



        print("find prerequisite")
        prerequisite = PrerequisiteRelationship(concept_dict,related_relationships)
        print("prerequisite", prerequisite)
        prerequisite_relationships = prerequisite.get_prerequisite_relationships()
        #results 
        prerequisite_relationships.to_csv("prerequisite_relationships_datamining.csv")

        print("Add relationships to graph")


        for _,r in prerequisite_relationships.iterrows():
            try:
                self.db.add_prerequisite_connections(r["prerequisite_concept"],r["concept"],r["score_weighted"],r["score_unweighted"])
            except Exception as e:
                print(e)


def run_prerequisite_material(material_id):
    myclient = pymongo.MongoClient(Config.MONGO_DB_URI)
    mydb = myclient[Config.MONGO_DB_NAME]

    material_name = None
    course_id = None
    course_name = None

    # Get material name and course id
    material = mydb.materials.find_one(ObjectId(material_id))
    if material is None:
        raise Exception("Material not found")

    material["id"] = material_id
    course_id = material["courseId"]

    # Get course name
    course = mydb.courses.find_one(ObjectId(course_id))
    course_name = course["name"]

    myclient.close()

    prerequisite = Prerequisite(course_name=course_name, course_id=course_id)
    print("prerequisite wrapper file", prerequisite)
    # prerequisite.find_prerequisite_lm(material)find_prerequisite_course
    prerequisite.find_prerequisite_course()
