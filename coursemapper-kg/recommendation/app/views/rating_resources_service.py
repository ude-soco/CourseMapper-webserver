from flask import Blueprint, request, jsonify, make_response
import logging
from log import LOG
from ..services.course_materials.recommendation.resource_recommender import ResourceRecommenderService

# Rating APIs
rating_resources = Blueprint("rating_resources", __name__)
logger = LOG(name=__name__, level=logging.DEBUG)


@rating_resources.route("/resource", methods=["POST"])
def rating():
    logger.info("Getting Rating Data")
    data = request.get_json()
    logger.info(f"Rating Data: {data}")

    resource_recommender_service = ResourceRecommenderService()
    resp = resource_recommender_service.user_rates_resources(rating=data)
    return make_response(jsonify(resp), 200)
