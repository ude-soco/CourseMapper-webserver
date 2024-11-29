from flask import Blueprint, request, jsonify, make_response
import logging
from log import LOG
from ..services.course_materials.recommendation import resource_recommender_helper as rrh
from app.views import controller_db


helper_service = Blueprint("helper_service", __name__)
logger = LOG(name=__name__, level=logging.DEBUG)


@helper_service.route("/update_factor_weights", methods=["POST"])
def update_resources_factor_weights():
    data = request.get_json()
    logger.info("------ Updating Factor Weights ------>")

    result = rrh.normalize_factor_weights(  factor_weights=data, 
                                                        method_type="l1", 
                                                        complete=True, 
                                                        sum_value=False
                                                    )
    return jsonify(result), 200




# @helper_service.route("/get_concepts_by_cids", methods=["GET"])
def get_concepts_by_cids():
    user_id = request.args.get("user_id")
    cids = request.args.get("cids") # request.args.getlist("cids")
    cids = str(cids).split(",")
    result = controller_db.get_concepts_by_cids(user_id=user_id, cids=cids)
    return make_response({ "records": result }, 200)

# @helper_service.route("/get_concepts_modified_by_user_id", methods=["GET"])
def get_concepts_modified_by_user_id():
    user_id = request.args.get("user_id")
    result = controller_db.get_concepts_modified_by_user_id(user_id=user_id)
    return make_response({ "records": result }, 200)

# @helper_service.route("/get_concepts_modified_by_user_id_and_mid", methods=["GET"])
def get_concepts_modified_by_user_id_and_mid():
    mid = request.args.get("mid")
    user_id = request.args.get("user_id")

    result = controller_db.get_concepts_modified_by_mid(mid)
    result = controller_db.update_concept_modified_node(result=result, user_id=user_id)
    return make_response({ "records": result }, 200)

# @helper_service.route("/get_concepts_modified_by_user_id_and_slide_id", methods=["GET"])
def get_concepts_modified_by_user_id_and_slide_id():
    slide_id = request.args.get("slide_id")
    user_id = request.args.get("user_id")

    result = controller_db.get_concepts_modified_by_slide_id(slide_id)
    result = controller_db.update_concept_modified_node(result=result, user_id=user_id)
    return make_response({ "records": result }, 200)


# @helper_service.route("/get_concepts_modified_by_user_from_saves", methods=["GET"])
def get_concepts_modified_by_user_from_saves():
    user_id = request.args.get("user_id")
    result = controller_db.get_concepts_modified_by_user_from_saves(user_id=user_id)
    return make_response(result, 200)
