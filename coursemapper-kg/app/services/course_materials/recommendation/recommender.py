import torch
from flair.data import Sentence
import numpy as np
import pandas as pd
import time
import logging
from sentence_transformers import util
from flair.embeddings import TransformerDocumentEmbeddings

from ..kwp_extraction.singlerank_method.singlerank import SingleRank
from .recommendation_type import RecommendationType
from ..kwp_extraction.dbpedia.concept_tagging import DBpediaSpotlight
from .wikipedia_service import WikipediaService
from .youtube_service import YoutubeService

from log import LOG

logger = LOG(name=__name__, level=logging.DEBUG)


def compute_combined_similatity(data, alpha, recommendation_type, with_user):
    logger.info("Compute Fused Cosine Similarities")
    if with_user:
        data[recommendation_type] = (1 - alpha) * data[
            RecommendationType.PKG_BASED_DOCUMENT_VARIANT
        ] + data[RecommendationType.PKG_BASED_KEYPHRASE_VARIANT] * alpha
    else:
        data[recommendation_type] = (1 - alpha) * data[
            RecommendationType.CONTENT_BASED_DOCUMENT_VARIANT
        ] + data[RecommendationType.CONTENT_BASED_KEYPHRASE_VARIANT] * alpha
    return data


def sort_by_similarity_type(data, similarity_type):
    logger.info("Sort Results")

    sorted_data = data.sort_values(
        by=[similarity_type], ascending=False, ignore_index=True
    )

    return sorted_data


def compute_cosine_similarity_with_embeddings(embedding1, embedding2):
    return util.pytorch_cos_sim(embedding1, embedding2).item()


def compute_dynamic_document_based_similarity(
    data, recommendation_type, user_embedding
):
    cosine_similarities = []

    for document_embedding in data["document_embedding"]:
        tensor = get_tensor_from_embedding(document_embedding)

        cosine_similarity = compute_cosine_similarity_with_embeddings(
            tensor, user_embedding
        )
        cosine_similarities.append(cosine_similarity)

    data[recommendation_type] = cosine_similarities

    return data


def get_tensor_from_embedding(embedding):
    embedding_array = [float(i) for i in embedding]
    embedding_array = np.array(embedding_array)
    embedding_tensor = torch.from_numpy(embedding_array).float()
    return embedding_tensor


def compute_dynamic_keyphrase_based_similarity(
    data, recommendation_type, user_embedding
):
    cosine_similarities = []

    for keyphrase_embedding in data["keyphrase_embedding"]:
        embedding_array = [float(i) for i in keyphrase_embedding]
        embedding_array = np.array(embedding_array)
        tensor = torch.from_numpy(embedding_array).float()

        cosine_similarity = compute_cosine_similarity_with_embeddings(
            tensor, user_embedding
        )
        cosine_similarities.append(cosine_similarity)

    data[recommendation_type] = cosine_similarities

    return data


def compute_document_based_similarity(
    data, slide_document_embedding, recommendation_type
):
    logger.info("Compute Document-Based Cosine Similarities")
    cosine_similarities = []

    slide_document_embedding_array = slide_document_embedding.split(",")
    slide_document_embedding_tensor = get_tensor_from_embedding(
        slide_document_embedding_array
    )

    for document_embedding in data["document_embedding"]:
        tensor = get_tensor_from_embedding(document_embedding)
        cosine_similarity = compute_cosine_similarity_with_embeddings(
            slide_document_embedding_tensor, tensor
        )
        cosine_similarities.append(cosine_similarity)

    data[recommendation_type] = cosine_similarities
    # data["similarity_score"] = cosine_similarities

    return data


def retrieve_keyphrases(data):
    logger.info("Add relevant columns for keyphrases")

    resource_keyphrases_infos = []
    resource_keyphrases = []
    keyphrase_counts = []

    # logger.info(data)
    for index, text in enumerate(data["text"]):
        pos = {"NOUN", "PROPN", "ADJ"}
        extractor = SingleRank()
        extractor.load_document(input=text, language="en")
        extractor.candidate_selection(pos=pos)
        extractor.candidate_weighting(window=10, pos=pos)
        keyphrases_infos = extractor.get_n_best(n=15)
        keyphrases = [keyphrase[0] for keyphrase in keyphrases_infos]

        keyphrase_counts.append(len(keyphrases))
        resource_keyphrases.append(keyphrases)
        resource_keyphrases_infos.append(keyphrases_infos)
        index += 1
    data["keyphrase_counts"] = keyphrase_counts
    data["keyphrases"] = resource_keyphrases
    data["keyphrases_infos"] = resource_keyphrases_infos

    return data


class Recommender:
    def __init__(self):
        self.youtube_service = YoutubeService()
        self.wikipedia_service = WikipediaService()
        self.dbpedia = DBpediaSpotlight()
        self.embedding = TransformerDocumentEmbeddings(
            "sentence-transformers/msmarco-distilbert-base-tas-b"
        )

    def canditate_selection(self, query, video, form="records"):
        data: pd.DataFrame
        top_n = 2 # 15

        if video:
            start_time = time.time()
            data = self.youtube_service.get_videos(query, top_n=top_n)
            end_time = time.time()
            print("Get Videos Execution time: ", end_time - start_time, flush=True)
        else:
            start_time = time.time()
            data = self.wikipedia_service.get_articles(query, top_n=top_n)
            end_time = time.time()
            print("Get Articles Execution time: ", end_time - start_time, flush=True)

        if form == "records":
            return data.to_dict('records')
        return data

    def _get_data(self, recommendation_type, not_understood_concept_list, slide_concepts, video):
        # If personalized recommendation, use DNU concepts to query Youtube and Wikipedia
        if (
            recommendation_type != RecommendationType.WITHOUT_EMBEDDING
            and recommendation_type != RecommendationType.COMBINED_STATIC
            and recommendation_type != RecommendationType.CONTENT_BASED_KEYPHRASE_VARIANT
            and recommendation_type != RecommendationType.CONTENT_BASED_DOCUMENT_VARIANT
        ):
            logger.info("# If personalized recommendation, use DNU concepts to query Youtube and Wikipedia")

            query = " ".join(not_understood_concept_list)
            data = self.canditate_selection(query=query, video=video)
            if isinstance(data, list) and data.empty:
                return []

        # Else use top 5 concepts from slide
        else:
            logger.info("# Else use top 5 concepts from slide")

            i = 0
            while i < 5:
                top_n_concepts = 5 - i
                logger.info(slide_concepts)
                concepts = slide_concepts[:top_n_concepts]
                slide_concepts_name = [concept["name"] for concept in concepts]
                logger.info("Get top %s concepts", top_n_concepts)
                query = " ".join(slide_concepts_name)
                logger.info("The query is %s -----------------" % query)

                data = self.canditate_selection(query=query, video=video)

                if not isinstance(data, list) and not data.empty:
                    if len(data.index) >= 5:
                        break
                i += 1

        if data.empty == False:
            logger.info(f"canditate_selection shape -> {data.shape}")
        return data

    def recommend(
        self,
        not_understood_concept_list=[],
        slide_concepts=[],
        slide_weighted_avg_embedding_of_concepts="",
        slide_document_embedding="",
        user_embedding="",
        top_n=10,
        video=True,
        recommendation_type=RecommendationType.WITHOUT_EMBEDDING,
        data:pd.DataFrame=None
    ):
        '''
            Apply recommendation algorithms
            data: resources in DataFrame
        '''

        """
        # If personalized recommendation, use DNU concepts to query Youtube and Wikipedia
        if (
            recommendation_type != RecommendationType.WITHOUT_EMBEDDING
            and recommendation_type != RecommendationType.COMBINED_STATIC
            and recommendation_type != RecommendationType.CONTENT_BASED_KEYPHRASE_VARIANT
            and recommendation_type != RecommendationType.CONTENT_BASED_DOCUMENT_VARIANT
        ):
            logger.info("# If personalized recommendation, use DNU concepts to query Youtube and Wikipedia")

            query = " ".join(not_understood_concept_list)
            data = self.canditate_selection(query=query, video=video)
            if isinstance(data, list) and data.empty:
                return []

        # Else use top 5 concepts from slide
        else:
            logger.info("# Else use top 5 concepts from slide")

            i = 0
            while i < 5:
                top_n_concepts = 5 - i
                concepts = slide_concepts[:top_n_concepts]
                slide_concepts_name = [concept["name"] for concept in concepts]
                logger.info("Get top %s concepts", top_n_concepts)
                query = " ".join(slide_concepts_name)
                logger.info("The query is %s -----------------" % query)

                data = self.canditate_selection(query=query, video=video)

                if not isinstance(data, list) and not data.empty:
                    if len(data.index) >= 5:
                        break
                i += 1
        
        if data.empty == False:
            logger.info(f"canditate_selection shape -> {data.shape}")
        """

        # Without embedding Not yet supported
        if recommendation_type == RecommendationType.WITHOUT_EMBEDDING:
            return data
        
        # Model 1
        elif recommendation_type == RecommendationType.PKG_BASED_KEYPHRASE_VARIANT:
            start_time = time.time()

            # Tranform embedding to tensor
            user_embedding_array = user_embedding.split(",")
            user_tensor = get_tensor_from_embedding(user_embedding_array)

            # Step 1: Retrieve Keyphrases
            data = retrieve_keyphrases(data)
            end_time = time.time()
            print(
                "Retrieve keyphrases Execution time: ",
                end_time - start_time,
                flush=True,
            )

            start_time = time.time()

            # Step 2: compute keyphrase-based embedding for resources
            data = self.compute_keyphrase_based_embeddings(data)
            end_time = time.time()
            print(
                "Retrieve keyphrase-based embeddings Execution time: ",
                end_time - start_time,
                flush=True,
            )

            start_time = time.time()

            # Step 3: compute keyphrase-based similarity between user embeddings and
            # resources weighted average keyphrase embeddings
            logger.info("Compute Cosine Similarities")
            data = compute_dynamic_keyphrase_based_similarity(
                data, recommendation_type, user_embedding=user_tensor
            )
            end_time = time.time()
            print(
                "Retrieve keyphrase-based similarity Execution time: ",
                end_time - start_time,
                flush=True,
            )

            start_time = time.time()

            # Step 4: sort results by similarity score
            # sorted_data = sort_by_similarity_type(data, recommendation_type)

            end_time = time.time()
            print(
                "Retrieve keyphrase-based sorted data Execution time: ",
                end_time - start_time,
                flush=True,
            )

            return data # sorted_data.head(top_n)
        
        # If Model 2
        elif recommendation_type == RecommendationType.PKG_BASED_DOCUMENT_VARIANT:
            # Transform embedding to tensor
            user_embedding_array = user_embedding.split(",")
            user_embedding_array = [float(i) for i in user_embedding_array]
            user_embedding_array = np.array(user_embedding_array)
            user_tensor = torch.from_numpy(user_embedding_array).float()
            start_time = time.time()

            # Step 1: compute document embedding for resources
            data = self.compute_document_based_embeddings(data)
            end_time = time.time()
            print(
                "Retrieve term-based embeddings Execution time: ",
                end_time - start_time,
                flush=True,
            )
            start_time = time.time()

            # Step 2: compute similarities between user embeddings and resources document embeddings
            logger.info("Compute Cosine Similarities")
            data = compute_dynamic_document_based_similarity(
                data, recommendation_type, user_embedding=user_tensor
            )
            end_time = time.time()
            print(
                "Retrieve user document-based similarity Execution time: ",
                end_time - start_time,
                flush=True,
            )
            start_time = time.time()

            # Step 3: sort results
            # sorted_data = sort_by_similarity_type(data, recommendation_type)

            end_time = time.time()
            print("Sort result Execution time: ", end_time - start_time, flush=True)

            return data # sorted_data.head(top_n)
    
        # If Model 3
        elif recommendation_type == RecommendationType.CONTENT_BASED_KEYPHRASE_VARIANT:
            start_time = time.time()

            # Step 1: Retrieve Keyphrases
            data = retrieve_keyphrases(data)

            end_time = time.time()
            print(
                "Retrieve keyphrases Execution time: ",
                end_time - start_time,
                flush=True,
            )

            start_time = time.time()

            # Step 2: compute keyphrase-based embedding for resources
            data = self.compute_keyphrase_based_embeddings(data)
            end_time = time.time()
            print(
                "Retrieve keyphrase-based embedding Execution time: ",
                end_time - start_time,
                flush=True,
            )
            start_time = time.time()

            # Step 3: compute keyphrase-based similarity between slide weighted average keyphrase embeddings and
            # resources weighted average keyphrase embeddings
            logger.info("Compute Cosine Similarities")
            data = compute_dynamic_keyphrase_based_similarity(
                data, slide_weighted_avg_embedding_of_concepts, recommendation_type
            ) # compute_keyphrase_based_similarity
            end_time = time.time()
            print(
                "Retrieve keyphrase-based embedding Execution time: ",
                end_time - start_time,
                flush=True,
            )
            start_time = time.time()

            # Step 4: sort results by similarity score
            # sorted_data = sort_by_similarity_type(data, recommendation_type)

            end_time = time.time()
            print(
                "Retrieve keyphrase-based embeddings Execution time: ",
                end_time - start_time,
                flush=True,
            )

            return data # sorted_data.head(top_n)

        # if Model 4
        elif recommendation_type == RecommendationType.CONTENT_BASED_DOCUMENT_VARIANT:
            start_time = time.time()

            # Step 1: compute document embedding for resources
            data = self.compute_document_based_embeddings(data)

            end_time = time.time()
            print(
                "Retrieve term-based embeddings Execution time: ",
                end_time - start_time,
                flush=True,
            )
            start_time = time.time()

            # Step 2: compute similarities between slide document embeddings and resources document embeddings
            logger.info("Compute Cosine Similarities")
            data = compute_document_based_similarity(
                data, slide_document_embedding, recommendation_type
            )

            end_time = time.time()
            print(
                "Compute term-based similarity Execution time: ",
                end_time - start_time,
                flush=True,
            )

            start_time = time.time()

            # Step 3: sort results
            # sorted_data = sort_by_similarity_type(data, recommendation_type)

            end_time = time.time()

            print(
                "Compute term-based Sort Execution time: ",
                end_time - start_time,
                flush=True,
            )

            return data # sorted_data.head(top_n)

        # If Combined Dynamic Model.
        # TODO this model was Ignored during the evalution. Can be considered in future works
        elif recommendation_type == RecommendationType.COMBINED_DYNAMIC:
            start_time = time.time()

            user_embedding_array = user_embedding.split(",")
            user_embedding_array = [float(i) for i in user_embedding_array]
            user_embedding_array = np.array(user_embedding_array)
            user_tensor = torch.from_numpy(user_embedding_array).float()

            data = retrieve_keyphrases(data)
            data = self.compute_keyphrase_based_embeddings(data)
            data = self.compute_document_based_embeddings(data)

            logger.info("Compute Cosine Similarities")
            data = compute_dynamic_keyphrase_based_similarity(
                data, recommendation_type, user_embedding=user_tensor
            )
            data = compute_dynamic_document_based_similarity(
                data, recommendation_type, user_embedding=user_tensor
            )
            data = compute_combined_similatity(
                data, 0.5, recommendation_type, with_user=True
            )

            sorted_data = sort_by_similarity_type(data, recommendation_type)

            end_time = time.time()
            print(
                "Retrieve combined similarity with user embeddings Execution time: ",
                end_time - start_time,
                flush=True,
            )

            return sorted_data # .head(top_n)

        # If Combined Static Model.
        # TODO Ignored during the evalution. Can be considered in future works
        elif recommendation_type == RecommendationType.COMBINED_STATIC:
            start_time = time.time()

            data = retrieve_keyphrases(data)
            data = self.compute_keyphrase_based_embeddings(data)
            data = self.compute_document_based_embeddings(data)

            logger.info("Compute Cosine Similarities")
            data = compute_document_based_similarity(
                data, slide_document_embedding, recommendation_type
            )
            data = self.slide_weighted_avg_embedding_of_concepts(
                data, slide_weighted_avg_embedding_of_concepts, recommendation_type
            )
            data = compute_combined_similatity(
                data, 0.5, recommendation_type, with_user=False
            )

            sorted_data = sort_by_similarity_type(data, recommendation_type)

            end_time = time.time()
            print(
                "Retrieve combined similarity without user embeddings Execution time: ",
                end_time - start_time,
                flush=True,
            )

            return sorted_data.head(top_n)

    def compute_keyphrase_based_embeddings(self, data):
        logger.info("Add relevant Columns for keyphrase-based embeddings")

        resource_keyphrase_embeddings = []

        for index, keyphrase_infos in enumerate(data["keyphrases_infos"]):
            keyphrases_avg_embedding = (
                self.compute_weighted_avg_embedding_of_keyphrases(
                    keyphrase_infos
                ).tolist()
            )

            resource_keyphrase_embeddings.append(keyphrases_avg_embedding)

        data["keyphrase_embedding"] = resource_keyphrase_embeddings

        return data

    def compute_document_based_embeddings(self, data):
        logger.info("Add relevant Columns for document embeddings")
        resource_document_based_embeddings = []

        for index, text in enumerate(data["text"]):
            # logger.info(text)
            sentence = Sentence(text)
            self.embedding.embed(sentence)

            resource_document_based_embeddings.append(sentence.get_embedding().tolist())

        data["document_embedding"] = resource_document_based_embeddings

        return data

    def compute_cosine_similarity_with_text(self, text1, text2):
        sentence1 = Sentence(text1)
        sentence2 = Sentence(text2)

        self.embedding.embed(sentence1)
        self.embedding.embed(sentence2)

        return compute_cosine_similarity_with_embeddings(
            sentence1.get_embedding(), sentence2.get_embedding()
        )

    def compute_cosine_similarity_with_keyphrases(self, keyphrases1, keyphrases2):
        average_embedding1 = self.compute_weighted_avg_embedding_of_keyphrases(
            keyphrases1
        )
        average_embedding2 = self.compute_weighted_avg_embedding_of_keyphrases(
            keyphrases2
        )

        return compute_cosine_similarity_with_embeddings(
            average_embedding1, average_embedding2
        )

    def compute_weighted_avg_embedding_of_keyphrases(self, keyphrase_infos):
        np.seterr("raise")
        embedding_list = []
        weight_sum = 0
        for keyphrase in keyphrase_infos:
            sentence = Sentence(keyphrase[0])
            self.embedding.embed(sentence)
            embedding_list.append(sentence.get_embedding() * keyphrase[1])
            weight_sum += keyphrase[1]
        if len(embedding_list) != 0:
            vectors = np.sum(embedding_list, axis=0)
            # print("Lenght: %s", len(embedding_list))
            # print("Weight Sum: %s", weight_sum)
            # dividing by the sum of weights
            average_embedding = vectors / weight_sum
            # print("average_embedding: %s", type(average_embedding))
            return average_embedding
        else:
            return 0
