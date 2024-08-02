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
import pandas as pd

# import resource_recommender_helper as rrh
from ..recommendation import resource_recommender_helper as rrh

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
        '''
            Check if parameters exist. If one doesn't exist, return not found message
            check_message = resource_recommender_service.check_parameters(
            slide_id, material_id, user_id, non_understood_concept_ids, understood_concept_ids, new_concept_ids, recommendation_type)
        '''
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
    """
    def get_reosurce_by_rid_from_redis(self, user_id: str, rid: str):
        result_temp = self.get_redis_key_value(key_name=f"{user_id}_{self.redis_key_1}")
        resource = None
        if result_temp:
            result_temp = json.loads(result_temp)
            resources = result_temp["resources"]
            resource = next((d for d in resources if d['id'] == rid ), None)
        return resource
        
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

    """  

    def user_rates_resources(self, rating: dict):
        # if rating["value"] == "HELPFUL":
        #     resource = self.get_reosurce_by_rid_from_redis(user_id=rating["user_id"], rid=rating["rid"])
        resource = None
        rating_updated = self.db.user_rates_resources(rating=rating, resource=resource)
        return rating_updated
    
    def save_or_remove_user_resources(self, data: dict):
        # if data["status"] == True:
        #     resource = self.get_reosurce_by_rid_from_redis(user_id=data["user_id"], rid=data["rid"])
        resource = None
        resource_saved = self.db.user_saves_or_removes_resource(data=data, resource=resource)
        return resource_saved

    def filter_user_resources_saved_by(self, data: dict):
        resources = self.db.filter_user_resources_saved_by(data)
        return resources
    
    def get_rids_from_user_saves(self, user_id: dict):
        rids = self.db.get_rids_from_user_saves(user_id=user_id)
        return rids

    def process_recommandation_pipeline(self, 
                                    rec_params: dict, 
                                    factor_weights: dict,
                                    recommendation_type,
                                    user_embedding="", 
                                    slide_weighted_avg_embedding_of_concepts="", 
                                    slide_document_embedding="",
                                    top_n_resources=10
        ):
        results = []
        resources = []
        # self.recommender = Recommender()
        recommender = Recommender()

        # Check if concepts already exist and connected to any resources in Neo4j Database
        # concepts_to_be_crawled = []
        concepts_having_resources, concepts_not_having_resources, resources_found = rrh.check_and_get_resources_with_concepts(db=self.db, concepts=rec_params["concepts"])

        # Crawl resources from YouTube (from each dnu) and Wikipedia API
        if len(concepts_not_having_resources) > 0:
            for concept in concepts_not_having_resources: #i in range(len(not_understood_concept_list)):
                results.append(rrh.parallel_crawling_resources(function=recommender.canditate_selection, 
                                                               concept_name=concept["name"], 
                                                               cid= concept["cid"], 
                                                               result_type="records",
                                                               top_n_videos=2,
                                                               top_n_articles=2
                                                            ))

            # Store resources into Neo4j Database (by creating connection btw Resource and Concept_modified)
            for result in results:
                self.db.store_resources(resources_dict=result, cid=result["cid"], recommendation_type=rec_params["recommendation_type"])
        
        # Gather|Retrieve all resources crawled
        resources = self.db.retrieve_resources(concepts=rec_params["concepts"], embedding_values=True)
        
        # resources_new = self.db.retrieve_resources(concepts=concepts_not_having_resources, embedding_values=True)
        # if len(resources_found) > 0:
        #     resources = resources_found + resources_new
        # else:
        #     resources = resources_new
        # resources = rrh.remove_duplicates_from_resources(dict_list=resources)

        # Check whether some resource attributes are empty or not, such as: keyphrases, keyphrase_embedding, document_embedding
        # are_embedding_values_present = rrh.check_keys_not_empty_from_resources(resources=resources, recommendation_type_str=rec_params["recommendation_type"])
        
        # process with the recommendation algorithm selected
        # if len(concepts_having_resources) != len(rec_params["concepts"]):
        if len(resources) > 0:
            data_df = pd.DataFrame(resources)
            resources_df = recommender.recommend(
                slide_weighted_avg_embedding_of_concepts=slide_weighted_avg_embedding_of_concepts,
                slide_document_embedding=slide_document_embedding,
                user_embedding=user_embedding,
                top_n=10,
                recommendation_type=recommendation_type,
                data=data_df,
                are_embedding_values_present=True # are_embedding_values_present
            )
            # resources = resources_df.where(resources_df.notnull(), None).to_dict(orient='records')
            # resources_df = resources_df.fillna(0, inplace=True)
            resources_df.replace({np.nan: None}, inplace=True)
            resources = resources_df.to_dict(orient='records') 
            self.db.store_resources(resources_list=resources, resources_form="list",resources_dict=None, cid=None)

            # insert attribute "is_bookmarked_fill" for resource saved by the user
            rids_user_resources_saved = self.db.get_rids_from_user_saves(user_id=rec_params["user_id"])
            resources = [{**resource, 'is_bookmarked_fill': resource['rid'] in rids_user_resources_saved} for resource in resources]

        # Apply ranking algorithm on the resources
        # resources = rrh.remove_keys_from_resources(resources=resources)
        resources_dict = rrh.rank_resources(resources=resources, weights=factor_weights, top_n_resources=top_n_resources)

        # Provide only the top 10 of the resources
        result_final = {"recommendation_type": rec_params["recommendation_type"], "concepts": rec_params["concepts"], "nodes": resources_dict }
        # result_final = {"recommendation_type": rec_params["recommendation_type"], "concepts": rec_params["concepts"], "nodes": {"vidoes": [], "articles": []} }
        return result_final

    def _get_resources(self, data_rec_params: dict, data_default: dict=None, top_n = 5):
        '''
            Save cro_form, Crawl Youtube and Wikipedia API and then Store Resources
            Result: { "recommendation_type": "", "concepts": [], "nodes": {"articles": [], "videos": []} }
        '''
        body = rrh.rec_params_request_mapped(data_rec_params, data_default)
        result = { "recommendation_type": "", "concepts": [], "nodes": {"articles": [], "videos": []} }

        # Map recommendation type to enum values
        rec_params = body["rec_params"]
        # recommendation_type_str = body["rec_params"]["recommendation_type"]
        recommendation_type = RecommendationType.map_type(rec_params["recommendation_type"])

        check_message = self.check_parameters(
                    slide_id=body["slide_id"],
                    material_id=body["material_id"],
                    non_understood_concept_ids=body["non_understood_concept_ids"],
                    understood_concept_ids=body["understood_concept_ids"],
                    new_concept_ids=body["new_concept_ids"],
                    recommendation_type=rec_params["recommendation_type"],
                )
        if check_message != "":
            return result
        
        user = {"name": body["username"], "id": body["user_id"] , "user_email": body["user_email"] }
        # _slide = None
        user_embedding = ""
        slide_document_embedding = ""
        slide_weighted_avg_embedding_of_concepts = ""
   
        if recommendation_type in [ RecommendationType.PKG_BASED_DOCUMENT_VARIANT, RecommendationType.PKG_BASED_KEYPHRASE_VARIANT ]:
            # Only take n (n=5) concepts with the higher weight
            rec_params["concepts"] = rrh.get_top_n_concepts(concepts=rec_params["concepts"], top_n=len(rec_params["concepts"]))

            # Store Concepts into Neo4j Database
            clu = rrh.save_and_get_concepts_modified(   db=self.db,
                                                        rec_params=rec_params, 
                                                        top_n=5, 
                                                        user_embedding=True, 
                                                        understood_list=body["understood_concept_ids"], 
                                                        non_understood_list=body["non_understood_concept_ids"]
                                                    )

            rec_params["concepts"] = clu["concepts"]
            user_embedding = clu.get("user_embedding")

        elif recommendation_type in [ RecommendationType.CONTENT_BASED_DOCUMENT_VARIANT, RecommendationType.CONTENT_BASED_KEYPHRASE_VARIANT ]:
            _slide = self.db.get_slide(body["slide_id"])
            slide_document_embedding = _slide[0]["s"]["initial_embedding"]
            slide_weighted_avg_embedding_of_concepts = _slide[0]["s"][
                    "weighted_embedding_of_concept"
                ]
            # slide_concepts = _slide[0]["s"]["concepts"]
            slide_concepts_ = self.db.get_top_n_concept_by_slide_id(slide_id=body["slide_id"]) # , top_n=5)

            # Store Concepts into Neo4j Database
            rec_params["concepts"] = slide_concepts_
            rec_params["mid"] = body["material_id"]
            clu = rrh.save_and_get_concepts_modified(   db=self.db,
                                                        rec_params=rec_params, 
                                                        top_n=len(slide_concepts_), 
                                                        user_embedding=False, 
                                                        understood_list=[], 
                                                        non_understood_list=[]
                                                    )
            rec_params["concepts"] = clu["concepts"]

        factor_weights = rrh.build_factor_weights(body["rec_params"]["factor_weights"]["weights"])
        result = self.process_recommandation_pipeline(
            rec_params=rec_params,
            factor_weights=factor_weights,
            recommendation_type=recommendation_type,
            user_embedding=user_embedding,
            slide_weighted_avg_embedding_of_concepts=slide_weighted_avg_embedding_of_concepts,
            slide_document_embedding=slide_document_embedding,
            top_n_resources=10
        )
        return result



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
    
    def process_new_concepts(self, body: dict, factor_weights, new_concepts: list = [], top_n=5):
        '''
            Process and Crawl Resources
            Inside a Threading
        '''
        self.set_redis_key_value(key_name=f"{body['user_id']}_{self.redis_key_2}", value="running", set_time=False)

        rec_params = body["rec_params"]
        # concepts = new_concepts
        concepts = rec_params["concepts"]
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
            clu = rrh.save_and_get_concepts_modified(  rec_params=rec_params, top_n=5, user_embedding=True, 
                                                        understood_list=body["understood_concept_ids"], 
                                                        non_understood_list=body["non_understood_concept_ids"]
                                                    )

        elif recommendation_type in [ RecommendationType.CONTENT_BASED_DOCUMENT_VARIANT, RecommendationType.CONTENT_BASED_KEYPHRASE_VARIANT ]:
            logger.info("---------recommendation_type statistic----------")

            _slide = self.db.get_slide(body["slide_id"])
            slide_concepts = _slide[0]["s"]["concepts"]
            # cro_form["concepts"] = slide_concepts
            clu = rrh.save_and_get_concepts_modified(  rec_params=rec_params, top_n=5, user_embedding=False, 
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

        result = {"concepts": rec_params["concepts"], "resources": []}

        # if concepts == 1:
        #     self.set_redis_key_value(key_name=f"{body['user_id']}_{self.redis_key_1}", value=result, ex=(60 * 10080))
        #     self.save
        # else:
        #     pass

        resources_bg = resources_crawled["articles"] + resources_crawled["videos"]
        print("resources_bg")
        print(resources_bg)
        result = {"concepts": rec_params["concepts"], "resources": []}

        if len(resources_bg) > 0:
            if len(rec_params["concepts"]) != len(concepts):
                resources_found = self.db.retrieve_resources(concepts=rec_params["concepts"])
                resources = resources_found + resources_bg
                result["resources"] = self.rrh.rank_resources(resources=resources, weights=factor_weights)
            else:
                result["resources"] = self.rrh.rank_resources(resources=resources_bg, weights=factor_weights)
            self.set_redis_key_value(key_name=f"{body['user_id']}_{self.redis_key_1}", value=result, ex=(60 * 10080))
        else:
            self.set_redis_key_value(key_name=f"{body['user_id']}_{self.redis_key_1}", value=result, ex=(60 * 10080))
        
        # self.set_redis_key_value(key_name=f"{body['user_id']}_{self.redis_key_2}", value="completed")
        self.remove_redis_key_value(key_name=f"{body['user_id']}_{self.redis_key_2}")

        ''' 
            old
            if len(resources) > 0:
                resources = [{"node_id": node["id"]} for node in resources]
                self.edit_relationship_btw_concepts_and_resources(concepts=rec_params["concepts"], resources=resources)
                resources = self.db.retrieve_resources(concepts=rec_params["concepts"])
                # result = self.rrh.rank_resources(resources=resources, weights=factor_weights)
            else:
                result = {"articles": [], "videos": []}
        '''

        return concepts, result

    def _get_resources2(self, data_rec_params: dict, data_default: dict=None):
        '''
            Save cro_form, Crawl Youtube and Wikipedia API and then Store Resources
            Result: [ {"recommendation_type": str, "concepts": list(concepts), "nodes": list(resources)} ]
        '''
        body = rrh.rec_params_request_mapped(data_rec_params, data_default)
        # result = {}

        # Only take 5 concepts with the higher weight
        rec_params = body["rec_params"]
        top_n = 5
        concepts_top_n: list = body["rec_params"]["concepts"]
        concepts_top_n.sort(key=lambda x: x["weight"], reverse=True)
        rec_params["concepts"] = concepts_top_n[:top_n]

        # check whether the DNUs have been aldready requested
        # dnu_found = self.cro_get_concept_cro(user_id=body["croForm"]["user_id"], cid=cid, weight=weight)

        factor_weights = rrh.build_factor_weights(body["rec_params"]["factor_weights"]["weights"])
        concepts = rec_params["concepts"]

        are_concepts_sane, resources_temp = rrh.check_request_temp(rec_params=rec_params)
        
        # default resources value
        resources = { "articles": [], "videos": [] }

        if are_concepts_sane == True:
            resources = resources_temp
        else:
            resources = self.process_new_concepts(body=body, factor_weights=factor_weights)

        """
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
            resources = resourse_found # self.rrh.rank_resources(resourse_found)

            if len(concepts_not_having_resources) > 0:
                # concepts_used, resources_new = self.process_new_concepts(body=body, factor_weights=factor_weights, new_concepts=concepts_not_having_resources)
                rrh.create_get_resources_thread(self.process_new_concepts, args=(body, factor_weights, concepts_not_having_resources))

            elif len(concepts) > 0:
                # self.process_new_concepts(body=body, factor_weights=factor_weights)
                rrh.create_get_resources_thread(self.process_new_concepts, args=(body, factor_weights))
        """

        result = self.rrh.rank_resources(resources=resources, weights=factor_weights)
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
