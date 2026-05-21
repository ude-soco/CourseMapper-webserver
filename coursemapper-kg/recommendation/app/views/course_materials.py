import logging

from log import LOG
import time
import json

from ..services.course_materials.recommendation.resource_recommender import ResourceRecommenderService
from ..services.course_materials.recommendation.recommendation_type import RecommendationType
from ..services.course_materials.kwp_extraction.dbpedia.data_service1 import RecService
from ..services.course_materials.Relational_ConceptGCN.relational_conceptgcn_rrgcn import RRGCN
from ..services.course_materials.Relational_ConceptGCN.relational_conceptgcn_compgcn import relational_conceptgcn_compgcn
from ..services.course_materials.GCN.gcn import GCN
#from ..services.course_materials.Relational_ConceptGCN.relational_conceptgcn_compgcn import relational_conceptgcn_compgcn
#from ..services.course_materials.Relational_ConceptGCN.relational_conceptgcn_rrgcn import RRGCN
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
    # gcn = GCN()
    # gcn.load_data()
    gcn = RRGCN()
    gcn.rrgcn_1_2()
    # gcn = relational_conceptgcn_compgcn()
    # gcn.compgcn_without_direction_weight('mult')
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

def get_sequence_concepts(job):
    data = job["data"]
    material_id = data["materialId"]
    user_id = data["userId"]
    understood = data["understoodConcepts"]
    non_understood = data["nonUnderstoodConcepts"]
    new_concepts = data["newConcepts"]
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

    gcn = RRGCN()
    gcn.rrgcn_1_2()
    
    # gcn = relational_conceptgcn_compgcn()
    # gcn.compgcn_without_direction_weight('mult')

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
    sequence_path = data_service._get_concept_sequence_recommendation(user_id=user_id, mid=material_id)
    end_time = time.time()
    logger.info(sequence_path)
    
    print(
        "Get top-5 recommendation concept and interpretability Execution time: ",
        end_time - start_time,
        flush=True,
    )
    end_time1 = time.time()
    print("Execution time: ", end_time1 - start_time1, flush=True)
    #make_response.headers.add('Access-Control-Allow-Origin', '*')

    return sequence_path

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