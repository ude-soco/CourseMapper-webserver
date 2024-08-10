import logging

from log import LOG
import time

from ..services.course_materials.recommendation.resource_recommender import ResourceRecommenderService
from ..services.course_materials.recommendation.recommendation_type import RecommendationType
from ..services.course_materials.kwp_extraction.dbpedia.data_service import DataService
from ..services.course_materials.kwp_extraction.dbpedia.data_service1 import RecService
from ..services.course_materials.GCN.gcn import GCN
from ..services.course_materials.prerequisite.prerequisite_wrapper import run_prerequisite_material

logger = LOG(name=__name__, level=logging.DEBUG)


def prerequisite_material(job):
    material_id = job["materialId"]
    run_prerequisite_material(material_id)


def concept_map(job, file):
    model_name = job["modelName"]
    material_id = job["materialId"]
    material_name = job["materialName"]

    start_time = time.time()

    ### ========
    ### KWP
    # data_service = DataService1()
    # resp = data_service._get_data(
        # materialId=materialId,
        # materialName=materialName,
        # file=materialFile,
        # model_name=model,
        # top_n=15,
        # #   user_id= user_id,
        # #   user_email=user_email,
        # #   username=username,
    # )
    ### ========
    ### Semi
    # from ..services.course_materials.kwp_extraction.dbpedia.data_serviceKWP import DataService1
    # materialConcepts = request.form.get("selectedConcepts")  # type: ignore
    # data_service = DataService1()
    # resp = data_service._get_graph(
        # materialId=materialId,
        # materialName=materialName,
        # concepts=materialConcepts,
        # file=materialFile,
        # model_name=model,
        # top_n=15,
        # with_category=True,
        # with_property=True,
        # with_doc_sim=True,
        # userId=userId,
        # userEmail=userEmail,
        # username=username,
    # )
    ### ========
    ### Top-Down
    # from ..services.course_materials.kwp_extraction.dbpedia.data_service_top_down import DataServiceTopDown
    # data_service_top_down = DataServiceTopDown()
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
    ### ========

    ### Bottom-Up
    data_service = DataService()
    resp = data_service._get_data(
        materialId=material_id,
        materialName=material_name,
        file=file,
        model_name=model_name,
        top_n=15,
        with_category=True,
        with_property=True,
        with_doc_sim=True,
        whole_text=False,
    )
    end_time = time.time()
    print("Execution time: ", end_time - start_time, flush=True)

    return resp


def get_concepts(job):
    material_id = job["materialId"]
    user_id = job["userId"]
    understood = job["understood"]
    non_understood = job["nonUnderstood"]
    new_concepts = job["newConcepts"]

    understood = [cid for cid in understood.split(",") if understood]
    non_understood = [cid for cid in non_understood.split(",") if non_understood]
    new_concepts = [cid for cid in new_concepts.split(",") if new_concepts]
    material_id = material_id.split("-")[0]

    print(
        "material_id:",
        material_id,
        "user_id: ",
        user_id,
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
    # use GCN to get final embedding of each node
    start_time = time.time()
    data_service._extract_vector_relation(mid=material_id)
    gcn = GCN()
    gcn.load_data()

    ### ========
    ### LightGCN Variant
    # from ..services.course_materials.GCN.lightGCN import LightGCN
    # lightGCN = LightGCN()
    # lightGCN.load_data(variant=True)
    ### ========
    ### LightGCN
    # from ..services.course_materials.GCN.lightGCN import LightGCN
    # lightGCN = LightGCN()
    # lightGCN.load_data(variant=False)
    ### ========

    end_time = time.time()
    print("use gcn Execution time: ", end_time - start_time, flush=True)

    start_time = time.time()
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

    return resp


def get_resources(job):
    material_id = job["materialId"]
    user_id = job["userId"]
    slide_id = job["slideId"]
    understood = job["understood"]
    non_understood = job["nonUnderstood"]
    new_concepts = job["newConcepts"]

    print("not-understood from paul:", non_understood, flush=True)
    understood_concept_ids = [cid for cid in understood.split(",") if understood]
    non_understood_concept_ids = [
        cid for cid in non_understood.split(",") if non_understood
    ]
    new_concept_ids = [cid for cid in new_concepts.split(",") if new_concepts]

    print(
        "material_id:",
        material_id,
        "slide_id: ",
        slide_id,
        "user_id: ",
        user_id,
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
    check_message = resource_recommender_service.check_parameters(
        slide_id=slide_id,
        material_id=material_id,
        non_understood_concept_ids=non_understood_concept_ids,
        understood_concept_ids=understood_concept_ids,
        new_concept_ids=new_concept_ids,
        recommendation_type=recommendation_type,
    )
    if check_message != "":
        return make_response(check_message, 404)

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
            user_id=user_id,
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

    return resp
