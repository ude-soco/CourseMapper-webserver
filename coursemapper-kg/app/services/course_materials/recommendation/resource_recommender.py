import concurrent.futures
from flask import current_app

from ..db.neo4_db import NeoDataBase

from .recommendation_type import RecommendationType
from .recommender import Recommender
import numpy as np


from log import LOG
import logging
logger = LOG(name=__name__, level=logging.DEBUG)

class ResourceRecommenderService:
    def __init__(self):
        neo4j_uri = current_app.config.get("NEO4J_URI")  # type: ignore
        neo4j_user = current_app.config.get("NEO4J_USER")  # type: ignore
        neo4j_pass = current_app.config.get("NEO4J_PASSWORD")  # type: ignore

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
    
    def check_parameters_new(
        self,
        slide_id,
        material_id,
        concept_cids: list,
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

        for cid in concept_cids:
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
    # cro logic
    def cro_save_logic(
            self,
            cro_form: dict,
            top_n=5,
            user_embedding=False,
        ):
        """
            cro_form: user_id: str, mid: str, recommendation_type: int (1,2 -> dynamic and 3,4 -> static), concepts: list,
        """
        result = {
                "user_embedding": None,
                "cro_form": None,
                "concept_cids": [],
                "concept_names": []
            }

        # get only top 5 dnu
        concepts: list = cro_form["concepts"]
        concepts.sort(key=lambda x: x["weight"], reverse=True)
        cro_form["concepts"] = concepts[:top_n]

        # create concept_cro
        concepts_cro = self.db.cro_create_concept_cro(cro_form=cro_form)

        cids = [node["cid"] for node in cro_form["concepts"]]
        concepts = self.db.cro_get_concepts(cids=cids)
        for node_cro in concepts_cro:
            for node in concepts:
                if node_cro["cid"] == node["cid"]:
                    node_cro["name"] = node["name"]
                    node_cro["final_embedding"] = node["final_embedding"]
                    break
        
        cro_form["concepts"] = concepts_cro
        result["cro_form"] = cro_form

        ## Update User Embedding
        if user_embedding:
            sum_embeddings = 0
            sum_weights = 0
            # Convert string type to array type 'np.array'
            # Sum and average these concept embeddings to get user embedding
            for concept in concepts_cro:
                list1 = concept["final_embedding"].split(',')
                list2 = []
                for j in list1:
                    list2.append(float(j))
                arr = np.array(list2)
                sum_embeddings = sum_embeddings + arr * concept["weight"]
                sum_weights = sum_weights + concept["weight"]

            # The weighted average of final embeddings of all dnu concepts
            average = np.divide(sum_embeddings, sum_weights)
            embedding_str =','.join(str(i) for i in average)

            # Writing user embedding
            self.db.cro_update_user_embedding_value(user_id=cro_form["user_id"], embedding=embedding_str)
            result["user_embedding"] = embedding_str

        return result

    def cro_save_rating(self, rating: dict):
        resource_rid = rating["resource"]["rid"]
        rating["resource"] = resource_rid
        self.db.cro_create_rating(rating=rating)

        # update resource counts: helpful_count and not_helpful_count
        ratings_counted = self.db.cro_count_rating(resource_rid=resource_rid)
        logger.info(f"Increment and decrement Rating: {ratings_counted}")
        self.db.cro_update_resource_count(resource_rid=resource_rid, 
                                          helpful_count=ratings_counted["helpful_count"], 
                                          not_helpful_count=ratings_counted["not_helpful_count"]
                                        )
        
    def cro_edit_relationship_btw_concepts_cro_and_resources(self, concepts_cro: list, resources: list):
        self.db.cro_edit_relationship_btw_concepts_cro_and_resources(concepts_cro=concepts_cro, 
                                                                     resources=resources,
                                                                     old_relationship=True
                                                                    )
    
    def cro_get_resources_ranked_and_sorted(self, cro_form: dict):
        concepts_cro = cro_form["concepts"]
        result = []
        resources = self.db.cro_get_resources(concepts_cro=concepts_cro)
        positive_rated = []
        negative_rated = []
        rest = []
        for node in resources:
            if node["helpful_count"] != 0:
                positive_rated.append(node)
            elif node["helpful_count"] == 0 and node["not_helpful_count"] == 0:
                rest.append(node)
            elif node["not_helpful_count"] > 0:
                negative_rated.append(node)
        
        # top rated
        result += positive_rated
                
        # by: highest similarity scores
        rest = rest.sort(key=lambda x: x["similarity_score"], reverse=True)
        result += rest

        # negative rated
        negative_rated = negative_rated.sort(key=lambda x: x["not_helpful_count"], reverse=False)
        result += negative_rated

        return result

    def cro_store_detail_rec(
            self, 
            cro_form: dict, 
            top_n=5,
            user_embedding=False,
            is_concept_cids=False,
            is_concept_names=False
        ):
        """
            cro_form: user_id: str, mid: str, recommendation_type: int (1,2 -> dynamic and 3,4 -> static), concepts: list,
        """
        msg_log_gobal = "CRO ->"
        result_exists = False
        result_final = {
                "cro_form_concepts_original": [],
                # "top_n_dnu_concepts": None,
                "user_embedding": None,
                "cro_form": None,
                "concepts": [],
                "result_exists": False
            }
        logger.info(f"{msg_log_gobal} Creating cro_form (if not exists) and updating User Embedding Value")

        ## set the original concepts list
        logger.info("setting the original concepts list")
        result_final["cro_form_concepts_original"] = cro_form["concepts"]


        ## complete the concept list with existing dnus
        logger.info("completing the concept list with existing dnus")
        user_dnus_conceps = self.db.cro_get_top_n_dnu_concepts( user_id=cro_form["user_id"],
                                                                material_id=cro_form["mid"]
                                                            )
        user_dnus_conceps = sorted(user_dnus_conceps, key=lambda x: x["weight"], reverse=True)

        concepts = []
        """
        # if len(cro_form["concepts"]) > 5:
        #     concepts_sorted = sorted(cro_form["concepts"], key=lambda x: x["weight"], reverse=True)
        #     concepts = concepts_sorted[:top_n]
        # else:
        #     # concepts_2 = user_dnus_conceps[:len(cro_form["concepts"]) + 1 ]
        #     concepts_2 = []
        #     count = 0
        #     for concept_root in user_dnus_conceps:
        #         if count == len(cro_form["concepts"]) + 1 :
        #             if concept_root["cid"] not in [concept["cid"] for concept in cro_form["concepts"]]:
        #                 concepts_2.append(concept_root)
        #                 count += 1
        #         else:
        #             break
            
        #     concepts_1 = cro_form["concepts"]
        #     concepts = concepts_1 + concepts_2
        """
        
        ## set detail of concept
        concepts_sorted = sorted(cro_form["concepts"], key=lambda x: x["weight"], reverse=True) # to be adapt with the logic above
        concepts = concepts_sorted[:top_n]
        for concept in concepts:
            for concept_root in user_dnus_conceps:
                if concept["cid"] == concept_root["cid"]:
                    concept["name"] = concept_root["name"]
                    concept["final_embedding"] = concept_root["final_embedding"]
                    break
                
        # print("concepts ->", len(concepts))

        ## Check if node "cro_form" exists
        logger.info("Check if node 'cro_form' exists")
        cro_form_node_exists = self.db.cro_check_cro_nodes_exist(cro_form=True)

        cro_form_found = None
        # cro_form_concept_cids = [concept["cid"] for concept in concepts]
        # concept_weights_udpated = [concept["weight"] for concept in concepts]
        if cro_form_node_exists["node_exists"] == True:
            cro_form_found = self.db.cro_get_exact_cro_form(cro_form=cro_form)
            # cro_form_found = self.db.cro_get_exact_cro_form(    user_id=cro_form["user_id"], 
            #                                                                                 mid=cro_form["mid"], 
            #                                                                                 concept_cids=cro_form_concept_cids
            #                                                                             )

            logger.info("cro_get_exact_cro_form ->")
            # print(cro_form_found)
            
            if cro_form_found:
                result_exists = True
                # result_final["result_exists"] = True

        if cro_form_found == None:
            cro_form_result = self.db.cro_create_cro_form(
                    user_id=cro_form["user_id"],
                    mid=cro_form["mid"],
                    recommendation_type=cro_form["recommendation_type"],
                    concepts=concepts # cro_form["concepts"]
                    # concepts_original=result_final["cro_form_concepts_original"]
                )
            cro_form_found = cro_form_result

            # check relationship between cro_user and cro_form alreay exists
            rsuf = self.db.cro_check_and_count_relationship_cro_user_and_cro_form(user_id=cro_form["user_id"])
            if rsuf["count"] == 0:

                ## create node cro_user
                cro_user_result = self.db.cro_create_cro_user(user_id=cro_form["user_id"], embedding="")
                
                ## create relationship between cro_user and cro_concept # cro_user_result_cro_form_result_r
                logger.info("creating relationship between cro_user and cro_concept")

                r = self.db.cro_create_relationship_between_cro_user_and_cro_concept(
                    cro_user_node_id=cro_user_result["node_id"],
                    cro_form_node_id=cro_form_found["node_id"]
                )
                if r:
                    self.db.cro_create_relationship_between_user_and_cro_user(
                        user_id=cro_user_result["user_id"], 
                        cro_user_node_id=cro_user_result["node_id"]
                    )
        
        logger.info(f"cro_form_found -> {cro_form_found['node_id']}")

        if result_exists:
            result_final["result_exists"] = True

        if cro_form_found is not None and user_embedding:
            logger.info("Update User Embedding")

            if len(cro_form_found["concept_cids"]) > 0:

                ## Update User Embedding
                sum_embeddings = 0
                sum_weights = 0
                # Convert string type to array type 'np.array'
                # Sum and average these concept embeddings to get user embedding
                for concept in concepts: # cro_form_found["concepts"]:
                    list1 = concept["final_embedding"].split(',')
                    list2 = []
                    for j in list1:
                        list2.append(float(j))
                    arr = np.array(list2)
                    sum_embeddings = sum_embeddings + arr * concept["weight"]
                    sum_weights = sum_weights + concept["weight"]

                # The weighted average of final embeddings of all dnu concepts
                average = np.divide(sum_embeddings, sum_weights)
                embedding_str =','.join(str(i) for i in average)

                self.db.cro_user_update_embedding(user_id=cro_form_found["user_id"], embedding=embedding_str)
                logger.info(f"{msg_log_gobal} getting user embedding")
                result_final["user_embedding"] = embedding_str

        # set cro_form from the database
        logger.info("setting cro_form from the database")
        result_final["cro_form"] = cro_form_found
        result_final["concepts"] = concepts

        if is_concept_cids:
            result_final["concept_cids"] = [concept["cid"] for concept in concepts]
        if is_concept_names:
            result_final["concept_names"] = [concept["name"] for concept in concepts]

        return result_final
    
    ######
    ######

    def _get_resources(self, user_id, slide_id, material_id, recommendation_type, cro_form: dict=None, pagination_params: dict=None):
        """
            Save cro_form, Crawl Youtube and Wikipedia API and then Store Resources
        """
        wikipedia_articles = []
        youtube_videos = []
        resource_list = []
        relationship_list = []
        not_understood_concept_list = []
        concepts = []

        # to be removed
        # sort_by_params = {"similarity_score": True, "most_recent": False, "popularity": False}
        # pagination_params = { "current_page": 1, "total_items": 15, "content": [], "total_pages": 2, "sort_by_params": sort_by_params}

        if cro_form ["recommendation_type"] in [1, 2, "1", "2"]:
            cro_logic_result = self.cro_save_logic(
                                        cro_form=cro_form,
                                        top_n=5,
                                        user_embedding=True
                                    )
            cro_form = cro_logic_result["cro_form"]
            user_embedding = cro_logic_result["user_embedding"]

            not_understood_concept_list = [concept["name"] for concept in cro_form["concepts"]]
            concept_ids = [concept["cid"] for concept in cro_form["concepts"]]
            concepts = cro_form["concepts"]

        elif cro_form ["recommendation_type"] in [3, 4, "3", "4"]:
            _slide = self.db.get_slide(slide_id)
            slide_concepts = _slide[0]["s"]["concepts"]
            
            cro_form["concepts"] = slide_concepts
            cro_logic_result = self.cro_save_logic(
                                    cro_form=cro_form,
                                    top_n=5,
                                    user_embedding=False
                                )
            cro_form = cro_logic_result["cro_form"]
            concepts = cro_form["concepts"]
            concept_ids = [concept["cid"] for concept in cro_form["concepts"]]
        
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
                and recommendation_type != RecommendationType.STATIC_KEYPHRASE_BASED
                and recommendation_type != RecommendationType.STATIC_DOCUMENT_BASED
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


        # If both results are empty return an empty object
        if (isinstance(youtube_videos, list) or youtube_videos.empty) and (
            isinstance(wikipedia_articles, list) or wikipedia_articles.empty
        ):
            # return {}
            resources = []
        else:
            # Otherwise proceed save the results in the database
            resources, relationships = self.db.get_or_create_resoures_relationships(
                wikipedia_articles=wikipedia_articles,
                youtube_videos=youtube_videos,
                user_id=user_id,
                material_id=material_id,
                concept_ids=concept_ids,
                recommendation_type=recommendation_type,
            )
            #### TO DO
            ### OPTIONAL: REMOVE RELATIONSHIP "CONTAINS" BTW "Resource" and "Concept"
        
        self.cro_edit_relationship_btw_concepts_cro_and_resources(concepts_cro=cro_form["concepts"], resources=resources)
        result = self.cro_get_resources_ranked_and_sorted(cro_form=cro_form)
        return {"cro_form": cro_form, "nodes": result}

        """
        result_video_ids = []
        result_article_ids = []

        if not isinstance(youtube_videos, list) and not youtube_videos.empty:
            result_video_ids = youtube_videos["id"].tolist()

        if not isinstance(wikipedia_articles, list) and not wikipedia_articles.empty:
            result_article_ids = wikipedia_articles["id"].tolist()

        result_ids = result_video_ids + result_article_ids

        # filter the results from the database and keep only the ones generated by the Recommender
        filtered_resources = [r for r in resources if r["rid"] in result_ids]
        resp = get_serialized_resource_data(filtered_resources, concepts, relations=[])
        """
        """
        # if not isinstance(youtube_videos, list) and (not youtube_videos.empty):
        #     youtube_videos = youtube_videos.drop(columns=["concept_embedding", "text", 'thumbnails', 'description',
        #     'description_full', 'id', 'title', 'channelTitle', 'liveBroadcastContent', 'kind', 'publishedAt',
        #     'channelId', 'publishTime', 'views', 'duration'])
        #     # file_path_youtube = "recommendation/data/video_concept_user_description_and_title_only.csv"
        #     file_path_youtube = "recommendation/data/video_concept_subtitles_only_15.csv"
        #     # file_path_youtube = "recommendation/data/video_document_subtitles_only_15.csv"
        #     # file_path_youtube = "recommendation/data/video_document_user.csv"
        #     # file_path_youtube = "recommendation/data/video_document_user_20.csv"
        #     # file_path_youtube = "recommendation/data/video_document_user_15.csv"
        #     # file_path_youtube = "recommendation/data/video_document_user_10.csv"
        #     # file_path_youtube = "recommendation/data/video_concept_user_description_and_title_only_15.csv"
        #     # file_path_youtube = "recommendation/data/video_concept_user_subtitles_only_15.csv"
        #     # file_path_youtube = "recommendation/data/video_concept_user_description_and_title_only_10.csv"
        #
        #     # youtube_videos.to_csv(file_path_youtube, index=False)
        #     youtube_videos.to_csv(file_path_youtube, mode='a', index=False, header=False)
        #
        # if not isinstance(wikipedia_articles, list) and (not wikipedia_articles.empty):
        #     wikipedia_articles = wikipedia_articles.drop(columns=["concept_embedding", "text", 'abstract', 'id',
        #     'title'])
        #     # file_path_wikipedia = "recommendation/data/article_concept_user_abstract_and_title_only.csv"
        #     file_path_wikipedia = "recommendation/data/article_concept_content_only_15.csv"
        #     # file_path_wikipedia = "recommendation/data/article_document_content_only_15.csv"
        #     # file_path_wikipedia = "recommendation/data/article_document_user.csv"
        #     # file_path_wikipedia = "recommendation/data/article_document_user_20.csv"
        #     # file_path_wikipedia = "recommendation/data/article_document_user_15.csv"
        #     # file_path_wikipedia = "recommendation/data/article_document_user_10.csv"
        #     # file_path_wikipedia = "recommendation/data/article_concept_user_abstract_and_title_only_15.csv"
        #     # file_path_wikipedia = "recommendation/data/article_concept_user_content_only_15.csv"
        #     # file_path_wikipedia = "recommendation/data/article_concept_user_abstract_and_title_only_10.csv"
        #
        #     # wikipedia_articles.to_csv(file_path_wikipedia, index=False)
        #     wikipedia_articles.to_csv(file_path_wikipedia, mode='a', index=False, header=False)

        # file_path_youtube = "recommendation/dat2/video_data_all_without_user.png"
        # file_path_wikipedia = "recommendation/dat2/articles_data_all_without_user.png"
        # file_path_youtube_document_based_similarity = "recommendation/data/dist2/video_document_based_similarity.png"
        # file_path_wikipedia_document_based_similarity = "recommendation/data/dist2/articles_document_based_similarity.png"
        # file_path_youtube_concept_based_similarity = "recommendation/data/dist2/video_concept_based_similarity.png"
        # file_path_wikipedia_concept_based_similarity = "recommendation/data/dist2/articles_concept_based_similarity.png"
        # file_path_youtube_user_document_based_similarity = "recommendation/data/dist2/video_user_document_based_similarity.png"
        # file_path_wikipedia_user_document_based_similarity = "recommendation/data/dist2/articles_user_document_based_similarity.png"
        # file_path_youtube_user_concept_based_similarity = "recommendation/data/dist2/video_user_concept_based_similarity.png"
        # file_path_wikipedia_user_concept_based_similarity = "recommendation/data/dist2/articles_user_concept_based_similarity.png"
        # file_path_youtube_fused_similarity = "recommendation/data/dist2/video_fused_similarity.png"
        # file_path_wikipedia_fused_similarity = "recommendation/data/dist2/articles_fused_similarity.png"
        # file_path_youtube_fused_user_similarity = "recommendation/data/dist2/video_fused_user_similarity.png"
        # file_path_wikipedia_fused_user_similarity = "recommendation/data/dist2/articles_fused_user_similarity.png"
        #
        # save_plot_data(youtube_videos, file_path_youtube)
        # save_plot_data(wikipedia_articles, file_path_wikipedia)
        #
        #
        # plot_distribution_chart(youtube_videos, "document_based_similarity", file_path_youtube_document_based_similarity)
        # plot_distribution_chart(wikipedia_articles, "document_based_similarity", file_path_wikipedia_document_based_similarity)
        # plot_distribution_chart(youtube_videos, "concept_based_similarity", file_path_youtube_concept_based_similarity)
        # plot_distribution_chart(wikipedia_articles, "concept_based_similarity", file_path_wikipedia_concept_based_similarity)
        # plot_distribution_chart(youtube_videos, "user_document_based_similarity", file_path_youtube_user_document_based_similarity)
        # plot_distribution_chart(wikipedia_articles, "user_document_based_similarity", file_path_wikipedia_user_document_based_similarity)
        # plot_distribution_chart(youtube_videos, "user_concept_based_similarity", file_path_youtube_user_concept_based_similarity)
        # plot_distribution_chart(wikipedia_articles, "user_concept_based_similarity", file_path_wikipedia_user_concept_based_similarity)
        # plot_distribution_chart(youtube_videos, "fused_similarity", file_path_youtube_fused_similarity)
        # plot_distribution_chart(wikipedia_articles, "fused_similarity", file_path_wikipedia_fused_similarity)
        # plot_distribution_chart(youtube_videos, "fused_user_similarity", file_path_youtube_fused_user_similarity)
        # plot_distribution_chart(wikipedia_articles, "fused_user_similarity", file_path_wikipedia_fused_user_similarity)
        """

    def map_recommendation_request(self, data_cro_form: dict, data_default: dict=None):
        if data_default:
            material_id = data_default.get("materialId")  # type: ignore
            material_page = data_default.get("materialPage")  # type: ignore
            user_id = data_default.get("userId")  # type: ignore
            user_email = data_default.get("userEmail")  # type: ignore
            slide_id = data_default.get("slideId")  # type: ignore
            username = data_default.get("username")  # type: ignore
            # recommendation_type = data_default.get("recommendationType")# activate if several models need to be tested & modelNumber will be sent from frontend
            understood = data_default.get("understoodConcepts")  # type: ignore
            non_understood = data_default.get("nonUnderstoodConcepts")  # type: ignore
            new_concepts = data_default.get("newConcepts")

            understood_concept_ids = [cid for cid in understood.split(",") if understood]
            non_understood_concept_ids = [ cid for cid in non_understood.split(",") if non_understood ]
            new_concept_ids = [cid for cid in new_concepts.split(",") if new_concepts]

        # material_id = data_cro_form.get("mid")
        # user_id = data_cro_form.get("user_id")
        # slide_id = data_cro_form.get("slide_id")
        # concept_cids = [concept["cid"] for concept in data_cro_form["concepts"]]
        pagination_params = data_cro_form["pagination_params"]
        logger.info("pagination_params ->", pagination_params)

        # if data_default == None and data_cro_form != None:
        #     # get concepts
        #     return self.db.cro_retrieve_concept_resources_pagination(cro_form=cro_form, concepts=concepts, pagination_params=pagination_params)

        # extract recommendation type
        result = {
            "cro_form": None,
            "concepts": [],
            "edges": None,
            "recommendation_type_1": {
                "nodes": []
            },
            "recommendation_type_2": {
                "nodes": []
            },
            "recommendation_type_3": {
                "nodes": []
            },
            "recommendation_type_4": {
                "nodes": []
            }
        }
        # recommendation_type = "1"
        for key, value in data_cro_form["recommendation_types"]["models"].items():
            cro_form = {
                "user_id": data_cro_form["user_id"],
                "mid": data_cro_form["mid"],
                "slide_id": data_cro_form["slide_id"],
                "category": data_cro_form["category"],
                "concepts": data_cro_form["concepts"],
                # "pagination_params": data_cro_form["pagination_params"],
                # "recommendation_type": value
            }

            if key == "recommendation_type_1" and value == True:
                recommendation_type = "1"
            if key == "recommendation_type_2" and value == True:
                recommendation_type = "2"
            if key == "recommendation_type_3" and value == True:
                recommendation_type = "3"
            if key == "recommendation_type_4" and value == True:
                recommendation_type = "4"

            if recommendation_type and recommendation_type != None: # cro_form.get("recommendation_type"):
                cro_form["recommendation_type"] = int(recommendation_type)
                if data_default != None:
                    logger.info("---CRO Starting--with--cro_form-->", cro_form)

                    """
                    # convert recommendation_type from int into string
                    # recommendation_type = str(cro_form["recommendation_type"])

                    # resource_recommender_service = ResourceRecommenderService()
                    # TODO comment out or remove the next line if the recommendation_type is sent from the frontend
                    # Only first model is needed ==> no model_type will be sent from frontend (other models were added for evaluation task)
                    # recommendation_type = "1"
                    """

                    # Check if parameters exist. If one doesn't exist, return not found message
                    # check_message = resource_recommender_service.check_parameters(slide_id, material_id, user_id, non_understood_concept_ids, understood_concept_ids, new_concept_ids, recommendation_type)
                    check_message = self.check_parameters(
                        slide_id=slide_id,
                        material_id=material_id,
                        non_understood_concept_ids=non_understood_concept_ids,
                        understood_concept_ids=understood_concept_ids,
                        new_concept_ids=new_concept_ids,
                        recommendation_type=recommendation_type,
                    )
                    if check_message != "":
                    # logger.info(check_message)
                        # return {"msg": check_message, "code": 404} # make_response(check_message, 404)
                        return {"result": check_message, "code": 404}
                    
                    user = {"name": username, "id": user_id, "user_email": user_email}

                    # Map recommendation type to enum values
                    if recommendation_type == "1":
                        recommendation_type = RecommendationType.DYNAMIC_KEYPHRASE_BASED
                    elif recommendation_type == "2":
                        recommendation_type = RecommendationType.DYNAMIC_DOCUMENT_BASED
                    elif recommendation_type == "3":
                        recommendation_type = RecommendationType.STATIC_KEYPHRASE_BASED
                    elif recommendation_type == "4":
                        recommendation_type = RecommendationType.STATIC_DOCUMENT_BASED
                
                    # If personalized recommendtion, build user model
                    if (
                        recommendation_type != RecommendationType.WITHOUT_EMBEDDING
                        and recommendation_type != RecommendationType.COMBINED_STATIC
                        and recommendation_type != RecommendationType.STATIC_KEYPHRASE_BASED
                        and recommendation_type != RecommendationType.STATIC_DOCUMENT_BASED
                    ):
                        self._construct_user(
                            user=user,
                            non_understood=non_understood_concept_ids,
                            understood=understood_concept_ids,
                            new_concepts=new_concept_ids,
                            mid=material_id,
                        )

                user_id = cro_form["user_id"]
                slide_id = cro_form["slide_id"]
                material_id = cro_form["mid"]
                resp = self._get_resources(
                    user_id=user_id,
                    slide_id=slide_id,
                    material_id=material_id,
                    recommendation_type=recommendation_type,
                    cro_form=cro_form,
                    pagination_params=pagination_params
                )


                recommendation_type = None
                result["recommendation_type_" + str(resp["recommendation_type"])] = {
                                                                                    # "cro_form": resp["cro_form"],
                                                                                    # "concepts": resp["concepts"],
                                                                                    "nodes": resp["nodes"]
                                                                                }
                cro_form = resp["cro_form"]
                result["cro_form"] = cro_form
                result["concepts"] = cro_form["concepts"]
                
        return {"result": result, "code": 404}
            

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
