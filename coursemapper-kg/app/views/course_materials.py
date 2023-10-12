
from flask import Blueprint, request, jsonify, make_response
import logging

from flask_cors import cross_origin
from log import LOG
import json
import time

from ..services.course_materials.recommendation.resource_recommender import ResourceRecommenderService
from ..services.course_materials.recommendation.recommendation_type import RecommendationType
from ..services.course_materials.kwp_extraction.dbpedia.data_service import DataService
from ..services.course_materials.kwp_extraction.dbpedia.data_service1 import RecService
from ..services.course_materials.kwp_extraction.dbpedia.data_serviceKWP import DataService1
from ..services.course_materials.kwp_extraction.dbpedia.data_service_top_down import DataServiceTopDown
from ..services.course_materials.GCN.gcn import GCN
from ..services.course_materials.GCN.lightGCN import LightGCN

logger = LOG(name=__name__, level=logging.DEBUG)

course_materials = Blueprint("course_materials", __name__)


@course_materials.route("/get_resources", methods=["POST"])
def get_resources():
    material_id = request.form.get("materialId")  # type: ignore
    material_page = request.form.get("materialPage")  # type: ignore
    user_id = request.form.get("userId")  # type: ignore
    user_email = request.form.get("userEmail")  # type: ignore
    slide_id = request.form.get("slideId")  # type: ignore
    username = request.form.get("username")  # type: ignore
    # recommendation_type = request.form.get("recommendationType")# activate if several models need to be tested & modelNumber will be sent from frontend
    understood = request.form.get("understoodConcepts")  # type: ignore
    non_understood = request.form.get("nonUnderstoodConcepts")  # type: ignore
    new_concepts = request.form.get("newConcepts")  # type: ignore

    print("not-understood from paul:", non_understood, flush=True)
    understood_concept_ids = [cid for cid in understood.split(",") if understood]
    non_understood_concept_ids = [
        cid for cid in non_understood.split(",") if non_understood
    ]
    new_concept_ids = [cid for cid in new_concepts.split(",") if new_concepts]

    print(
        "material_id:",
        material_id,
        "page: ",
        material_page,
        "slide_id: ",
        slide_id,
        "user_id: ",
        user_id,
        "user_email: ",
        user_email,
        "username: ",
        username,
        "understood: ",
        understood,
        "nonUnderstood: ",
        non_understood,
        "new_concepts: ",
        new_concepts,
        flush=True,
    )
    resource_recommender_service = ResourceRecommenderService()
    # TODO comment out or remove the next line if the recommendation_type is sent from the frontend
    # Only first model is needed ==> no model_type will be sent from frontend (other models were added for evaluation task)
    recommendation_type = "1"

    # Check if parameters exist. If one doesn't exist, return not found message
    # check_message = resource_recommender_service.check_parameters(slide_id, material_id, user_id, non_understood_concept_ids, understood_concept_ids, new_concept_ids, recommendation_type)
    check_message = resource_recommender_service.check_parameters(
        slide_id=slide_id,
        material_id=material_id,
        non_understood_concept_ids=non_understood_concept_ids,
        understood_concept_ids=understood_concept_ids,
        new_concept_ids=new_concept_ids,
        recommendation_type=recommendation_type,
        
    )
    if check_message != "":
       # logger.info(check_message)
        return make_response(check_message, 404)

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
        resource_recommender_service._construct_user(
            user=user,
            non_understood=non_understood_concept_ids,
            understood=understood_concept_ids,
            new_concepts=new_concept_ids,
            mid=material_id,
        )

    resp = resource_recommender_service._get_resources(
        user_id=user_id,
        slide_id=slide_id,
        material_id=material_id,
        recommendation_type=recommendation_type,
    )

    return make_response(resp, 200)


@course_materials.route("/rating", methods=["POST"])
def rating():
    resource = json.loads(request.form.get("resource"))  # type: ignore
    concepts = request.form.get("concepts")  # type: ignore
    user_id = request.form.get("userId")  # type: ignore
    rating = request.form.get("rating")  # type: ignore
    rating_state = request.form.get("ratingState")  # type: ignore

    logger.debug("resource: %s" % resource["id"])
    logger.debug("concepts: %s" % concepts)
    logger.debug("user_id: %s" % user_id)
    logger.debug("rating: %s" % rating)
    logger.debug("rating_state: %s" % rating_state)

    resource_recommender_service = ResourceRecommenderService()
    resp = resource_recommender_service.set_rating(
        resource=resource,
        concepts=concepts,
        user_id=user_id,
        rating=rating,
    )
    logger.info(resp)

    return make_response(jsonify(resp), 200)


@course_materials.route("/get_concepts", methods=["POST"])

def get_concepts():
    
    material_id = request.form.get("materialId")  # type: ignore
    material_page = request.form.get("materialPage")  # type: ignore
    user_id = request.form.get("userId")  # type: ignore
    user_email = request.form.get("userEmail")  # type: ignore
    username = request.form.get("username")  # type: ignore
    understood = request.form.get("understoodConcepts")  # type: ignore
    non_understood = request.form.get("nonUnderstoodConcepts")  # type: ignore
    new_concepts = request.form.get("newConcepts")  # type: ignore

    print("not-understood from Yipeng:", non_understood, flush=True)

    understood = [cid for cid in understood.split(",") if understood]
    non_understood = [cid for cid in non_understood.split(",") if non_understood]
    new_concepts = [cid for cid in new_concepts.split(",") if new_concepts]
    material_id = material_id.split("-")[0]
    slide_id = str(material_id) + "_slide_" + str(material_page)

    print(
        "material_id:",
        material_id,
        "page: ",
        material_page,
        "slide_id: ",
        slide_id,
        "user_id: ",
        user_id,
        "user_email: ",
        user_email,
        "username: ",
        username,
        "understood: ",
        understood,
        "nonUnderstood: ",
        non_understood,
        "new_concepts: ",
        new_concepts,
        flush=True,
    )
    start_time1 = time.time()
    start_time = time.time()
    data_service = RecService()
    end_time = time.time()
    print("Get RecService time: ", end_time - start_time, flush=True)
    # start_time = time.time()
    # # get related concepts and category of concepts user doesn't understand
    # # data_service._get_related_category(ids=non_understood, mid=material_id)
    # end_time = time.time()
    # print('Get the related concepts and category Execution time: ', end_time - start_time, flush=True)
    # use GCN to get final embedding of each node
    start_time = time.time()
    data_service._extract_vector_relation(mid=material_id)
#    logger.info("GCN")
    gcn = GCN()
    gcn.load_data()
    end_time = time.time()
    print("use gcn Execution time: ", end_time - start_time, flush=True)

    start_time = time.time()
    user = {"name": username, "id": user_id, "user_email": user_email}
    data_service._construct_user(
        user=user,
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


@course_materials.route("/get_concepts/lightgcn_variant", methods=["POST"])
def concepts_lightgcn_variant():
    material_id = request.form.get("materialId")  # type: ignore
    material_page = request.form.get("materialPage")  # type: ignore
    user_id = request.form.get("userId")  # type: ignore
    user_email = request.form.get("userEmail")  # type: ignore
    username = request.form.get("username")  # type: ignore
    understood = request.form.get("understoodConcepts")  # type: ignore
    non_understood = request.form.get("nonUnderstoodConcepts")  # type: ignore
    new_concepts = request.form.get("newConcepts")  # type: ignore

    understood = [cid for cid in understood.split(",") if understood]
    non_understood = [cid for cid in non_understood.split(",") if non_understood]
    new_concepts = [cid for cid in new_concepts.split(",") if new_concepts]
    material_id = material_id.split("-")[0]
    slide_id = str(material_id) + "_slide_" + str(material_page)

    print(
        "material_id:",
        material_id,
        "page: ",
        material_page,
        "slide_id: ",
        slide_id,
        "user_id: ",
        user_id,
        "user_email: ",
        user_email,
        "username: ",
        username,
        "understood: ",
        understood,
        "nonUnderstood: ",
        non_understood,
        "new_concepts: ",
        new_concepts,
        flush=True,
    )
    start_time1 = time.time()

    data_service = RecService()
    # start_time = time.time()
    # # get related concepts and category of concepts user doesn't understand
    # data_service._get_related_category(ids=non_understood, mid=material_id)
    # end_time = time.time()
    # print('Get the related concepts and category Execution time: ', end_time - start_time, flush=True)
    # use GCN to get final embedding of each node
    start_time = time.time()
    logger.info("LightGCN variant")
    # data_service._extract_vector_relation(mid=material_id)
    lightGCN = LightGCN()
    lightGCN.load_data(variant=True)
    end_time = time.time()
    print("use gcn Execution time: ", end_time - start_time, flush=True)

    start_time = time.time()
    user = {"name": username, "id": user_id, "user_email": user_email}
    data_service._construct_user(
        user=user,
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

    return make_response(resp, 200)


@course_materials.route("/get_concepts/lightgcn", methods=["POST"])
def concepts_lightgcn():
    material_id = request.form.get("materialId")  # type: ignore
    material_page = request.form.get("materialPage")  # type: ignore
    user_id = request.form.get("userId")  # type: ignore
    user_email = request.form.get("userEmail")  # type: ignore
    username = request.form.get("username")  # type: ignore
    understood = request.form.get("understoodConcepts")  # type: ignore
    non_understood = request.form.get("nonUnderstoodConcepts")  # type: ignore
    new_concepts = request.form.get("newConcepts")  # type: ignore

    understood = [cid for cid in understood.split(",") if understood]
    non_understood = [cid for cid in non_understood.split(",") if non_understood]
    new_concepts = [cid for cid in new_concepts.split(",") if new_concepts]
    material_id = material_id.split("-")[0]
    slide_id = str(material_id) + "_slide_" + str(material_page)

    print(
        "material_id:",
        material_id,
        "page: ",
        material_page,
        "slide_id: ",
        slide_id,
        "user_id: ",
        user_id,
        "user_email: ",
        user_email,
        "username: ",
        username,
        "understood: ",
        understood,
        "nonUnderstood: ",
        non_understood,
        "new_concepts: ",
        new_concepts,
        flush=True,
    )
    start_time1 = time.time()

    data_service = RecService()
    # start_time = time.time()
    # # get related concepts and category of concepts user doesn't understand
    # data_service._get_related_category(ids=non_understood, mid=material_id)

    # end_time = time.time()
    # print('Get the related concepts and category Execution time: ', end_time - start_time, flush=True)
    # use GCN to get final embedding of each node
    start_time = time.time()
    # data_service._extract_vector_relation(mid=material_id)
    logger.info("LightGCN")
    lightGCN = LightGCN()
    lightGCN.load_data(variant=False)
    end_time = time.time()
    print("use gcn Execution time: ", end_time - start_time, flush=True)

    start_time = time.time()
    user = {"name": username, "id": user_id, "user_email": user_email}
    data_service._construct_user(
        user=user,
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

    return make_response(resp, 200)


@course_materials.route("/concept-slide", methods=["POST"])
def concepts_slide():
    model = request.form.get("model")  # type: ignore
    material_id = request.form.get("materialId")  # type: ignore
    slide_id = request.form.get("slideId")  # type: ignore
    materialName = request.form.get("materialName")  # type: ignore
    materialPage = request.form.get("materialPage")  # type: ignore
    materialFile = request.files.get("materialFile")  # type: ignore
    user_id = request.form.get("userId")  # type: ignore
    user_email = request.form.get("userEmail")  # type: ignore
    username = request.form.get("username")  # type: ignore

    materialId = material_id.split("-", 1)[0]
    print(
        "model: ",
        model,
        "material_id:",
        materialId,
        "material_name:",
        materialName,
        "page: ",
        materialPage,
        "file: ",
        materialFile,
        "user_id: ",
        user_id,
        "slide_id: ",
        slide_id,
        "user_email: ",
        user_email,
        "username: ",
        username,
        flush=True,
    )

    startTime = time.time()

    data_service = DataService()
    resp = data_service._get_dataSlide(
        material_id=materialId,
        material_name=materialName,
        file=materialFile,
        current_page=materialPage,
        model_name=model,
        top_n=15,
        user_id=user_id,
        user_email=user_email,
        username=username,
        with_category=False,
        with_property=False,  # concept expansion
        whole_text=True,  # avoid extracting keyphrases
    )

    endTime = time.time()
    print("Execution time: ", endTime - startTime, flush=True)
    return make_response(resp, 200)


@course_materials.route("/concept-map/kwp", methods=["POST"])
def concepts_map_kwp():
    model = request.form.get("model")  # type: ignore
    materialId = request.form.get("materialId")  # type: ignore
    materialName = request.form.get("materialName")  # type: ignore
    materialFile = request.files.get("materialFile")  # type: ignore
    userId = request.form.get("userId")  # type: ignore
    userEmail = request.form.get("userEmail")  # type: ignore
    username = request.form.get("username")  # type: ignore

    print(
        "model: ",
        model,
        "material_id:",
        materialId,
        "material_name:",
        materialName,
        "file: ",
        materialFile,
        "user_id: ",
        userId,
        "user_email: ",
        userEmail,
        "username: ",
        username,
    )

    data_service1 = DataService1()
    resp = data_service1._get_data(
        materialId=materialId,
        materialName=materialName,
        file=materialFile,
        model_name=model,
        top_n=15,
        #   user_id= user_id,
        #   user_email=user_email,
        #   username=username,
    )
    return make_response(resp, 200)


@course_materials.route("/concept-map/semi", methods=["POST"])
def concepts_map_semi():
    model = request.form.get("model")  # type: ignore
    materialId = request.form.get("materialId")  # type: ignore
    materialName = request.form.get("materialName")  # type: ignore
    materialConcepts = request.form.get("selectedConcepts")  # type: ignore
    materialFile = request.files.get("materialFile")  # type: ignore
    userId = request.form.get("userId")  # type: ignore
    userEmail = request.form.get("userEmail")  # type: ignore
    username = request.form.get("username")  # type: ignore

    print(
        "model: ",
        model,
        "material_id:",
        materialId,
        "material_name:",
        materialName,
        "materialConcepts: ",
        materialConcepts,
        "file: ",
        materialFile,
        "user_id: ",
        userId,
        "user_email: ",
        userEmail,
        "username: ",
        username,
        flush=True,
    )

    data_service1 = DataService1()
    resp = data_service1._get_graph(
        materialId=materialId,
        materialName=materialName,
        concepts=materialConcepts,
        file=materialFile,
        model_name=model,
        top_n=15,
        with_category=True,
        with_property=True,
        with_doc_sim=True,
        userId=userId,
        userEmail=userEmail,
        username=username,
    )

    # print('This is error output', file=sys.stderr)
    # print('This is standard output', file=sys.stdout)
    # print('@@@@@@@@@@@@@@@@@@@@@',flush=True)
    # print('response is:',flush=True)
    # print(resp,flush=True)
    return make_response(resp, 200)


@course_materials.route("/concept-map", methods=["POST"])
def concept_map():
    model = request.form.get("model")  # type: ignore
    materialId = request.form.get("materialId")  # type: ignore
    materialName = request.form.get("materialName")  # type: ignore
    materialFile = request.files.get("materialFile")  # type: ignore
    userId = request.form.get("userId")  # type: ignore
    userEmail = request.form.get("userEmail")  # type: ignore
    username = request.form.get("username")  # type: ignore

    # print(
    #     "model: ",
    #     model,
    #     "material_id:",
    #     materialId,
    #     "material_name:",
    #     materialName,
    #     "file: ",
    #     materialFile,
    #     "user_id: ",
    #     userId,
    #     "user_email: ",
    #     userEmail,
    #     "username: ",
    #     username,
    # )
    # model = "singlerank"
    startTime = time.time()
    data_service = DataService()
    # data_service_top_down = DataServiceTopDown()

    # # # # # # Build LM KG.

    ### Activate top_down
    # resp = data_service_top_down._get_data(materialId=materialId,
    #                               materialName=materialName,
    #                               file=materialFile,
    #                               model_name=model,
    #                               top_n=100,
    #                               with_category=True,
    #                               with_property=True,
    #                               with_doc_sim=True,
    #                               userId=userId,
    #                               userEmail=userEmail,
    #                               username=username,
    #                               whole_text=False
    #                               )
    # return make_response(resp, 200)

    ### Activate bottom_up
    resp = data_service._get_data(
        materialId=materialId,
        materialName=materialName,
        file=materialFile,
        model_name=model,
        top_n=15,
        with_category=True,
        with_property=True,
        with_doc_sim=True,
        userId=userId,
        userEmail=userEmail,
        username=username,
        whole_text=False,
    )
    endTime = time.time()
    print("Execution time: ", endTime - startTime, flush=True)

    return make_response(resp, 200)
