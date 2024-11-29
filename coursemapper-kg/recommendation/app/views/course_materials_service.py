from flask import Blueprint, request, jsonify, make_response, copy_current_request_context
import logging
from log import LOG
import time

from ..services.course_materials.recommendation.resource_recommender import ResourceRecommenderService
from ..services.course_materials.kwp_extraction.dbpedia.data_service1 import RecService
from ..services.course_materials.GCN.gcn import GCN
from ..services.course_materials.recommendation import resource_recommender_helper as rrh


logger = LOG(name=__name__, level=logging.DEBUG)
course_materials = Blueprint("course_materials", __name__)


# @helper_service.route("/update_factor_weights", methods=["POST"])
def update_resources_factor_weights(job):
    # data = request.get_json()
    data = job["data"]
    logger.info("------ Updating Factor Weights ------>")
    result = rrh.normalize_factor_weights(  factor_weights=data, 
                                                        method_type="l1", 
                                                        complete=True, 
                                                        sum_value=False
                                                    )
    return jsonify(result), 200


# @user_resources.route("/save_or_remove", methods=["POST"])
def save_or_remove_user_resources(job):
    # data = request.get_json()
    data = job["data"]
    logger.info(f"Getting Resource Saved -> {data}")
    resource_recommender_service = ResourceRecommenderService()
    resp = resource_recommender_service.save_or_remove_user_resources(data=data)
    return make_response(jsonify(resp), 200)


# @rating_resources.route("/resource", methods=["POST"])
def rating_resource(job):
    # data = request.get_json()
    data = job["data"]
    logger.info("Getting Rating Data")
    resource_recommender_service = ResourceRecommenderService()
    resp = resource_recommender_service.user_rates_resources(rating=data)
    return make_response(jsonify(resp), 200)


@course_materials.route("/get_concepts", methods=["POST"])
def get_concepts():
    data = request.get_json()

    # material_id = job["materialId"]
    # user_id = job["userId"]
    # understood = job["understood"]
    # non_understood = job["nonUnderstood"]
    # new_concepts = job["newConcepts"]

    material_id = data.get("materialId")
    # material_page = data.get("materialPage")
    user_id = data.get("userId")
    understood = data.get("understoodConcepts")
    non_understood = data.get("nonUnderstoodConcepts")
    new_concepts = data.get("newConcepts")

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
#    logger.info("GCN")
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
    #make_response.headers.add('Access-Control-Allow-Origin', '*')
    return make_response(resp, 200)
    # return resp


@course_materials.route("/get_resources", methods=["POST"])
def get_resources():
    data = request.get_json()
    resource_recommender_service = ResourceRecommenderService()
    result = resource_recommender_service._get_resources(data_default=data["default"], data_rec_params=data["rec_params"])
    return jsonify(result), 200
    # return result
