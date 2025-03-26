from ..db.neo4_db import NeoDataBase

from .recommendation_type import RecommendationType
from .recommender import Recommender
import numpy as np
from config import Config

import numpy as np
import pandas as pd

from ..recommendation import resource_recommender_helper as rrh

from log import LOG
import logging
logger = LOG(name=__name__, level=logging.DEBUG)

class ResourceRecommenderService:
    def __init__(self):
        neo4j_uri = Config.NEO4J_URI
        neo4j_user = Config.NEO4J_USER
        neo4j_pass = Config.NEO4J_PASSWORD

        self.db = NeoDataBase(neo4j_uri, neo4j_user, neo4j_pass)

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

    def get_top_n_dnu_concepts(self, user, top_n):
        return self.db.get_top_n_dnu_concepts(user=user, top_n=top_n)
        # TODO: material_id is missing and the user argument is not correctly used
        # return self.db.get_top_n_dnu_concepts(user_id=user, material_id=material_id top_n=top_n)

    def get_slide_concepts(self, slide_id):
        return

    def _construct_user(self, user_id, non_understood, understood, new_concepts, mid):
        self.db.construct_user_model(
            user_id, non_understood, understood, new_concepts, mid
        )

    def resources_crawler_logic(self, concepts, recommendation_type=None):
        results = []
        recommender = Recommender(embedding_model=None)
    
        # Check if concepts already exist and connected to any resources in Neo4j Database
        concepts_db_checked = rrh.check_and_validate_resources(db=self.db, concepts=concepts)
        
        # Crawl resources from YouTube (from each dnu) and Wikipedia API
        for concept_updated in concepts_db_checked: #i in range(len(not_understood_concept_list)):
            results.append(rrh.parallel_crawling_resources(function=recommender.canditate_selection, 
                                                            concept_updated=concept_updated,
                                                            result_type="records",
                                                            top_n_videos=50,
                                                            top_n_articles=15
                                                        ))
        
        if recommendation_type:
            # Store resources into Neo4j Database (by creating connection btw Resource and Concept_modified)
            for result in results:
                self.db.store_resources(resources_dict=result, cid=result["cid"],
                                        recommendation_type=recommendation_type,
                                        resources_form="dict"
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


    def process_recommandation_pipeline(self, 
                                    rec_params: dict, 
                                    factor_weights: dict,
                                    recommendation_type,
                                    user_embedding="", 
                                    slide_weighted_avg_embedding_of_concepts="", 
                                    slide_document_embedding="",
                                    top_n_resources=10
        ):
        recommender = Recommender(embedding_model=None)
        self.resources_crawler_logic(concepts=rec_params["concepts"], recommendation_type=rec_params["recommendation_type"])

        # Gather|Retrieve all resources crawled
        resources = self.db.retrieve_resources(concepts=rec_params["concepts"], embedding_values=True)
        logger.info(f"len of resources {len(resources)}")
        
        # process with the recommendation algorithm selected
        if len(resources) > 0:
            data_df = pd.DataFrame(resources)
            resources_df = recommender.recommend(
                slide_weighted_avg_embedding_of_concepts=slide_weighted_avg_embedding_of_concepts,
                slide_document_embedding=slide_document_embedding,
                user_embedding=user_embedding,
                top_n=10,
                recommendation_type=recommendation_type,
                data=data_df
            )
            resources_df.replace({np.nan: None}, inplace=True)
            resources = resources_df.to_dict(orient='records') 
            self.db.store_resources(resources_list=resources, resources_form="list",resources_dict=None, cid=None)

            # insert attribute "is_bookmarked_fill" for resource saved by the user
            rids_user_resources_saved = self.db.get_rids_from_user_saves(user_id=rec_params["user_id"])
            resources = [{**resource, 'is_bookmarked_fill': resource['rid'] in rids_user_resources_saved} for resource in resources]

        # Apply ranking algorithm on the resources
        resources_dict = rrh.rank_resources(resources=resources, weights=factor_weights, 
                                            top_n_resources=top_n_resources, recommendation_type=recommendation_type,
                                            pagination_params=rec_params["pagination_params"]
                                        )
        result_final = {    
                            "recommendation_type": rec_params["recommendation_type"],
                            "concepts": rec_params["concepts"], 
                            "nodes": resources_dict
                        }
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
        
        # user = {"user_id": body["user_id"], "name": body["username"], "user_email": body["user_email"] }
        # create user node if not existed
        # user_ = self.db.get_or_create_user_v2(user)
                                   
        # _slide = None
        user_embedding = ""
        slide_document_embedding = ""
        slide_weighted_avg_embedding_of_concepts = ""
   
        if recommendation_type in [ RecommendationType.PKG_BASED_KEYPHRASE_VARIANT, RecommendationType.PKG_BASED_DOCUMENT_VARIANT ]:
            clu = rrh.save_and_get_concepts_modified(   db=self.db,
                                                        rec_params=rec_params, 
                                                        top_n=5, 
                                                        user_embedding_status=True, 
                                                        understood_list=body["understood_concept_ids"], 
                                                        non_understood_list=body["non_understood_concept_ids"]
                                                    )

            rec_params["concepts"] = clu["concepts"]
            user_embedding = clu.get("user_embedding")

        elif recommendation_type in [ RecommendationType.CONTENT_BASED_KEYPHRASE_VARIANT, RecommendationType.CONTENT_BASED_DOCUMENT_VARIANT ]:
            slide_concepts_ = self.db.get_main_concepts_by_slide_id(slide_id=body["slide_id"])
            _slide = self.db.get_slide(body["slide_id"])
            # slide_concepts = _slide[0]["s"]["concepts"]
            slide_document_embedding = _slide[0]["s"]["initial_embedding"]
            slide_weighted_avg_embedding_of_concepts = _slide[0]["s"][
                "weighted_embedding_of_concept"
            ]

            rec_params["concepts"] = slide_concepts_
            rec_params["mid"] = body["material_id"]
            clu = rrh.save_and_get_concepts_modified(   db=self.db,
                                                        rec_params=rec_params, 
                                                        top_n=len(slide_concepts_), 
                                                        user_embedding_status=False, 
                                                        understood_list=[], 
                                                        non_understood_list=[]
                                                    )
            rec_params["concepts"] = clu["concepts"]

        factor_weights = rrh.build_factor_weights(body["rec_params"]["factor_weights"])
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


    def _get_resources_by_main_concepts(self, mid: str): #, slide_id: str):
        # list of main concepts
        main_concepts = self.db.get_main_concepts_by_mid(mid=mid)
        try:
            self.resources_crawler_logic(concepts=main_concepts)
            return {"msg": True}
        except Exception as e:
            print(e)
            pass
        return {"msg": False}
