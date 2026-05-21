from pymongo import MongoClient
from ..config import Config




class MongoDBConnection:

    def __init__(self):
        self.uri = Config.MONGO_DB_URI
        self.db_name = Config.MONGO_DB_NAME

        self.client = MongoClient(self.uri)
        self.db = self.client[self.db_name]
           
    def get_collection(self, name):
        return self.db[name]

    def close(self):
        if self.client:
            self.client.close()