from .base import BaseWordEmbedder
import os
import numpy as np
from typing import List
from flair.embeddings import ELMoEmbeddings


# elmo_options_file = current_app.config.get("ELMO_OPTIONS_FILE")  # type:ignore
# elmo_weight_file = current_app.config.get("ELMO_WEIGHT_FILE")  # type:ignore
elmo_options_file = os.path.abspath(
    os.path.join(
        # os.path.dirname(__file__),
        "app",
        "algorithms",
        "elmo_2x4096_512_2048cnn_2xhighway_options.json",
    )
)
elmo_weight_file = os.path.abspath(
    os.path.join(
        # os.path.dirname(__file__),
        "app",
        "algorithms",
        "elmo_2x4096_512_2048cnn_2xhighway_weights.hdf5",
    )
)

print(elmo_options_file)


class FlairElmoWordEmbeddings(BaseWordEmbedder):
    def __init__(
        self,
        embedding_model: ELMoEmbeddings = ELMoEmbeddings(
            options_file=elmo_options_file, weight_file=elmo_weight_file
        ),
    ):
        super().__init__(embedding_model=embedding_model)
        if isinstance(embedding_model, ELMoEmbeddings):
            self.embedding_model = embedding_model
        else:
            raise ValueError("Please select a valid ELMoEmbeddings model")

    def get_tokenized_words_embeddings(
        self, tokenized_sentences: List[List[str]]
    ) -> np.ndarray:
        embeddings, _ = self.embedding_model.ee.batch_to_embeddings(tokenized_sentences)
        embeddings = embeddings.detach().cpu().numpy()

        return embeddings
