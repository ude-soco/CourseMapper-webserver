import pymongo
import pandas as pd

class CourseMaterials:
    def __init__(self, course_name = None, course_id = None):
        self.materials = pd.DataFrame()
        self.course_name = course_name
        self.course_id = course_id
        self.list_of_learning_materials()


    def list_of_learning_materials(self):
        myclient = pymongo.MongoClient("mongodb://localhost:27017/")
        mydb = myclient["coursemapper_v2"]
        courses= mydb["courses"]
        channels_id= []
        try:
            query = {"_id": self.course_id}
            for x in courses.find(query):
                channels_id += x["channels"] 
        except:
            query = {"name": self.course_name} 
            for x in courses.find(query):
                channels_id += x["channels"]

        query = {"_id": {"$in": channels_id}} 
        channels = mydb["channels"]
        channels_creation = []
        materials_id = []
        for x in channels.find(query):
            channels_creation += [{"channelId":x["_id"],
                                "createdAt":x["createdAt"]}]
            materials_id += x["materials"]

        learning_materials = mydb["materials"]
        materials =[]
        query = {"_id": {"$in": materials_id}}

        for x in learning_materials.find(query):
            materials +=[{"id" : x['_id'],
                        "name": x["name"],
                        "channelId": x["channelId"]}]

        channels = pd.DataFrame(channels_creation)
        materials = pd.DataFrame(materials)
        self.materials = materials.merge(channels, how="left", on="channelId")

    def get_list_of_materials(self):
        return self.materials

