import numpy as np
from flair.embeddings import TransformerWordEmbeddings
from flair.data import Sentence
from typing import List


class FlairTransformerWordEmbeddings:
    """
    TransformerWordEmbeddings
    https://github.com/flairNLP/flair/blob/master/resources/docs/embeddings/TRANSFORMER_EMBEDDINGS.md 
    Arguments:
        embedding_model: a flair transformer word embedding
    """
    def __init__(self, embedding_model: TransformerWordEmbeddings):
        self.embedding_model = embedding_model

    def get_tokenized_words_embeddings(
            self, tokenized_sentences: List[List[str]]) -> np.ndarray:
        """
        Embed the tokenized sentences into an n-dimensional matrix of embeddings
        Arguments:
            tokenized_sentences: 2D list of tokenized sentences
        Returns:
            ndarray words embeddings with shape (len(sentences), 1, dimension of embeddings)
        """
        temp_embeddings = []
        for i in range(0, len(tokenized_sentences)):
            sentence = Sentence(tokenized_sentences[i])
            self.embedding_model.embed(sentence)
            sentence_np = np.array(
                [token.embedding.detach().cpu().numpy() for token in sentence])
            sentence.clear_embeddings()
            emb = np.zeros((1, sentence_np.shape[0], sentence_np.shape[1]))
            emb[0] = sentence_np
            temp_embeddings.append(emb)

        _max = max(map(lambda x: (x.shape[1], x.shape[2]), temp_embeddings))
        embeddings = []
        for n in temp_embeddings:
            embedding = np.zeros((1, _max[0], _max[1]), dtype=float)
            embedding[0:n.shape[0], 0:n.shape[1], 0:n.shape[2]] = n
            embeddings.append(embedding)

        embeddings = np.asarray(embeddings)
        return embeddings
