from flask import Blueprint, request, make_response

from app.extensions import neo4j


backend = Blueprint("backend", __name__)

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


# boby024
def update_concept_node(result, user_id=None):
    result_final = []
    if result and len(result) > 0:
        if user_id:
            concepts_modified = neo4j.cro_get_concepts_modified_by_user_id(user_id=user_id)

        for node in result:
            node["weight_updated"] = node["weight"] * 100
            node["status"] = False
            
            # Update Concept weight modified by the User
            for concept_modified in concepts_modified:
                if node["cid"] == concept_modified["cid"]:
                    node["weight"] = concept_modified["weight"]

            result_final.append(node)
        result_final = sorted(result_final, key=lambda d: d['name'])

    return result_final

@backend.route("/cro_get_concepts_by_user_id_and_mid", methods=["GET"])
def cro_get_concepts_by_user_id_and_mid():
    mid = request.args.get("mid")
    user_id = request.args.get("user_id")
    # print("mid ->", mid)

    result = neo4j.cro_get_concepts_by_mid(mid)
    result = update_concept_node(result=result, user_id=user_id)
    return make_response({ "records": result }, 200)

@backend.route("/cro_get_concepts_by_user_id_and_slide_id", methods=["GET"])
def cro_get_concepts_by_user_id_and_slide_id():
    slide_id = request.args.get("slide_id")
    user_id = request.args.get("user_id")
    # print("slide_id ->", slide_id)

    result = neo4j.cro_get_concepts_by_slide_id(slide_id)
    result = update_concept_node(result=result, user_id=user_id)
    return make_response({ "records": result }, 200)


# @backend.route("/cro_get_concepts_by_user_id_and_mid", methods=["GET"])
# def cro_get_concepts_by_user_id_and_mid():
#     user_id = request.args.get("user_id")
#     mid = request.args.get("mid")

#     result = neo4j.get_concepts_by_user_id_and_mid(user_id, mid)
#     return make_response({ "records": result }, 200)


# @backend.route("/get_concepts_by_cids", methods=["GET"])
# def get_concepts_by_cids():
#     cids = request.args.getlist("cids")
#     print(cids)

#     result = neo4j.get_concepts_by_cids(cids)
#     print(result)
    
#     return make_response({ "records": result }, 200)


# @backend.route("/get_dnu_concepts_by_mid_and_silde_id", methods=["GET"])
# def get_dnu_concepts_by_mid_and_silde_id():
#     silde_id = request.args.get("silde_id")
#     print(silde_id)


# @backend.route("/get_concepts_by_mid_and_silde_id", methods=["GET"])
# def get_concepts_by_mid_and_silde_id():
#     silde_id = request.args.get("silde_id")
#     print(silde_id)

