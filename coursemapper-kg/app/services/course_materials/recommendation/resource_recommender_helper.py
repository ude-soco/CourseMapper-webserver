import json
from datetime import datetime, timedelta
from dateutil.parser import parse as date_parse
import numpy as np
from sklearn.preprocessing import normalize as normalize_sklearn, MinMaxScaler as MinMaxScaler_sklearn
import json
import threading
import time
import math
import scipy.stats as st
from ..db.neo4_db import NeoDataBase
import concurrent.futures
from .recommendation_type import RecommendationType

from log import LOG
import logging
logger = LOG(name=__name__, level=logging.DEBUG)


def insert_dict_if_not_exists_by_id(lst: list, new_dict: dict, key: str):
    if not any(d.get(key) == new_dict.get(key) for d in lst):
        lst.append(new_dict)
    return lst

def remove_duplicates_from_resources(dict_list: list, key: str="rid"):
    '''
        Remove Duplicates from list (resource list)
    '''
    logger.info("Remove Duplicates from list (resource list)")

    seen = set()
    unique_dicts = []
    
    for d in dict_list:
        value = d[key]
        if value not in seen:
            seen.add(value)
            unique_dicts.append(d)
    
    return unique_dicts

def remove_keys_from_resources(resources: list, recommendation_type=None):
    '''
        Remove keys from list (resource list)
        keys = ["keyphrase_counts", "keyphrases", "keyphrases_infos", "keyphrase_embedding", "document_embedding"]
    '''
    logger.info("Remove keys from list (resource list)")
    if recommendation_type in [ RecommendationType.PKG_BASED_DOCUMENT_VARIANT, RecommendationType.PKG_BASED_KEYPHRASE_VARIANT ]:
        keys = [    "keyphrase_counts", "keyphrases_infos", "keyphrase_embedding", "document_embedding", 
                    "composite_score", "labels"
                ]
    else:
        keys = [    "keyphrase_counts", "keyphrases_infos", "keyphrase_embedding", "document_embedding", 
                    "composite_score", "labels", "keyphrases"
                ]
        
    resources_updated = [{k: v for k, v in d.items() if k not in keys} for d in resources]
    return resources_updated

def check_keys_not_empty_from_resources(resources: list, recommendation_type_str: str):
    '''
        Check whether some resource attributes are empty or not, 
        such as: keyphrases, keyphrase_embedding, document_embedding
        return: False (not empty) | True (empty)
    '''
    logger.info("Check whether some resource attributes are empty or not, such as: keyphrases, keyphrase_embedding, document_embedding")
    
    for resource in resources:
        if recommendation_type_str in ["1", "3"]: # keyphrase_embedding
            if resource.get("keyphrase_embedding") == "":
                return True
        elif recommendation_type_str in ["2", "4"]: # document_embedding
            if resource.get("document_embedding") == "":
                return True
    return False

def get_top_n_concepts(concepts: list, top_n=5):
    '''
        Get top n concepts from the list
    '''
    # concepts.sort(key=lambda x: x["weight"], reverse=True)
    concepts_ = sorted(concepts, key=lambda x: x["weight"])
    return concepts_[:top_n]

def save_and_get_concepts_modified(db: NeoDataBase, rec_params, top_n=5, user_embedding=False, understood_list=[], non_understood_list =[]):
    '''
        rec_params : {'user_id': str, 'mid': str, 'slide_id': int, 'category': str, 'concepts': list, 'recommendation_type': str, 'factor_weights': dict}
        status: dnu or u (PKG_BASED_KEYPHRASE_VARIANT |  PKG_BASED_DOCUMENT_VARIANT) | 
                content (CONTENT_BASED_DOCUMENT_VARIANT | CONTENT_BASED_KEYPHRASE_VARIANT)
                u: for type 1, 2 (understood)
                dnu_reset: not used for pkg recommandations 
    '''
    logger.info("Saving Logic: Concept_modified")
    
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
    cids = [concept["cid"] for concept in concepts]
    # concepts.sort(key=lambda x: x["weight"], reverse=True)
    # concepts = concepts[:top_n]

    # update status between understood and non-understood
    if len(understood_list) > 0:
        for cid in understood_list:
            db.update_rs_btw_user_and_cm(user_id=user_id, cid=cid, weight=None, mid=None, status='u', only_status=True)

    if len(concepts) > 0:
        if rec_params["recommendation_type"] in ["1", "2"]:
            status = 'dnu'
        else:
            status = 'content' # for CONTENT_BASED_
        
        for concept in concepts:
            db.create_concept_modified(cid=concept["cid"])
            concept_modified = db.update_rs_btw_user_and_cm(user_id=user_id, cid=concept["cid"], weight=concept["weight"], mid=rec_params["mid"], status=status)
            concepts_modified.append(concept_modified)
        
        if status == "dnu":
            db.update_rs_btw_user_and_cms(user_id=user_id, cids=cids, special_status="dnu_reset")


        # update user embedding value (because weight value could be changed from the user)
        if user_embedding:
            user_embedding = db.get_user_embedding_with_concept_modified(user_id=user_id, mid=rec_params["mid"], status=status)
            result["user_embedding"] = user_embedding
    
    # result["concept_cids"]  = [concept["cid"] for concept in concepts]
    # result["concept_names"] = [concept["name"] for concept in concepts]
    # rec_params["concepts"] = concepts
    result["concepts"] = concepts
    # result["rec_params"] = rec_params
    return result

def normalize_factor_weights(factor_weights: dict=None, values: list=[], method_type = "l1", complete=True, sum_value=True): # List[float]
    '''
        method_type: normalization techniques
            l1: L1 normalization, also known as L1 norm normalization or Manhattan normalization
            l1: L2 normalization, also known as L2 norm normalization or Euclidean normalization
            max: Max Normalization
            min-max: Min-Max
        
        https://www.pythonprog.com/sklearn-preprocessing-normalize/#Normalization_Techniques
        TypeScript: https://sklearn.vercel.app/guide/install

        factor_weights : {'status': False, 'reload': True, 'weights': {'similarity_score': 0.7, 'creation_date': 0.3, 'views': 0.3, 'like_count': 0.1, 'user_rating': 0.1, 'saves_count': 0.1}
    '''
    logger.info("Normalization of factor weights")
    
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

def wilson_lower_bound_score(up, down, confidence=0.95):
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

def normalize_min_max_score_date(date_str: str, max: datetime):
    """
        Calculate Normalization Score of Creation Date
    """
    date = date_parse(date_str).replace(tzinfo=None)

    # First video posted on Youtube
    min = datetime(year=2005, month=4, day=23, hour=8, minute=31, second=52, tzinfo=None)
    return (date - min).days / (max - min).days

def normalize_min_max_score(value: int, min_value: int, max_value: int):
    if (max_value - min_value) == 0:
        return 0
    return (value - min_value) / (max_value - min_value)

def calculate_factors_weights(category: int, resources: list, weights: dict = None, light=False):
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
            rating_normalized = wilson_lower_bound_score(up=resource["helpful_count"], down=resource["not_helpful_count"])
            creation_date_normalized = normalize_min_max_score_date(date_str=resource["publish_time"], max=now)
            views_normalzed = normalize_min_max_score(value=int(resource["views"]), min_value=min_views, max_value=max_views) 
            bookmarked_normalized = normalize_min_max_score(value=int(resource["bookmarked_count"]), min_value=bookmarked_min_value, max_value=bookmarked_max_value)
            like_count_normalized = normalize_min_max_score(value=int(resource["like_count"]), min_value=like_count_min_value, max_value=like_count_max_value)

            resource["composite_score"] = (views_normalzed * weight_views) \
                                        + (rating_normalized * weight_user_rating) \
                                        + (creation_date_normalized * weight_creation_date) \
                                        + (similarity_normalized * weight_similarity_score) \
                                        + (bookmarked_normalized * weight_saves_count) \
                                        + (like_count_normalized * weight_like_count)
            
    elif category == 2:
        for resource in resources:
            rating_normalized = wilson_lower_bound_score(up=resource["helpful_count"], down=resource["not_helpful_count"])
            resource["composite_score"] = (rating_normalized * weight_user_rating) \
                                        + (resource["similarity_score"] * weight_similarity_score) \
                                        + (resource["bookmarked_count"] * weight_saves_count) \


    # sort by composite score value
    resources.sort(key=lambda x: x["composite_score"], reverse=True)

    return resources

def rank_resources(resources: list, weights: dict = None, ratings: list = None, top_n_resources=10, recommendation_type=None):
    '''
        factor_weights: {   "video": dict, (default: {'like_count': 0.146, 'creation_date': 0.205, 'views': 0.146, 'similarity_score': 0.152, 'saves_count': 0.199, 'user_rating': 0.152}) 
                            "article": dict, (default: {'similarity_score': 0.3, 'saves_count': 0.4, 'user_rating': 0.3})
                    }
        Step 1: Remove duplicates if exist
        Step 2: Ranking/Sorting Logic for Resources
        Result Form: {"articles": list, "videos": list}
        Step 3: Last Step: Resources having Rating related to DNU_modified (cid)
    '''
    logger.info("Appliying Ranking Algorithm")
    # resources = remove_duplicates_from_resources(resources)

    if len(resources) > 0:
        video_weights_normalized = normalize_factor_weights(factor_weights=weights["video"], method_type="l1", complete=True, sum_value=False)
        article_weights_normalized = normalize_factor_weights(factor_weights=weights["article"], method_type="l1", complete=True, sum_value=False)

        # video items
        resources_videos = [resource for resource in resources if "Video" in resource["labels"]]
        resources_videos = calculate_factors_weights(category=1, resources=resources_videos, weights=video_weights_normalized)
        resources_videos = remove_keys_from_resources(resources=resources_videos, recommendation_type=recommendation_type)

        # articles items
        resources_articles = [resource for resource in resources if "Article" in resource["labels"]]
        resources_articles = calculate_factors_weights(category=2, resources=resources_articles, weights=article_weights_normalized)
        resources_articles = remove_keys_from_resources(resources=resources_articles, recommendation_type=recommendation_type)

        # # Finally, priorities on resources having Rating related to DNU_modified (cid)
        if ratings and len(ratings) > 0:
            pass

        return {
            "articles": resources_articles[: top_n_resources],
            "videos": resources_videos[: top_n_resources]
        }
    return { "articles": [], "videos": [] }

def rec_params_request_mapped(data_rec_params: dict, data_default: dict=None):
    '''
        Map Recommandations Params
    '''

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

def build_factor_weights(factor_weights_params: dict = None):
    '''
        Generate Factor weights for Ranking
    '''

    factor_weights_articles = {}
    factor_weights_viedos = {}

    if factor_weights_params:
        factor_weights_articles = normalize_factor_weights(  factor_weights=factor_weights_params, 
                                                        method_type="l1", 
                                                        complete=True, 
                                                        sum_value=False
                                                    )
        # set video weights
        factor_weights_viedos = {}
        for key, value in factor_weights_params.items():
            if key in ["similarity_score", "user_rating", "saves_count"]:
                factor_weights_viedos[key] = value

        factor_weights_viedos = normalize_factor_weights(  factor_weights=factor_weights_viedos, 
                                                method_type="l1", 
                                                complete=True, 
                                                sum_value=False
                                            )
    return {
        "article": factor_weights_articles,
        "video": factor_weights_viedos
    }

def check_request_temp(rec_params: dict, key="cid"):
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

    # result_temp = get_redis_key_value(key_name=f"{user_id}_{redis_key_1}")
    result_temp = None
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

def create_get_resources_thread(func, args):
    '''
        active threading for the function given
        func: the function to run
        args: arguments taken from the function func
    '''
    thread = threading.Thread(target=func, args=args)
    thread.start()
    # redis_client.set(name=f"{user_id}_{redis_key_1}", value=status, ex=(redis_client_expiration_time * 10080))

def check_and_get_resources_with_concepts(db: NeoDataBase, concepts: list):
    '''
        Check if concepts already exist and connected to any resources in Neo4j Database
        If resources exist, check based on:
        updated_at: it's not more than a given time (one week old)
        default time = 14 days
    '''
    current_time = datetime.now()

    concepts_having_resources = []
    concepts_not_having_resources = []
    resources_found = []
    resourse_btw = []

    # if len(concepts) == 0:
    #     return resources_found
    # else:

    for concept in concepts:
        resourse_btw = db.retrieve_resources(concepts=[concept], embedding_values=True)

        ## at least 5 | 10 resources
        if len(resourse_btw) == 0: # len(resourse_btw) >= 5:
            concepts_not_having_resources.append(concept)
        else:
            # resources_found += resourse_btw
            concepts_having_resources.append(concept)

            # check the attribute 'updated_at' <= the given time
            for resource in resourse_btw:
                # Parse the given ISO time string
                given_time = datetime.fromisoformat(resource["updated_at"])
                time_difference = current_time - given_time
                if time_difference <= timedelta(days=14):
                    resources_found.append(resource)
    return concepts_having_resources, concepts_not_having_resources, resources_found

def parallel_crawling_resources(function, concept_name: str, cid: str, result_type: str, top_n_videos, top_n_articles):
    '''
        Parallel Crawling of Resources with the function 
        canditate_selection from Class Recommender
        submit function: takes
            function: canditate_selection (this function takes the params below)
            query, video, result_type="records", top_n_videos=2, top_n_articles=2
    '''
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_videos = executor.submit(function, concept_name, True, result_type, top_n_videos, top_n_articles)
        future_articles = executor.submit(function, concept_name, False, result_type, top_n_videos, top_n_articles)
        result_videos = future_videos.result()
        result_articles = future_articles.result()
        return {"cid": cid, "videos": result_videos, "articles": result_articles}


# def parallel_crawling_resources2(function, concept_name: str, cid: str):
#     result_videos = function(concept_name, True)
#     result_articles = function(concept_name, False)
#     return {"cid": cid, "videos": result_videos, "articles": result_articles}
