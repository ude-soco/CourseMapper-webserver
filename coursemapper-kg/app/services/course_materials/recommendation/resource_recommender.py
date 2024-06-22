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
    # CRO logic

    def save_and_get_concepts_modified(self, recs_params, non_understood_list =[], understood_list=[]):
        """
            recs_params: {
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
        """
        result = {
            "new_concept_modified": True,
            "concepts": [],
            "concept_cids": [],
            "concept_names": [],
            "concepts_original": recs_params["concepts"],
            "concepts_not_saved": [],
            "concepts_saved": []
        }
        tx = self.db.driver.session()
        user_id = recs_params["user_id"]
        concepts = recs_params["concepts"]

        # update status between understood and non-understood
        if len(understood_list) > 0:
            for cid in understood_list:
                tx.run(
                    '''
                        MATCH p=(u)-[r:HAS_MODIFIED]->(c) 
                        WHERE c.user_id = $user_id AND c.cid = $cid
                        SET c.status = 'u'
                    ''',
                    user_id=user_id,
                    cid=cid
                )

        if len(concepts) > 0:
          # get user node
          user_node = self.db.cro_get_user(user_id=user_id)

          for concept in understood_list:

            # check if the node Concept_modified exist
            concept_modified_node_exists = tx.run(
                """
                    MATCH (c:Concept_modified)
                    WHERE c.user_id = $user_id and c.cid = $cid and c.weight = $weight
                    RETURN ID(c) as node_id, c.cid as cid, c.weight as weight
                """,
                user_id=user_id,
                cid=cid,
                weight=concept["weight"]
            )

            if concept_modified_node_exists is not None:
                tx.run(
                    """
                        MATCH (c:Concept_modified)
                        WHERE c.user_id = $user_id and c.cid = $cid and c.weight = $weight
                        SET c.weight = $weight
                        RETURN ID(c) as node_id, c.cid as cid, c.weight as weight
                    """,
                    user_id=user_id,
                    cid=cid,
                    weight=concept["weight"]
                )
            else:
                # create node Concept_modified
                concept_modified_node = tx.run(
                        '''
                            MERGE (c: Concept_modified {
                                    user_id: $user_id, 
                                    cid: $cid, 
                                    weight: $weight, 
                                    mid: $mid, 
                                    status: $status
                                })
                            RETURN ID(c) as node_id, c.cid as cid, c.weight as weight
                        ''',
                        user_id=user_id,
                        cid=concept["cid"],
                        weight=concept["weight"],
                        mid=concept["mid"],
                        status='dnu'
                    )
                
                if concept_modified_node is not None:
                    logger.info("Creating relationship between node User and Concept_modified")
                    tx.run(
                            '''
                                MATCH (a:User),(b:Concept_modified)
                                WHERE ID(a) = $id_a AND ID(b) = $id_b
                                MERGE (a)-[r:HAS_MODIFIED]->(b)
                                RETURN r
                            ''',
                            id_a=user_node["node_id"],
                            id_b=concept_modified_node["node_id"]
                        )

                    logger.info("Creating relationship between Concept_modified and original concept")
                    concept_original = tx.run(
                            """
                            MATCH (c:Concept)
                            WHERE c.cid = $cid
                            RETURN ID(c) as node_id
                            """,
                            cid=cid
                        ).single()
                    
                    if concept_original is not None:
                        tx.run(
                                """
                                MATCH (a:Concept_modified),(b:Concept)
                                WHERE ID(a) = $id_a AND ID(b) = $id_b
                                MERGE (a)-[r:ORIGINATED_FROM]->(b)
                                RETURN r
                                """,
                                id_a=concept_modified_node["node_id"],
                                id_b=concept_original["node_id"]
                            )

            # update user embedding value (because weight value could be changed from the user)



    def cro_form_logic_updated(
            self,
            cro_form: dict,
            top_n=5,
            user_embedding=False,
        ):
        """
            cro_form: user_id: str, concepts: list,
        """
        result = {
                "cro_form": None,
                "user_embedding": None,
                "concepts": None,
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
        # result["concept_names"] = [concept["name"] for concept in cro_form["concepts"]]

        ## Update User Embedding
        if user_embedding:
            # user = self.db.cro_get_user(user_id=cro_form["user_id"], complete=True)
            # embedding_str = user["embedding"]
            # result["user_embedding"] = embedding_str

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

    def user_rates_resources(self, rating: dict):
        self.db.user_rates_resources(rating=rating)
        rating_found = self.db.get_user_rating_detail_by(rating=rating)
        return rating_found
    
    def save_or_remove_user_resources(self, data: dict):
        resource_saved = self.db.save_or_remove_user_resources(data)
        return resource_saved

    def get_concepts_mids_sliders_numbers_for_user_resources_filtering(self, data: dict):
        result = self.db.get_concepts_mids_sliders_numbers_for_user_resources_filtering(data)
        return result

    def filter_user_resources_saved_by(self, data: dict):
        resources = self.db.filter_user_resources_saved_by(data)
        result = {
                    "articles": [resource for resource in resources if "Video" in resource["labels"]],
                    "videos": [resource for resource in resources if "Article" in resource["labels"]]
                }
        return result
    
    def cro_edit_relationship_btw_concepts_cro_and_resources(self, concepts_cro: list, resources: list):
        self.db.cro_edit_relationship_btw_concepts_cro_and_resources(concepts_cro=concepts_cro, 
                                                                     resources=resources,
                                                                     old_relationship=True
                                                                    )

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

    def cro_sort_result(self, resources: list, weights: dict = None, ratings: list = None):
        """
            Ranking/Sorting Logic for Resources
            Result Form: {"articles": list, "videos": list}
            Last Step: Resources having Rating related to DNU_modified (cid)
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
        resources_videos = self.calculate_factors_weights(category=1, resources=resources_videos, weights=video_weights_normalized)
        resources_videos = [{k: v for k, v in d.items() if k not in ["composite_score", "labels"]} for d in resources_videos]

        # articles items
        resources_articles = [resource for resource in resources if "Article" in resource["labels"]]
        resources_articles = self.calculate_factors_weights(category=2, resources=resources_articles, weights=article_weights_normalized)
        resources_articles = [{k: v for k, v in d.items() if k not in ["composite_score", "labels"]} for d in resources_articles]

        # # Finally, priorities on resources having Rating related to DNU_modified (cid)
        if ratings and len(ratings) > 0:
            pass

        return {
            "articles": resources_articles,
            "videos": resources_videos
        }

    def store_resources(self, recommendation_type, user_id, material_id, _slide, user_embedding, concepts, concept_ids, not_understood_concept_list):
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

            # print(future.result())
            # print(future.__dict__)
            
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
            #### TO DO -> Improving Saving Performance
            ### ONLY SAVE Resources without Creating Relationship "CONTAINS" to "Concept"

            # Otherwise proceed save the results in the database
            resources, relationships = self.db.get_or_create_resoures_relationships(
                wikipedia_articles=wikipedia_articles,
                youtube_videos=youtube_videos,
                user_id=user_id,
                material_id=material_id,
                concept_ids=concept_ids,
                recommendation_type=recommendation_type,
            )
        
        return resources
    
    def cro_extract_meta_data(self, data_cro_form: dict, data_default: dict=None):
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
            "croForm": data_cro_form,
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
    
    def _get_resources(self, data_cro_form: dict, data_default: dict=None):
        """
            Save cro_form, Crawl Youtube and Wikipedia API and then Store Resources
            Result: [ {"recommendation_type": str, "concepts": list(concepts), "nodes": list(resources)} ]
        """
        body = self.cro_extract_meta_data(data_cro_form, data_default)
        result = {}

        # check whether the DNUs have been aldready requested
        # dnu_found = self.cro_get_concept_cro(user_id=body["croForm"]["user_id"], cid=cid, weight=weight)

        # Map recommendation type to enum values
        rec_type = body["croForm"]["recommendation_type"]
        recommendation_type = RecommendationType.map_type(rec_type)

        cro_form = {
            "user_id": body["croForm"]["user_id"],
            "concepts": body["croForm"]["concepts"],
        }
        factor_weights = self.build_factor_weights(body["croForm"]["factor_weights"]["weights"])
        concepts = cro_form["concepts"]

        # check whether to only rank resources
        if body["croForm"]["factor_weights"]["reload"] == True:
            logger.info("----Ranking Resourses----")
            resources = self.db.cro_get_resources(concepts_cro=cro_form["concepts"])
            result = self.cro_sort_result(resources=resources, weights=factor_weights)

        else:
            logger.info("----new concepts----")
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
            if recommendation_type in [ RecommendationType.PKG_BASED_DOCUMENT__VARIANT, RecommendationType.PKG_BASED_KEYPHRASE_VARIANT ]:
                logger.info("---------recommendation_type dyn----------")

                self._construct_user(
                    user=user,
                    non_understood=body["non_understood_concept_ids"],
                    understood=body["understood_concept_ids"],
                    new_concepts=body["new_concept_ids"],
                    mid=body["material_id"],
                )
                clu = self.cro_form_logic_updated(cro_form=cro_form, top_n=5, user_embedding=True)

            elif recommendation_type in [ RecommendationType.CONTENT_BASED_DOCUMENT_VARIANT, RecommendationType.CONTENT_BASED_KEYPHRASE_VARIANT ]:
                logger.info("---------recommendation_type statistic----------")

                _slide = self.db.get_slide(body["slide_id"])
                slide_concepts = _slide[0]["s"]["concepts"]
                # cro_form["concepts"] = slide_concepts
                clu = self.cro_form_logic_updated(cro_form=cro_form, top_n=5, user_embedding=False)
                clu["concepts"] = slide_concepts

            cro_form = clu["cro_form"]
            user_embedding = clu.get("user_embedding")
            # concepts = cro_form["concepts"]
            concept_ids = [concept["cid"] for concept in cro_form["concepts"]]
            not_understood_concept_list = [concept["name"] for concept in cro_form["concepts"]]

            resources = self.store_resources(   
                                recommendation_type=recommendation_type,
                                user_id=body["user_id"],
                                material_id=body["material_id"],
                                _slide=_slide,
                                user_embedding=user_embedding,
                                concepts=concepts,
                                concept_ids=concept_ids,
                                not_understood_concept_list=not_understood_concept_list
                            )

            if len(resources) > 0:
                resources = [{"node_id": node["id"]} for node in resources]
                self.cro_edit_relationship_btw_concepts_cro_and_resources(concepts_cro=cro_form["concepts"], resources=resources)
                resources = self.db.cro_get_resources(concepts_cro=cro_form["concepts"])

                result = self.cro_sort_result(resources=resources, weights=factor_weights)
            else:
                result = {"articles": [], "videos": []}

        concepts = [{k: v for k, v in d.items() if k != "final_embedding"} for d in concepts]
        recommendation_type_nbr = RecommendationType.map_type(recommendation_type, find_type="v")

        result = {key: result[key][:10] for key, value in result.items()}
        result = {"recommendation_type": recommendation_type_nbr, "concepts": concepts, "nodes": result }
                #   "count": {"videos": len(result["videos"]), "articles": len(result["articles"])} 

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
