import os

STANFORDCORENLP = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "app",
        "algorithm",
        "stanford-corenlp-full-2018-02-27",
    )
)

ELMO_WEIGHT_FILE = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "app",
        "algorithm",
        "elmo_2x4096_512_2048cnn_2xhighway_weights.hdf5",
    )
)

ELMO_OPTIONS_FILE = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "app",
        "algorithm",
        "elmo_2x4096_512_2048cnn_2xhighway_options.json",
    )
)


class Config(object):
    DEBUG = False
    TESTING = False
    SECRET_KEY = "secret"
    NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "1234qwer!")
    STANFORDCORENLP = STANFORDCORENLP
    ELMO_OPTIONS_FILE = ELMO_OPTIONS_FILE
    ELMO_WEIGHT_FILE = ELMO_WEIGHT_FILE
