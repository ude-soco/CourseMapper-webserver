import torch
from flair.data import Sentence
import numpy as np
import pandas as pd
import time
import logging
from sentence_transformers import util, SentenceTransformer

from ..kwp_extraction.singlerank_method.singlerank import SingleRank
from .recommendation_type import RecommendationType
from ..kwp_extraction.dbpedia.concept_tagging import DBpediaSpotlight
from .wikipedia_service import WikipediaService
from .youtube_service import YoutubeService
import json
from config import Config
from ..db.neo4_db import NeoDataBase
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
    '''
        sort results by similarity score
        sorted_data = sort_by_similarity_type(data, recommendation_type)
    '''
    logger.info("Sort Results")

    sorted_data = data.sort_values(
        by=[similarity_type], ascending=False, ignore_index=True
    )

    return sorted_data

def compute_cosine_similarity_with_embeddings(embedding1, embedding2):
    return util.pytorch_cos_sim(embedding1, embedding2).item()


def get_tensor_from_embedding(embedding):
    '''
        Tranform embedding to tensor
    '''
    embedding_array = [float(i) for i in embedding]
    embedding_array = np.array(embedding_array)
    embedding_tensor = torch.from_numpy(embedding_array).float()
    return embedding_tensor


def compute_similarity(embedding_type: str, data, embedding_tensor):
    ''' 
        Compute Cosine Similarities
    '''
    logger.info(f"Computing Cosine Similarities with {embedding_type}")

    cosine_similarities = []
    for embedding in data[embedding_type]:
        tensor = get_tensor_from_embedding(embedding)
        cosine_similarity = compute_cosine_similarity_with_embeddings(
            tensor, embedding_tensor
        )
        cosine_similarities.append(cosine_similarity)
    data["similarity_score"] = cosine_similarities
    return data


def retrieve_keyphrases(data):
    '''
        Retrieve keyphrases
    '''
    logger.info("Add relevant columns for keyphrases")

    for index, row in data.iterrows():
        if len(row["keyphrases"]) < 1:
            text = row["text"]
            pos = {"NOUN", "PROPN", "ADJ"}
            extractor = SingleRank()
            extractor.load_document(input=text, language="en")
            extractor.candidate_selection(pos=pos)
            extractor.candidate_weighting(window=10, pos=pos)
            keyphrases_infos = extractor.get_n_best(n=15)
            keyphrases = [keyphrase[0] for keyphrase in keyphrases_infos]

            keyphrases_infos_modified  = [list(item) for item in keyphrases_infos]
            data.at[index, 'keyphrases_infos'] = json.dumps(keyphrases_infos_modified)
            # data.at[index, 'keyphrases_infos'] = keyphrases_infos
            data.at[index, 'keyphrases'] = keyphrases

    return data

class Recommender:
    def __init__(self, embedding_model):
        self.youtube_service = YoutubeService()
        self.wikipedia_service = WikipediaService()
        self.dbpedia = DBpediaSpotlight()
        neo4j_uri = Config.NEO4J_URI
        neo4j_user = Config.NEO4J_USER
        neo4j_pass = Config.NEO4J_PASSWORD

        self.db = NeoDataBase(neo4j_uri, neo4j_user, neo4j_pass)

        if not embedding_model:
            # embedding_model = "sentence-transformers/msmarco-distilbert-base-tas-b"
            embedding_model = "all-mpnet-base-v2"
        self.embedding = SentenceTransformer(embedding_model)

    def canditate_selection(self, query, video, result_type="records", top_n_videos=2, top_n_articles=2):
        '''
            query: string to query API content
            video: content type with True for video and False for wikipedia content
            result_type: which form to deliver the resources crawled: records (list of dict)
            top_n_videos: number of content to get from YouTube API
            top_n_articles: number of content to get from Wikipedia API
        '''
        data: pd.DataFrame
        # top_n = 2 # 15

        if video:
            start_time = time.time()
            data = self.youtube_service.get_videos(query, top_n=top_n_videos)
            end_time = time.time()
            print("Get Videos Execution time: ", end_time - start_time, flush=True)
        else:
            start_time = time.time()
            data = self.wikipedia_service.get_articles(query, top_n=top_n_articles)
            end_time = time.time()
            print("Get Articles Execution time: ", end_time - start_time, flush=True)

        if result_type == "records":
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
        recommendation_type=RecommendationType.WITHOUT_EMBEDDING,
        data:pd.DataFrame=None,
        slide_weighted_avg_embedding_of_concepts="",
        slide_document_embedding="",
        user_embedding="",
        top_n=10,
        video=True,
        not_understood_concept_list=[],
        slide_concepts=[],
    ):
        '''
            Apply recommendation algorithms
            data: resources in DataFrame
            are_embedding_values_present: False (not empty) | True (empty) (
                if the resource contains key values: keyphrase_embedding | document_embedding)
        '''
        logger.info("Applying the recommendation algorithm Selected")

        # Model 1
        if recommendation_type == RecommendationType.PKG_BASED_KEYPHRASE_VARIANT:
            logger.info("Algorithm Model 1: Starting Processing")
            start_time = time.time()
            
            # Tranform embedding to tensor
            user_tensor = get_tensor_from_embedding(user_embedding.split(","))

            # Step 1: Retrieve Keyphrases
            data = retrieve_keyphrases(data)

            # Step 2: compute keyphrase-based embedding for resources
            data = self.compute_keyphrase_based_embeddings(data)

             # Compute document embedding for resources For Color band
            data = self.compute_document_based_embeddings(data)
            
            # Step 3: compute keyphrase-based similarity between user embeddings and
            # resources weighted average keyphrase embeddings
            data = compute_similarity(embedding_type="keyphrase_embedding", data=data, embedding_tensor=user_tensor)
            
            total_time = time.time() - start_time
            logger.info(f"Algorithm Model 1: Execution time {str(total_time)}")
            return data
        
        # If Model 2
        elif recommendation_type == RecommendationType.PKG_BASED_DOCUMENT_VARIANT:
            start_time = time.time()

            # Transform embedding to tensor
            user_tensor = get_tensor_from_embedding(user_embedding.split(","))
            
            # Step 1: compute document embedding for resources
            data = self.compute_document_based_embeddings(data)
                
            # Step 2: compute similarities between user embeddings and resources document embeddings
            data = compute_similarity(embedding_type="document_embedding", data=data, embedding_tensor=user_tensor)

            total_time = time.time() - start_time
            logger.info(f"Algorithm Model 2: Execution time {str(total_time)}")
            return data 
    
        # If Model 3
        elif recommendation_type == RecommendationType.CONTENT_BASED_KEYPHRASE_VARIANT:
            start_time = time.time()

            # Tranform embedding to tensor
            slide_weighted_avg_embedding_of_concepts_embedding = get_tensor_from_embedding(slide_weighted_avg_embedding_of_concepts)

            # Step 1: Retrieve Keyphrases
            data = retrieve_keyphrases(data)

            # Step 2: compute keyphrase-based embedding for resources
            data = self.compute_keyphrase_based_embeddings(data)

             # Compute document embedding for resources For Color band
            data = self.compute_document_based_embeddings(data)

            # Step 3: compute keyphrase-based similarity between slide weighted average keyphrase embeddings and
            # resources weighted average keyphrase embeddings
            data = compute_similarity(embedding_type="keyphrase_embedding", data=data, embedding_tensor=slide_weighted_avg_embedding_of_concepts_embedding)

            total_time = time.time() - start_time
            logger.info(f"Algorithm Model 3: Execution time {str(total_time)}")
            return data # sorted_data.head(top_n)

        # if Model 4
        elif recommendation_type == RecommendationType.CONTENT_BASED_DOCUMENT_VARIANT:
            # Compute term-based
            start_time = time.time()

            # Transform embedding to tensor
            slide_document_embedding_tensor = get_tensor_from_embedding(slide_document_embedding.split(","))

            # Step 1: compute document embedding for resources
            data = self.compute_document_based_embeddings(data)

            # Step 2: compute similarities between slide document embeddings and resources document embeddings
            data = compute_similarity(embedding_type="document_embedding", data=data, embedding_tensor=slide_document_embedding_tensor)

            total_time = time.time() - start_time
            logger.info(f"Algorithm Model 4: Execution time {str(total_time)}")
            return data


    def compute_keyphrase_based_embeddings(self, data):
        '''
            Compute keyphrase-based embedding for resources
        '''
        logger.info("Add relevant Columns for keyphrase embeddings")
        # print(data["keyphrases_infos"].head(5))

        def do(row):
            if len(row["keyphrase_embedding"]) < 1:
                keyphrase_infos = row["keyphrases_infos"]
                keyphrases_avg_embedding = (
                    self.compute_weighted_avg_embedding_of_keyphrases(
                        keyphrase_infos
                    ).tolist()
                )
                return keyphrases_avg_embedding
            else:
                return row["keyphrase_embedding"]

        data['keyphrase_embedding'] = data.apply(do, axis=1)
        return data

    def compute_document_based_embeddings(self, data):
        '''
            Compute document embedding for resources
            Retrieve term-based embeddings
        '''
        logger.info("Add relevant Columns for document embeddings")
        def do(row):
            if len(row["document_embedding"]) < 1:
                text = row["text"]
                value = self.embedding.encode(text)
                return value.tolist()
            else:
                return row["document_embedding"]

        data['document_embedding'] = data.apply(do, axis=1)
        return data

    def compute_cosine_similarity_with_text(self, text1, text2):
        sencence1_embedding = self.embedding.encode(text1)
        sencence2_embedding = self.embedding.encode(text2)

        return compute_cosine_similarity_with_embeddings(
            sencence1_embedding, sencence2_embedding
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
        keyphrase_infos = json.loads(keyphrase_infos)
        for keyphrase in keyphrase_infos:
            embedding = self.embedding.encode(keyphrase[0])
            embedding_list.append(embedding * keyphrase[1])
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

    def post_retrieve_keyphrases(self,data,dnu_concepts,mid):
        """
        Extract keyphrases from the 'abstract' column and store them in a new 'keyphrases' column.
        Uses the SingleRank algorithm for keyphrase extraction.
        1. Keyphrases Extraction from abstract/description 
        2. Keyphrase Extraction also gives automatically the importance ranking for each keyphrase in the doc.
        3. Compute the embedding of each Kephrase
        4. Compute the embedding of each DNU concept
        5. Comute and store the similarity score between each kephrase and the DNU concept
        6. to do: get the max s.c betweeen each keyphrase and one dnu for keyphrase coloring
        """
        logger.info("Extracting keyphrases and adding to DataFrame.")
        keyphrases_list = []  # emprty list of lists of keyphrases to be rendered
        keyphrases_dnu_similarity_score=[]  # list of lists of dictionaries (one to one) first attr is DNU concept and second is similarity score between the dnu and the keyphrase
        concept_ids=[concept["cid"] for concept in dnu_concepts]
        concepts_nodes=self.db.get_concepts_nodes(concept_ids,mid)
        print(concepts_nodes)
        document_dnu_similarity=[]
        for index, row in data.iterrows():
            text = row.get("text", "")
            if text:
                extractor = SingleRank()
                extractor.load_document(input=text, language="en")
                extractor.candidate_selection(pos={"NOUN", "PROPN", "ADJ"})
                extractor.candidate_weighting(window=10, pos={"NOUN", "PROPN", "ADJ"})
                keyphrases = []
                keyphrases_dnu_similarities=[]
                document_similarity={}
                for kp in extractor.get_n_best(n=15):
                    keyphrases.append(kp)
                    keyphrase_embedding=self.embedding.encode(kp[0])
                    keyphrase_similarity={}
                    for concept in concepts_nodes:
                        #dnu_embedding=self.embedding.encode(dnu["name"])
                        concept_embedding = [float(x.strip()) for x in concept["final_embedding"].split(',')]
                        keyphrase_similarity[concept["name"]]=compute_cosine_similarity_with_embeddings(keyphrase_embedding,concept_embedding)
                    sorted_similarity=dict(sorted(keyphrase_similarity.items(), key=lambda item: item[1], reverse=True))
                    keyphrases_dnu_similarities.append(sorted_similarity)
                
                for concept in concepts_nodes:
                    concept_embedding = [float(x.strip()) for x in concept["final_embedding"].split(',')]
                    document_similarity[concept["name"]]=self.compute_cosine_similarity_with_embeddings(concept_embedding
                                                                                                        ,data["document_embedding"])
                document_dnu_similarity.append(document_similarity)
                    
            else:
                keyphrases = []

            keyphrases_list.append(keyphrases)
            keyphrases_dnu_similarity_score.append(keyphrases_dnu_similarities)
        

        data["keyphrases"] = keyphrases_list 
        data["keyphrases_dnu_similarity_score"]=keyphrases_dnu_similarity_score
        data["document_dnu_similarity"]=document_dnu_similarity
        print(data.info())
    
       
        return data

