import os

class Config:
    PIPELINES = os.getenv('PIPELINES', 'concept-map,modify-graph,expand-material').split(',')

    WIKIPEDIA_USER_AGENT = os.getenv('WIKIPEDIA_USER_AGENT', 'CourseMapper (coursemapper@example.com)')
    WIKIPEDIA_FALLBACK = os.getenv('WIKIPEDIA_FALLBACK', 'true').lower() == 'true'
    WIKIPEDIA_DATABASE_CONNECTION_STRING = os.getenv('WIKIPEDIA_DATABASE_CONNECTION_STRING', '')
    WIKIPEDIA_USE_STORED_EMBEDDINGS = os.getenv('WIKIPEDIA_USE_STORED_EMBEDDINGS', 'true').lower() == 'true'

    REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
    REDIS_DB = int(os.getenv('REDIS_DB', '0'))
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)
    REDIS_USE_CACHE = os.getenv('REDIS_USE_CACHE', 'true').lower() == 'true'

    NEO4J_URI = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
    NEO4J_USER = os.getenv('NEO4J_USER', 'neo4j')
    NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD', '1234qwer!')
    NEO4J_SAVE_TO_DB = os.getenv('NEO4J_SAVE_TO_DB', 'true').lower() == 'true'

    MONGO_DB_URI = os.environ.get("MONGO_DB_URI")
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME")

    DBPEDIA_SPOTLIGHT_URL = os.getenv('DBPEDIA_SPOTLIGHT_URL', 'https://dbpedia-spotlight-en.soco.inko.cloud/rest/annotate')
    # Uncomment the line below to use the official DBpedia Spotlight API
    # DBPEDIA_SPOTLIGHT_URL = os.getenv('DBPEDIA_SPOTLIGHT_URL', 'https://api.dbpedia-spotlight.org/en/annotate')
    DBPEDIA_SPOTLIGHT_CONFIDENCE = float(os.getenv('DBPEDIA_SPOTLIGHT_CONFIDENCE', '0.35'))
    DBPEDIA_SPOTLIGHT_SUPPORT = int(os.getenv('DBPEDIA_SPOTLIGHT_SUPPORT', '5'))

    EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'all-mpnet-base-v2')
    KEYPHRASE_MIN_LENGTH = float(os.getenv('KEYPHRASE_MIN_LENGTH', '3'))
    TOP_N_KEYPHRASES = int(os.getenv('TOP_N_KEYPHRASES', '15'))
    WEIGHT_THRESHOLD = float(os.getenv('WEIGHT_THRESHOLD', '0.192'))
    TOP_N_RELATED_CATEGORIES = int(os.getenv('TOP_N_RELATED_CATEGORIES', '3'))
    TOP_N_RELATED_CONCEPTS = int(os.getenv('TOP_N_RELATED_CONCEPTS', '20'))

    @staticmethod
    def dump_to_str() -> str:
        return f'WIKIPEDIA_USER_AGENT={Config.WIKIPEDIA_USER_AGENT}\n' \
               f'WIKIPEDIA_FALLBACK={Config.WIKIPEDIA_FALLBACK}\n' \
               f'WIKIPEDIA_DATABASE_CONNECTION_STRING={Config.WIKIPEDIA_DATABASE_CONNECTION_STRING}\n' \
               f'WIKIPEDIA_USE_STORED_EMBEDDINGS={Config.WIKIPEDIA_USE_STORED_EMBEDDINGS}\n' \
               f'REDIS_HOST={Config.REDIS_HOST}\n' \
               f'REDIS_PORT={Config.REDIS_PORT}\n' \
               f'REDIS_DB={Config.REDIS_DB}\n' \
               f'REDIS_PASSWORD={Config.REDIS_PASSWORD}\n' \
               f'REDIS_USE_CACHE={Config.REDIS_USE_CACHE}\n' \
               f'NEO4J_URI={Config.NEO4J_URI}\n' \
               f'NEO4J_USER={Config.NEO4J_USER}\n' \
               f'NEO4J_PASSWORD={Config.NEO4J_PASSWORD}\n' \
               f'NEO4J_SAVE_TO_DB={Config.NEO4J_SAVE_TO_DB}\n' \
               f'DBPEDIA_SPOTLIGHT_URL={Config.DBPEDIA_SPOTLIGHT_URL}\n' \
               f'DBPEDIA_SPOTLIGHT_CONFIDENCE={Config.DBPEDIA_SPOTLIGHT_CONFIDENCE}\n' \
               f'DBPEDIA_SPOTLIGHT_SUPPORT={Config.DBPEDIA_SPOTLIGHT_SUPPORT}\n' \
               f'EMBEDDING_MODEL={Config.EMBEDDING_MODEL}\n' \
               f'KEYPHRASE_MIN_LENGTH={Config.KEYPHRASE_MIN_LENGTH}\n' \
               f'TOP_N_KEYPHRASES={Config.TOP_N_KEYPHRASES}\n' \
               f'WEIGHT_THRESHOLD={Config.WEIGHT_THRESHOLD}\n' \
               f'TOP_N_RELATED_CATEGORIES={Config.TOP_N_RELATED_CATEGORIES}\n' \
               f'TOP_N_RELATED_CONCEPTS={Config.TOP_N_RELATED_CONCEPTS}\n' \
               f'MONGO_DB_URI={Config.MONGO_DB_URI}\n' \
               f'MONGO_DB_NAME={Config.MONGO_DB_NAME}\n' \
