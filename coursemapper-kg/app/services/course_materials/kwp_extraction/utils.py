import os
from stanfordcorenlp import StanfordCoreNLP

from .embeddings.word_embeddings.base import BaseWordEmbedder
from .embeddings.word_embeddings.flair_transformers_word_emb import (
    FlairTransformerWordEmbeddings,
)

from .taggers.base import BasePOSTagger
from .taggers.stanford_core_nlp_tagger import StanfordCoreNLPTagger
from .taggers.flair_tagger import FlairTagger


stanfordcorenlp_file = os.path.abspath(
    os.path.join(
        "app",
        "algorithms",
        "stanford-corenlp-full-2018-02-27",
    )
)


def get_word_embedder(embedding_model) -> BaseWordEmbedder:
    """
    Get the word embedder
    Arguments:
        embedding_model: the word embedding model
    Returns:

    """
    if isinstance(embedding_model, BaseWordEmbedder):
        return embedding_model
    if "TransformerWordEmbeddings" in str(type(embedding_model)):
        return FlairTransformerWordEmbeddings(embedding_model)
    if isinstance(embedding_model, str) and embedding_model != "":
        return FlairTransformerWordEmbeddings(embedding_model)

    return FlairTransformerWordEmbeddings("bert-base-uncased")


def get_POSTagger(tagger_model) -> BasePOSTagger:
    """
    Get the POS tagger
    Arguments:
        tagger_model: the POS tagger model
    Returns:

    """
    if isinstance(tagger_model, BasePOSTagger):
        return tagger_model
    if isinstance(tagger_model, str) and tagger_model != "":
        return FlairTagger(tagger_model)
    if isinstance(tagger_model, StanfordCoreNLP):
        return StanfordCoreNLPTagger(tagger_model)
    return StanfordCoreNLPTagger(StanfordCoreNLP(stanfordcorenlp_file, quiet=True))
