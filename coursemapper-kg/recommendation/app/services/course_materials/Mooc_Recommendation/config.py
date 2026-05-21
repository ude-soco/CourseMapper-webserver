import os
from dotenv import load_dotenv, find_dotenv


class Config:

    load_dotenv(find_dotenv())

    NEO4J_URI = os.getenv("NEO4J_URI")
    NEO4J_USER = os.getenv("NEO4J_USER")
    NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
    NEO4J_URI_MOOC = os.getenv("NEO4J_URI_MOOC")
    NEO4J_USER_MOOC = os.getenv("NEO4J_USER_MOOC")
    NEO4J_PASSWORD_MOOC = os.getenv("NEO4J_PASSWORD_MOOC")
    MONGO_DB_URI = os.getenv("MONGO_DB_URI")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
