import os

STANFORDCORENLP = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "app",
        "algorithm",
        "stanford-corenlp-full-2018-02-27",
    )
)


class Config(object):
    NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "1234qwer!")
    REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.environ.get("REDIS_PORT", "6379"))
    REDIS_DB = int(os.environ.get("REDIS_DB", "0"))
    REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD")
    PIPELINES = os.environ.get("PIPELINES")
    STANFORDCORENLP = STANFORDCORENLP
