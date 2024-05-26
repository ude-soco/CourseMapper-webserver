import os
from typing import List
from flair.embeddings import TransformerWordEmbeddings
from stanfordcorenlp import StanfordCoreNLP
from services.sifrank.document import Document
from services.sifrank.sif_sentence_embedding import SIFSentenceEmbeddings
from services.sifrank.method import (
    cos_sim_distance,
    get_all_distances,
    get_final_distance,
)
from services.sifrank.stanford_core_nlp_tagger import StanfordCoreNLPTagger
from services.sifrank.flair_transformers_word_emb import FlairTransformerWordEmbeddings
from config import Config


stanfordcorenlp_file = os.path.abspath("stanford-corenlp-full-2018-02-27")

class KeyphraseService:
    def __init__(self):
        self.model = FlairTransformerWordEmbeddings(TransformerWordEmbeddings(
            "squeezebert/squeezebert-mnli", subtoken_pooling="mean", layers="3,5"
        ))
        self.tagger_model = StanfordCoreNLPTagger(StanfordCoreNLP(
            stanfordcorenlp_file, quiet=True
        ))

    def __del__(self):
        self.tagger_model.close()

    def extract_keyphrases(self, text) -> List[str]:
        """
        Extracts keyphrases from a given string using SIFRank with SqueezeBERT.

        Args:
        text (str): The input text from which to extract keyphrases.

        Returns:
        List[str]: A list of extracted keyphrases.
        """
        if not text or len(text.strip()) == 0:
            return []

        document = Document(tagger_model=self.tagger_model, text=text)

        sif_sent_embedding = SIFSentenceEmbeddings(
            wordembedding_model=self.model, lamda=1.0
        )

        (
            sentences_embeddings,
            candidates_embeddings,
        ) = sif_sent_embedding.get_tokenized_sent_embeddings(
            document, True, True
        )

        distances = []
        for i, embedding in enumerate(candidates_embeddings):
            distance = cos_sim_distance(
                sentences_embeddings,
                embedding,
            )
            distances.append(distance)

        dist_all = get_all_distances(candidates_embeddings, document, distances)
        keyphrases = get_final_distance(dist_all)
        sorted_keyphrases = sorted(keyphrases.items(), key=lambda x: x[1], reverse=True)[0:Config.TOP_N_KEYPHRASES]
        return [x[0] for x in sorted_keyphrases]
