import logging

from log import LOG
import time
import json

from ..services.course_materials.recommendation.resource_recommender import ResourceRecommenderService
from ..services.course_materials.recommendation.recommendation_type import RecommendationType
from ..services.course_materials.kwp_extraction.dbpedia.data_service1 import RecService
from ..services.course_materials.GCN.gcn import GCN

logger = LOG(name=__name__, level=logging.DEBUG)


def get_concepts(job):
    data = job["data"]

    # material_page = data("materialPage")
    material_id = data["materialId"]
    user_id = data["userId"]
    understood = data["understoodConcepts"]
    non_understood = data["nonUnderstoodConcepts"]
    new_concepts = data["newConcepts"]

    # print("not-understood:", non_understood, flush=True)
    understood = [cid for cid in understood.split(",") if understood]
    non_understood = [cid for cid in non_understood.split(",") if non_understood]
    new_concepts = [cid for cid in new_concepts.split(",") if new_concepts]
    material_id = material_id.split("-")[0]
    # slide_id = str(material_id) + "_slide_" + str(material_page)

    start_time1 = time.time()
    start_time = time.time()
    data_service = RecService()
    end_time = time.time()
    print("Get RecService time: ", end_time - start_time, flush=True)

    start_time = time.time()
    data_service._extract_vector_relation(mid=material_id)
    # logger.info("GCN")
    gcn = GCN()
    gcn.load_data()
    end_time = time.time()
    print("use gcn Execution time: ", end_time - start_time, flush=True)

    start_time = time.time()
    # user = {"name": username, "id": user_id, "user_email": user_email}
    data_service._construct_user(
        user_id=user_id,
        non_understood=non_understood,
        understood=understood,
        new_concepts=new_concepts,
        mid=material_id,
    )
    end_time = time.time()
    print("Get User model Execution time: ", end_time - start_time, flush=True)

    start_time = time.time()
    # Get top-5 recommendation concept and interpretability
    resp = data_service._get_concept_recommendation(user_id=user_id, mid=material_id)
    end_time = time.time()

    print(
        "Get top-5 recommendation concept and interpretability Execution time: ",
        end_time - start_time,
        flush=True,
    )
    end_time1 = time.time()
    print("Execution time: ", end_time1 - start_time1, flush=True)
    return resp


def get_resources_by_main_concepts(job):
    data = job["data"]
    data = json.loads(data)
    mid = data["materialId"]
    resource_recommender_service = ResourceRecommenderService()
    result = resource_recommender_service._get_resources_by_main_concepts(mid=mid)
    return result

def get_resources(job):
    data = job["data"]
    resource_recommender_service = ResourceRecommenderService()
    result = resource_recommender_service._get_resources(data_default=data["default"], data_rec_params=data["rec_params"])
    return result
