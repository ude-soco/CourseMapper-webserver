import concurrent.futures
from flask import current_app

from ..db.neo4_db import NeoDataBase

from .recommendation_type import RecommendationType
from .recommender import Recommender
import numpy as np

import math
import scipy.stats as st

from datetime import datetime
from dateutil.parser import parse as date_parse

import numpy as np
from sklearn.preprocessing import normalize as normalize_sklearn, MinMaxScaler as MinMaxScaler_sklearn
import redis
import json
import threading
import time


from log import LOG
import logging
logger = LOG(name=__name__, level=logging.DEBUG)

class ResourceRecommenderService:
    def __init__(self):
        neo4j_uri = current_app.config.get("NEO4J_URI")  # type: ignore
        neo4j_user = current_app.config.get("NEO4J_USER")  # type: ignore
        neo4j_pass = current_app.config.get("NEO4J_PASSWORD")  # type: ignore

        self.db = NeoDataBase(neo4j_uri, neo4j_user, neo4j_pass)

        # Connect to Redis
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        # self.redis_client_expiration_time = 60 # for 1 week
        self.redis_key_1 = "recs_resources" # i.e: user_id_recs_new
        self.redis_key_2 = "recs_resources_status"

    def set_redis_key_value(self, key_name: str, value, ex=60, set_time=True):
        '''
            value: str | dict
        '''
        data = None
        if isinstance(value, str):
            data = value
        elif isinstance(value, dict):
            data = json.dumps(value)
        
        if set_time:
            self.redis_client.set(name=key_name, value=data, ex=ex)
        else:
            self.redis_client.set(name=key_name, value=data)

    def get_redis_key_value(self, key_name: str):
        result = None
        value = self.redis_client.get(key_name)
        if value:
            result = json.loads(value)
        return result
    
    def remove_redis_key_value(self, key_name: str):
        self.redis_client.delete(key_name)

    def check_parameters(
        self,
        slide_id,
        material_id,
        non_understood_concept_ids,
        understood_concept_ids,
        new_concept_ids,
        recommendation_type,
    ):
        if not self.db.slide_exists(slide_id):
            return "No Slide found with id: %s" % slide_id

        if not self.db.lm_exists(material_id):
            return "No Learning Material found with id: %s" % slide_id

        # if not self.db.user_exists(user_id):
        #     return 'No User found with id: %s' % slide_id

        if not recommendation_type in ["1", "2", "3", "4"]:
            return "Recommendation type %s not supported" % recommendation_type

        for cid in (
            non_understood_concept_ids + understood_concept_ids + new_concept_ids
        ):
            if not self.db.concept_exists(cid):
                return "No User found with id: %s" % slide_id

        return ""

    def set_rating(self, resource, user_id, rating, concepts=[]):
        return self.db.create_or_edit_user_rating(
            resource, user_id, rating, concepts=concepts
        )

    def get_top_n_dnu_concepts(self, user, top_n):
        return self.db.get_top_n_dnu_concepts(user=user, top_n=top_n)
        # TODO: material_id is missing and the user argument is not correctly used
        # return self.db.get_top_n_dnu_concepts(user_id=user, material_id=material_id top_n=top_n)

    def get_slide_concepts(self, slide_id):
        return

    def _construct_user(self, user, non_understood, understood, new_concepts, mid):
        self.db.construct_user_model(
            user, non_understood, understood, new_concepts, mid
        )

    def _get_personalized_recommendation(
        self,
        not_understood_concept_list,
        user_embedding,
        resource_type,
        recommendation_type,
    ):
        return self.recommender.recommend(
            not_understood_concept_list=not_understood_concept_list,
            user_embedding=user_embedding,
            video=True if resource_type == "Youtube" else False,
            recommendation_type=recommendation_type,
        )

    def _get_static_recommendation(
        self,
        slide_document_embedding,
        slide_concepts,
        slide_weighted_avg_embedding_of_concepts,
        resource_type,
        recommendation_type,
    ):
        return self.recommender.recommend(
            not_understood_concept_list=slide_concepts,
            slide_document_embedding=slide_document_embedding,
            slide_concepts=slide_concepts,
            slide_weighted_avg_embedding_of_concepts=slide_weighted_avg_embedding_of_concepts,
            video=True if resource_type == "Youtube" else False,
            recommendation_type=recommendation_type,
        )

    ######
    ######
    # CRO logic

    def get_reosurce_by_rid_from_redis(self, user_id: str, rid: str):
        result_temp = self.get_redis_key_value(key_name=f"{user_id}_{self.redis_key_1}")
        resource = None
        if result_temp:
            result_temp = json.loads(result_temp)
            resources = result_temp["resources"]
            resource = next((d for d in resources if d['id'] == rid ), None)
        return resource
    
    def save_and_get_concepts_modified(self, rec_params, top_n=5, user_embedding=False, understood_list=[], non_understood_list =[]):
        '''
            rec_params: {
                "user_id": "65e0536db1effed771dbdbb9",
                "mid": "6662201fec6bb9067ff71cc9",
                "slide_id": 1,
                "category": "1",
                "concepts": [
                    {
                        "cid": "2156985142238936538",
                        "mid": "6662201fec6bb9067ff71cc9",
                        "weight": 0.79
                    }
                ],
                "recommendation_type": "1",
                "factor_weights": {
                    "status": true,
                    "reload": true,
                    "weights": {
                        "similarity_score": 0.7,
                        "creation_date": 0.3,
                        "views": 0.3,
                        "like_count": 0.1,
                        "user_rating": 0.1,
                        "nbr_saves": 0.1
                    }
                }
            }
        '''
        
        result = {
            "concepts": [],
            "concept_cids": [],
            "concept_names": [],
            "rec_params": None,
            "user_embedding": None
        }
        concepts_modified = []
        user_id = rec_params["user_id"]

        concepts: list = rec_params["concepts"]
        # concepts.sort(key=lambda x: x["weight"], reverse=True)
        # concepts = concepts[:top_n]

        # update status between understood and non-understood
        if len(understood_list) > 0:
            for cid in understood_list:
                self.db.update_rs_btw_user_and_cm(user_id=user_id, cid=cid, weight=None, mid=None, status='u', only_status=True)

        if len(concepts) > 0:
            if rec_params["recommendation_type"] in ["1", "2"]:
                status = 'dnu'
            else:
                status = 'content' # for CONTENT_BASED_
          
            for concept in concepts:
                concept_modified = self.db.update_rs_btw_user_and_cm(user_id=user_id, cid=concept["cid"], weight=concept["weight"], mid=concept["mid"], status=status)
                concepts_modified.append(concept_modified)

            # update user embedding value (because weight value could be changed from the user)
            if user_embedding:
                user_embedding = self.db.get_user_embedding_with_concept_modified(user_id=user_id, mid=rec_params["mid"], status=status)
                result["user_embedding"] = user_embedding
        
        result["concept_cids"]  = [concept["cid"] for concept in concepts]
        result["concept_names"] = [concept["name"] for concept in concepts]
        rec_params["concepts"] = concepts
        result["concepts"] = concepts
        result["rec_params"] = rec_params
        return result

    def user_rates_resources(self, rating: dict):
        resource = None
        if rating["value"] == "HELPFUL":
            resource = self.get_reosurce_by_rid_from_redis(user_id=rating["user_id"], rid=rating["rid"])

        rating_updated = self.db.user_rates_resources(rating=rating, resource=resource)
        return rating_updated
    
    def save_or_remove_user_resources(self, data: dict):
        resource = None
        if data["status"] == True:
            resource = self.get_reosurce_by_rid_from_redis(user_id=data["user_id"], rid=data["rid"])

        resource_saved = self.db.user_saves_or_removes_resource(data=data, resource=resource)
        return resource_saved

    def get_concepts_mids_sliders_numbers_for_user_resources_saved(self, data: dict):
        result = self.db.get_concepts_mids_sliders_numbers_for_user_resources_saved(data)
        return result

    def filter_user_resources_saved_by(self, data: dict):
        resources = self.db.filter_user_resources_saved_by(data)
        result = {
                    "articles": [resource for resource in resources if "Video" in resource["labels"]],
                    "videos": [resource for resource in resources if "Article" in resource["labels"]]
                }
        return result

    def normalize_factor_weights(self, factor_weights: dict=None, values: list=[], method_type = "l1", complete=True, sum_value=True): # List[float]
        """
        method_type: normalization techniques
            l1: L1 normalization, also known as L1 norm normalization or Manhattan normalization
            l1: L2 normalization, also known as L2 norm normalization or Euclidean normalization
            max: Max Normalization
            min-max: Min-Max
        
        https://www.pythonprog.com/sklearn-preprocessing-normalize/#Normalization_Techniques
        TypeScript: https://sklearn.vercel.app/guide/install

        factor_weights = { 'similarity_score': 0.7, 'creation_date': 0.3, 'nbr_views': 0.3, 
                'nbr_likes_youTube': 0.1, 'rating_courseMapper': 0.1, 'nbr_save_courseMapper': 0.1
            }
        """
        normalized_values = None
        scaled_data = None
        
        if factor_weights:
            values = [value for key, value in factor_weights.items()]
            key_names = [key for key, value in factor_weights.items()]

        if method_type == "l1":
            normalized_values = normalize_sklearn([values], norm=method_type).tolist()
        if method_type == "l2":
            normalized_values = normalize_sklearn([values], norm=method_type).tolist()
        if method_type == "max":
            normalized_values = normalize_sklearn([values], norm=method_type).tolist()
        if method_type == "min-max":
            data = np.array(values).reshape(-1, 1)
            scaler = MinMaxScaler_sklearn()
            scaler.fit(data)
            scaled_data = scaler.transform(data)
            scaled_data = scaled_data.tolist()
            scaled_data = [value[0] for value in scaled_data]

        if normalized_values:
            normalized_values = normalized_values[0]
            normalized_values = [round(value, 3) for value in normalized_values]
        elif scaled_data:
            normalized_values = scaled_data

        if sum_value:
            # print("sun values: ", sum(normalized_values))
            logger.info("factor weight sum ->", sum(normalized_values))

        if complete:
            normalized_values = dict(zip(key_names, normalized_values))
        
        return normalized_values

    def wilson_lower_bound_score(self, up, down, confidence=0.95):
        """
            Calculate lower bound of wilson score
            :param up: No of positive ratings
            :param down: No of negative ratings
            :param confidence: Confidence interval, by default is 95 %
            :return: Wilson Lower bound score
        """
        n = up + down
        if n == 0:
            return 0.0
        z = st.norm.ppf(1 - (1 - confidence) / 2)
        phat = 1.0 * up / n
        return (phat + z * z / (2 * n) - z * math.sqrt((phat * (1 - phat) + z * z / (4 * n)) / n)) / (1 + z * z / n)

    def normalize_min_max_score_date(self, date_str: str, max: datetime):
        """
            Calculate Normalization Score of Creation Date
        """
        date = date_parse(date_str).replace(tzinfo=None)

        # First video posted on Youtube
        min = datetime(year=2005, month=4, day=23, hour=8, minute=31, second=52, tzinfo=None)
        return (date - min).days / (max - min).days

    def normalize_min_max_score(self, value: int, min_value: int, max_value: int):
        if (max_value - min_value) == 0:
            return 0
        return (value - min_value) / (max_value - min_value)

    def calculate_factors_weights(self, category: int, resources: list, weights: dict = None, light=False):
        """
            Sort by these extra features provided by the resources such as:
            weights: dict containing factors weight
            {'similarity_score': 0.2, 'creation_date': 0.2, 'views': 0.3, 'like_count': 0.1, 'user_rating': 0.1, 'saves_count': 0.1}
        """
        now = datetime.now()
        default_weight = 0.001

        weight_similarity_score = weights.get("similarity_score") if 'similarity_score' in weights else default_weight
        weight_creation_date = weights.get("creation_date") if 'creation_date' in weights else default_weight
        weight_views = weights.get("views") if 'views' in weights else default_weight
        weight_user_rating = weights.get("user_rating") if 'user_rating' in weights else default_weight
        weight_like_count = weights.get("like_count") if 'like_count' in weights else default_weight
        weight_saves_count = weights.get("saves_count") if 'saves_count' in weights else default_weight

        bookmarked_min_value = min(resources, key=lambda x: x["bookmarked_count"])["bookmarked_count"]
        bookmarked_max_value = max(resources, key=lambda x: x["bookmarked_count"])["bookmarked_count"]
        
        if category == 1:
            min_views = int(min(resources, key=lambda x: int(x["views"]))["views"])
            max_views = int(max(resources, key=lambda x: int(x["views"]))["views"])

            like_count_min_value = min(resources, key=lambda x: x["like_count"])["like_count"]
            like_count_max_value = max(resources, key=lambda x: x["like_count"])["like_count"]

            for resource in resources:
                similarity_normalized = resource["similarity_score"]
                rating_normalized = self.wilson_lower_bound_score(up=resource["helpful_count"], down=resource["not_helpful_count"])
                creation_date_normalized = self.normalize_min_max_score_date(date_str=resource["publish_time"], max=now)
                views_normalzed = self.normalize_min_max_score(value=int(resource["views"]), min_value=min_views, max_value=max_views) 
                bookmarked_normalized = self.normalize_min_max_score(value=int(resource["bookmarked_count"]), min_value=bookmarked_min_value, max_value=bookmarked_max_value)
                like_count_normalized = self.normalize_min_max_score(value=int(resource["like_count"]), min_value=like_count_min_value, max_value=like_count_max_value)

                resource["composite_score"] = (views_normalzed * weight_views) \
                                            + (rating_normalized * weight_user_rating) \
                                            + (creation_date_normalized * weight_creation_date) \
                                            + (similarity_normalized * weight_similarity_score) \
                                            + (bookmarked_normalized * weight_saves_count) \
                                            + (like_count_normalized * weight_like_count)
                
        elif category == 2:
            for resource in resources:
                rating_normalized = self.wilson_lower_bound_score(up=resource["helpful_count"], down=resource["not_helpful_count"])
                resource["composite_score"] = (rating_normalized * weight_user_rating) \
                                            + (resource["similarity_score"] * weight_similarity_score) \
                                            + (resource["bookmarked_count"] * weight_saves_count) \


        # sort by composite score value
        resources.sort(key=lambda x: x["composite_score"], reverse=True)

        return resources
    
    def remove_duplicates_from_resources(dict_list: list):
        seen = set()
        unique_dicts = []
        for d in dict_list:
            # Convert dictionary to a tuple of its items
            items = tuple(sorted(d.items()))
            if items not in seen:
                seen.add(items)
                unique_dicts.append(d)
        return unique_dicts

    def rank_resources(self, resources: list, weights: dict = None, ratings: list = None):
        """
            Step 1: Remove duplicates if exist
            Step 2: Ranking/Sorting Logic for Resources
            Result Form: {"articles": list, "videos": list}
            Step 3: Last Step: Resources having Rating related to DNU_modified (cid)
        """
        # Normalize Weights
        # if weights is None:
        #     # to be completed
        #     video_weights_normalized =  {} # {'similarity_score': 0.2, 'creation_date': 0.2, 'views': 0.3, 'like_count': 0.1, 'user_rating': 0.1, 'saves_count': 0.1}
        #     article_weights_normalized = {} # {'similarity_score': 0.4, 'creation_date': 0.4, 'user_rating': 0.2}
        # else:
        video_weights_normalized = self.normalize_factor_weights(factor_weights=weights["video"], method_type="l1", complete=True, sum_value=False)
        article_weights_normalized = self.normalize_factor_weights(factor_weights=weights["article"], method_type="l1", complete=True, sum_value=False)

        # video items
        resources_videos = [resource for resource in resources if "Video" in resource["labels"]]
        resources_videos = self.remove_duplicates_from_resources(resources_videos)
        resources_videos = self.calculate_factors_weights(category=1, resources=resources_videos, weights=video_weights_normalized)
        resources_videos = [{k: v for k, v in d.items() if k not in ["composite_score", "labels"]} for d in resources_videos]

        # articles items
        resources_articles = [resource for resource in resources if "Article" in resource["labels"]]
        resources_articles = self.remove_duplicates_from_resources(resources_articles)
        resources_articles = self.calculate_factors_weights(category=2, resources=resources_articles, weights=article_weights_normalized)
        resources_articles = [{k: v for k, v in d.items() if k not in ["composite_score", "labels"]} for d in resources_articles]

        # # Finally, priorities on resources having Rating related to DNU_modified (cid)
        if ratings and len(ratings) > 0:
            pass

        return {
            "articles": resources_articles,
            "videos": resources_videos
        }

    def crawl_resources(self, recommendation_type, user_id, material_id, _slide, user_embedding, concepts, concept_ids, not_understood_concept_list):
        """
            Saving resources after crawling and proceeding with algorithms
            1) Crawl content based on concept names (not_understood_concept_list)
            2) The algorithm (4 in total) processes the retrieved content
        """
        wikipedia_articles = []
        youtube_videos = []
        self.recommender = Recommender()

        # Allow parallel recommendation of videos and articles
        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = {}
            resource_types = ["Youtube", "Wikipedia"]

            # If personalized, get user information from the database then proceed with the personalized recommendation
            if (
                recommendation_type != RecommendationType.WITHOUT_EMBEDDING
                and self.db.user_exists(user_id)
                and recommendation_type != RecommendationType.COMBINED_STATIC
                and recommendation_type != RecommendationType.CONTENT_BASED_KEYPHRASE_VARIANT
                and recommendation_type != RecommendationType.CONTENT_BASED_DOCUMENT_VARIANT
            ):
                for resource_type in resource_types:
                    # Start the load operations and mark each future with its URL
                    future = executor.submit(
                        self._get_personalized_recommendation,
                        not_understood_concept_list=not_understood_concept_list,
                        user_embedding=user_embedding,
                        resource_type=resource_type,
                        recommendation_type=recommendation_type,
                    )
                    futures[future] = resource_type

            # Else retrieve Slide information from the database then proceed with the static recommendation
            else:
                slide_document_embedding = _slide[0]["s"]["initial_embedding"]
                slide_weighted_avg_embedding_of_concepts = _slide[0]["s"][
                    "weighted_embedding_of_concept"
                ]

                for resource_type in resource_types:
                    # Start the load operations and mark each future with the resource type
                    future = executor.submit(
                        self._get_static_recommendation,
                        slide_document_embedding=slide_document_embedding,
                        slide_concepts=concepts,
                        slide_weighted_avg_embedding_of_concepts=slide_weighted_avg_embedding_of_concepts,
                        resource_type=resource_type,
                        recommendation_type=recommendation_type,
                    )
                    futures[future] = resource_type

            
            # When one of the parallel operations is finish retrieve results
            # 3000s is the maximum time allowed for each operation
            for future in concurrent.futures.as_completed(futures, 3000):
                data_type = futures[future]
                try:
                    if data_type == "Youtube":
                        youtube_videos = future.result()
                    else:
                        wikipedia_articles = future.result()
                except Exception as exc:
                    print("%r generated an exception: %s" % (data_type, exc))

        '''
        # If both results are empty return an empty object
        if (isinstance(youtube_videos, list) or youtube_videos.empty) and (
            isinstance(wikipedia_articles, list) or wikipedia_articles.empty
        ):
            # return {}
            resources = []
        else:
            #### TO DO -> Improving Saving Performance
            ### ONLY SAVE Resources without Creating Relationship "CONTAINS" to "Concept"


            
            if len(concept_ids) == 1:
                # Otherwise proceed save the results in the database: Neo4j
                resources, relationships = self.db.get_or_create_resoures_relationships(
                    wikipedia_articles=wikipedia_articles,
                    youtube_videos=youtube_videos,
                    user_id=user_id,
                    material_id=material_id,
                    concept_ids=concept_ids,
                    recommendation_type=recommendation_type,
                )
            else:
                # store resources into Database: Redis
                key_name = f"{user_id}_recs_new"
                self.redis_client.set(name=key_name, value=json.dumps(resources), ex=(self.redis_client_expiration_time * 10080))
        '''
        
        return {
            "articles": wikipedia_articles.to_dict(orient='records'),
            "videos": youtube_videos.to_dict(orient='records'),
            "user_id": user_id,
            "material_id": material_id,
            "concept_ids": concept_ids,
            "recommendation_type": recommendation_type
        }
    
    def store_resources_to_neo4j(self, resources_detail: dict):
        '''
            save the results in the database: Neo4j
        '''
        resources = []
        wikipedia_articles = resources_detail["wikipedia_articles"]
        youtube_videos = resources_detail["youtube_videos"]

        if (isinstance(youtube_videos, list) or youtube_videos.empty) and (
                    isinstance(wikipedia_articles, list) or wikipedia_articles.empty
                ):
            resources, relationships = self.db.get_or_create_resoures_relationships(
                wikipedia_articles=wikipedia_articles,
                youtube_videos=youtube_videos,
                user_id=resources_detail["user_id"],
                material_id=resources_detail["material_id"],
                concept_ids=resources_detail["concept_ids"],
                recommendation_type=resources_detail["recommendation_type"],
            )
        return resources

    def store_resources_temp_to_redis(self, resources_detail: dict):
        '''
            save the results in the database: Redis
        '''
        user_id = resources_detail["user_id"]
        resources = {
            "articles": resources_detail["wikipedia_articles"],
            "videos": resources_detail["youtube_videos"],
        }
        # ex: 1 weeek
        # self.redis_client.set(name=f"{user_id}_{self.redis_key_1}", value=resources, ex=(60 * 10080))
        # self.set_redis_key_value(key_name=)
    
    def rec_params_request_mapped(self, data_rec_params: dict, data_default: dict=None):
        understood = data_default.get("understoodConcepts")
        non_understood = data_default.get("nonUnderstoodConcepts")
        new_concepts = data_default.get("newConcepts")

        return {
            "material_id": data_default.get("materialId"),
            "slide_id": data_default.get("slideId"),
            "understood": understood,
            "non_understood": non_understood,
            "new_concepts": new_concepts,
            "understood_concept_ids": [cid for cid in understood.split(",") if understood],
            "non_understood_concept_ids": [ cid for cid in non_understood.split(",") if non_understood ],
            "new_concept_ids": [cid for cid in new_concepts.split(",") if new_concepts],
            "username": data_default.get("username"),
            "user_id": data_default.get("userId"),
            "user_email": data_default.get("userEmail"),
            "rec_params": data_rec_params,
        }

    def build_factor_weights(self, factor_weights_params: dict = None):
        factor_weights_articles = {}
        factor_weights_viedos = {}

        if factor_weights_params:
            factor_weights_articles = self.normalize_factor_weights(  factor_weights=factor_weights_params, 
                                                            method_type="l1", 
                                                            complete=True, 
                                                            sum_value=False
                                                        )
            # set video weights
            factor_weights_viedos = {}
            for key, value in factor_weights_params.items():
                if key in ["similarity_score", "user_rating", "saves_count"]:
                    factor_weights_viedos[key] = value

            factor_weights_viedos = self.normalize_factor_weights(  factor_weights=factor_weights_viedos, 
                                                    method_type="l1", 
                                                    complete=True, 
                                                    sum_value=False
                                                )
        return {
            "article": factor_weights_articles,
            "video": factor_weights_viedos
        }
    
    def check_request_temp(self, rec_params: dict, key="cid"):
        '''
            check if user add or change concpet(s) to the concepts list
            check if resources (saved temporally: Redis) have already been recommended for the concepts given

            key = rec_params_user_id
            get temp result_temp : {concepts: list, resources: list}
            get temporal rec_params_concepts
            if there are same from those stored in the temp
            and return resources temp stored
        '''
        are_concepts_sane = True
        resources = None
        user_id = rec_params["user_id"]
        concepts = rec_params["concepts"]

        result_temp = self.get_redis_key_value(key_name=f"{user_id}_{self.redis_key_1}")
        if result_temp:
            result_temp = json.loads(result_temp)
            concepts_temp = result_temp["concepts"]

            if concepts_temp is None:
                are_concepts_sane = False

            elif len(concepts) != len(concepts_temp):
                are_concepts_sane = False

            elif len(concepts) == len(concepts_temp):
                for dict1, dict2 in zip(concepts, concepts_temp):
                    if dict1.get(key) != dict2.get(key):
                        are_concepts_sane = False
                        break

                resources = result_temp["resources"]
        else:
                are_concepts_sane = False
        return are_concepts_sane, resources

    def process_new_concepts(self, body: dict, factor_weights, new_concepts: list = []):
        '''
            Process and Crawl Resources
            Inside a Threading
        '''
        self.set_redis_key_value(key_name=f"{body['user_id']}_{self.redis_key_2}", value="running", set_time=False)

        rec_params = body["rec_params"]
        concepts = new_concepts
        # factor_weights = self.build_factor_weights(body["rec_params"]["factor_weights"]["weights"])
        
        # Map recommendation type to enum values
        rec_type = body["rec_params"]["recommendation_type"]
        recommendation_type = RecommendationType.map_type(body["rec_params"]["recommendation_type"])

        logger.info("---- concepts updated ----")
        # Check if parameters exist. If one doesn't exist, return not found message
        # check_message = resource_recommender_service.check_parameters(
        # slide_id, material_id, user_id, non_understood_concept_ids, understood_concept_ids, new_concept_ids, recommendation_type)
        check_message = self.check_parameters(
            slide_id=body["slide_id"],
            material_id=body["material_id"],
            non_understood_concept_ids=body["non_understood_concept_ids"],
            understood_concept_ids=body["understood_concept_ids"],
            new_concept_ids=body["new_concept_ids"],
            recommendation_type=rec_type
        )
        if check_message != "":
            return {}
        
        user = {"name": body["username"], "id": body["user_id"] , "user_email": body["user_email"] }
        _slide = None
        # If personalized recommendtion, build user model
        if recommendation_type in [ RecommendationType.PKG_BASED_DOCUMENT_VARIANT, RecommendationType.PKG_BASED_KEYPHRASE_VARIANT ]:
            logger.info("---------recommendation_type dyn----------")

            self._construct_user(
                user=user,
                non_understood=body["non_understood_concept_ids"],
                understood=body["understood_concept_ids"],
                new_concepts=body["new_concept_ids"],
                mid=body["material_id"],
            )
            clu = self.save_and_get_concepts_modified(  rec_params=rec_params, top_n=5, user_embedding=True, 
                                                        understood_list=body["understood_concept_ids"], 
                                                        non_understood_list=body["non_understood_concept_ids"]
                                                    )

        elif recommendation_type in [ RecommendationType.CONTENT_BASED_DOCUMENT_VARIANT, RecommendationType.CONTENT_BASED_KEYPHRASE_VARIANT ]:
            logger.info("---------recommendation_type statistic----------")

            _slide = self.db.get_slide(body["slide_id"])
            slide_concepts = _slide[0]["s"]["concepts"]
            # cro_form["concepts"] = slide_concepts
            clu = self.save_and_get_concepts_modified(  rec_params=rec_params, top_n=5, user_embedding=False, 
                                        understood_list=body["understood_concept_ids"], 
                                        non_understood_list=body["non_understood_concept_ids"]
                                    )
            
            clu["concepts"] = slide_concepts

        rec_params_concpets = clu["rec_params"]
        user_embedding = clu.get("user_embedding")
        concept_ids = [concept["cid"] for concept in rec_params_concpets["concepts"]]
        not_understood_concept_list = [concept["name"] for concept in rec_params_concpets["concepts"]]

        resources_crawled = self.crawl_resources(   
                            recommendation_type=recommendation_type,
                            user_id=body["user_id"],
                            material_id=body["material_id"],
                            _slide=_slide,
                            user_embedding=user_embedding,
                            concepts=concepts,
                            concept_ids=concept_ids,
                            not_understood_concept_list=not_understood_concept_list
                        )

        resources_bg = resources_crawled["articles"] + resources_crawled["videos"]
        print("resources_bg")
        print(resources_bg)
        result = {"concepts": rec_params["concepts"], "resources": []}

        if len(resources_bg) > 0:
            if len(rec_params["concepts"]) != len(concepts):
                resources_found = self.db.retrieve_resources(concepts=rec_params["concepts"])
                resources = resources_found + resources_bg
                result["resources"] = self.rank_resources(resources=resources, weights=factor_weights)
            else:
                result["resources"] = self.rank_resources(resources=resources_bg, weights=factor_weights)
            self.set_redis_key_value(key_name=f"{body['user_id']}_{self.redis_key_1}", value=result, ex=(60 * 10080))
        else:
            self.set_redis_key_value(key_name=f"{body['user_id']}_{self.redis_key_1}", value=result, ex=(60 * 10080))
        
        # self.set_redis_key_value(key_name=f"{body['user_id']}_{self.redis_key_2}", value="completed")
        self.remove_redis_key_value(key_name=f"{body['user_id']}_{self.redis_key_2}")

        '''
            if len(resources) > 0:
                resources = [{"node_id": node["id"]} for node in resources]
                self.edit_relationship_btw_concepts_and_resources(concepts=rec_params["concepts"], resources=resources)
                resources = self.db.retrieve_resources(concepts=rec_params["concepts"])
                # result = self.rank_resources(resources=resources, weights=factor_weights)
            else:
                result = {"articles": [], "videos": []}
        '''

        return concepts, result

    def create_get_resources_thread(self, func, args):
        '''
            active threading for the function given
            func: the function to run
            args: arguments taken from the function func
        '''
        thread = threading.Thread(target=func, args=args)
        thread.start()
        # self.redis_client.set(name=f"{user_id}_{self.redis_key_1}", value=status, ex=(self.redis_client_expiration_time * 10080))

    def _get_resources(self, data_rec_params: dict, data_default: dict=None):
        '''
            Save cro_form, Crawl Youtube and Wikipedia API and then Store Resources
            Result: [ {"recommendation_type": str, "concepts": list(concepts), "nodes": list(resources)} ]
        '''
        body = self.rec_params_request_mapped(data_rec_params, data_default)
        # result = {}

        # Only take 5 concepts with the higher weight
        rec_params = body["rec_params"]
        top_n = 5
        concepts_top_n: list = body["rec_params"]["concepts"]
        concepts_top_n.sort(key=lambda x: x["weight"], reverse=True)
        rec_params["concepts"] = concepts_top_n[:top_n]

        # check whether the DNUs have been aldready requested
        # dnu_found = self.cro_get_concept_cro(user_id=body["croForm"]["user_id"], cid=cid, weight=weight)

        factor_weights = self.build_factor_weights(body["rec_params"]["factor_weights"]["weights"])
        concepts = rec_params["concepts"]

        are_concepts_sane, resources_temp = self.check_request_temp(rec_params=rec_params)
        print("sdsd")
        print(are_concepts_sane, resources_temp)
        
        # default resources value
        resources = { "articles": [], "videos": [] }

        if are_concepts_sane == True:
            resources = resources_temp
        
        elif are_concepts_sane == False:
            # get resources connected to concepts from the database (Neo4j)
            concepts_having_resources = []
            concepts_not_having_resources = []
            resourse_found = [] # self.db.retrieve_resources(concepts=concepts)
            for concept in concepts:
                resourse_btw = self.db.retrieve_resources(concepts=concepts)
                if len(resourse_btw) == 0:
                    concepts_not_having_resources.append(concept)
                else:
                    resourse_found.append(resourse_btw)
                    concepts_having_resources.append(concept)
            
            # remove duplicates and rank
            resources = resourse_found # self.rank_resources(resourse_found)

            if len(concepts_not_having_resources) > 0:
                # concepts_used, resources_new = self.process_new_concepts(body=body, factor_weights=factor_weights, new_concepts=concepts_not_having_resources)
                self.create_get_resources_thread(self.process_new_concepts, args=(body, factor_weights, concepts_not_having_resources))

            elif len(concepts) > 0:
                # self.process_new_concepts(body=body, factor_weights=factor_weights)
                self.create_get_resources_thread(self.process_new_concepts, args=(body, factor_weights))

        result = self.rank_resources(resources=resources, weights=factor_weights)
        concepts = [{k: v for k, v in d.items() if k != "final_embedding"} for d in concepts]

        recommendation_type = RecommendationType.map_type(body["rec_params"]["recommendation_type"])
        recommendation_type_nbr = RecommendationType.map_type(recommendation_type, find_type="v")

        result = {key: result[key][:10] for key, value in result.items()}
        result = {"recommendation_type": recommendation_type_nbr, "concepts": concepts, "nodes": result }
        # "count": {"videos": len(result["videos"]), "articles": len(result["articles"])} 

        return result

def get_serialized_resource_data(resources, concepts, relations):
    """ """
    data = {}
    ser_resources = []
    ser_realations = []

    for resource in resources:
        r = {
            "title": resource["title"],
            "id": resource["rid"],
            "uri": resource["uri"],
            "helpful_counter": resource["helpful_count"],
            "not_helpful_counter": resource["not_helpful_count"],
            "labels": resource["labels"],
            "similarity_score": resource["similarity_score"],
            "keyphrases": resource["keyphrases"],
        }

        if "Video" in r["labels"]:
            r["description"] = resource["description"]
            r["description_full"] = resource["description_full"]
            r["thumbnail"] = resource["thumbnail"]
            r["duration"] = resource["duration"]
            r["views"] = resource["views"]
            r["publish_time"] = resource["publish_time"]

        elif "Article" in r["labels"]:
            r["abstract"] = resource["abstract"]

        ser_resources.append({"data": r})
    for relation in relations:
        r = {
            "type": relation["type"],
            "source": relation["source"],
            "target": relation["target"],
        }
        ser_realations.append({"data": r})
    data["concepts"] = concepts
    data["nodes"] = ser_resources
    data["edges"] = ser_realations

    return data

def save_data_to_file(data, file_path):
    data.to_csv(file_path, sep="\t", encoding="utf-8")
