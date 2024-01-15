import numpy as np

from .singlerank_method.singlerank import SingleRank
from .utils import get_word_embedder
from .utils import get_POSTagger
from .data_representation.document import Document
from .embeddings.sif_sentence_embedding import SIFSentenceEmbeddings
from typing import Union, List, Tuple
from .method import (
    cos_sim_distance,
    get_all_distances,
    get_final_distance,
    get_position_score,
)
import logging
from log import LOG
from ..exceptions.exceptions import KeyphraseExtractionException

# from .yake.yake import KeywordExtractor

logger = LOG(name=__name__, level=logging.DEBUG)


class KeyphraseExtractor:
    def __init__(self, embedding_model="", tagger_model=None):
        self.tagger = tagger_model
        self.wordembedding_model = get_word_embedder(embedding_model)
        self.embeddings_type = str(type(self.wordembedding_model)).lower()

    def extract_keyphrases(
        self,
        text: str,
        top_n: int = 15,
        elmo_layers_weight=[0.0, 1.0, 0.0],
        lamda: Union[int, float] = 1.0,
        use_doc_segmentation: bool = True,
        use_embedding_alignment: bool = True,
        method: str = "sifrank",
        dataset: str = "",
        position_bias=3.4,
    ) -> List[Tuple[str, float]]:
        """
        Extract Keyphrases
        Arguments:
            text:
            top_n:
            elmo_layers_weight:
            lamda:
            use_doc_segmentation:
            use_embedding_alignment:
            method:
            position_bias:
        Returns:

        """
        try:
            self.tagger_model = get_POSTagger(self.tagger)
            document = Document(tagger_model=self.tagger_model, text=text)
            if not method:
                method = "sifrank"

            if method == "sifrank":
                keyphrases = self.SIFRank(
                    document=document,
                    lamda=lamda,
                    use_doc_segmentation=use_doc_segmentation,
                    use_embedding_alignment=use_embedding_alignment,
                    top_n=top_n,
                    dataset=dataset,
                    elmo_layers_weight=elmo_layers_weight,
                )

                self.tagger_model.close()
                return keyphrases
            elif method == "sifrankplus":
                keyphrases = self.SIFRankPlus(
                    document=document,
                    lamda=lamda,
                    use_doc_segmentation=use_doc_segmentation,
                    use_embedding_alignment=use_embedding_alignment,
                    top_n=top_n,
                    position_bias=position_bias,
                    elmo_layers_weight=elmo_layers_weight,
                )
                self.tagger_model.tagger_model.close()
                return keyphrases
            elif method == "singlerank":
                pos = {"NOUN", "PROPN", "ADJ"}
                extractor = SingleRank()
                extractor.load_document(input=text, language="en")
                extractor.candidate_selection(pos=pos)
                extractor.candidate_weighting(window=10, pos=pos)
                keyphrases = extractor.get_n_best(n=top_n)
                return keyphrases
            # elif method == "yake":
            #     max_ngram_size = 3
            #     num = 1000
            #     custom_kwextractor = KeywordExtractor(
            #         lan="en",
            #         n=max_ngram_size,
            #         dedupLim = 0.7,
            #         top=num,
            #         additional_stopwords=['description', 'literature', 'aufl', 'aufl.', 'auflage', 'und', 'learning', 'targets',
            #                               'pre-qualifications', 'info', 'link', 'notice', 'springer', 'berlin']
            #     )
            #     keyphrases = []
            #     try:
            #         if len(text.strip()) > 0:
            #             keyphrases = custom_kwextractor.extract_keywords(text)
            #     except Exception as e:
            #         print(str(e))
            #
            #     lecture_keywords = []
            #     if len(keyphrases) > 0:
            #         lecture_keywords = self.reverse_yake_weights(keyphrases)
            #
            #     return lecture_keywords
        except Exception as e:
            logger.error("Failed to extract keyphrases", e)
            self.tagger_model.tagger_model.close()
            raise KeyphraseExtractionException("Failed to extract keyphrases - %s" % e)

    def SIFRank(
        self,
        document,
        lamda,
        use_doc_segmentation,
        use_embedding_alignment,
        top_n,
        dataset,
        elmo_layers_weight,
    ):
        """ """
        self.sif_sent_embedding = SIFSentenceEmbeddings(
            wordembedding_model=self.wordembedding_model, lamda=lamda, dataset=dataset
        )

        (
            sentences_embeddings,
            candidates_embeddings,
        ) = self.sif_sent_embedding.get_tokenized_sent_embeddings(
            document, use_doc_segmentation, use_embedding_alignment
        )

        # print('####################################################################################')
        # print('candidates_embeddings length')
        # print(len(candidates_embeddings))
        # print('####################################################################################')

        distances = []
        for i, embedding in enumerate(candidates_embeddings):
            distance = cos_sim_distance(
                sentences_embeddings,
                embedding,
                self.embeddings_type,
                elmo_layers_weight,
            )
            distances.append(distance)

        dist_all = get_all_distances(candidates_embeddings, document, distances)
        keyphrases = get_final_distance(dist_all)
        return sorted(keyphrases.items(), key=lambda x: x[1], reverse=True)[0:top_n]

    def SIFRankPlus(
        self,
        document,
        lamda,
        use_doc_segmentation,
        use_embedding_alignment,
        top_n,
        position_bias,
        elmo_layers_weight,
    ):
        """ """
        self.sif_sent_embedding = SIFSentenceEmbeddings(
            wordembedding_model=self.wordembedding_model, lamda=lamda
        )

        (
            sentences_embeddings,
            candidates_embeddings,
        ) = self.sif_sent_embedding.get_tokenized_sent_embeddings(
            document, use_doc_segmentation, use_embedding_alignment
        )
        position_score = get_position_score(
            document.keyphrases_candidates, position_bias
        )

        average_score = sum(position_score.values()) / (float)(len(position_score))
        distances = []
        for i, embedding in enumerate(candidates_embeddings):
            distance = cos_sim_distance(
                sentences_embeddings,
                embedding,
                self.embeddings_type,
                elmo_layers_weight,
            )
            distances.append(distance)

        dist_all = get_all_distances(candidates_embeddings, document, distances)
        keyphrases = get_final_distance(dist_all)
        for np, distance in keyphrases.items():
            if np in position_score:
                keyphrases[np] = distance * position_score[np] / average_score

        return sorted(keyphrases.items(), key=lambda x: x[1], reverse=True)[0:top_n]

    def reverse_yake_weights(self, keyword_weights):
        weights = [weight for keyword, weight in keyword_weights]
        reverse_weights = weights[::-1]
        reverse_keyphrase_weights = []

        for i in range(len(keyword_weights)):
            reverse_keyphrase_weights.append(
                {"text": keyword_weights[i][0], "value": reverse_weights[i]}
            )

        return reverse_keyphrase_weights
