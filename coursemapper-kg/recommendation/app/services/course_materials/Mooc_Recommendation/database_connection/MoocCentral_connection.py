from neo4j import GraphDatabase
from ..config import Config

class MoocCentralConnection:

    def __init__(self):

        self.uri = Config.NEO4J_URI_MOOC
        self.user = Config.NEO4J_USER_MOOC
        self.password = Config.NEO4J_PASSWORD_MOOC

        self.driver = GraphDatabase.driver(
            self.uri,
            auth=(self.user, self.password),
            encrypted=False
        )

    def get_session(self):
        return self.driver.session()
    
    def close(self):
        if self.driver:
            self.driver.close()