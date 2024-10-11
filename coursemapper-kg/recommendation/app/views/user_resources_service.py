from flask import Blueprint, request, jsonify, make_response
import logging
from log import LOG
from ..services.course_materials.recommendation.resource_recommender import ResourceRecommenderService

# Resource Saved APIs
user_resources = Blueprint("user_resources", __name__)
logger = LOG(name=__name__, level=logging.DEBUG)


@user_resources.route("/save_or_remove", methods=["POST"])
def save_or_remove_user_resources_():
    data = request.get_json()
    logger.info(f"Getting Resource Saved -> {data}")

    resource_recommender_service = ResourceRecommenderService()
    resp = resource_recommender_service.save_or_remove_user_resources(data=data)
    return make_response(jsonify(resp), 200)

@user_resources.route("/get_filter_params", methods=["POST"])
def get_concepts_mids_sliders_numbers_for_user_resources_saved():
    data = request.get_json()
    logger.info(f"User Resources Saved FIlter Params -> {data}")

    resource_recommender_service = ResourceRecommenderService()
    resp = resource_recommender_service.get_concepts_mids_sliders_numbers_for_user_resources_saved(data=data)
    return make_response(jsonify(resp), 200)

@user_resources.route("/filter", methods=["POST"])
def filter_user_resources_saved_by():
    data = request.get_json()
    logger.info(f"Getting User Resources Saved Filter -> {data}")

    resource_recommender_service = ResourceRecommenderService()
    resp = resource_recommender_service.filter_user_resources_saved_by(data=data)
    return make_response(jsonify(resp), 200)

@user_resources.route("/get_rids_from_user_saves", methods=["GET"])
def get_rids_from_user_saves():
    user_id = request.args.get('user_id')
    logger.info(f"Getting rids from User Resources Saved -> {user_id}")

    resource_recommender_service = ResourceRecommenderService()
    resp = resource_recommender_service.get_rids_from_user_saves(user_id=user_id)
    return make_response(jsonify(resp), 200)
