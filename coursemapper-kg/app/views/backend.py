from flask import Blueprint, request, make_response

from app.extensions import neo4j


backend = Blueprint("backend", __name__, url_prefix="/kg-api")

@backend.route("/check_slide/<slide_id>", methods=["GET"])
def check_slide(slide_id: str):
    result = neo4j.check_slide(slide_id)
    return make_response({ "records": result }, 200)


@backend.route("/get_slide/<slide_id>", methods=["GET"])
def get_slide(slide_id: str):
    result = neo4j.get_slide(slide_id)
    return make_response({ "records": result }, 200)


@backend.route("/check_material/<material_id>", methods=["GET"])
def check_material(material_id: str):
    result = neo4j.check_material(material_id)
    return make_response({ "records": result }, 200)


@backend.route("/get_material/<material_id>", methods=["GET"])
def get_material(material_id: str):
    result = neo4j.get_material(material_id)
    return make_response({ "records": result }, 200)


@backend.route("/get_material_edges/<material_id>", methods=["GET"])
def get_material_edges(material_id: str):
    result = neo4j.get_material_edges(material_id)
    return make_response({ "records": result }, 200)


@backend.route("/get_material_concept_ids/<material_id>", methods=["GET"])
def get_material_concept_ids(material_id: str):
    result = neo4j.get_material_concept_ids(material_id)
    return make_response({ "records": result }, 200)


@backend.route("/get_higher_levels_nodes", methods=["GET"])
def get_higher_levels_nodes():
    material_ids = request.args.getlist("material_ids")
    result = neo4j.get_higher_levels_nodes(material_ids)
    return make_response({ "records": result }, 200)


@backend.route("/get_higher_levels_edges", methods=["GET"])
def get_higher_levels_edges():
    material_ids = request.args.getlist("material_ids")
    result = neo4j.get_higher_levels_edges(material_ids)
    return make_response({ "records": result }, 200)
