
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
# import asyncio

logger = LOG(name=__name__, level=logging.DEBUG)

course_materials = Blueprint("course_materials", __name__)

# Resource Saved APIs
@course_materials.route("/user_resources/save_or_remove", methods=["POST"])
def save_or_remove_user_resources_():
    data = request.get_json()
    logger.info(f"Getting Resource Saved -> {data}")

    resource_recommender_service = ResourceRecommenderService()
    resp = resource_recommender_service.save_or_remove_user_resources(data=data)
    return make_response(jsonify(resp), 200)

@course_materials.route("/user_resources/get_filter_params", methods=["POST"])
def get_concepts_mids_sliders_numbers_for_user_resources_saved():
    data = request.get_json()
    logger.info(f"User Resources Saved FIlter Params -> {data}")

    resource_recommender_service = ResourceRecommenderService()
    resp = resource_recommender_service.get_concepts_mids_sliders_numbers_for_user_resources_saved(data=data)
    return make_response(jsonify(resp), 200)

@course_materials.route("/user_resources/filter", methods=["POST"])
def filter_user_resources_saved_by():
    data = request.get_json()
    logger.info(f"Getting User Resources Saved Filter -> {data}")

    resource_recommender_service = ResourceRecommenderService()
    resp = resource_recommender_service.filter_user_resources_saved_by(data=data)
    return make_response(jsonify(resp), 200)


# Rating APIs
@course_materials.route("/rating", methods=["POST"])
def rating():
    logger.info("Getting Rating Data")
    data = request.get_json()
    logger.info(f"Rating Data: {data}")

    resource_recommender_service = ResourceRecommenderService()
    resp = resource_recommender_service.user_rates_resources(rating=data)
    return make_response(jsonify(resp), 200)

    """
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
    """


@course_materials.route("/get_resources/update_factor_weights", methods=["POST"])
def update_resources_factor_weights():
    data = request.get_json()
    logger.info("------ Updating Factor Weights ------>")
    rrs = ResourceRecommenderService()
    """
    weigths_normalized = {}
    for k,v in data.items():
        weigths_normalized[k] = rrs.normalize_factor_weights(  factor_weights=v, 
                                                        method_type="l1", 
                                                        complete=True, 
                                                        sum_value=False
                                                    )
    result = {
        "original": data,
        "normalized": weigths_normalized
    }
    """ 
    result = rrs.normalize_factor_weights(  factor_weights=data, 
                                                        method_type="l1", 
                                                        complete=True, 
                                                        sum_value=False
                                                    )
    return jsonify(result), 200


@course_materials.route("/get_resources", methods=["POST"])
def get_resources():
    data = request.get_json()
    logger.info("------ CRO DATA ----^-->")
    print(data)
    print()

    data_default = data["default"]
    data_rec_params = data["rec_params"]
    
    resource_recommender_service = ResourceRecommenderService()
    result = resource_recommender_service._get_resources(data_default=data_default, data_rec_params=data_rec_params)

    if result == None:
        return jsonify({"msg": "Internal Server Error"}), 404
    return jsonify(result), 200

@course_materials.route("/get_concepts", methods=["POST"])
def get_concepts():
    # return make_response([], 200)
    
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

    ## boby024
    return CRO_TEST_get_concepts

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



## boby024
CRO_TEST_get_concepts = {
    "nodes": [
        {
            "data": {
                "Reason": [
                    {
                        "dnu": [
                            "Learning analytics",
                            "Correlation and dependence",
                            "Machine learning",
                            "Data mining"
                        ]
                    },
                    {
                        "dnu": [
                            "Learning analytics",
                            "Correlation and dependence",
                            "Machine learning",
                            "Data mining"
                        ],
                        "name": "slide_2",
                        "type": "Slide"
                    }
                ],
                "abstract": "Association rule learning is a rule-based machine learning method for discovering interesting relations between variables in large databases. It is intended to identify strong rules discovered in databases using some measures of interestingness. In any given transaction with a variety of items, association rules are meant to discover the rules that determine how or why certain items are connected. Based on the concept of strong rules, Rakesh Agrawal, Tomasz Imieliński and Arun Swami introduced association rules for discovering regularities between products in large-scale transaction data recorded by point-of-sale (POS) systems in supermarkets. For example, the rule found in the sales data of a supermarket would indicate that if a customer buys onions and potatoes together, they are likely to also buy hamburger meat. Such information can be used as the basis for decisions about marketing activities such as, e.g., promotional pricing or product placements. In addition to the above example from market basket analysis association rules are employed today in many application areas including Web usage mining, intrusion detection, continuous production, and bioinformatics. In contrast with sequence mining, association rule learning typically does not consider the order of items either within a transaction or across transactions. The association rule algorithm itself consists of various parameters that can make it difficult for those without some expertise in data mining to execute, with many rules that are arduous to understand.",
                "id": "1962266098871970222",
                "name": "Association rule learning",
                "roads": [
                    [
                        {
                            "name": "test",
                            "type": "user"
                        },
                        "dnu",
                        {
                            "abstract": "Learning analytics is the measurement, collection, analysis and reporting of data about learners and their contexts, for purposes of understanding and optimizing learning and the environments in which it occurs.The growth of online learning since the 1990s, particularly in higher education, has contributed to the advancement of Learning Analytics as student data can be captured and made available for analysis. When learners use an LMS, social media, or similar online tools, their clicks, navigation patterns, time on task, social networks, information flow, and concept development through discussions can be tracked. The rapid development of massive open online courses (MOOCs) offers additional data for researchers to evaluate teaching and learning in online environments.",
                            "id": "8054968523653998513",
                            "name": "Learning analytics",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Learning_analytics",
                            "wikipedia": "http://en.wikipedia.org/wiki/Learning_analytics"
                        },
                        "CONTAINS",
                        {
                            "name": "slide_2",
                            "type": "Slide"
                        },
                        "CONTAINS",
                        {
                            "abstract": "Association rule learning is a rule-based machine learning method for discovering interesting relations between variables in large databases. It is intended to identify strong rules discovered in databases using some measures of interestingness. In any given transaction with a variety of items, association rules are meant to discover the rules that determine how or why certain items are connected. Based on the concept of strong rules, Rakesh Agrawal, Tomasz Imieliński and Arun Swami introduced association rules for discovering regularities between products in large-scale transaction data recorded by point-of-sale (POS) systems in supermarkets. For example, the rule found in the sales data of a supermarket would indicate that if a customer buys onions and potatoes together, they are likely to also buy hamburger meat. Such information can be used as the basis for decisions about marketing activities such as, e.g., promotional pricing or product placements. In addition to the above example from market basket analysis association rules are employed today in many application areas including Web usage mining, intrusion detection, continuous production, and bioinformatics. In contrast with sequence mining, association rule learning typically does not consider the order of items either within a transaction or across transactions. The association rule algorithm itself consists of various parameters that can make it difficult for those without some expertise in data mining to execute, with many rules that are arduous to understand.",
                            "id": "1962266098871970222",
                            "name": "Association rule learning",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Association_rule_learning",
                            "wikipedia": "http://en.wikipedia.org/wiki/Association_rule_learning"
                        }
                    ],
                    [
                        {
                            "name": "test",
                            "type": "user"
                        },
                        "dnu",
                        {
                            "abstract": "",
                            "id": "2176769380760892505",
                            "name": "Correlation and dependence",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Correlation_and_dependence",
                            "wikipedia": "http://en.wikipedia.org/wiki/Correlation_and_dependence"
                        },
                        "CONTAINS",
                        {
                            "name": "slide_2",
                            "type": "Slide"
                        },
                        "CONTAINS",
                        {
                            "abstract": "Association rule learning is a rule-based machine learning method for discovering interesting relations between variables in large databases. It is intended to identify strong rules discovered in databases using some measures of interestingness. In any given transaction with a variety of items, association rules are meant to discover the rules that determine how or why certain items are connected. Based on the concept of strong rules, Rakesh Agrawal, Tomasz Imieliński and Arun Swami introduced association rules for discovering regularities between products in large-scale transaction data recorded by point-of-sale (POS) systems in supermarkets. For example, the rule found in the sales data of a supermarket would indicate that if a customer buys onions and potatoes together, they are likely to also buy hamburger meat. Such information can be used as the basis for decisions about marketing activities such as, e.g., promotional pricing or product placements. In addition to the above example from market basket analysis association rules are employed today in many application areas including Web usage mining, intrusion detection, continuous production, and bioinformatics. In contrast with sequence mining, association rule learning typically does not consider the order of items either within a transaction or across transactions. The association rule algorithm itself consists of various parameters that can make it difficult for those without some expertise in data mining to execute, with many rules that are arduous to understand.",
                            "id": "1962266098871970222",
                            "name": "Association rule learning",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Association_rule_learning",
                            "wikipedia": "http://en.wikipedia.org/wiki/Association_rule_learning"
                        }
                    ],
                    [
                        {
                            "name": "test",
                            "type": "user"
                        },
                        "dnu",
                        {
                            "abstract": "Machine learning (ML) is a field of inquiry devoted to understanding and building methods that 'learn', that is, methods that leverage data to improve performance on some set of tasks. It is seen as a part of artificial intelligence. Machine learning algorithms build a model based on sample data, known as training data, in order to make predictions or decisions without being explicitly programmed to do so. Machine learning algorithms are used in a wide variety of applications, such as in medicine, email filtering, speech recognition, agriculture, and computer vision, where it is difficult or unfeasible to develop conventional algorithms to perform the needed tasks. A subset of machine learning is closely related to computational statistics, which focuses on making predictions using computers, but not all machine learning is statistical learning. The study of mathematical optimization delivers methods, theory and application domains to the field of machine learning. Data mining is a related field of study, focusing on exploratory data analysis through unsupervised learning. Some implementations of machine learning use data and neural networks in a way that mimics the working of a biological brain. In its application across business problems, machine learning is also referred to as predictive analytics.",
                            "id": "5803328596782921368",
                            "name": "Machine learning",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Machine_learning",
                            "wikipedia": "http://en.wikipedia.org/wiki/Machine_learning"
                        },
                        "CONTAINS",
                        {
                            "name": "slide_2",
                            "type": "Slide"
                        },
                        "CONTAINS",
                        {
                            "abstract": "Association rule learning is a rule-based machine learning method for discovering interesting relations between variables in large databases. It is intended to identify strong rules discovered in databases using some measures of interestingness. In any given transaction with a variety of items, association rules are meant to discover the rules that determine how or why certain items are connected. Based on the concept of strong rules, Rakesh Agrawal, Tomasz Imieliński and Arun Swami introduced association rules for discovering regularities between products in large-scale transaction data recorded by point-of-sale (POS) systems in supermarkets. For example, the rule found in the sales data of a supermarket would indicate that if a customer buys onions and potatoes together, they are likely to also buy hamburger meat. Such information can be used as the basis for decisions about marketing activities such as, e.g., promotional pricing or product placements. In addition to the above example from market basket analysis association rules are employed today in many application areas including Web usage mining, intrusion detection, continuous production, and bioinformatics. In contrast with sequence mining, association rule learning typically does not consider the order of items either within a transaction or across transactions. The association rule algorithm itself consists of various parameters that can make it difficult for those without some expertise in data mining to execute, with many rules that are arduous to understand.",
                            "id": "1962266098871970222",
                            "name": "Association rule learning",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Association_rule_learning",
                            "wikipedia": "http://en.wikipedia.org/wiki/Association_rule_learning"
                        }
                    ],
                    [
                        {
                            "name": "test",
                            "type": "user"
                        },
                        "dnu",
                        {
                            "abstract": "Data mining is the process of extracting and discovering patterns in large data sets involving methods at the intersection of machine learning, statistics, and database systems. Data mining is an interdisciplinary subfield of computer science and statistics with an overall goal of extracting information (with intelligent methods) from a data set and transforming the information into a comprehensible structure for further use. Data mining is the analysis step of the \"knowledge discovery in databases\" process, or KDD. Aside from the raw analysis step, it also involves database and data management aspects, data pre-processing, model and inference considerations, interestingness metrics, complexity considerations, post-processing of discovered structures, visualization, and online updating. The term \"data mining\" is a misnomer because the goal is the extraction of patterns and knowledge from large amounts of data, not the extraction (mining) of data itself. It also is a buzzword and is frequently applied to any form of large-scale data or information processing (collection, extraction, warehousing, analysis, and statistics) as well as any application of computer decision support system, including artificial intelligence (e.g., machine learning) and business intelligence. The book Data mining: Practical machine learning tools and techniques with Java (which covers mostly machine learning material) was originally to be named Practical machine learning, and the term data mining was only added for marketing reasons. Often the more general terms (large scale) data analysis and analytics—or, when referring to actual methods, artificial intelligence and machine learning—are more appropriate. The actual data mining task is the semi-automatic or automatic analysis of large quantities of data to extract previously unknown, interesting patterns such as groups of data records (cluster analysis), unusual records (anomaly detection), and dependencies (association rule mining, sequential pattern mining). This usually involves using database techniques such as spatial indices. These patterns can then be seen as a kind of summary of the input data, and may be used in further analysis or, for example, in machine learning and predictive analytics. For example, the data mining step might identify multiple groups in the data, which can then be used to obtain more accurate prediction results by a decision support system. Neither the data collection, data preparation, nor result interpretation and reporting is part of the data mining step, although they do belong to the overall KDD process as additional steps. The difference between data analysis and data mining is that data analysis is used to test models and hypotheses on the dataset, e.g., analyzing the effectiveness of a marketing campaign, regardless of the amount of data. In contrast, data mining uses machine learning and statistical models to uncover clandestine or hidden patterns in a large volume of data. The related terms data dredging, data fishing, and data snooping refer to the use of data mining methods to sample parts of a larger population data set that are (or may be) too small for reliable statistical inferences to be made about the validity of any patterns discovered. These methods can, however, be used in creating new hypotheses to test against the larger data populations.",
                            "id": "8975906538566188683",
                            "name": "Data mining",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Data_mining",
                            "wikipedia": "http://en.wikipedia.org/wiki/Data_mining"
                        },
                        "CONTAINS",
                        {
                            "name": "slide_2",
                            "type": "Slide"
                        },
                        "CONTAINS",
                        {
                            "abstract": "Association rule learning is a rule-based machine learning method for discovering interesting relations between variables in large databases. It is intended to identify strong rules discovered in databases using some measures of interestingness. In any given transaction with a variety of items, association rules are meant to discover the rules that determine how or why certain items are connected. Based on the concept of strong rules, Rakesh Agrawal, Tomasz Imieliński and Arun Swami introduced association rules for discovering regularities between products in large-scale transaction data recorded by point-of-sale (POS) systems in supermarkets. For example, the rule found in the sales data of a supermarket would indicate that if a customer buys onions and potatoes together, they are likely to also buy hamburger meat. Such information can be used as the basis for decisions about marketing activities such as, e.g., promotional pricing or product placements. In addition to the above example from market basket analysis association rules are employed today in many application areas including Web usage mining, intrusion detection, continuous production, and bioinformatics. In contrast with sequence mining, association rule learning typically does not consider the order of items either within a transaction or across transactions. The association rule algorithm itself consists of various parameters that can make it difficult for those without some expertise in data mining to execute, with many rules that are arduous to understand.",
                            "id": "1962266098871970222",
                            "name": "Association rule learning",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Association_rule_learning",
                            "wikipedia": "http://en.wikipedia.org/wiki/Association_rule_learning"
                        }
                    ]
                ],
                "score": 0.9873782970537454,
                "type": "annotation",
                "uri": "http://dbpedia.org/resource/Association_rule_learning",
                "wikipedia": "http://en.wikipedia.org/wiki/Association_rule_learning"
            }
        },
        {
            "data": {
                "Reason": [
                    {
                        "dnu": [
                            "Learning analytics",
                            "Correlation and dependence",
                            "Machine learning",
                            "Data mining"
                        ]
                    },
                    {
                        "dnu": [
                            "Learning analytics",
                            "Correlation and dependence",
                            "Machine learning",
                            "Data mining"
                        ],
                        "name": "slide_2",
                        "type": "Slide"
                    }
                ],
                "abstract": "In computing, a database is an organized collection of data stored and accessed electronically. Small databases can be stored on a file system, while large databases are hosted on computer clusters or cloud storage. The design of databases spans formal techniques and practical considerations, including data modeling, efficient data representation and storage, query languages, security and privacy of sensitive data, and distributed computing issues, including supporting concurrent access and fault tolerance. A (DBMS) is the software that interacts with end users, applications, and the database itself to capture and analyze the data. The DBMS software additionally encompasses the core facilities provided to administer the database. The sum total of the database, the DBMS and the associated applications can be referred to as a database system. Often the term \"database\" is also used loosely to refer to any of the DBMS, the database system or an application associated with the database. Computer scientists may classify database management systems according to the database models that they support. Relational databases became dominant in the 1980s. These model data as rows and columns in a series of tables, and the vast majority use SQL for writing and querying data. In the 2000s, non-relational databases became popular, collectively referred to as NoSQL, because they use different query languages.",
                "id": "1133739882904124268",
                "name": "Database",
                "roads": [
                    [
                        {
                            "name": "test",
                            "type": "user"
                        },
                        "dnu",
                        {
                            "abstract": "Learning analytics is the measurement, collection, analysis and reporting of data about learners and their contexts, for purposes of understanding and optimizing learning and the environments in which it occurs.The growth of online learning since the 1990s, particularly in higher education, has contributed to the advancement of Learning Analytics as student data can be captured and made available for analysis. When learners use an LMS, social media, or similar online tools, their clicks, navigation patterns, time on task, social networks, information flow, and concept development through discussions can be tracked. The rapid development of massive open online courses (MOOCs) offers additional data for researchers to evaluate teaching and learning in online environments.",
                            "id": "8054968523653998513",
                            "name": "Learning analytics",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Learning_analytics",
                            "wikipedia": "http://en.wikipedia.org/wiki/Learning_analytics"
                        },
                        "CONTAINS",
                        {
                            "name": "slide_2",
                            "type": "Slide"
                        },
                        "CONTAINS",
                        {
                            "abstract": "In computing, a database is an organized collection of data stored and accessed electronically. Small databases can be stored on a file system, while large databases are hosted on computer clusters or cloud storage. The design of databases spans formal techniques and practical considerations, including data modeling, efficient data representation and storage, query languages, security and privacy of sensitive data, and distributed computing issues, including supporting concurrent access and fault tolerance. A (DBMS) is the software that interacts with end users, applications, and the database itself to capture and analyze the data. The DBMS software additionally encompasses the core facilities provided to administer the database. The sum total of the database, the DBMS and the associated applications can be referred to as a database system. Often the term \"database\" is also used loosely to refer to any of the DBMS, the database system or an application associated with the database. Computer scientists may classify database management systems according to the database models that they support. Relational databases became dominant in the 1980s. These model data as rows and columns in a series of tables, and the vast majority use SQL for writing and querying data. In the 2000s, non-relational databases became popular, collectively referred to as NoSQL, because they use different query languages.",
                            "id": "1133739882904124268",
                            "name": "Database",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Database",
                            "wikipedia": "http://en.wikipedia.org/wiki/Database"
                        }
                    ],
                    [
                        {
                            "name": "test",
                            "type": "user"
                        },
                        "dnu",
                        {
                            "abstract": "",
                            "id": "2176769380760892505",
                            "name": "Correlation and dependence",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Correlation_and_dependence",
                            "wikipedia": "http://en.wikipedia.org/wiki/Correlation_and_dependence"
                        },
                        "CONTAINS",
                        {
                            "name": "slide_2",
                            "type": "Slide"
                        },
                        "CONTAINS",
                        {
                            "abstract": "In computing, a database is an organized collection of data stored and accessed electronically. Small databases can be stored on a file system, while large databases are hosted on computer clusters or cloud storage. The design of databases spans formal techniques and practical considerations, including data modeling, efficient data representation and storage, query languages, security and privacy of sensitive data, and distributed computing issues, including supporting concurrent access and fault tolerance. A (DBMS) is the software that interacts with end users, applications, and the database itself to capture and analyze the data. The DBMS software additionally encompasses the core facilities provided to administer the database. The sum total of the database, the DBMS and the associated applications can be referred to as a database system. Often the term \"database\" is also used loosely to refer to any of the DBMS, the database system or an application associated with the database. Computer scientists may classify database management systems according to the database models that they support. Relational databases became dominant in the 1980s. These model data as rows and columns in a series of tables, and the vast majority use SQL for writing and querying data. In the 2000s, non-relational databases became popular, collectively referred to as NoSQL, because they use different query languages.",
                            "id": "1133739882904124268",
                            "name": "Database",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Database",
                            "wikipedia": "http://en.wikipedia.org/wiki/Database"
                        }
                    ],
                    [
                        {
                            "name": "test",
                            "type": "user"
                        },
                        "dnu",
                        {
                            "abstract": "Machine learning (ML) is a field of inquiry devoted to understanding and building methods that 'learn', that is, methods that leverage data to improve performance on some set of tasks. It is seen as a part of artificial intelligence. Machine learning algorithms build a model based on sample data, known as training data, in order to make predictions or decisions without being explicitly programmed to do so. Machine learning algorithms are used in a wide variety of applications, such as in medicine, email filtering, speech recognition, agriculture, and computer vision, where it is difficult or unfeasible to develop conventional algorithms to perform the needed tasks. A subset of machine learning is closely related to computational statistics, which focuses on making predictions using computers, but not all machine learning is statistical learning. The study of mathematical optimization delivers methods, theory and application domains to the field of machine learning. Data mining is a related field of study, focusing on exploratory data analysis through unsupervised learning. Some implementations of machine learning use data and neural networks in a way that mimics the working of a biological brain. In its application across business problems, machine learning is also referred to as predictive analytics.",
                            "id": "5803328596782921368",
                            "name": "Machine learning",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Machine_learning",
                            "wikipedia": "http://en.wikipedia.org/wiki/Machine_learning"
                        },
                        "CONTAINS",
                        {
                            "name": "slide_2",
                            "type": "Slide"
                        },
                        "CONTAINS",
                        {
                            "abstract": "In computing, a database is an organized collection of data stored and accessed electronically. Small databases can be stored on a file system, while large databases are hosted on computer clusters or cloud storage. The design of databases spans formal techniques and practical considerations, including data modeling, efficient data representation and storage, query languages, security and privacy of sensitive data, and distributed computing issues, including supporting concurrent access and fault tolerance. A (DBMS) is the software that interacts with end users, applications, and the database itself to capture and analyze the data. The DBMS software additionally encompasses the core facilities provided to administer the database. The sum total of the database, the DBMS and the associated applications can be referred to as a database system. Often the term \"database\" is also used loosely to refer to any of the DBMS, the database system or an application associated with the database. Computer scientists may classify database management systems according to the database models that they support. Relational databases became dominant in the 1980s. These model data as rows and columns in a series of tables, and the vast majority use SQL for writing and querying data. In the 2000s, non-relational databases became popular, collectively referred to as NoSQL, because they use different query languages.",
                            "id": "1133739882904124268",
                            "name": "Database",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Database",
                            "wikipedia": "http://en.wikipedia.org/wiki/Database"
                        }
                    ],
                    [
                        {
                            "name": "test",
                            "type": "user"
                        },
                        "dnu",
                        {
                            "abstract": "Data mining is the process of extracting and discovering patterns in large data sets involving methods at the intersection of machine learning, statistics, and database systems. Data mining is an interdisciplinary subfield of computer science and statistics with an overall goal of extracting information (with intelligent methods) from a data set and transforming the information into a comprehensible structure for further use. Data mining is the analysis step of the \"knowledge discovery in databases\" process, or KDD. Aside from the raw analysis step, it also involves database and data management aspects, data pre-processing, model and inference considerations, interestingness metrics, complexity considerations, post-processing of discovered structures, visualization, and online updating. The term \"data mining\" is a misnomer because the goal is the extraction of patterns and knowledge from large amounts of data, not the extraction (mining) of data itself. It also is a buzzword and is frequently applied to any form of large-scale data or information processing (collection, extraction, warehousing, analysis, and statistics) as well as any application of computer decision support system, including artificial intelligence (e.g., machine learning) and business intelligence. The book Data mining: Practical machine learning tools and techniques with Java (which covers mostly machine learning material) was originally to be named Practical machine learning, and the term data mining was only added for marketing reasons. Often the more general terms (large scale) data analysis and analytics—or, when referring to actual methods, artificial intelligence and machine learning—are more appropriate. The actual data mining task is the semi-automatic or automatic analysis of large quantities of data to extract previously unknown, interesting patterns such as groups of data records (cluster analysis), unusual records (anomaly detection), and dependencies (association rule mining, sequential pattern mining). This usually involves using database techniques such as spatial indices. These patterns can then be seen as a kind of summary of the input data, and may be used in further analysis or, for example, in machine learning and predictive analytics. For example, the data mining step might identify multiple groups in the data, which can then be used to obtain more accurate prediction results by a decision support system. Neither the data collection, data preparation, nor result interpretation and reporting is part of the data mining step, although they do belong to the overall KDD process as additional steps. The difference between data analysis and data mining is that data analysis is used to test models and hypotheses on the dataset, e.g., analyzing the effectiveness of a marketing campaign, regardless of the amount of data. In contrast, data mining uses machine learning and statistical models to uncover clandestine or hidden patterns in a large volume of data. The related terms data dredging, data fishing, and data snooping refer to the use of data mining methods to sample parts of a larger population data set that are (or may be) too small for reliable statistical inferences to be made about the validity of any patterns discovered. These methods can, however, be used in creating new hypotheses to test against the larger data populations.",
                            "id": "8975906538566188683",
                            "name": "Data mining",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Data_mining",
                            "wikipedia": "http://en.wikipedia.org/wiki/Data_mining"
                        },
                        "CONTAINS",
                        {
                            "name": "slide_2",
                            "type": "Slide"
                        },
                        "CONTAINS",
                        {
                            "abstract": "In computing, a database is an organized collection of data stored and accessed electronically. Small databases can be stored on a file system, while large databases are hosted on computer clusters or cloud storage. The design of databases spans formal techniques and practical considerations, including data modeling, efficient data representation and storage, query languages, security and privacy of sensitive data, and distributed computing issues, including supporting concurrent access and fault tolerance. A (DBMS) is the software that interacts with end users, applications, and the database itself to capture and analyze the data. The DBMS software additionally encompasses the core facilities provided to administer the database. The sum total of the database, the DBMS and the associated applications can be referred to as a database system. Often the term \"database\" is also used loosely to refer to any of the DBMS, the database system or an application associated with the database. Computer scientists may classify database management systems according to the database models that they support. Relational databases became dominant in the 1980s. These model data as rows and columns in a series of tables, and the vast majority use SQL for writing and querying data. In the 2000s, non-relational databases became popular, collectively referred to as NoSQL, because they use different query languages.",
                            "id": "1133739882904124268",
                            "name": "Database",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Database",
                            "wikipedia": "http://en.wikipedia.org/wiki/Database"
                        }
                    ]
                ],
                "score": 0.9806759617407537,
                "type": "annotation",
                "uri": "http://dbpedia.org/resource/Database",
                "wikipedia": "http://en.wikipedia.org/wiki/Database"
            }
        },
        {
            "data": {
                "Reason": [],
                "abstract": "Rule-based machine learning (RBML) is a term in computer science intended to encompass any machine learning method that identifies, learns, or evolves 'rules' to store, manipulate or apply. The defining characteristic of a rule-based machine learner is the identification and utilization of a set of relational rules that collectively represent the knowledge captured by the system. This is in contrast to other machine learners that commonly identify a singular model that can be universally applied to any instance in order to make a prediction. Rule-based machine learning approaches include learning classifier systems, association rule learning, artificial immune systems, and any other method that relies on a set of rules, each covering contextual knowledge. While rule-based machine learning is conceptually a type of rule-based system, it is distinct from traditional rule-based systems, which are often hand-crafted, and other rule-based decision makers. This is because rule-based machine learning applies some form of learning algorithm to automatically identify useful rules, rather than a human needing to apply prior domain knowledge to manually construct rules and curate a rule set.",
                "id": "8007212189569908212",
                "name": "Rule-based machine learning",
                "roads": [],
                "score": 0.9717050137357932,
                "type": "property",
                "uri": "http://dbpedia.org/resource/Rule-based_machine_learning",
                "wikipedia": "http://en.wikipedia.org/wiki/Rule-based_machine_learning"
            }
        },
        {
            "data": {
                "Reason": [
                    {
                        "dnu": [
                            "Learning analytics",
                            "Correlation and dependence",
                            "Machine learning",
                            "Data mining"
                        ]
                    },
                    {
                        "dnu": [
                            "Learning analytics",
                            "Correlation and dependence",
                            "Machine learning",
                            "Data mining"
                        ],
                        "name": "slide_2",
                        "type": "Slide"
                    }
                ],
                "abstract": "Cluster analysis or clustering is the task of grouping a set of objects in such a way that objects in the same group (called a cluster) are more similar (in some sense) to each other than to those in other groups (clusters). It is a main task of exploratory data analysis, and a common technique for statistical data analysis, used in many fields, including pattern recognition, image analysis, information retrieval, bioinformatics, data compression, computer graphics and machine learning. Cluster analysis itself is not one specific algorithm, but the general task to be solved. It can be achieved by various algorithms that differ significantly in their understanding of what constitutes a cluster and how to efficiently find them. Popular notions of clusters include groups with small distances between cluster members, dense areas of the data space, intervals or particular statistical distributions. Clustering can therefore be formulated as a multi-objective optimization problem. The appropriate clustering algorithm and parameter settings (including parameters such as the distance function to use, a density threshold or the number of expected clusters) depend on the individual data set and intended use of the results. Cluster analysis as such is not an automatic task, but an iterative process of knowledge discovery or interactive multi-objective optimization that involves trial and failure. It is often necessary to modify data preprocessing and model parameters until the result achieves the desired properties. Besides the term clustering, there is a number of terms with similar meanings, including automatic classification, numerical taxonomy, botryology (from Greek βότρυς \"grape\"), typological analysis, and community detection. The subtle differences are often in the use of the results: while in data mining, the resulting groups are the matter of interest, in automatic classification the resulting discriminative power is of interest. Cluster analysis was originated in anthropology by Driver and Kroeber in 1932 and introduced to psychology by Joseph Zubin in 1938 and Robert Tryon in 1939 and famously used by Cattell beginning in 1943 for trait theory classification in personality psychology.",
                "id": "247708307003061874",
                "name": "Cluster analysis",
                "roads": [
                    [
                        {
                            "name": "test",
                            "type": "user"
                        },
                        "dnu",
                        {
                            "abstract": "Learning analytics is the measurement, collection, analysis and reporting of data about learners and their contexts, for purposes of understanding and optimizing learning and the environments in which it occurs.The growth of online learning since the 1990s, particularly in higher education, has contributed to the advancement of Learning Analytics as student data can be captured and made available for analysis. When learners use an LMS, social media, or similar online tools, their clicks, navigation patterns, time on task, social networks, information flow, and concept development through discussions can be tracked. The rapid development of massive open online courses (MOOCs) offers additional data for researchers to evaluate teaching and learning in online environments.",
                            "id": "8054968523653998513",
                            "name": "Learning analytics",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Learning_analytics",
                            "wikipedia": "http://en.wikipedia.org/wiki/Learning_analytics"
                        },
                        "CONTAINS",
                        {
                            "name": "slide_2",
                            "type": "Slide"
                        },
                        "CONTAINS",
                        {
                            "abstract": "Cluster analysis or clustering is the task of grouping a set of objects in such a way that objects in the same group (called a cluster) are more similar (in some sense) to each other than to those in other groups (clusters). It is a main task of exploratory data analysis, and a common technique for statistical data analysis, used in many fields, including pattern recognition, image analysis, information retrieval, bioinformatics, data compression, computer graphics and machine learning. Cluster analysis itself is not one specific algorithm, but the general task to be solved. It can be achieved by various algorithms that differ significantly in their understanding of what constitutes a cluster and how to efficiently find them. Popular notions of clusters include groups with small distances between cluster members, dense areas of the data space, intervals or particular statistical distributions. Clustering can therefore be formulated as a multi-objective optimization problem. The appropriate clustering algorithm and parameter settings (including parameters such as the distance function to use, a density threshold or the number of expected clusters) depend on the individual data set and intended use of the results. Cluster analysis as such is not an automatic task, but an iterative process of knowledge discovery or interactive multi-objective optimization that involves trial and failure. It is often necessary to modify data preprocessing and model parameters until the result achieves the desired properties. Besides the term clustering, there is a number of terms with similar meanings, including automatic classification, numerical taxonomy, botryology (from Greek βότρυς \"grape\"), typological analysis, and community detection. The subtle differences are often in the use of the results: while in data mining, the resulting groups are the matter of interest, in automatic classification the resulting discriminative power is of interest. Cluster analysis was originated in anthropology by Driver and Kroeber in 1932 and introduced to psychology by Joseph Zubin in 1938 and Robert Tryon in 1939 and famously used by Cattell beginning in 1943 for trait theory classification in personality psychology.",
                            "id": "247708307003061874",
                            "name": "Cluster analysis",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Cluster_analysis",
                            "wikipedia": "http://en.wikipedia.org/wiki/Cluster_analysis"
                        }
                    ],
                    [
                        {
                            "name": "test",
                            "type": "user"
                        },
                        "dnu",
                        {
                            "abstract": "",
                            "id": "2176769380760892505",
                            "name": "Correlation and dependence",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Correlation_and_dependence",
                            "wikipedia": "http://en.wikipedia.org/wiki/Correlation_and_dependence"
                        },
                        "CONTAINS",
                        {
                            "name": "slide_2",
                            "type": "Slide"
                        },
                        "CONTAINS",
                        {
                            "abstract": "Cluster analysis or clustering is the task of grouping a set of objects in such a way that objects in the same group (called a cluster) are more similar (in some sense) to each other than to those in other groups (clusters). It is a main task of exploratory data analysis, and a common technique for statistical data analysis, used in many fields, including pattern recognition, image analysis, information retrieval, bioinformatics, data compression, computer graphics and machine learning. Cluster analysis itself is not one specific algorithm, but the general task to be solved. It can be achieved by various algorithms that differ significantly in their understanding of what constitutes a cluster and how to efficiently find them. Popular notions of clusters include groups with small distances between cluster members, dense areas of the data space, intervals or particular statistical distributions. Clustering can therefore be formulated as a multi-objective optimization problem. The appropriate clustering algorithm and parameter settings (including parameters such as the distance function to use, a density threshold or the number of expected clusters) depend on the individual data set and intended use of the results. Cluster analysis as such is not an automatic task, but an iterative process of knowledge discovery or interactive multi-objective optimization that involves trial and failure. It is often necessary to modify data preprocessing and model parameters until the result achieves the desired properties. Besides the term clustering, there is a number of terms with similar meanings, including automatic classification, numerical taxonomy, botryology (from Greek βότρυς \"grape\"), typological analysis, and community detection. The subtle differences are often in the use of the results: while in data mining, the resulting groups are the matter of interest, in automatic classification the resulting discriminative power is of interest. Cluster analysis was originated in anthropology by Driver and Kroeber in 1932 and introduced to psychology by Joseph Zubin in 1938 and Robert Tryon in 1939 and famously used by Cattell beginning in 1943 for trait theory classification in personality psychology.",
                            "id": "247708307003061874",
                            "name": "Cluster analysis",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Cluster_analysis",
                            "wikipedia": "http://en.wikipedia.org/wiki/Cluster_analysis"
                        }
                    ],
                    [
                        {
                            "name": "test",
                            "type": "user"
                        },
                        "dnu",
                        {
                            "abstract": "Machine learning (ML) is a field of inquiry devoted to understanding and building methods that 'learn', that is, methods that leverage data to improve performance on some set of tasks. It is seen as a part of artificial intelligence. Machine learning algorithms build a model based on sample data, known as training data, in order to make predictions or decisions without being explicitly programmed to do so. Machine learning algorithms are used in a wide variety of applications, such as in medicine, email filtering, speech recognition, agriculture, and computer vision, where it is difficult or unfeasible to develop conventional algorithms to perform the needed tasks. A subset of machine learning is closely related to computational statistics, which focuses on making predictions using computers, but not all machine learning is statistical learning. The study of mathematical optimization delivers methods, theory and application domains to the field of machine learning. Data mining is a related field of study, focusing on exploratory data analysis through unsupervised learning. Some implementations of machine learning use data and neural networks in a way that mimics the working of a biological brain. In its application across business problems, machine learning is also referred to as predictive analytics.",
                            "id": "5803328596782921368",
                            "name": "Machine learning",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Machine_learning",
                            "wikipedia": "http://en.wikipedia.org/wiki/Machine_learning"
                        },
                        "CONTAINS",
                        {
                            "name": "slide_2",
                            "type": "Slide"
                        },
                        "CONTAINS",
                        {
                            "abstract": "Cluster analysis or clustering is the task of grouping a set of objects in such a way that objects in the same group (called a cluster) are more similar (in some sense) to each other than to those in other groups (clusters). It is a main task of exploratory data analysis, and a common technique for statistical data analysis, used in many fields, including pattern recognition, image analysis, information retrieval, bioinformatics, data compression, computer graphics and machine learning. Cluster analysis itself is not one specific algorithm, but the general task to be solved. It can be achieved by various algorithms that differ significantly in their understanding of what constitutes a cluster and how to efficiently find them. Popular notions of clusters include groups with small distances between cluster members, dense areas of the data space, intervals or particular statistical distributions. Clustering can therefore be formulated as a multi-objective optimization problem. The appropriate clustering algorithm and parameter settings (including parameters such as the distance function to use, a density threshold or the number of expected clusters) depend on the individual data set and intended use of the results. Cluster analysis as such is not an automatic task, but an iterative process of knowledge discovery or interactive multi-objective optimization that involves trial and failure. It is often necessary to modify data preprocessing and model parameters until the result achieves the desired properties. Besides the term clustering, there is a number of terms with similar meanings, including automatic classification, numerical taxonomy, botryology (from Greek βότρυς \"grape\"), typological analysis, and community detection. The subtle differences are often in the use of the results: while in data mining, the resulting groups are the matter of interest, in automatic classification the resulting discriminative power is of interest. Cluster analysis was originated in anthropology by Driver and Kroeber in 1932 and introduced to psychology by Joseph Zubin in 1938 and Robert Tryon in 1939 and famously used by Cattell beginning in 1943 for trait theory classification in personality psychology.",
                            "id": "247708307003061874",
                            "name": "Cluster analysis",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Cluster_analysis",
                            "wikipedia": "http://en.wikipedia.org/wiki/Cluster_analysis"
                        }
                    ],
                    [
                        {
                            "name": "test",
                            "type": "user"
                        },
                        "dnu",
                        {
                            "abstract": "Data mining is the process of extracting and discovering patterns in large data sets involving methods at the intersection of machine learning, statistics, and database systems. Data mining is an interdisciplinary subfield of computer science and statistics with an overall goal of extracting information (with intelligent methods) from a data set and transforming the information into a comprehensible structure for further use. Data mining is the analysis step of the \"knowledge discovery in databases\" process, or KDD. Aside from the raw analysis step, it also involves database and data management aspects, data pre-processing, model and inference considerations, interestingness metrics, complexity considerations, post-processing of discovered structures, visualization, and online updating. The term \"data mining\" is a misnomer because the goal is the extraction of patterns and knowledge from large amounts of data, not the extraction (mining) of data itself. It also is a buzzword and is frequently applied to any form of large-scale data or information processing (collection, extraction, warehousing, analysis, and statistics) as well as any application of computer decision support system, including artificial intelligence (e.g., machine learning) and business intelligence. The book Data mining: Practical machine learning tools and techniques with Java (which covers mostly machine learning material) was originally to be named Practical machine learning, and the term data mining was only added for marketing reasons. Often the more general terms (large scale) data analysis and analytics—or, when referring to actual methods, artificial intelligence and machine learning—are more appropriate. The actual data mining task is the semi-automatic or automatic analysis of large quantities of data to extract previously unknown, interesting patterns such as groups of data records (cluster analysis), unusual records (anomaly detection), and dependencies (association rule mining, sequential pattern mining). This usually involves using database techniques such as spatial indices. These patterns can then be seen as a kind of summary of the input data, and may be used in further analysis or, for example, in machine learning and predictive analytics. For example, the data mining step might identify multiple groups in the data, which can then be used to obtain more accurate prediction results by a decision support system. Neither the data collection, data preparation, nor result interpretation and reporting is part of the data mining step, although they do belong to the overall KDD process as additional steps. The difference between data analysis and data mining is that data analysis is used to test models and hypotheses on the dataset, e.g., analyzing the effectiveness of a marketing campaign, regardless of the amount of data. In contrast, data mining uses machine learning and statistical models to uncover clandestine or hidden patterns in a large volume of data. The related terms data dredging, data fishing, and data snooping refer to the use of data mining methods to sample parts of a larger population data set that are (or may be) too small for reliable statistical inferences to be made about the validity of any patterns discovered. These methods can, however, be used in creating new hypotheses to test against the larger data populations.",
                            "id": "8975906538566188683",
                            "name": "Data mining",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Data_mining",
                            "wikipedia": "http://en.wikipedia.org/wiki/Data_mining"
                        },
                        "CONTAINS",
                        {
                            "name": "slide_2",
                            "type": "Slide"
                        },
                        "CONTAINS",
                        {
                            "abstract": "Cluster analysis or clustering is the task of grouping a set of objects in such a way that objects in the same group (called a cluster) are more similar (in some sense) to each other than to those in other groups (clusters). It is a main task of exploratory data analysis, and a common technique for statistical data analysis, used in many fields, including pattern recognition, image analysis, information retrieval, bioinformatics, data compression, computer graphics and machine learning. Cluster analysis itself is not one specific algorithm, but the general task to be solved. It can be achieved by various algorithms that differ significantly in their understanding of what constitutes a cluster and how to efficiently find them. Popular notions of clusters include groups with small distances between cluster members, dense areas of the data space, intervals or particular statistical distributions. Clustering can therefore be formulated as a multi-objective optimization problem. The appropriate clustering algorithm and parameter settings (including parameters such as the distance function to use, a density threshold or the number of expected clusters) depend on the individual data set and intended use of the results. Cluster analysis as such is not an automatic task, but an iterative process of knowledge discovery or interactive multi-objective optimization that involves trial and failure. It is often necessary to modify data preprocessing and model parameters until the result achieves the desired properties. Besides the term clustering, there is a number of terms with similar meanings, including automatic classification, numerical taxonomy, botryology (from Greek βότρυς \"grape\"), typological analysis, and community detection. The subtle differences are often in the use of the results: while in data mining, the resulting groups are the matter of interest, in automatic classification the resulting discriminative power is of interest. Cluster analysis was originated in anthropology by Driver and Kroeber in 1932 and introduced to psychology by Joseph Zubin in 1938 and Robert Tryon in 1939 and famously used by Cattell beginning in 1943 for trait theory classification in personality psychology.",
                            "id": "247708307003061874",
                            "name": "Cluster analysis",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Cluster_analysis",
                            "wikipedia": "http://en.wikipedia.org/wiki/Cluster_analysis"
                        }
                    ]
                ],
                "score": 0.9709386774814065,
                "type": "annotation",
                "uri": "http://dbpedia.org/resource/Cluster_analysis",
                "wikipedia": "http://en.wikipedia.org/wiki/Cluster_analysis"
            }
        },
        {
            "data": {
                "Reason": [
                    {
                        "dnu": [
                            "Learning analytics",
                            "Algorithm",
                            "Machine learning",
                            "Data mining"
                        ]
                    },
                    {
                        "dnu": [
                            "Learning analytics",
                            "Algorithm",
                            "Machine learning",
                            "Data mining"
                        ],
                        "name": "slide_8",
                        "type": "Slide"
                    }
                ],
                "abstract": "A priori (\"from the earlier\") and a posteriori (\"from the later\") are Latin phrases used in philosophy to distinguish types of knowledge, justification, or argument by their reliance on empirical evidence or experience. A priori knowledge is independent from current experience (e.g., as part of a new study). Examples include mathematics, tautologies, and deduction from pure reason. A posteriori knowledge depends on empirical evidence. Examples include most fields of science and aspects of personal knowledge. The terms originate from the analytic methods found in Organon, a collection of works by Aristotle. Prior analytics (a priori) is about deductive logic, which comes from definitions and first principles. Posterior analytics (a posteriori) is about inductive logic, which comes from observational evidence. Both terms appear in Euclid's Elements and were popularized by Immanuel Kant's Critique of Pure Reason, an influential work in the history of philosophy. Both terms are primarily used as modifiers to the noun \"knowledge\" (i.e. \"a priori knowledge\"). A priori can be used to modify other nouns such as \"truth\". Philosophers may use apriority, apriorist, and aprioricity as nouns referring to the quality of being a priori.",
                "id": "5456343436534005148",
                "name": "A priori and a posteriori",
                "roads": [
                    [
                        {
                            "name": "test",
                            "type": "user"
                        },
                        "dnu",
                        {
                            "abstract": "Learning analytics is the measurement, collection, analysis and reporting of data about learners and their contexts, for purposes of understanding and optimizing learning and the environments in which it occurs.The growth of online learning since the 1990s, particularly in higher education, has contributed to the advancement of Learning Analytics as student data can be captured and made available for analysis. When learners use an LMS, social media, or similar online tools, their clicks, navigation patterns, time on task, social networks, information flow, and concept development through discussions can be tracked. The rapid development of massive open online courses (MOOCs) offers additional data for researchers to evaluate teaching and learning in online environments.",
                            "id": "8054968523653998513",
                            "name": "Learning analytics",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Learning_analytics",
                            "wikipedia": "http://en.wikipedia.org/wiki/Learning_analytics"
                        },
                        "CONTAINS",
                        {
                            "name": "slide_8",
                            "type": "Slide"
                        },
                        "CONTAINS",
                        {
                            "abstract": "A priori (\"from the earlier\") and a posteriori (\"from the later\") are Latin phrases used in philosophy to distinguish types of knowledge, justification, or argument by their reliance on empirical evidence or experience. A priori knowledge is independent from current experience (e.g., as part of a new study). Examples include mathematics, tautologies, and deduction from pure reason. A posteriori knowledge depends on empirical evidence. Examples include most fields of science and aspects of personal knowledge. The terms originate from the analytic methods found in Organon, a collection of works by Aristotle. Prior analytics (a priori) is about deductive logic, which comes from definitions and first principles. Posterior analytics (a posteriori) is about inductive logic, which comes from observational evidence. Both terms appear in Euclid's Elements and were popularized by Immanuel Kant's Critique of Pure Reason, an influential work in the history of philosophy. Both terms are primarily used as modifiers to the noun \"knowledge\" (i.e. \"a priori knowledge\"). A priori can be used to modify other nouns such as \"truth\". Philosophers may use apriority, apriorist, and aprioricity as nouns referring to the quality of being a priori.",
                            "id": "5456343436534005148",
                            "name": "A priori and a posteriori",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/A_priori_and_a_posteriori",
                            "wikipedia": "http://en.wikipedia.org/wiki/A_priori_and_a_posteriori"
                        }
                    ],
                    [
                        {
                            "name": "test",
                            "type": "user"
                        },
                        "dnu",
                        {
                            "abstract": "In mathematics and computer science, an algorithm (/ˈælɡərɪðəm/) is a finite sequence of rigorous instructions, typically used to solve a class of specific problems or to perform a computation. Algorithms are used as specifications for performing calculations and data processing. More advanced algorithms can perform automated deductions (referred to as automated reasoning) and use mathematical and logical tests to divert the code execution through various routes (referred to as automated decision-making). Using human characteristics as descriptors of machines in metaphorical ways was already practiced by Alan Turing with terms such as \"memory\", \"search\" and \"stimulus\". In contrast, a heuristic is an approach to problem solving that may not be fully specified or may not guarantee correct or optimal results, especially in problem domains where there is no well-defined correct or optimal result. As an effective method, an algorithm can be expressed within a finite amount of space and time, and in a well-defined formal language for calculating a function. Starting from an initial state and initial input (perhaps empty), the instructions describe a computation that, when executed, proceeds through a finite number of well-defined successive states, eventually producing \"output\" and terminating at a final ending state. The transition from one state to the next is not necessarily deterministic; some algorithms, known as randomized algorithms, incorporate random input.",
                            "id": "3005927017443355360",
                            "name": "Algorithm",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Algorithm",
                            "wikipedia": "http://en.wikipedia.org/wiki/Algorithm"
                        },
                        "CONTAINS",
                        {
                            "name": "slide_8",
                            "type": "Slide"
                        },
                        "CONTAINS",
                        {
                            "abstract": "A priori (\"from the earlier\") and a posteriori (\"from the later\") are Latin phrases used in philosophy to distinguish types of knowledge, justification, or argument by their reliance on empirical evidence or experience. A priori knowledge is independent from current experience (e.g., as part of a new study). Examples include mathematics, tautologies, and deduction from pure reason. A posteriori knowledge depends on empirical evidence. Examples include most fields of science and aspects of personal knowledge. The terms originate from the analytic methods found in Organon, a collection of works by Aristotle. Prior analytics (a priori) is about deductive logic, which comes from definitions and first principles. Posterior analytics (a posteriori) is about inductive logic, which comes from observational evidence. Both terms appear in Euclid's Elements and were popularized by Immanuel Kant's Critique of Pure Reason, an influential work in the history of philosophy. Both terms are primarily used as modifiers to the noun \"knowledge\" (i.e. \"a priori knowledge\"). A priori can be used to modify other nouns such as \"truth\". Philosophers may use apriority, apriorist, and aprioricity as nouns referring to the quality of being a priori.",
                            "id": "5456343436534005148",
                            "name": "A priori and a posteriori",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/A_priori_and_a_posteriori",
                            "wikipedia": "http://en.wikipedia.org/wiki/A_priori_and_a_posteriori"
                        }
                    ],
                    [
                        {
                            "name": "test",
                            "type": "user"
                        },
                        "dnu",
                        {
                            "abstract": "Machine learning (ML) is a field of inquiry devoted to understanding and building methods that 'learn', that is, methods that leverage data to improve performance on some set of tasks. It is seen as a part of artificial intelligence. Machine learning algorithms build a model based on sample data, known as training data, in order to make predictions or decisions without being explicitly programmed to do so. Machine learning algorithms are used in a wide variety of applications, such as in medicine, email filtering, speech recognition, agriculture, and computer vision, where it is difficult or unfeasible to develop conventional algorithms to perform the needed tasks. A subset of machine learning is closely related to computational statistics, which focuses on making predictions using computers, but not all machine learning is statistical learning. The study of mathematical optimization delivers methods, theory and application domains to the field of machine learning. Data mining is a related field of study, focusing on exploratory data analysis through unsupervised learning. Some implementations of machine learning use data and neural networks in a way that mimics the working of a biological brain. In its application across business problems, machine learning is also referred to as predictive analytics.",
                            "id": "5803328596782921368",
                            "name": "Machine learning",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Machine_learning",
                            "wikipedia": "http://en.wikipedia.org/wiki/Machine_learning"
                        },
                        "CONTAINS",
                        {
                            "name": "slide_8",
                            "type": "Slide"
                        },
                        "CONTAINS",
                        {
                            "abstract": "A priori (\"from the earlier\") and a posteriori (\"from the later\") are Latin phrases used in philosophy to distinguish types of knowledge, justification, or argument by their reliance on empirical evidence or experience. A priori knowledge is independent from current experience (e.g., as part of a new study). Examples include mathematics, tautologies, and deduction from pure reason. A posteriori knowledge depends on empirical evidence. Examples include most fields of science and aspects of personal knowledge. The terms originate from the analytic methods found in Organon, a collection of works by Aristotle. Prior analytics (a priori) is about deductive logic, which comes from definitions and first principles. Posterior analytics (a posteriori) is about inductive logic, which comes from observational evidence. Both terms appear in Euclid's Elements and were popularized by Immanuel Kant's Critique of Pure Reason, an influential work in the history of philosophy. Both terms are primarily used as modifiers to the noun \"knowledge\" (i.e. \"a priori knowledge\"). A priori can be used to modify other nouns such as \"truth\". Philosophers may use apriority, apriorist, and aprioricity as nouns referring to the quality of being a priori.",
                            "id": "5456343436534005148",
                            "name": "A priori and a posteriori",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/A_priori_and_a_posteriori",
                            "wikipedia": "http://en.wikipedia.org/wiki/A_priori_and_a_posteriori"
                        }
                    ],
                    [
                        {
                            "name": "test",
                            "type": "user"
                        },
                        "dnu",
                        {
                            "abstract": "Data mining is the process of extracting and discovering patterns in large data sets involving methods at the intersection of machine learning, statistics, and database systems. Data mining is an interdisciplinary subfield of computer science and statistics with an overall goal of extracting information (with intelligent methods) from a data set and transforming the information into a comprehensible structure for further use. Data mining is the analysis step of the \"knowledge discovery in databases\" process, or KDD. Aside from the raw analysis step, it also involves database and data management aspects, data pre-processing, model and inference considerations, interestingness metrics, complexity considerations, post-processing of discovered structures, visualization, and online updating. The term \"data mining\" is a misnomer because the goal is the extraction of patterns and knowledge from large amounts of data, not the extraction (mining) of data itself. It also is a buzzword and is frequently applied to any form of large-scale data or information processing (collection, extraction, warehousing, analysis, and statistics) as well as any application of computer decision support system, including artificial intelligence (e.g., machine learning) and business intelligence. The book Data mining: Practical machine learning tools and techniques with Java (which covers mostly machine learning material) was originally to be named Practical machine learning, and the term data mining was only added for marketing reasons. Often the more general terms (large scale) data analysis and analytics—or, when referring to actual methods, artificial intelligence and machine learning—are more appropriate. The actual data mining task is the semi-automatic or automatic analysis of large quantities of data to extract previously unknown, interesting patterns such as groups of data records (cluster analysis), unusual records (anomaly detection), and dependencies (association rule mining, sequential pattern mining). This usually involves using database techniques such as spatial indices. These patterns can then be seen as a kind of summary of the input data, and may be used in further analysis or, for example, in machine learning and predictive analytics. For example, the data mining step might identify multiple groups in the data, which can then be used to obtain more accurate prediction results by a decision support system. Neither the data collection, data preparation, nor result interpretation and reporting is part of the data mining step, although they do belong to the overall KDD process as additional steps. The difference between data analysis and data mining is that data analysis is used to test models and hypotheses on the dataset, e.g., analyzing the effectiveness of a marketing campaign, regardless of the amount of data. In contrast, data mining uses machine learning and statistical models to uncover clandestine or hidden patterns in a large volume of data. The related terms data dredging, data fishing, and data snooping refer to the use of data mining methods to sample parts of a larger population data set that are (or may be) too small for reliable statistical inferences to be made about the validity of any patterns discovered. These methods can, however, be used in creating new hypotheses to test against the larger data populations.",
                            "id": "8975906538566188683",
                            "name": "Data mining",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/Data_mining",
                            "wikipedia": "http://en.wikipedia.org/wiki/Data_mining"
                        },
                        "CONTAINS",
                        {
                            "name": "slide_8",
                            "type": "Slide"
                        },
                        "CONTAINS",
                        {
                            "abstract": "A priori (\"from the earlier\") and a posteriori (\"from the later\") are Latin phrases used in philosophy to distinguish types of knowledge, justification, or argument by their reliance on empirical evidence or experience. A priori knowledge is independent from current experience (e.g., as part of a new study). Examples include mathematics, tautologies, and deduction from pure reason. A posteriori knowledge depends on empirical evidence. Examples include most fields of science and aspects of personal knowledge. The terms originate from the analytic methods found in Organon, a collection of works by Aristotle. Prior analytics (a priori) is about deductive logic, which comes from definitions and first principles. Posterior analytics (a posteriori) is about inductive logic, which comes from observational evidence. Both terms appear in Euclid's Elements and were popularized by Immanuel Kant's Critique of Pure Reason, an influential work in the history of philosophy. Both terms are primarily used as modifiers to the noun \"knowledge\" (i.e. \"a priori knowledge\"). A priori can be used to modify other nouns such as \"truth\". Philosophers may use apriority, apriorist, and aprioricity as nouns referring to the quality of being a priori.",
                            "id": "5456343436534005148",
                            "name": "A priori and a posteriori",
                            "type": "annotation",
                            "uri": "http://dbpedia.org/resource/A_priori_and_a_posteriori",
                            "wikipedia": "http://en.wikipedia.org/wiki/A_priori_and_a_posteriori"
                        }
                    ]
                ],
                "score": 0.9708400746657513,
                "type": "annotation",
                "uri": "http://dbpedia.org/resource/A_priori_and_a_posteriori",
                "wikipedia": "http://en.wikipedia.org/wiki/A_priori_and_a_posteriori"
            }
        }
    ]
}


def cro_get_resources_pagination():
    return {
    "concepts": [
        {
            "cid": "5653580029100052527",
            "id": 6,
            "name": "Data mining",
            "weight": 0.81
        },
        {
            "cid": "7763501701694587840",
            "id": 3,
            "name": "Learning analytics",
            "weight": 0.79
        },
        {
            "cid": "7001703143521206045",
            "id": 8,
            "name": "Correlation and dependence",
            "weight": 0.78
        },
        {
            "cid": "1209742421036043811",
            "id": 61,
            "name": "Pattern recognition",
            "weight": 0.77
        },
        {
            "cid": "739049491223862103",
            "id": 62,
            "name": "Algorithm",
            "weight": 0.74
        }
    ],
    "edges": [],
    "nodes": {'videos': {'current_page': 1,
  'total_pages': 2,
  'total_items': 15,
  'content': [{'description': 'Abroad Education Channel : https://www.youtube.com/channel/UC9sgREj-cfZipx65BLiHGmw Company Specific HR Mock ...',
    'description_full': 'Abroad Education Channel :\nhttps://www.youtube.com/channel/UC9sgREj-cfZipx65BLiHGmw\n\nCompany Specific HR Mock Interview : \nA seasoned professional with over 18 years of experience with Product, IT Services and Agri industry of valuable experience in Human Resource Management, Extensive Experience in Talent Acquisition, Personnel Management, Compensation and Benefits, Performance Reviews, Training & Development and all facets of Human Resources will be performing mock HR Interviews and provides feedback on the session and guides with interview techniques.\n\ncontact me on gmail at : shraavyareddy810@gmail.com\n\nfollow me on instagram at : https://www.instagram.com/shraavya_katkuri/\n\nPlacement playlist: https://www.youtube.com/channel/UCHNO_Y3DskuKiw9VTvo8AMw\n\npaper presentation for semester exams :\nhttps://youtu.be/utSVdagxc7I',
    'duration': '8:34',
    'helpful_counter': 0,
    'id': 'Dy9urawfXos',
    'keyphrases': ['pearson&#39;s correlation coefficient |dm|.',
     'https://www.youtube.com/channel/uc9sgrej-cfzipx65blihgmw company specific',
     'education channel',
     'correlation analysis',
     'mock'],
    'labels': ['Resource', 'Video'],
    'not_helpful_counter': 0,
    'publish_time': '2022-02-08T13:37:22Z',
    'similarity_score': '0.90',
    'thumbnail': 'https://i.ytimg.com/vi/Dy9urawfXos/hqdefault.jpg',
    'title': '#13 Correlation Analysis - Pearson&#39;s Correlation Coefficient |DM|',
    'uri': 'https://www.youtube.com/embed/Dy9urawfXos?autoplay=1',
    'views': '63252'},
   {'description': "Here, I've explained Decision Trees in great detail. You'll also learn the math behind splitting the nodes. The next video will show ...",
    'description_full': "Here, I've explained Decision Trees in great detail. You'll also learn the math behind splitting the nodes. The next video will show you how to code a decision tree classifier from scratch.\n#machinelearning #datascience\n\nFor more videos please subscribe - \nhttp://bit.ly/normalizedNERD \n\nJoin our discord - \nhttps://discord.gg/39YYU936RC\n\nFacebook - \nhttps://www.facebook.com/nerdywits/\nInstagram - \nhttps://www.instagram.com/normalizednerd/\nTwitter - \nhttps://twitter.com/normalized_nerd",
    'duration': '10:33',
    'helpful_counter': 0,
    'id': 'ZVR2Way4nwQ',
    'keyphrases': [],
    'labels': ['Resource', 'Video'],
    'not_helpful_counter': 0,
    'publish_time': '2021-01-13T13:14:16Z',
    'similarity_score': '0.87',
    'thumbnail': 'https://i.ytimg.com/vi/ZVR2Way4nwQ/hqdefault.jpg',
    'title': 'Decision Tree Classification Clearly Explained!',
    'uri': 'https://www.youtube.com/embed/ZVR2Way4nwQ?autoplay=1',
    'views': '488992'},
   {'description': 'Myself Shridhar Mankar an Engineer l YouTuber l Educational Blogger l Educator l Podcaster. My Aim- To Make Engineering ...',
    'description_full': 'Myself Shridhar Mankar an Engineer l YouTuber l Educational Blogger l Educator l Podcaster. \nMy Aim- To Make Engineering Students Life EASY.\n\nWebsite\xa0\xa0 - https://5minutesengineering.com \n\n5 Minutes Engineering English YouTube Channel -\xa0 https://m.youtube.com/channel/UChTsiSbpTuSrdOHpXkKlq6Q\n\nInstagram -\xa0 https://www.instagram.com/5minutesengineering/?hl=en\n\nA small donation would mean the world to me and will help me to make AWESOME videos for you.\n• UPI ID : 5minutesengineering@apl\n\nPlaylists :\n\n• 5 Minutes Engineering Podcast :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcCTAu8NRuCaD3aTEgHLeF0X\n\n• Aptitude :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcBpa1jwpCbEDespCRF3UPE5\n\n• Machine Learning :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcBhOEPwf5cFwqo5B-cP9G4P\n\n• Computer Graphics :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcAtxMe7ahYC4ZYjQHun_b-T\n\n• C Language Tutorial for Beginners :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcBqvw6QTRsA8gvZL3ao2ON-\n\n• R Tutorial for Beginners :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcCRFzBkZ-b92Hdg-qCUfx48\n\n• Python Tutorial for Beginners :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcCJu4i6UGMkMx1p3yYZJsbC\n\n• Embedded and Real Time Operating Systems (ERTOS) :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcBpuYagx0JiSaM-Bi4dm0hG\n\n• Shridhar Live Talks :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcD21x33RkmGvcZtrnWlTDdI\n\n• Welcome to 5 Minutes Engineering :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcCwG02L6fm0G5zmzpyw3eyc \n\n• Human Computer Interaction (HCI) :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcDz_8-pygbcNvNF0DEwKoIL\n\n• Computer Organization and Architecture :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcCaiXeUEjcTzHwIfJqH1qCN\n\n• Deep Learning :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcD-6P8cuX2bZAHSThF6AYvq\n\n• Genetic Algorithm :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcDHUTN26NXKfjg6wFJKDO9R\n\n• Cloud Computing :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcCyQH0n9GHfwviu6KeJ46BV\n\n• Information and Cyber Security :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcArHtWmbs_vXX6soTK3WEJw\n\n• Soft Computing and Optimization Algorithms :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcCPUl8mAnb4g1oExKd0n4Gw\n\n• Compiler Design :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcC6FupM--SachxUTOiQ7XHw\n\n• Operating System :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcD0LLrv7CXxSiO2gNJsoxpi\n\n• Hadoop :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcAhiP6C1qVorA7HZRejRE6M\n\n• CUDA :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcB73J5yO6uSFUycHJSA45O0\n\n• Discrete Mathematics :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcDKuvj-wIgDnHA5JTfUwrHv\n\n• Theory of Computation (TOC) :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcDXLUrW3JEq2cv8efNF6UeQ\n\n• Data Analytics :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcD_agAK_MpCDJdDXFuJqS9X\n\n• Software Modeling and Design :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcD1pjNSpEm2pje3zPrSiflZ\n\n• Internet Of Things (IOT) :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcB8fDd64B8SkJiPpEIzpCzC\n\n• Database Management Systems (DBMS) :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcBU4HS74xGTK1cAFbY0rdVY \n\n• Computer Network (CN) :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcAXkWn2IR-l_WXOrr0n851a\n\n• Software Engineering and Project Management :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcCB7zUM0YSDR-1mM4KoiyLM\n\n• Design and Analysis of Algorithm :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcBOrMihdkd48kgs6_YP8taa\n\n• Data Mining and Warehouse :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcChP0xiW3KK9elNuhfCLVVi\n\n• Mobile Communication :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcAjqrKO-b9UMa2AaAlzZY7D\n\n• High Performance Computing :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcA1eJbqwvjKgsnT321hXRGx\n\n• Artificial Intelligence and Robotics :\n\xa0 https://youtube.com/playlist?list=PLYwpaL_SFmcBmfMtX5wRMAtqna7pY-YtG',
    'duration': '5:15',
    'helpful_counter': 0,
    'id': 'QOGhtUGqP94',
    'keyphrases': [],
    'labels': ['Resource', 'Video'],
    'not_helpful_counter': 0,
    'publish_time': '2023-01-15T12:30:10Z',
    'similarity_score': '0.84',
    'thumbnail': 'https://i.ytimg.com/vi/QOGhtUGqP94/hqdefault.jpg',
    'title': 'Correlation Explained in Hindi',
    'uri': 'https://www.youtube.com/embed/QOGhtUGqP94?autoplay=1',
    'views': '30415'},
   {'description': 'Subject - Data Mining and Business Intelligence Video Name - From Association Mining to Correlation Analysis, Pattern ...',
    'description_full': 'Subject - Data Mining and Business Intelligence\n\nVideo Name - From Association Mining to Correlation Analysis, Pattern Evaluation Measures\n\nChapter - Frequent Pattern Mining\n\nFaculty - Prof. Apoorva Wani\n\nUpskill and get Placements with Ekeeda Career Tracks\nData Science - https://ekeeda.com/career-track/data-scientist\nSoftware Development Engineer - https://ekeeda.com/career-track/software-development-engineer\nEmbedded & IoT Engineer - https://ekeeda.com/career-track/embedded-and-iot-engineer\n\nGet FREE Trial for GATE 2023 Exam with Ekeeda GATE - 20000+ Lectures & Notes, strategy, updates, and notifications which will help you to crack your GATE exam.\nhttps://ekeeda.com/catalog/competitive-exam\nCoupon Code - EKGATE\n\nGet Free Notes of All Engineering Subjects & Technology\nhttps://ekeeda.com/digital-library\n\nAccess the Complete Playlist of Subject Data Mining and Business Intelligence - https://www.youtube.com/playlist?list=PLm_MSClsnwm8czfGtiBvDJkHXwixcq-ck\n\nSocial Links:\nhttps://www.instagram.com/ekeeda_official/\nhttps://in.linkedin.com/company/ekeeda.com\n\nHappy Learning!\n\n#fromassociationminingtocorrelationanalysispatternevaluationmeasures\n#frequentpatternmining\n#dataminingandbusinessintelligence',
    'duration': '12:3',
    'helpful_counter': 0,
    'id': 'dlUc8PA7Gag',
    'keyphrases': ['pattern evaluation measures- frequent pattern mining',
     'association mining',
     'data mining',
     'business intelligence video name',
     'correlation analysis',
     'pattern',
     'subject'],
    'labels': ['Resource', 'Video'],
    'not_helpful_counter': 0,
    'publish_time': '2022-04-08T05:29:16Z',
    'similarity_score': '0.92',
    'thumbnail': 'https://i.ytimg.com/vi/dlUc8PA7Gag/hqdefault.jpg',
    'title': 'From Association Mining to Correlation Analysis,Pattern Evaluation Measures- Frequent Pattern Mining',
    'uri': 'https://www.youtube.com/embed/dlUc8PA7Gag?autoplay=1',
    'views': '2580'},
   {'description': '',
    'description_full': '',
    'duration': '5:31',
    'helpful_counter': 0,
    'id': 'khZCmz3oLuI',
    'keyphrases': ['data mining',
     'pattern discovery',
     'interestingness',
     'lift',
     'χ2'],
    'labels': ['Resource', 'Video'],
    'not_helpful_counter': 0,
    'publish_time': '2016-09-01T13:25:07Z',
    'similarity_score': '0.91',
    'thumbnail': 'https://i.ytimg.com/vi/khZCmz3oLuI/hqdefault.jpg',
    'title': 'DATA MINING   4 Pattern Discovery in Data Mining   3 2  Interestingness Measures   Lift and χ2',
    'uri': 'https://www.youtube.com/embed/khZCmz3oLuI?autoplay=1',
    'views': '17241'},
   {'description': 'Data Science Course for 3-8 Yrs Work Exp: https://l.linklyhq.com/l/1tx7P Data Science Course for 0-3 Yrs Work Exp: ...',
    'description_full': "🔥Data Science Course for 3-8 Yrs Work Exp: https://l.linklyhq.com/l/1tx7P\n🔥Data Science Course for 0-3 Yrs Work Exp: https://l.linklyhq.com/l/1ugC3\n🔥Data Science Course for 8+ Yrs Work Exp: https://l.linklyhq.com/l/1tx7Q\n\nIn this statistics video, you will learn what correlation is. We will discuss types of correlation, some limitations, and the real-life applications of a correlation. In the end, you will also work on an example to calculate the correlations using excel.\n\n✅Subscribe to our Channel to learn more about the top Technologies: https://bit.ly/2VT4WtH\n\n⏩ Check out the Data Science tutorial videos: https://www.youtube.com/watch?v=X3paOmcrTjQ&list=PLEiEAq2VkUUIEQ7ENKU5Gv0HpRDtOphC6\n\n#WhatIsCorrelation #TypesOfCorrelation #CorrelationCoefficient #PositiveCorrelation #NegativeCorrelation #CorrelationAndRegression #Statistics #LearnStatistics #Simplilearn\n\nWhat is Correlation?\nCorrelation is a statistic that measures the degree to which two variables move in relation to each other. It measures association, but doesn't show if x causes y or vice versa—or if the association is caused by a third factor.\n\n🔥Free Data Science Course with Completion Certificate: https://www.simplilearn.com/data-science-free-course-for-beginners-skillup?utm_campaign=WhatIsCorrelation&utm_medium=Description&utm_source=youtube\n\n➡️ About Caltech Post Graduate Program In Data Science\nThis Post Graduation in Data Science leverages the superiority of Caltech's academic eminence. The Data Science program covers critical Data Science topics like Python programming, R programming, Machine Learning, Deep Learning, and Data Visualization tools through an interactive learning model with live sessions by global practitioners and practical labs.\n\n✅ Key Features\n- Simplilearn's JobAssist helps you get noticed by top hiring companies\n- Caltech PG program in Data Science completion certificate\n- Earn up to 14 CEUs from Caltech CTME\n- Masterclasses delivered by distinguished Caltech faculty and IBM experts\n- Caltech CTME Circle membership\n- Online convocation by Caltech CTME Program Director\n- IBM certificates for IBM courses\n- Access to hackathons and Ask Me Anything sessions from IBM\n- 25+ hands-on projects from the likes of Amazon, Walmart, Uber, and many more\n- Seamless access to integrated labs\n- Capstone projects in 3 domains\n- Simplilearn’s Career Assistance to help you get noticed by top hiring companies\n- 8X higher interaction in live online classes by industry experts\n\n✅ Skills Covered\n- Exploratory Data Analysis\n- Descriptive Statistics\n- Inferential Statistics\n- Model Building and Fine Tuning\n- Supervised and Unsupervised Learning\n- Ensemble Learning\n- Deep Learning\n- Data Visualization\n\n👉 Learn More At: https://www.simplilearn.com/post-graduate-program-data-science?utm_campaign=WhatIsCorrelation-PEfQCv9nvSo&utm_medium=Description&utm_source=youtube \n🔥 Data Science Bootcamp (US Only): https://www.simplilearn.com/data-science-bootcamp\n?utm_campaign=WhatIsCorrelation-PEfQCv9nvSo&utm_medium=Description&utm_source=youtube \n\n🔥🔥 Interested in Attending Live Classes? Call Us: IN - 18002127688 / US - +18445327688",
    'duration': '4:33',
    'helpful_counter': 0,
    'id': 'PEfQCv9nvSo',
    'keyphrases': ['https://l.linklyhq.com/l/1tx7p data science course',
     'data science course',
     'yrs work exp',
     'correlation coefficient',
     'correlation',
     'simplilearn',
     'statistics',
     'types'],
    'labels': ['Resource', 'Video'],
    'not_helpful_counter': 0,
    'publish_time': '2022-01-22T06:30:08Z',
    'similarity_score': '0.91',
    'thumbnail': 'https://i.ytimg.com/vi/PEfQCv9nvSo/hqdefault.jpg',
    'title': 'What Is Correlation? | Types of Correlation | Correlation Coefficient | Statistics | Simplilearn',
    'uri': 'https://www.youtube.com/embed/PEfQCv9nvSo?autoplay=1',
    'views': '60374'},
   {'description': 'Linear Regression Algorithm – Solved Numerical Example in Machine Learning by Mahesh Huddar The following concepts are ...',
    'description_full': "Linear Regression Algorithm – Solved Numerical Example in Machine Learning by Mahesh Huddar\n\nThe following concepts are discussed:\n______________________________\nregression equation, \nregression analysis introduction,\nregression analysis, \nlinear regression solved example,\nlinear regression example,\n regression solved example,\nregression numerical example,\nregression numerical methods,\n\n\n********************************\n\n1. Blog / Website: https://www.vtupulse.com/\n2. Like Facebook Page: https://www.facebook.com/VTUPulse\n3. Follow us on Instagram: https://www.instagram.com/vtupulse/\n4. Like, Share, Subscribe, and Don't forget to press the bell ICON for regular updates",
    'duration': '5:30',
    'helpful_counter': 0,
    'id': 'QcPycBZomac',
    'keyphrases': ['linear regression algorithm –',
     'machine learning',
     'numerical example',
     'mahesh huddar',
     'concepts'],
    'labels': ['Resource', 'Video'],
    'not_helpful_counter': 0,
    'publish_time': '2023-05-02T16:50:10Z',
    'similarity_score': '0.91',
    'thumbnail': 'https://i.ytimg.com/vi/QcPycBZomac/hqdefault.jpg',
    'title': 'Linear Regression Algorithm – Solved Numerical Example in Machine Learning by Mahesh Huddar',
    'uri': 'https://www.youtube.com/embed/QcPycBZomac?autoplay=1',
    'views': '76972'},
   {'description': 'In this video, we will explore the correlation among different columns of data using Pandas Corr() function. Exploring correlations ...',
    'description_full': 'In this video, we will explore the correlation among different columns of data using Pandas Corr() function.\n\nExploring correlations in data using python is very important task in Machine Learning feature engineering..',
    'duration': '2:18',
    'helpful_counter': 0,
    'id': '1jLngF4KSqE',
    'keyphrases': ['different columns',
     'pandas corr',
     'correlations',
     'data',
     'video',
     'function',
     'python'],
    'labels': ['Resource', 'Video'],
    'not_helpful_counter': 0,
    'publish_time': '2022-04-14T15:56:40Z',
    'similarity_score': '0.91',
    'thumbnail': 'https://i.ytimg.com/vi/1jLngF4KSqE/hqdefault.jpg',
    'title': 'Finding correlations in data using Python.',
    'uri': 'https://www.youtube.com/embed/1jLngF4KSqE?autoplay=1',
    'views': '12912'},
   {'description': 'This lecture provides the introductory concepts of Frequent pattern mining in transnational databases.',
    'description_full': 'This lecture provides the introductory concepts of Frequent pattern mining in transnational databases.',
    'duration': '19:31',
    'helpful_counter': 0,
    'id': 'QN3_wxqnSlw',
    'keyphrases': ['frequent pattern mining',
     'frequent patterns',
     'association rules',
     'association analysis',
     'introductory concepts',
     'transnational databases',
     'lecture',
     'confidence',
     'support'],
    'labels': ['Resource', 'Video'],
    'not_helpful_counter': 0,
    'publish_time': '2017-09-19T09:06:40Z',
    'similarity_score': '0.91',
    'thumbnail': 'https://i.ytimg.com/vi/QN3_wxqnSlw/hqdefault.jpg',
    'title': 'Association analysis: Frequent Patterns, Support, Confidence and Association Rules',
    'uri': 'https://www.youtube.com/embed/QN3_wxqnSlw?autoplay=1',
    'views': '161923'},
   {'description': 'Covariance is closely related to Correlation. But what it really says? This video explains covariance with visualizations.',
    'description_full': 'Covariance is closely related to Correlation. But what it really says? This video explains covariance with visualizations.\n#machinelearning #datascience\n\nLike my work? Support me -\nhttps://www.buymeacoffee.com/normalizednerd\n\nFor more videos please subscribe - \nhttp://bit.ly/normalizedNERD \n\nJoin our discord - \nhttps://discord.gg/39YYU936RC\n\nFacebook - \nhttps://www.facebook.com/nerdywits/\nInstagram - \nhttps://www.instagram.com/normalizednerd/\nTwitter - \nhttps://twitter.com/normalized_nerd',
    'duration': '7:47',
    'helpful_counter': 0,
    'id': 'TPcAnExkWwQ',
    'keyphrases': ['covariance',
     'correlation',
     'video',
     'related',
     'visualizations'],
    'labels': ['Resource', 'Video'],
    'not_helpful_counter': 0,
    'publish_time': '2021-06-03T14:30:07Z',
    'similarity_score': '0.89',
    'thumbnail': 'https://i.ytimg.com/vi/TPcAnExkWwQ/hqdefault.jpg',
    'title': 'Covariance Clearly Explained!',
    'uri': 'https://www.youtube.com/embed/TPcAnExkWwQ?autoplay=1',
    'views': '46243'},
   {'description': 'The similarity measure is the measure of how much alike two data objects are. #MachineLearning #SimilarityMeasure #Clustering ...',
    'description_full': 'The similarity measure is the measure of how much alike two data objects are.  #MachineLearning #SimilarityMeasure #Clustering\n\nMachine Learning 👉https://www.youtube.com/playlist?list=PLPN-43XehstOjGY6vM6nBpSggHoAv9hkR\n\nArtificial Intelligence 👉https://www.youtube.com/playlist?list=PLPN-43XehstNQttedytmmLPwzMCXahBRg\n\nCloud Computing 👉https://www.youtube.com/playlist?list=PLPN-43XehstNd5WsXQ9y3GFXyagkX1PC3\n\nWireless Technology 👉https://www.youtube.com/playlist?list=PLPN-43XehstMhFEXiOgJwv2Ec3vOTWpSH\n\nData Mining 👉https://www.youtube.com/playlist?list=PLPN-43XehstOe0CxcXaYeLTFpgD2IiluP\n\nSimulation Modeling 👉https://www.youtube.com/playlist?list=PLPN-43XehstPwUMDCs9zYQS-e5-0zjifX\n\nBig Data 👉https://www.youtube.com/playlist?list=PLPN-43XehstPr1D-t9X2klE--Uj4YSNwn\n\nBlockchain 👉https://www.youtube.com/playlist?list=PLPN-43XehstNgC2t_EScmj1GWv24ncugJ\n\nIOT 👉https://www.youtube.com/playlist?list=PLPN-43XehstOS_3mv9LgFWnVXQE-7PKbF\n\n\nFollow me on Instagram 👉 https://www.instagram.com/ngnieredteacher/\nVisit my Profile 👉 https://www.linkedin.com/in/reng99/\nSupport my work on Patreon 👉 https://www.patreon.com/ranjiraj',
    'duration': '10:19',
    'helpful_counter': 0,
    'id': 'a8riMSeBtwY',
    'keyphrases': ['similarity measures',
     'data objects',
     'measure',
     'much',
     'machinelearning',
     'machine',
     'clustering'],
    'labels': ['Resource', 'Video'],
    'not_helpful_counter': 0,
    'publish_time': '2019-10-02T16:00:22Z',
    'similarity_score': '0.89',
    'thumbnail': 'https://i.ytimg.com/vi/a8riMSeBtwY/hqdefault.jpg',
    'title': 'Machine Learning | Similarity Measures',
    'uri': 'https://www.youtube.com/embed/a8riMSeBtwY?autoplay=1',
    'views': '26844'},
   {'description': 'Linear Regression in 2 minutes. --------------- Credit: Manim and Python : https://github.com/3b1b/manim Blender3D: ...',
    'description_full': 'Linear Regression in 2 minutes.\n\n\n\n---------------\nCredit:\n🐍 Manim and Python : https://github.com/3b1b/manim\n🐵 Blender3D: https://www.blender.org/\n🗒️ Emacs: https://www.gnu.org/software/emacs/\nMusic/Sound: www.bensound.com\n\nThis video would not have been possible without the help of Gökçe Dayanıklı.',
    'duration': '2:34',
    'helpful_counter': 0,
    'id': 'CtsRRUddV2s',
    'keyphrases': ['linear regression',
     'minutes',
     'https://github.com/3b1b/manim blender3d',
     'credit',
     'manim',
     'python'],
    'labels': ['Resource', 'Video'],
    'not_helpful_counter': 0,
    'publish_time': '2021-11-28T07:49:01Z',
    'similarity_score': '0.90',
    'thumbnail': 'https://i.ytimg.com/vi/CtsRRUddV2s/hqdefault.jpg',
    'title': 'Linear Regression in 2 minutes',
    'uri': 'https://www.youtube.com/embed/CtsRRUddV2s?autoplay=1',
    'views': '106207'},
   {'description': 'With the help of correlation analysis, the linear relationship between variables can be examined. The strength of the correlation is ...',
    'description_full': 'With the help of correlation analysis, the linear relationship between variables can be examined. The strength of the correlation is determined by the correlation coefficient, which varies from -1 to +1. This means that correlation analyses can be used to make a statement about the strength and direction of the relationship between two variables.\n\nInterpret correlation\nPositive correlation\nA positive correlation exists when larger values of variable A are accompanied by larger values of variable B. Body size and shoe size, for example, correlate positively, resulting in a correlation coefficient that lies between 0 and 1, i.e. a positive value.\n\nNegative correlation\nA negative correlation exists when larger values of variable A are accompanied by smaller values of variable B. The product price and the sales volume usually have a negative correlation; the more expensive a product is, the lower the sales volume. In this case, the correlation coefficient lies between -1 and 0, i.e. it takes on a negative value.\n\nMore information on correlation analysis:\nhttps://datatab.net/tutorial/correlation\n\nAnd here is the online correlation calculator:\nhttps://datatab.net/statistics-calculator/correlation',
    'duration': '5:40',
    'helpful_counter': 0,
    'id': 'qo1FVrlvW1Y',
    'keyphrases': ['correlation analysis',
     'linear relationship',
     'correlation',
     'variables',
     'help',
     'strength'],
    'labels': ['Resource', 'Video'],
    'not_helpful_counter': 0,
    'publish_time': '2021-01-11T19:34:49Z',
    'similarity_score': '0.87',
    'thumbnail': 'https://i.ytimg.com/vi/qo1FVrlvW1Y/hqdefault.jpg',
    'title': 'Correlation analysis',
    'uri': 'https://www.youtube.com/embed/qo1FVrlvW1Y?autoplay=1',
    'views': '114324'},
   {'description': 'This video is about Simple Linear Regression which is a supervised machine learning algorithm. Watch Multiple Linear ...',
    'description_full': 'This video is about  Simple Linear Regression which is a supervised machine learning algorithm.\n\nWatch Multiple Linear Regression at https://youtu.be/m9Q6nUruqOQ. \n\n\n\n\nIf you are interested in  building cool Natural Language Processing (NLP) Apps , access our NLP APIs at https://www.firstlanguage.in/ . Also for NLP product development and consultation, please reach out to us at     info@firstlanguage.in',
    'duration': '10:11',
    'helpful_counter': 0,
    'id': 'orQ-QGaOPIg',
    'keyphrases': ['simple linear regression',
     'supervised machine learning algorithm',
     'linear regression',
     'multiple linear',
     'video'],
    'labels': ['Resource', 'Video'],
    'not_helpful_counter': 0,
    'publish_time': '2018-08-06T08:41:33Z',
    'similarity_score': '0.87',
    'thumbnail': 'https://i.ytimg.com/vi/orQ-QGaOPIg/hqdefault.jpg',
    'title': 'Lecture 5 - Linear Regression',
    'uri': 'https://www.youtube.com/embed/orQ-QGaOPIg?autoplay=1',
    'views': '143321'},
   {'description': 'In this video we are going to understand about Pearson Correlation Coefficient. We will also understand the difference between ...',
    'description_full': 'In this video we are going to understand about Pearson Correlation Coefficient. We will also understand the difference between Covariance and Correlation.\n\nPlease join as a member in my channel to get additional benefits like materials in Data Science, live streaming for Members and many more \nhttps://www.youtube.com/channel/UCNU_lfiiWBdtULKOw6X0Dig/join\n\nSupport me in Patreon: https://www.patreon.com/join/2340909?\n\nBuy the Best book of Machine Learning, Deep Learning with python sklearn and tensorflow from below\namazon url:\nhttps://www.amazon.in/Hands-Machine-Learning-Scikit-Learn-Tensor/dp/9352135210/ref=as_sl_pc_qf_sp_asin_til?tag=krishnaik06-21&linkCode=w00&linkId=a706a13cecffd115aef76f33a760e197&creativeASIN=9352135210\n\n\nYou can buy my book on Finance with Machine Learning and Deep Learning from the below url\n\namazon url: https://www.amazon.in/Hands-Python-Finance-implementing-strategies/dp/1789346371/ref=as_sl_pc_qf_sp_asin_til?tag=krishnaik06-21&linkCode=w00&linkId=ac229c9a45954acc19c1b2fa2ca96e23&creativeASIN=1789346371\n\n\n\n\nConnect with me here:\nTwitter: https://twitter.com/Krishnaik06\nFacebook: https://www.facebook.com/krishnaik06\ninstagram: https://www.instagram.com/krishnaik06\n\nSubscribe my unboxing Channel\n\nhttps://www.youtube.com/channel/UCjWY5hREA6FFYrthD0rZNIw\n\n\nBelow are the various playlist created on ML,Data Science and Deep Learning. Please subscribe and support the channel. Happy Learning!\n\nDeep Learning Playlist: https://www.youtube.com/watch?v=DKSZHN7jftI&list=PLZoTAELRMXVPGU70ZGsckrMdr0FteeRUi\nData Science Projects playlist: https://www.youtube.com/watch?v=5Txi0nHIe0o&list=PLZoTAELRMXVNUcr7osiU7CCm8hcaqSzGw\n\nNLP playlist: https://www.youtube.com/watch?v=6ZVf1jnEKGI&list=PLZoTAELRMXVMdJ5sqbCK2LiM0HhQVWNzm\n\nStatistics Playlist: https://www.youtube.com/watch?v=GGZfVeZs_v4&list=PLZoTAELRMXVMhVyr3Ri9IQ-t5QPBtxzJO\n\nFeature Engineering playlist: https://www.youtube.com/watch?v=NgoLMsaZ4HU&list=PLZoTAELRMXVPwYGE2PXD3x0bfKnR0cJjN\n\nComputer Vision playlist: https://www.youtube.com/watch?v=mT34_yu5pbg&list=PLZoTAELRMXVOIBRx0andphYJ7iakSg3Lk\n\nData Science Interview Question playlist: https://www.youtube.com/watch?v=820Qr4BH0YM&list=PLZoTAELRMXVPkl7oRvzyNnyj1HS4wt2K-\n\nYou can buy my book on Finance with Machine Learning and Deep Learning from the below url\n\namazon url: https://www.amazon.in/Hands-Python-Finance-implementing-strategies/dp/1789346371/ref=sr_1_1?keywords=krish+naik&qid=1560943725&s=gateway&sr=8-1\n\n🙏🙏🙏🙏🙏🙏🙏🙏\nYOU JUST NEED TO DO \n3 THINGS to support my channel\nLIKE\nSHARE \n&\nSUBSCRIBE \nTO MY YOUTUBE CHANNEL',
    'duration': '11:17',
    'helpful_counter': 0,
    'id': '6fUYt1alA1U',
    'keyphrases': ['pearson correlation coefficient',
     'correlation',
     'difference',
     'video',
     'covariance',
     'statistics-'],
    'labels': ['Resource', 'Video'],
    'not_helpful_counter': 0,
    'publish_time': '2019-09-12T13:43:02Z',
    'similarity_score': '0.87',
    'thumbnail': 'https://i.ytimg.com/vi/6fUYt1alA1U/hqdefault.jpg',
    'title': 'Statistics- What is Pearson Correlation Coefficient? Difference between Correlation and Covariance',
    'uri': 'https://www.youtube.com/embed/6fUYt1alA1U?autoplay=1',
    'views': '228760'}]},
 'articles': {'current_page': 1,
  'total_pages': 2,
  'total_items': 15,
  'content': [{'abstract': 'In mathematics, a time series is a series of data points indexed (or listed or graphed) in time order.  Most commonly, a time series is a sequence taken at successive equally spaced points in time. Thus it is a sequence of discrete-time data. Examples of time series are heights of ocean tides, counts of sunspots, and the daily closing value of the Dow Jones Industrial Average.\nA time series is very frequently plotted via a run chart (which is a temporal line chart). Time series are used in statistics, signal processing, pattern recognition, econometrics, mathematical finance, weather forecasting, earthquake prediction, electroencephalography, control engineering, astronomy, communications engineering, and largely in any domain of applied science and engineering which involves temporal measurements.\nTime series analysis comprises methods for analyzing time series data in order to extract meaningful statistics and other characteristics of the data. Time series forecasting is the use of a model to predict future values based on previously observed values. While regression analysis is often employed in such a way as to test relationships between one or more different time series, this type of analysis is not usually called "time series analysis", which refers in particular to relationships between different points in time within a single series.\nTime series data have a natural temporal ordering.  This makes time series analysis distinct from cross-sectional studies, in which there is no natural ordering of the observations (e.g. explaining people\'s wages by reference to their respective education levels, where the individuals\' data could be entered in any order).  Time series analysis is also distinct from spatial data analysis where the observations typically relate to geographical locations (e.g. accounting for house prices by the location as well as the intrinsic characteristics of the houses). A stochastic model for a time series will generally reflect the fact that observations close together in time will be more closely related than observations further apart. In addition, time series models will often make use of the natural one-way ordering of time so that values for a given period will be expressed as deriving in some way from past values, rather than from future values (see time reversibility).\nTime series analysis can be applied to real-valued, continuous data, discrete numeric data, or discrete symbolic data (i.e. sequences of characters, such as letters and words in the English language).\n\n',
    'helpful_counter': 0,
    'id': 'https://en.wikipedia.org/wiki/Time_series',
    'keyphrases': [],
    'labels': ['Resource', 'Article'],
    'not_helpful_counter': 0,
    'similarity_score': '0.83',
    'title': 'Time series',
    'uri': 'https://en.wikipedia.org/wiki/Time_series'},
   {'abstract': 'Market sentiment, also known as investor attention, is the general prevailing attitude of investors as to anticipated price development in a market. This attitude is the accumulation of a variety of fundamental and technical factors, including price history, economic reports, seasonal factors, and national and world events. If investors expect upward price movement in the stock market, the sentiment is said to be bullish. On the contrary, if the market sentiment is bearish, most investors expect downward price movement. Market participants who maintain a static sentiment, regardless of market conditions, are described as permabulls and permabears respectively. Market sentiment is usually considered as a contrarian indicator: what most people expect is a good thing to bet against. Market sentiment is used because it is believed to be a good predictor of market moves, especially when it is more extreme. Very bearish sentiment is usually followed by the market going up more than normal, and vice versa. A bull market refers to a sustained period of either realized or expected price rises, whereas a bear market is used to describe when an index or stock has fallen 20% or more from a recent high for a sustained length of time.Market sentiment is monitored with a variety of technical and statistical methods such as the number of advancing versus declining stocks and new highs versus new lows comparisons. A large share of the overall movement of an individual stock has been attributed to market sentiment. The stock market\'s demonstration of the situation is often described as all boats float or sink with the tide, in the popular Wall Street phrase "the trend is your friend". In the last decade, investors are also known to measure market sentiment through the use of news analytics, which include sentiment analysis on textual stories about companies and sectors.\n\n',
    'helpful_counter': 0,
    'id': 'https://en.wikipedia.org/wiki/Market_sentiment',
    'keyphrases': [],
    'labels': ['Resource', 'Article'],
    'not_helpful_counter': 0,
    'similarity_score': '0.84',
    'title': 'Market sentiment',
    'uri': 'https://en.wikipedia.org/wiki/Market_sentiment'},
   {'abstract': 'Speech recognition is an interdisciplinary subfield of computer science and computational linguistics that develops methodologies and technologies that enable the recognition and translation of spoken language into text by computers. It is also known as automatic speech recognition (ASR), computer speech recognition or speech to text (STT). It incorporates knowledge and research in the computer science, linguistics and computer engineering fields. The reverse process is speech synthesis.\nSome speech recognition systems require "solly" (also called "enrollment") where an individual speaker reads text or isolated vocabulary into the system. The system analyzes the person\'s specific voice and uses it to fine-tune the recognition of that person\'s speech, resulting in increased accuracy. Systems that do not use training are called "speaker-independent" systems. Systems that use training are called "speaker dependent".\nSpeech recognition applications include voice user interfaces such as voice dialing (e.g. "call home"), call routing (e.g. "I would like to make a collect call"), domotic appliance control, search key words (e.g. find a podcast where particular words were spoken), simple data entry (e.g., entering a credit card number), preparation of structured documents (e.g. a radiology report), determining speaker characteristics, speech-to-text processing (e.g., word processors or emails), and aircraft (usually termed direct voice input).\nThe term voice recognition or speaker identification refers to identifying the speaker, rather than what they are saying. Recognizing the speaker can simplify the task of translating speech in systems that have been trained on a specific person\'s voice or it can be used to authenticate or verify the identity of a speaker as part of a security process.\nFrom the technology perspective, speech recognition has a long history with several waves of major innovations. Most recently, the field has benefited from advances in deep learning and big data. The advances are evidenced not only by the surge of academic papers published in the field, but more importantly by the worldwide industry adoption of a variety of deep learning methods in designing and deploying speech recognition systems.',
    'helpful_counter': 0,
    'id': 'https://en.wikipedia.org/wiki/Speech_recognition',
    'keyphrases': [],
    'labels': ['Resource', 'Article'],
    'not_helpful_counter': 0,
    'similarity_score': '0.84',
    'title': 'Speech recognition',
    'uri': 'https://en.wikipedia.org/wiki/Speech_recognition'},
   {'abstract': 'Multivariate statistics is a subdivision of statistics encompassing the simultaneous observation and analysis of more than one outcome variable, i.e., multivariate random variables. \nMultivariate statistics concerns understanding the different aims and background of each of the different forms of multivariate analysis, and how they relate to each other. The practical application of multivariate statistics to a particular problem may involve several types of univariate and multivariate analyses in order to understand the relationships between variables and their relevance to the problem being studied.\nIn addition, multivariate statistics is concerned with multivariate probability distributions, in terms of both\n\nhow these can be used to represent the distributions of observed data;\nhow they can be used as part of statistical inference, particularly where several different quantities are of interest to the same analysis.Certain types of problems involving multivariate data, for example simple linear regression and multiple regression, are not usually considered to be special cases of multivariate statistics because the analysis is dealt with by considering the (univariate) conditional distribution of a single outcome variable given the other variables.',
    'helpful_counter': 0,
    'id': 'https://en.wikipedia.org/wiki/Multivariate_statistics',
    'keyphrases': [],
    'labels': ['Resource', 'Article'],
    'not_helpful_counter': 0,
    'similarity_score': '0.85',
    'title': 'Multivariate statistics',
    'uri': 'https://en.wikipedia.org/wiki/Multivariate_statistics'},
   {'abstract': '',
    'helpful_counter': 0,
    'id': 'https://en.wikipedia.org/wiki/List_of_statistics_articles',
    'keyphrases': [],
    'labels': ['Resource', 'Article'],
    'not_helpful_counter': 0,
    'similarity_score': '0.82',
    'title': 'List of statistics articles',
    'uri': 'https://en.wikipedia.org/wiki/List_of_statistics_articles'},
   {'abstract': 'In statistics, probability density estimation or simply density estimation is the construction of an estimate, based on observed data, of an unobservable underlying probability density function.  The unobservable density function is thought of as the density according to which a large population is distributed; the data are usually thought of as a random sample from that population.A variety of approaches to density estimation are used, including Parzen windows and a range of data clustering techniques, including vector quantization. The most basic form of density estimation is a rescaled histogram.',
    'helpful_counter': 0,
    'id': 'https://en.wikipedia.org/wiki/Density_estimation',
    'keyphrases': ['unobservable underlying probability density function',
     'probability density estimation',
     'density estimation',
     'unobservable density function',
     'density',
     'data clustering techniques',
     'estimate',
     'observed data',
     'vector quantization',
     'basic form',
     'data',
     'parzen windows',
     'large population',
     'random sample',
     'rescaled histogram'],
    'labels': ['Resource', 'Article'],
    'not_helpful_counter': 0,
    'similarity_score': '0.88',
    'title': 'Density estimation',
    'uri': 'https://en.wikipedia.org/wiki/Density_estimation'},
   {'abstract': "Cross-validation, sometimes called rotation estimation or out-of-sample testing, is any of various similar model validation techniques for assessing how the results of a statistical analysis will generalize to an independent data set.\nCross-validation is a resampling method that uses different portions of the data to test and train a model on different iterations. It is mainly used in settings where the goal is prediction, and one wants to estimate how accurately a predictive model will perform in practice.  In a prediction problem, a model is usually given a dataset of known data on which training is run (training dataset), and a dataset of unknown data (or first seen data) against which the model is tested (called the validation dataset or testing set). The goal of cross-validation is to test the model's ability to predict new data that was not used in estimating it, in order to flag problems like overfitting or selection bias and to give an insight on how the model will generalize to an independent dataset (i.e., an unknown dataset, for instance from a real problem).\nOne round of cross-validation involves partitioning a sample of data into complementary subsets, performing the analysis on one subset (called the training set), and validating the analysis on the other subset (called the validation set or testing set). To reduce variability, in most methods multiple rounds of cross-validation are performed using different partitions, and the validation results are combined (e.g. averaged) over the rounds to give an estimate of the model's predictive performance.\nIn summary, cross-validation combines (averages) measures of fitness in prediction to derive a more accurate estimate of model prediction performance.\n\n",
    'helpful_counter': 0,
    'id': 'https://en.wikipedia.org/wiki/Cross-validation_(statistics)',
    'keyphrases': ['cross - validation combines',
     'cross - validation',
     'various similar model validation techniques',
     'validation dataset',
     'model prediction performance',
     'validation results',
     'predictive model',
     'validation',
     'most methods multiple rounds',
     'unknown data',
     'independent data',
     'prediction problem',
     'model',
     'cross',
     'testing set'],
    'labels': ['Resource', 'Article'],
    'not_helpful_counter': 0,
    'similarity_score': '0.89',
    'title': 'Cross-validation (statistics)',
    'uri': 'https://en.wikipedia.org/wiki/Cross-validation_(statistics)'},
   {'abstract': 'The following outline is provided as an overview of and topical guide to machine learning:\nMachine learning – subfield of soft computing within computer science that evolved from the study of pattern recognition and computational learning theory in artificial intelligence. In 1959, Arthur Samuel defined machine learning as a "field of study that gives computers the ability to learn without being explicitly programmed". Machine learning explores the study and construction of algorithms that can learn from and make predictions on data. Such algorithms operate by building a model from an example training set of input observations in order to make data-driven predictions or decisions expressed as outputs, rather than following strictly static program instructions.\n\n',
    'helpful_counter': 0,
    'id': 'https://en.wikipedia.org/wiki/Outline_of_machine_learning',
    'keyphrases': ['computational learning theory',
     'machine learning',
     'computer science',
     'soft computing',
     'example training set',
     'learning',
     'static program instructions',
     'machine',
     'computers',
     'input observations',
     'such algorithms',
     'artificial intelligence',
     'pattern recognition',
     'study',
     'data'],
    'labels': ['Resource', 'Article'],
    'not_helpful_counter': 0,
    'similarity_score': '0.92',
    'title': 'Outline of machine learning',
    'uri': 'https://en.wikipedia.org/wiki/Outline_of_machine_learning'},
   {'abstract': 'Cognitive biases are systematic patterns of deviation from norm and/or rationality in judgment. They are often studied in psychology, sociology and behavioral economics.Although the reality of most of these biases is confirmed by reproducible research, there are often controversies about how to classify these biases or how to explain them. Several theoretical causes are known for some cognitive biases, which provides a classification of biases by their common generative mechanism (such as noisy information-processing). Gerd Gigerenzer has criticized the framing of cognitive biases as errors in judgment, and favors interpreting them as arising from rational deviations from logical thought.Explanations include information-processing rules (i.e., mental shortcuts), called heuristics, that the brain uses to produce decisions or judgments. Biases have a variety of forms and appear as cognitive ("cold") bias, such as mental noise, or motivational ("hot") bias, such as when beliefs are distorted by wishful thinking. Both effects can be present at the same time.There are also controversies over some of these biases as to whether they count as useless or irrational, or whether they result in useful attitudes or behavior. For example, when getting to know others, people tend to ask leading questions which seem biased towards confirming their assumptions about the person. However, this kind of confirmation bias has also been argued to be an example of social skill; a way to establish a connection with the other person.Although this research overwhelmingly involves human subjects, some findings that demonstrate bias have been found in non-human animals as well. For example, loss aversion has been shown in monkeys and hyperbolic discounting has been observed in rats, pigeons, and monkeys.',
    'helpful_counter': 0,
    'id': 'https://en.wikipedia.org/wiki/List_of_cognitive_biases',
    'keyphrases': ['cognitive biases',
     'biases',
     'non - human animals',
     'confirmation bias',
     'cognitive',
     'other person',
     'rational deviations',
     'noisy information',
     'processing rules',
     'bias',
     'common generative mechanism',
     'human subjects',
     'such',
     'example',
     'mental noise'],
    'labels': ['Resource', 'Article'],
    'not_helpful_counter': 0,
    'similarity_score': '0.89',
    'title': 'List of cognitive biases',
    'uri': 'https://en.wikipedia.org/wiki/List_of_cognitive_biases'},
   {'abstract': 'In statistics, naive Bayes classifiers are a family of linear "probabilistic classifiers" based on applying Bayes\' theorem with strong (naive) independence assumptions between the features (see Bayes classifier). They are among the simplest Bayesian network models, but coupled with kernel density estimation, they can achieve high accuracy levels.Naive Bayes classifiers are highly scalable, requiring a number of parameters linear in the number of variables (features/predictors) in a learning problem. Maximum-likelihood training can be done by evaluating a closed-form expression,:\u200a718\u200a which takes linear time, rather than by expensive iterative approximation as used for many other types of classifiers.\nIn the statistics literature, naive Bayes models are known under a variety of names, including simple Bayes and independence Bayes. All these names reference the use of Bayes\' theorem in the classifier\'s decision rule, but naive Bayes is not (necessarily) a Bayesian method.\n\n',
    'helpful_counter': 0,
    'id': 'https://en.wikipedia.org/wiki/Naive_Bayes_classifier',
    'keyphrases': ['naive bayes classifier',
     'naive bayes models',
     'bayes classifier',
     'naive bayes',
     'independence bayes',
     'simple bayes',
     'bayes',
     'probabilistic classifiers',
     'classifiers',
     'simplest bayesian network models',
     'naive',
     'kernel density estimation',
     'expensive iterative approximation',
     'high accuracy levels',
     'many other types'],
    'labels': ['Resource', 'Article'],
    'not_helpful_counter': 0,
    'similarity_score': '0.88',
    'title': 'Naive Bayes classifier',
    'uri': 'https://en.wikipedia.org/wiki/Naive_Bayes_classifier'},
   {'abstract': 'In statistics, the phi coefficient (or mean square contingency coefficient and denoted by φ or rφ) is a measure of association for two binary variables.\nIn machine learning, it is known as the Matthews correlation coefficient (MCC) and used as a measure of the quality of binary (two-class) classifications, introduced by biochemist Brian W. Matthews in 1975.Introduced by Karl Pearson, and also known as the Yule phi coefficient from its introduction by Udny Yule in 1912 this measure is similar to the Pearson correlation coefficient in its interpretation. \n\n',
    'helpful_counter': 0,
    'id': 'https://en.wikipedia.org/wiki/Phi_coefficient',
    'keyphrases': ['yule phi coefficient',
     'pearson correlation coefficient',
     'matthews correlation coefficient',
     'phi coefficient',
     'square contingency coefficient',
     'biochemist brian w. matthews',
     'karl pearson',
     'udny yule',
     'binary variables',
     'measure',
     'machine learning',
     'binary',
     'class',
     'similar',
     'classifications'],
    'labels': ['Resource', 'Article'],
    'not_helpful_counter': 0,
    'similarity_score': '0.90',
    'title': 'Phi coefficient',
    'uri': 'https://en.wikipedia.org/wiki/Phi_coefficient'},
   {'abstract': "In statistical analysis of binary classification, the F-score or F-measure is a measure of a test's accuracy. It is calculated from the precision and recall of the test, where the precision is the number of true positive results divided by the number of all positive results, including those not identified correctly, and the recall is the number of true positive results divided by the number of all samples that should have been identified as positive. Precision is also known as positive predictive value, and recall is also known as sensitivity in diagnostic binary classification. \nThe F1 score is the harmonic mean of the precision and recall. It thus symmetrically represents both precision and recall in one metric. The more generic \n  \n    \n      \n        \n          F\n          \n            β\n          \n        \n      \n    \n    {\\displaystyle F_{\\beta }}\n   score applies additional weights, valuing one of precision or recall more than the other.\nThe highest possible value of an F-score is 1.0, indicating perfect precision and recall, and the lowest possible value is 0, if either precision or recall are zero.\n\n",
    'helpful_counter': 0,
    'id': 'https://en.wikipedia.org/wiki/F-score',
    'keyphrases': ['positive predictive value',
     'true positive results',
     'perfect precision',
     'f1 score',
     'diagnostic binary classification',
     'highest possible value',
     'lowest possible value',
     'precision',
     'score',
     'positive results',
     'binary classification',
     'f',
     'recall',
     'positive',
     '\\displaystyle f_{\\beta'],
    'labels': ['Resource', 'Article'],
    'not_helpful_counter': 0,
    'similarity_score': '0.89',
    'title': 'F-score',
    'uri': 'https://en.wikipedia.org/wiki/F-score'},
   {'abstract': "Principal component analysis (PCA) is a popular technique for analyzing large datasets containing a high number of dimensions/features per observation, increasing the interpretability of data while preserving the maximum amount of information, and enabling the visualization of multidimensional data. Formally, PCA is a statistical technique for reducing the dimensionality of a dataset. This is accomplished by linearly transforming the data into a new coordinate system where (most of) the variation in the data can be described with fewer dimensions than the initial data. Many studies use the first two principal components in order to plot the data in two dimensions and to visually identify clusters of closely related data points. Principal component analysis has applications in many fields such as population genetics, microbiome studies, and atmospheric science.The principal components of a collection of points in a real coordinate space are a sequence of \n  \n    \n      \n        p\n      \n    \n    {\\displaystyle p}\n   unit vectors, where the \n  \n    \n      \n        i\n      \n    \n    {\\displaystyle i}\n  -th vector is the direction of a line that best fits the data while being orthogonal to the first \n  \n    \n      \n        i\n        −\n        1\n      \n    \n    {\\displaystyle i-1}\n   vectors. Here, a best-fitting line is defined as one that minimizes the average squared perpendicular distance from the points to the line. These directions constitute an orthonormal basis in which different individual dimensions of the data are linearly uncorrelated. Principal component analysis is the process of computing the principal components and using them to perform a change of basis on the data, sometimes using only the first few principal components and ignoring the rest.\nIn data analysis, the first principal component of a set of  \n  \n    \n      \n        p\n      \n    \n    {\\displaystyle p}\n   variables, presumed to be jointly normally distributed, is the derived variable formed as a linear combination of the original variables that explains the most variance. The second principal component explains the most variance in what is left once the effect of the first component is removed, and we may proceed through  \n  \n    \n      \n        p\n      \n    \n    {\\displaystyle p}\n   iterations until all the variance is explained. PCA is most commonly used when many of the variables are highly correlated with each other and it is desirable to reduce their number to an independent set.\nPCA is used in exploratory data analysis and for making predictive models. It is commonly used for dimensionality reduction by projecting each data point onto only the first few principal components to obtain lower-dimensional data while preserving as much of the data's variation as possible. The first principal component can equivalently be defined as a direction that maximizes the variance of the projected data. The \n  \n    \n      \n        i\n      \n    \n    {\\displaystyle i}\n  -th principal component can be taken as a direction orthogonal to the first \n  \n    \n      \n        i\n        −\n        1\n      \n    \n    {\\displaystyle i-1}\n   principal components that maximizes the variance of the projected data.\nFor either objective, it can be shown that the principal components are eigenvectors of the data's covariance matrix. Thus, the principal components are often computed by eigendecomposition of the data covariance matrix or singular value decomposition of the data matrix. PCA is the simplest of the true eigenvector-based multivariate analyses and is closely related to factor analysis. Factor analysis typically incorporates more domain-specific assumptions about the underlying structure and solves eigenvectors of a slightly different matrix. PCA is also related to canonical correlation analysis (CCA). CCA defines coordinate systems that optimally describe the cross-covariance between two datasets while PCA defines a new orthogonal coordinate system that optimally describes variance in a single dataset. Robust and L1-norm-based variants of standard PCA have also been proposed.\n\n",
    'helpful_counter': 0,
    'id': 'https://en.wikipedia.org/wiki/Principal_component_analysis',
    'keyphrases': ['principal component analysis',
     'first few principal components',
     'first principal component',
     'second principal component',
     'exploratory data analysis',
     'principal components',
     'data analysis',
     'data covariance matrix',
     'related data points',
     'data point',
     'data matrix',
     'dimensional data',
     'first component',
     'multidimensional data',
     'initial data'],
    'labels': ['Resource', 'Article'],
    'not_helpful_counter': 0,
    'similarity_score': '0.87',
    'title': 'Principal component analysis',
    'uri': 'https://en.wikipedia.org/wiki/Principal_component_analysis'},
   {'abstract': 'A receiver operating characteristic curve, or ROC curve, is a graphical plot that illustrates the performance of a binary classifier model (can be used for multi class classification as well) at varying threshold values.\nThe ROC curve is the plot of the true positive rate (TPR) against the false positive rate (FPR) at each threshold setting.\nThe ROC can also be thought of as a plot of the statistical power as a function of the Type I Error of the decision rule (when the performance is calculated from just a sample of the population, it can be thought of as estimators of these quantities). The ROC curve is thus the sensitivity or recall as a function of false positive rate. \nGiven the probability distributions for both true positive and false positive are known, the ROC curve is obtained as the cumulative distribution function (CDF, area under the probability distribution from \n  \n    \n      \n        −\n        ∞\n      \n    \n    {\\displaystyle -\\infty }\n   to the discrimination threshold) of the detection probability in the y-axis versus the CDF of the false positive probability on the x-axis.\nROC analysis provides tools to select possibly optimal models and to discard suboptimal ones independently from (and prior to specifying) the cost context or the class distribution. ROC analysis is related in a direct and natural way to cost/benefit analysis of diagnostic decision making.\n\n',
    'helpful_counter': 0,
    'id': 'https://en.wikipedia.org/wiki/Receiver_operating_characteristic',
    'keyphrases': ['false positive probability',
     'false positive rate',
     'roc curve',
     'roc analysis',
     'true positive rate',
     'false positive',
     'cumulative distribution function',
     'probability distributions',
     'true positive',
     'characteristic curve',
     'roc',
     'class distribution',
     'binary classifier model',
     'detection probability',
     'benefit analysis'],
    'labels': ['Resource', 'Article'],
    'not_helpful_counter': 0,
    'similarity_score': '0.88',
    'title': 'Receiver operating characteristic',
    'uri': 'https://en.wikipedia.org/wiki/Receiver_operating_characteristic'},
   {'abstract': 'In applied mathematics, topological data analysis (TDA) is an approach to the analysis of datasets using techniques from topology. Extraction of information from datasets that are high-dimensional, incomplete and noisy is generally challenging. TDA provides a general framework to analyze such data in a manner that is insensitive to the particular metric chosen and provides dimensionality reduction and robustness to noise.  Beyond this, it inherits functoriality, a fundamental concept of modern mathematics, from its topological nature, which allows it to adapt to new mathematical tools.The initial motivation is to study the shape of data. TDA has combined algebraic topology and other tools from pure mathematics to allow mathematically rigorous study of "shape". The main tool is persistent homology, an adaptation of homology to point cloud data. Persistent homology has been applied to many types of data across many fields. Moreover, its mathematical foundation is also of theoretical importance. The unique features of TDA make it a promising bridge between topology and geometry.',
    'helpful_counter': 0,
    'id': 'https://en.wikipedia.org/wiki/Topological_data_analysis',
    'keyphrases': ['topological data analysis',
     'new mathematical tools',
     'such data',
     'cloud data',
     'topological nature',
     'algebraic topology',
     'mathematical foundation',
     'pure mathematics',
     'applied mathematics',
     'data',
     'modern mathematics',
     'topology',
     'persistent homology',
     'tda',
     'other tools'],
    'labels': ['Resource', 'Article'],
    'not_helpful_counter': 0,
    'similarity_score': '0.90',
    'title': 'Topological data analysis',
    'uri': 'https://en.wikipedia.org/wiki/Topological_data_analysis'}]}}
    ,
    "nodes2": [
        {
            "data": {
                "description": "Abroad Education Channel : https://www.youtube.com/channel/UC9sgREj-cfZipx65BLiHGmw Company Specific HR Mock ...",
                "description_full": "Abroad Education Channel :\nhttps://www.youtube.com/channel/UC9sgREj-cfZipx65BLiHGmw\n\nCompany Specific HR Mock Interview : \nA seasoned professional with over 18 years of experience with Product, IT Services and Agri industry of valuable experience in Human Resource Management, Extensive Experience in Talent Acquisition, Personnel Management, Compensation and Benefits, Performance Reviews, Training & Development and all facets of Human Resources will be performing mock HR Interviews and provides feedback on the session and guides with interview techniques.\n\ncontact me on gmail at : shraavyareddy810@gmail.com\n\nfollow me on instagram at : https://www.instagram.com/shraavya_katkuri/\n\nPlacement playlist: https://www.youtube.com/channel/UCHNO_Y3DskuKiw9VTvo8AMw\n\npaper presentation for semester exams :\nhttps://youtu.be/utSVdagxc7I",
                "duration": "8:34",
                "helpful_counter": 0,
                "id": "Dy9urawfXos",
                "keyphrases": [
                    "pearson&#39;s correlation coefficient |dm|.",
                    "https://www.youtube.com/channel/uc9sgrej-cfzipx65blihgmw company specific",
                    "education channel",
                    "correlation analysis",
                    "mock"
                ],
                "labels": [
                    "Resource",
                    "Video"
                ],
                "not_helpful_counter": 0,
                "publish_time": "2022-02-08T13:37:22Z",
                "similarity_score": "0.90",
                "thumbnail": "https://i.ytimg.com/vi/Dy9urawfXos/hqdefault.jpg",
                "title": "#13 Correlation Analysis - Pearson&#39;s Correlation Coefficient |DM|",
                "uri": "https://www.youtube.com/embed/Dy9urawfXos?autoplay=1",
                "views": "63252"
            }
        },
        {
            "data": {
                "description": "Here, I've explained Decision Trees in great detail. You'll also learn the math behind splitting the nodes. The next video will show ...",
                "description_full": "Here, I've explained Decision Trees in great detail. You'll also learn the math behind splitting the nodes. The next video will show you how to code a decision tree classifier from scratch.\n#machinelearning #datascience\n\nFor more videos please subscribe - \nhttp://bit.ly/normalizedNERD \n\nJoin our discord - \nhttps://discord.gg/39YYU936RC\n\nFacebook - \nhttps://www.facebook.com/nerdywits/\nInstagram - \nhttps://www.instagram.com/normalizednerd/\nTwitter - \nhttps://twitter.com/normalized_nerd",
                "duration": "10:33",
                "helpful_counter": 0,
                "id": "ZVR2Way4nwQ",
                "keyphrases": [],
                "labels": [
                    "Resource",
                    "Video"
                ],
                "not_helpful_counter": 0,
                "publish_time": "2021-01-13T13:14:16Z",
                "similarity_score": "0.87",
                "thumbnail": "https://i.ytimg.com/vi/ZVR2Way4nwQ/hqdefault.jpg",
                "title": "Decision Tree Classification Clearly Explained!",
                "uri": "https://www.youtube.com/embed/ZVR2Way4nwQ?autoplay=1",
                "views": "488992"
            }
        },
        {
            "data": {
                "description": "Myself Shridhar Mankar an Engineer l YouTuber l Educational Blogger l Educator l Podcaster. My Aim- To Make Engineering ...",
                "description_full": "Myself Shridhar Mankar an Engineer l YouTuber l Educational Blogger l Educator l Podcaster. \nMy Aim- To Make Engineering Students Life EASY.\n\nWebsite   - https://5minutesengineering.com \n\n5 Minutes Engineering English YouTube Channel -  https://m.youtube.com/channel/UChTsiSbpTuSrdOHpXkKlq6Q\n\nInstagram -  https://www.instagram.com/5minutesengineering/?hl=en\n\nA small donation would mean the world to me and will help me to make AWESOME videos for you.\n• UPI ID : 5minutesengineering@apl\n\nPlaylists :\n\n• 5 Minutes Engineering Podcast :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcCTAu8NRuCaD3aTEgHLeF0X\n\n• Aptitude :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcBpa1jwpCbEDespCRF3UPE5\n\n• Machine Learning :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcBhOEPwf5cFwqo5B-cP9G4P\n\n• Computer Graphics :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcAtxMe7ahYC4ZYjQHun_b-T\n\n• C Language Tutorial for Beginners :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcBqvw6QTRsA8gvZL3ao2ON-\n\n• R Tutorial for Beginners :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcCRFzBkZ-b92Hdg-qCUfx48\n\n• Python Tutorial for Beginners :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcCJu4i6UGMkMx1p3yYZJsbC\n\n• Embedded and Real Time Operating Systems (ERTOS) :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcBpuYagx0JiSaM-Bi4dm0hG\n\n• Shridhar Live Talks :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcD21x33RkmGvcZtrnWlTDdI\n\n• Welcome to 5 Minutes Engineering :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcCwG02L6fm0G5zmzpyw3eyc \n\n• Human Computer Interaction (HCI) :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcDz_8-pygbcNvNF0DEwKoIL\n\n• Computer Organization and Architecture :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcCaiXeUEjcTzHwIfJqH1qCN\n\n• Deep Learning :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcD-6P8cuX2bZAHSThF6AYvq\n\n• Genetic Algorithm :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcDHUTN26NXKfjg6wFJKDO9R\n\n• Cloud Computing :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcCyQH0n9GHfwviu6KeJ46BV\n\n• Information and Cyber Security :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcArHtWmbs_vXX6soTK3WEJw\n\n• Soft Computing and Optimization Algorithms :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcCPUl8mAnb4g1oExKd0n4Gw\n\n• Compiler Design :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcC6FupM--SachxUTOiQ7XHw\n\n• Operating System :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcD0LLrv7CXxSiO2gNJsoxpi\n\n• Hadoop :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcAhiP6C1qVorA7HZRejRE6M\n\n• CUDA :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcB73J5yO6uSFUycHJSA45O0\n\n• Discrete Mathematics :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcDKuvj-wIgDnHA5JTfUwrHv\n\n• Theory of Computation (TOC) :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcDXLUrW3JEq2cv8efNF6UeQ\n\n• Data Analytics :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcD_agAK_MpCDJdDXFuJqS9X\n\n• Software Modeling and Design :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcD1pjNSpEm2pje3zPrSiflZ\n\n• Internet Of Things (IOT) :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcB8fDd64B8SkJiPpEIzpCzC\n\n• Database Management Systems (DBMS) :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcBU4HS74xGTK1cAFbY0rdVY \n\n• Computer Network (CN) :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcAXkWn2IR-l_WXOrr0n851a\n\n• Software Engineering and Project Management :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcCB7zUM0YSDR-1mM4KoiyLM\n\n• Design and Analysis of Algorithm :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcBOrMihdkd48kgs6_YP8taa\n\n• Data Mining and Warehouse :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcChP0xiW3KK9elNuhfCLVVi\n\n• Mobile Communication :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcAjqrKO-b9UMa2AaAlzZY7D\n\n• High Performance Computing :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcA1eJbqwvjKgsnT321hXRGx\n\n• Artificial Intelligence and Robotics :\n  https://youtube.com/playlist?list=PLYwpaL_SFmcBmfMtX5wRMAtqna7pY-YtG",
                "duration": "5:15",
                "helpful_counter": 0,
                "id": "QOGhtUGqP94",
                "keyphrases": [],
                "labels": [
                    "Resource",
                    "Video"
                ],
                "not_helpful_counter": 0,
                "publish_time": "2023-01-15T12:30:10Z",
                "similarity_score": "0.84",
                "thumbnail": "https://i.ytimg.com/vi/QOGhtUGqP94/hqdefault.jpg",
                "title": "Correlation Explained in Hindi",
                "uri": "https://www.youtube.com/embed/QOGhtUGqP94?autoplay=1",
                "views": "30415"
            }
        },
        {
            "data": {
                "description": "Subject - Data Mining and Business Intelligence Video Name - From Association Mining to Correlation Analysis, Pattern ...",
                "description_full": "Subject - Data Mining and Business Intelligence\n\nVideo Name - From Association Mining to Correlation Analysis, Pattern Evaluation Measures\n\nChapter - Frequent Pattern Mining\n\nFaculty - Prof. Apoorva Wani\n\nUpskill and get Placements with Ekeeda Career Tracks\nData Science - https://ekeeda.com/career-track/data-scientist\nSoftware Development Engineer - https://ekeeda.com/career-track/software-development-engineer\nEmbedded & IoT Engineer - https://ekeeda.com/career-track/embedded-and-iot-engineer\n\nGet FREE Trial for GATE 2023 Exam with Ekeeda GATE - 20000+ Lectures & Notes, strategy, updates, and notifications which will help you to crack your GATE exam.\nhttps://ekeeda.com/catalog/competitive-exam\nCoupon Code - EKGATE\n\nGet Free Notes of All Engineering Subjects & Technology\nhttps://ekeeda.com/digital-library\n\nAccess the Complete Playlist of Subject Data Mining and Business Intelligence - https://www.youtube.com/playlist?list=PLm_MSClsnwm8czfGtiBvDJkHXwixcq-ck\n\nSocial Links:\nhttps://www.instagram.com/ekeeda_official/\nhttps://in.linkedin.com/company/ekeeda.com\n\nHappy Learning!\n\n#fromassociationminingtocorrelationanalysispatternevaluationmeasures\n#frequentpatternmining\n#dataminingandbusinessintelligence",
                "duration": "12:3",
                "helpful_counter": 0,
                "id": "dlUc8PA7Gag",
                "keyphrases": [
                    "pattern evaluation measures- frequent pattern mining",
                    "association mining",
                    "data mining",
                    "business intelligence video name",
                    "correlation analysis",
                    "pattern",
                    "subject"
                ],
                "labels": [
                    "Resource",
                    "Video"
                ],
                "not_helpful_counter": 0,
                "publish_time": "2022-04-08T05:29:16Z",
                "similarity_score": "0.92",
                "thumbnail": "https://i.ytimg.com/vi/dlUc8PA7Gag/hqdefault.jpg",
                "title": "From Association Mining to Correlation Analysis,Pattern Evaluation Measures- Frequent Pattern Mining",
                "uri": "https://www.youtube.com/embed/dlUc8PA7Gag?autoplay=1",
                "views": "2580"
            }
        },
        {
            "data": {
                "description": "",
                "description_full": "",
                "duration": "5:31",
                "helpful_counter": 0,
                "id": "khZCmz3oLuI",
                "keyphrases": [
                    "data mining",
                    "pattern discovery",
                    "interestingness",
                    "lift",
                    "χ2"
                ],
                "labels": [
                    "Resource",
                    "Video"
                ],
                "not_helpful_counter": 0,
                "publish_time": "2016-09-01T13:25:07Z",
                "similarity_score": "0.91",
                "thumbnail": "https://i.ytimg.com/vi/khZCmz3oLuI/hqdefault.jpg",
                "title": "DATA MINING   4 Pattern Discovery in Data Mining   3 2  Interestingness Measures   Lift and χ2",
                "uri": "https://www.youtube.com/embed/khZCmz3oLuI?autoplay=1",
                "views": "17241"
            }
        },
        {
            "data": {
                "description": "Data Science Course for 3-8 Yrs Work Exp: https://l.linklyhq.com/l/1tx7P Data Science Course for 0-3 Yrs Work Exp: ...",
                "description_full": "🔥Data Science Course for 3-8 Yrs Work Exp: https://l.linklyhq.com/l/1tx7P\n🔥Data Science Course for 0-3 Yrs Work Exp: https://l.linklyhq.com/l/1ugC3\n🔥Data Science Course for 8+ Yrs Work Exp: https://l.linklyhq.com/l/1tx7Q\n\nIn this statistics video, you will learn what correlation is. We will discuss types of correlation, some limitations, and the real-life applications of a correlation. In the end, you will also work on an example to calculate the correlations using excel.\n\n✅Subscribe to our Channel to learn more about the top Technologies: https://bit.ly/2VT4WtH\n\n⏩ Check out the Data Science tutorial videos: https://www.youtube.com/watch?v=X3paOmcrTjQ&list=PLEiEAq2VkUUIEQ7ENKU5Gv0HpRDtOphC6\n\n#WhatIsCorrelation #TypesOfCorrelation #CorrelationCoefficient #PositiveCorrelation #NegativeCorrelation #CorrelationAndRegression #Statistics #LearnStatistics #Simplilearn\n\nWhat is Correlation?\nCorrelation is a statistic that measures the degree to which two variables move in relation to each other. It measures association, but doesn't show if x causes y or vice versa—or if the association is caused by a third factor.\n\n🔥Free Data Science Course with Completion Certificate: https://www.simplilearn.com/data-science-free-course-for-beginners-skillup?utm_campaign=WhatIsCorrelation&utm_medium=Description&utm_source=youtube\n\n➡️ About Caltech Post Graduate Program In Data Science\nThis Post Graduation in Data Science leverages the superiority of Caltech's academic eminence. The Data Science program covers critical Data Science topics like Python programming, R programming, Machine Learning, Deep Learning, and Data Visualization tools through an interactive learning model with live sessions by global practitioners and practical labs.\n\n✅ Key Features\n- Simplilearn's JobAssist helps you get noticed by top hiring companies\n- Caltech PG program in Data Science completion certificate\n- Earn up to 14 CEUs from Caltech CTME\n- Masterclasses delivered by distinguished Caltech faculty and IBM experts\n- Caltech CTME Circle membership\n- Online convocation by Caltech CTME Program Director\n- IBM certificates for IBM courses\n- Access to hackathons and Ask Me Anything sessions from IBM\n- 25+ hands-on projects from the likes of Amazon, Walmart, Uber, and many more\n- Seamless access to integrated labs\n- Capstone projects in 3 domains\n- Simplilearn’s Career Assistance to help you get noticed by top hiring companies\n- 8X higher interaction in live online classes by industry experts\n\n✅ Skills Covered\n- Exploratory Data Analysis\n- Descriptive Statistics\n- Inferential Statistics\n- Model Building and Fine Tuning\n- Supervised and Unsupervised Learning\n- Ensemble Learning\n- Deep Learning\n- Data Visualization\n\n👉 Learn More At: https://www.simplilearn.com/post-graduate-program-data-science?utm_campaign=WhatIsCorrelation-PEfQCv9nvSo&utm_medium=Description&utm_source=youtube \n🔥 Data Science Bootcamp (US Only): https://www.simplilearn.com/data-science-bootcamp\n?utm_campaign=WhatIsCorrelation-PEfQCv9nvSo&utm_medium=Description&utm_source=youtube \n\n🔥🔥 Interested in Attending Live Classes? Call Us: IN - 18002127688 / US - +18445327688",
                "duration": "4:33",
                "helpful_counter": 0,
                "id": "PEfQCv9nvSo",
                "keyphrases": [
                    "https://l.linklyhq.com/l/1tx7p data science course",
                    "data science course",
                    "yrs work exp",
                    "correlation coefficient",
                    "correlation",
                    "simplilearn",
                    "statistics",
                    "types"
                ],
                "labels": [
                    "Resource",
                    "Video"
                ],
                "not_helpful_counter": 0,
                "publish_time": "2022-01-22T06:30:08Z",
                "similarity_score": "0.91",
                "thumbnail": "https://i.ytimg.com/vi/PEfQCv9nvSo/hqdefault.jpg",
                "title": "What Is Correlation? | Types of Correlation | Correlation Coefficient | Statistics | Simplilearn",
                "uri": "https://www.youtube.com/embed/PEfQCv9nvSo?autoplay=1",
                "views": "60374"
            }
        },
        {
            "data": {
                "description": "Linear Regression Algorithm – Solved Numerical Example in Machine Learning by Mahesh Huddar The following concepts are ...",
                "description_full": "Linear Regression Algorithm – Solved Numerical Example in Machine Learning by Mahesh Huddar\n\nThe following concepts are discussed:\n______________________________\nregression equation, \nregression analysis introduction,\nregression analysis, \nlinear regression solved example,\nlinear regression example,\n regression solved example,\nregression numerical example,\nregression numerical methods,\n\n\n********************************\n\n1. Blog / Website: https://www.vtupulse.com/\n2. Like Facebook Page: https://www.facebook.com/VTUPulse\n3. Follow us on Instagram: https://www.instagram.com/vtupulse/\n4. Like, Share, Subscribe, and Don't forget to press the bell ICON for regular updates",
                "duration": "5:30",
                "helpful_counter": 0,
                "id": "QcPycBZomac",
                "keyphrases": [
                    "linear regression algorithm –",
                    "machine learning",
                    "numerical example",
                    "mahesh huddar",
                    "concepts"
                ],
                "labels": [
                    "Resource",
                    "Video"
                ],
                "not_helpful_counter": 0,
                "publish_time": "2023-05-02T16:50:10Z",
                "similarity_score": "0.91",
                "thumbnail": "https://i.ytimg.com/vi/QcPycBZomac/hqdefault.jpg",
                "title": "Linear Regression Algorithm – Solved Numerical Example in Machine Learning by Mahesh Huddar",
                "uri": "https://www.youtube.com/embed/QcPycBZomac?autoplay=1",
                "views": "76972"
            }
        },
        {
            "data": {
                "description": "In this video, we will explore the correlation among different columns of data using Pandas Corr() function. Exploring correlations ...",
                "description_full": "In this video, we will explore the correlation among different columns of data using Pandas Corr() function.\n\nExploring correlations in data using python is very important task in Machine Learning feature engineering..",
                "duration": "2:18",
                "helpful_counter": 0,
                "id": "1jLngF4KSqE",
                "keyphrases": [
                    "different columns",
                    "pandas corr",
                    "correlations",
                    "data",
                    "video",
                    "function",
                    "python"
                ],
                "labels": [
                    "Resource",
                    "Video"
                ],
                "not_helpful_counter": 0,
                "publish_time": "2022-04-14T15:56:40Z",
                "similarity_score": "0.91",
                "thumbnail": "https://i.ytimg.com/vi/1jLngF4KSqE/hqdefault.jpg",
                "title": "Finding correlations in data using Python.",
                "uri": "https://www.youtube.com/embed/1jLngF4KSqE?autoplay=1",
                "views": "12912"
            }
        },
        {
            "data": {
                "description": "This lecture provides the introductory concepts of Frequent pattern mining in transnational databases.",
                "description_full": "This lecture provides the introductory concepts of Frequent pattern mining in transnational databases.",
                "duration": "19:31",
                "helpful_counter": 0,
                "id": "QN3_wxqnSlw",
                "keyphrases": [
                    "frequent pattern mining",
                    "frequent patterns",
                    "association rules",
                    "association analysis",
                    "introductory concepts",
                    "transnational databases",
                    "lecture",
                    "confidence",
                    "support"
                ],
                "labels": [
                    "Resource",
                    "Video"
                ],
                "not_helpful_counter": 0,
                "publish_time": "2017-09-19T09:06:40Z",
                "similarity_score": "0.91",
                "thumbnail": "https://i.ytimg.com/vi/QN3_wxqnSlw/hqdefault.jpg",
                "title": "Association analysis: Frequent Patterns, Support, Confidence and Association Rules",
                "uri": "https://www.youtube.com/embed/QN3_wxqnSlw?autoplay=1",
                "views": "161923"
            }
        },
        {
            "data": {
                "description": "Covariance is closely related to Correlation. But what it really says? This video explains covariance with visualizations.",
                "description_full": "Covariance is closely related to Correlation. But what it really says? This video explains covariance with visualizations.\n#machinelearning #datascience\n\nLike my work? Support me -\nhttps://www.buymeacoffee.com/normalizednerd\n\nFor more videos please subscribe - \nhttp://bit.ly/normalizedNERD \n\nJoin our discord - \nhttps://discord.gg/39YYU936RC\n\nFacebook - \nhttps://www.facebook.com/nerdywits/\nInstagram - \nhttps://www.instagram.com/normalizednerd/\nTwitter - \nhttps://twitter.com/normalized_nerd",
                "duration": "7:47",
                "helpful_counter": 0,
                "id": "TPcAnExkWwQ",
                "keyphrases": [
                    "covariance",
                    "correlation",
                    "video",
                    "related",
                    "visualizations"
                ],
                "labels": [
                    "Resource",
                    "Video"
                ],
                "not_helpful_counter": 0,
                "publish_time": "2021-06-03T14:30:07Z",
                "similarity_score": "0.89",
                "thumbnail": "https://i.ytimg.com/vi/TPcAnExkWwQ/hqdefault.jpg",
                "title": "Covariance Clearly Explained!",
                "uri": "https://www.youtube.com/embed/TPcAnExkWwQ?autoplay=1",
                "views": "46243"
            }
        },
        {
            "data": {
                "description": "The similarity measure is the measure of how much alike two data objects are. #MachineLearning #SimilarityMeasure #Clustering ...",
                "description_full": "The similarity measure is the measure of how much alike two data objects are.  #MachineLearning #SimilarityMeasure #Clustering\n\nMachine Learning 👉https://www.youtube.com/playlist?list=PLPN-43XehstOjGY6vM6nBpSggHoAv9hkR\n\nArtificial Intelligence 👉https://www.youtube.com/playlist?list=PLPN-43XehstNQttedytmmLPwzMCXahBRg\n\nCloud Computing 👉https://www.youtube.com/playlist?list=PLPN-43XehstNd5WsXQ9y3GFXyagkX1PC3\n\nWireless Technology 👉https://www.youtube.com/playlist?list=PLPN-43XehstMhFEXiOgJwv2Ec3vOTWpSH\n\nData Mining 👉https://www.youtube.com/playlist?list=PLPN-43XehstOe0CxcXaYeLTFpgD2IiluP\n\nSimulation Modeling 👉https://www.youtube.com/playlist?list=PLPN-43XehstPwUMDCs9zYQS-e5-0zjifX\n\nBig Data 👉https://www.youtube.com/playlist?list=PLPN-43XehstPr1D-t9X2klE--Uj4YSNwn\n\nBlockchain 👉https://www.youtube.com/playlist?list=PLPN-43XehstNgC2t_EScmj1GWv24ncugJ\n\nIOT 👉https://www.youtube.com/playlist?list=PLPN-43XehstOS_3mv9LgFWnVXQE-7PKbF\n\n\nFollow me on Instagram 👉 https://www.instagram.com/ngnieredteacher/\nVisit my Profile 👉 https://www.linkedin.com/in/reng99/\nSupport my work on Patreon 👉 https://www.patreon.com/ranjiraj",
                "duration": "10:19",
                "helpful_counter": 0,
                "id": "a8riMSeBtwY",
                "keyphrases": [
                    "similarity measures",
                    "data objects",
                    "measure",
                    "much",
                    "machinelearning",
                    "machine",
                    "clustering"
                ],
                "labels": [
                    "Resource",
                    "Video"
                ],
                "not_helpful_counter": 0,
                "publish_time": "2019-10-02T16:00:22Z",
                "similarity_score": "0.89",
                "thumbnail": "https://i.ytimg.com/vi/a8riMSeBtwY/hqdefault.jpg",
                "title": "Machine Learning | Similarity Measures",
                "uri": "https://www.youtube.com/embed/a8riMSeBtwY?autoplay=1",
                "views": "26844"
            }
        },
        {
            "data": {
                "description": "Linear Regression in 2 minutes. --------------- Credit: Manim and Python : https://github.com/3b1b/manim Blender3D: ...",
                "description_full": "Linear Regression in 2 minutes.\n\n\n\n---------------\nCredit:\n🐍 Manim and Python : https://github.com/3b1b/manim\n🐵 Blender3D: https://www.blender.org/\n🗒️ Emacs: https://www.gnu.org/software/emacs/\nMusic/Sound: www.bensound.com\n\nThis video would not have been possible without the help of Gökçe Dayanıklı.",
                "duration": "2:34",
                "helpful_counter": 0,
                "id": "CtsRRUddV2s",
                "keyphrases": [
                    "linear regression",
                    "minutes",
                    "https://github.com/3b1b/manim blender3d",
                    "credit",
                    "manim",
                    "python"
                ],
                "labels": [
                    "Resource",
                    "Video"
                ],
                "not_helpful_counter": 0,
                "publish_time": "2021-11-28T07:49:01Z",
                "similarity_score": "0.90",
                "thumbnail": "https://i.ytimg.com/vi/CtsRRUddV2s/hqdefault.jpg",
                "title": "Linear Regression in 2 minutes",
                "uri": "https://www.youtube.com/embed/CtsRRUddV2s?autoplay=1",
                "views": "106207"
            }
        },
        {
            "data": {
                "description": "With the help of correlation analysis, the linear relationship between variables can be examined. The strength of the correlation is ...",
                "description_full": "With the help of correlation analysis, the linear relationship between variables can be examined. The strength of the correlation is determined by the correlation coefficient, which varies from -1 to +1. This means that correlation analyses can be used to make a statement about the strength and direction of the relationship between two variables.\n\nInterpret correlation\nPositive correlation\nA positive correlation exists when larger values of variable A are accompanied by larger values of variable B. Body size and shoe size, for example, correlate positively, resulting in a correlation coefficient that lies between 0 and 1, i.e. a positive value.\n\nNegative correlation\nA negative correlation exists when larger values of variable A are accompanied by smaller values of variable B. The product price and the sales volume usually have a negative correlation; the more expensive a product is, the lower the sales volume. In this case, the correlation coefficient lies between -1 and 0, i.e. it takes on a negative value.\n\nMore information on correlation analysis:\nhttps://datatab.net/tutorial/correlation\n\nAnd here is the online correlation calculator:\nhttps://datatab.net/statistics-calculator/correlation",
                "duration": "5:40",
                "helpful_counter": 0,
                "id": "qo1FVrlvW1Y",
                "keyphrases": [
                    "correlation analysis",
                    "linear relationship",
                    "correlation",
                    "variables",
                    "help",
                    "strength"
                ],
                "labels": [
                    "Resource",
                    "Video"
                ],
                "not_helpful_counter": 0,
                "publish_time": "2021-01-11T19:34:49Z",
                "similarity_score": "0.87",
                "thumbnail": "https://i.ytimg.com/vi/qo1FVrlvW1Y/hqdefault.jpg",
                "title": "Correlation analysis",
                "uri": "https://www.youtube.com/embed/qo1FVrlvW1Y?autoplay=1",
                "views": "114324"
            }
        },
        {
            "data": {
                "description": "This video is about Simple Linear Regression which is a supervised machine learning algorithm. Watch Multiple Linear ...",
                "description_full": "This video is about  Simple Linear Regression which is a supervised machine learning algorithm.\n\nWatch Multiple Linear Regression at https://youtu.be/m9Q6nUruqOQ. \n\n\n\n\nIf you are interested in  building cool Natural Language Processing (NLP) Apps , access our NLP APIs at https://www.firstlanguage.in/ . Also for NLP product development and consultation, please reach out to us at     info@firstlanguage.in",
                "duration": "10:11",
                "helpful_counter": 0,
                "id": "orQ-QGaOPIg",
                "keyphrases": [
                    "simple linear regression",
                    "supervised machine learning algorithm",
                    "linear regression",
                    "multiple linear",
                    "video"
                ],
                "labels": [
                    "Resource",
                    "Video"
                ],
                "not_helpful_counter": 0,
                "publish_time": "2018-08-06T08:41:33Z",
                "similarity_score": "0.87",
                "thumbnail": "https://i.ytimg.com/vi/orQ-QGaOPIg/hqdefault.jpg",
                "title": "Lecture 5 - Linear Regression",
                "uri": "https://www.youtube.com/embed/orQ-QGaOPIg?autoplay=1",
                "views": "143321"
            }
        },
        {
            "data": {
                "description": "In this video we are going to understand about Pearson Correlation Coefficient. We will also understand the difference between ...",
                "description_full": "In this video we are going to understand about Pearson Correlation Coefficient. We will also understand the difference between Covariance and Correlation.\n\nPlease join as a member in my channel to get additional benefits like materials in Data Science, live streaming for Members and many more \nhttps://www.youtube.com/channel/UCNU_lfiiWBdtULKOw6X0Dig/join\n\nSupport me in Patreon: https://www.patreon.com/join/2340909?\n\nBuy the Best book of Machine Learning, Deep Learning with python sklearn and tensorflow from below\namazon url:\nhttps://www.amazon.in/Hands-Machine-Learning-Scikit-Learn-Tensor/dp/9352135210/ref=as_sl_pc_qf_sp_asin_til?tag=krishnaik06-21&linkCode=w00&linkId=a706a13cecffd115aef76f33a760e197&creativeASIN=9352135210\n\n\nYou can buy my book on Finance with Machine Learning and Deep Learning from the below url\n\namazon url: https://www.amazon.in/Hands-Python-Finance-implementing-strategies/dp/1789346371/ref=as_sl_pc_qf_sp_asin_til?tag=krishnaik06-21&linkCode=w00&linkId=ac229c9a45954acc19c1b2fa2ca96e23&creativeASIN=1789346371\n\n\n\n\nConnect with me here:\nTwitter: https://twitter.com/Krishnaik06\nFacebook: https://www.facebook.com/krishnaik06\ninstagram: https://www.instagram.com/krishnaik06\n\nSubscribe my unboxing Channel\n\nhttps://www.youtube.com/channel/UCjWY5hREA6FFYrthD0rZNIw\n\n\nBelow are the various playlist created on ML,Data Science and Deep Learning. Please subscribe and support the channel. Happy Learning!\n\nDeep Learning Playlist: https://www.youtube.com/watch?v=DKSZHN7jftI&list=PLZoTAELRMXVPGU70ZGsckrMdr0FteeRUi\nData Science Projects playlist: https://www.youtube.com/watch?v=5Txi0nHIe0o&list=PLZoTAELRMXVNUcr7osiU7CCm8hcaqSzGw\n\nNLP playlist: https://www.youtube.com/watch?v=6ZVf1jnEKGI&list=PLZoTAELRMXVMdJ5sqbCK2LiM0HhQVWNzm\n\nStatistics Playlist: https://www.youtube.com/watch?v=GGZfVeZs_v4&list=PLZoTAELRMXVMhVyr3Ri9IQ-t5QPBtxzJO\n\nFeature Engineering playlist: https://www.youtube.com/watch?v=NgoLMsaZ4HU&list=PLZoTAELRMXVPwYGE2PXD3x0bfKnR0cJjN\n\nComputer Vision playlist: https://www.youtube.com/watch?v=mT34_yu5pbg&list=PLZoTAELRMXVOIBRx0andphYJ7iakSg3Lk\n\nData Science Interview Question playlist: https://www.youtube.com/watch?v=820Qr4BH0YM&list=PLZoTAELRMXVPkl7oRvzyNnyj1HS4wt2K-\n\nYou can buy my book on Finance with Machine Learning and Deep Learning from the below url\n\namazon url: https://www.amazon.in/Hands-Python-Finance-implementing-strategies/dp/1789346371/ref=sr_1_1?keywords=krish+naik&qid=1560943725&s=gateway&sr=8-1\n\n🙏🙏🙏🙏🙏🙏🙏🙏\nYOU JUST NEED TO DO \n3 THINGS to support my channel\nLIKE\nSHARE \n&\nSUBSCRIBE \nTO MY YOUTUBE CHANNEL",
                "duration": "11:17",
                "helpful_counter": 0,
                "id": "6fUYt1alA1U",
                "keyphrases": [
                    "pearson correlation coefficient",
                    "correlation",
                    "difference",
                    "video",
                    "covariance",
                    "statistics-"
                ],
                "labels": [
                    "Resource",
                    "Video"
                ],
                "not_helpful_counter": 0,
                "publish_time": "2019-09-12T13:43:02Z",
                "similarity_score": "0.87",
                "thumbnail": "https://i.ytimg.com/vi/6fUYt1alA1U/hqdefault.jpg",
                "title": "Statistics- What is Pearson Correlation Coefficient? Difference between Correlation and Covariance",
                "uri": "https://www.youtube.com/embed/6fUYt1alA1U?autoplay=1",
                "views": "228760"
            }
        },
        {
            "data": {
                "abstract": "In mathematics, a time series is a series of data points indexed (or listed or graphed) in time order.  Most commonly, a time series is a sequence taken at successive equally spaced points in time. Thus it is a sequence of discrete-time data. Examples of time series are heights of ocean tides, counts of sunspots, and the daily closing value of the Dow Jones Industrial Average.\nA time series is very frequently plotted via a run chart (which is a temporal line chart). Time series are used in statistics, signal processing, pattern recognition, econometrics, mathematical finance, weather forecasting, earthquake prediction, electroencephalography, control engineering, astronomy, communications engineering, and largely in any domain of applied science and engineering which involves temporal measurements.\nTime series analysis comprises methods for analyzing time series data in order to extract meaningful statistics and other characteristics of the data. Time series forecasting is the use of a model to predict future values based on previously observed values. While regression analysis is often employed in such a way as to test relationships between one or more different time series, this type of analysis is not usually called \"time series analysis\", which refers in particular to relationships between different points in time within a single series.\nTime series data have a natural temporal ordering.  This makes time series analysis distinct from cross-sectional studies, in which there is no natural ordering of the observations (e.g. explaining people's wages by reference to their respective education levels, where the individuals' data could be entered in any order).  Time series analysis is also distinct from spatial data analysis where the observations typically relate to geographical locations (e.g. accounting for house prices by the location as well as the intrinsic characteristics of the houses). A stochastic model for a time series will generally reflect the fact that observations close together in time will be more closely related than observations further apart. In addition, time series models will often make use of the natural one-way ordering of time so that values for a given period will be expressed as deriving in some way from past values, rather than from future values (see time reversibility).\nTime series analysis can be applied to real-valued, continuous data, discrete numeric data, or discrete symbolic data (i.e. sequences of characters, such as letters and words in the English language).\n\n",
                "helpful_counter": 0,
                "id": "https://en.wikipedia.org/wiki/Time_series",
                "keyphrases": [],
                "labels": [
                    "Resource",
                    "Article"
                ],
                "not_helpful_counter": 0,
                "similarity_score": "0.83",
                "title": "Time series",
                "uri": "https://en.wikipedia.org/wiki/Time_series"
            }
        },
        {
            "data": {
                "abstract": "Market sentiment, also known as investor attention, is the general prevailing attitude of investors as to anticipated price development in a market. This attitude is the accumulation of a variety of fundamental and technical factors, including price history, economic reports, seasonal factors, and national and world events. If investors expect upward price movement in the stock market, the sentiment is said to be bullish. On the contrary, if the market sentiment is bearish, most investors expect downward price movement. Market participants who maintain a static sentiment, regardless of market conditions, are described as permabulls and permabears respectively. Market sentiment is usually considered as a contrarian indicator: what most people expect is a good thing to bet against. Market sentiment is used because it is believed to be a good predictor of market moves, especially when it is more extreme. Very bearish sentiment is usually followed by the market going up more than normal, and vice versa. A bull market refers to a sustained period of either realized or expected price rises, whereas a bear market is used to describe when an index or stock has fallen 20% or more from a recent high for a sustained length of time.Market sentiment is monitored with a variety of technical and statistical methods such as the number of advancing versus declining stocks and new highs versus new lows comparisons. A large share of the overall movement of an individual stock has been attributed to market sentiment. The stock market's demonstration of the situation is often described as all boats float or sink with the tide, in the popular Wall Street phrase \"the trend is your friend\". In the last decade, investors are also known to measure market sentiment through the use of news analytics, which include sentiment analysis on textual stories about companies and sectors.\n\n",
                "helpful_counter": 0,
                "id": "https://en.wikipedia.org/wiki/Market_sentiment",
                "keyphrases": [],
                "labels": [
                    "Resource",
                    "Article"
                ],
                "not_helpful_counter": 0,
                "similarity_score": "0.84",
                "title": "Market sentiment",
                "uri": "https://en.wikipedia.org/wiki/Market_sentiment"
            }
        },
        {
            "data": {
                "abstract": "Speech recognition is an interdisciplinary subfield of computer science and computational linguistics that develops methodologies and technologies that enable the recognition and translation of spoken language into text by computers. It is also known as automatic speech recognition (ASR), computer speech recognition or speech to text (STT). It incorporates knowledge and research in the computer science, linguistics and computer engineering fields. The reverse process is speech synthesis.\nSome speech recognition systems require \"solly\" (also called \"enrollment\") where an individual speaker reads text or isolated vocabulary into the system. The system analyzes the person's specific voice and uses it to fine-tune the recognition of that person's speech, resulting in increased accuracy. Systems that do not use training are called \"speaker-independent\" systems. Systems that use training are called \"speaker dependent\".\nSpeech recognition applications include voice user interfaces such as voice dialing (e.g. \"call home\"), call routing (e.g. \"I would like to make a collect call\"), domotic appliance control, search key words (e.g. find a podcast where particular words were spoken), simple data entry (e.g., entering a credit card number), preparation of structured documents (e.g. a radiology report), determining speaker characteristics, speech-to-text processing (e.g., word processors or emails), and aircraft (usually termed direct voice input).\nThe term voice recognition or speaker identification refers to identifying the speaker, rather than what they are saying. Recognizing the speaker can simplify the task of translating speech in systems that have been trained on a specific person's voice or it can be used to authenticate or verify the identity of a speaker as part of a security process.\nFrom the technology perspective, speech recognition has a long history with several waves of major innovations. Most recently, the field has benefited from advances in deep learning and big data. The advances are evidenced not only by the surge of academic papers published in the field, but more importantly by the worldwide industry adoption of a variety of deep learning methods in designing and deploying speech recognition systems.",
                "helpful_counter": 0,
                "id": "https://en.wikipedia.org/wiki/Speech_recognition",
                "keyphrases": [],
                "labels": [
                    "Resource",
                    "Article"
                ],
                "not_helpful_counter": 0,
                "similarity_score": "0.84",
                "title": "Speech recognition",
                "uri": "https://en.wikipedia.org/wiki/Speech_recognition"
            }
        },
        {
            "data": {
                "abstract": "Multivariate statistics is a subdivision of statistics encompassing the simultaneous observation and analysis of more than one outcome variable, i.e., multivariate random variables. \nMultivariate statistics concerns understanding the different aims and background of each of the different forms of multivariate analysis, and how they relate to each other. The practical application of multivariate statistics to a particular problem may involve several types of univariate and multivariate analyses in order to understand the relationships between variables and their relevance to the problem being studied.\nIn addition, multivariate statistics is concerned with multivariate probability distributions, in terms of both\n\nhow these can be used to represent the distributions of observed data;\nhow they can be used as part of statistical inference, particularly where several different quantities are of interest to the same analysis.Certain types of problems involving multivariate data, for example simple linear regression and multiple regression, are not usually considered to be special cases of multivariate statistics because the analysis is dealt with by considering the (univariate) conditional distribution of a single outcome variable given the other variables.",
                "helpful_counter": 0,
                "id": "https://en.wikipedia.org/wiki/Multivariate_statistics",
                "keyphrases": [],
                "labels": [
                    "Resource",
                    "Article"
                ],
                "not_helpful_counter": 0,
                "similarity_score": "0.85",
                "title": "Multivariate statistics",
                "uri": "https://en.wikipedia.org/wiki/Multivariate_statistics"
            }
        },
        {
            "data": {
                "abstract": "",
                "helpful_counter": 0,
                "id": "https://en.wikipedia.org/wiki/List_of_statistics_articles",
                "keyphrases": [],
                "labels": [
                    "Resource",
                    "Article"
                ],
                "not_helpful_counter": 0,
                "similarity_score": "0.82",
                "title": "List of statistics articles",
                "uri": "https://en.wikipedia.org/wiki/List_of_statistics_articles"
            }
        },
        {
            "data": {
                "abstract": "In statistics, probability density estimation or simply density estimation is the construction of an estimate, based on observed data, of an unobservable underlying probability density function.  The unobservable density function is thought of as the density according to which a large population is distributed; the data are usually thought of as a random sample from that population.A variety of approaches to density estimation are used, including Parzen windows and a range of data clustering techniques, including vector quantization. The most basic form of density estimation is a rescaled histogram.",
                "helpful_counter": 0,
                "id": "https://en.wikipedia.org/wiki/Density_estimation",
                "keyphrases": [
                    "unobservable underlying probability density function",
                    "probability density estimation",
                    "density estimation",
                    "unobservable density function",
                    "density",
                    "data clustering techniques",
                    "estimate",
                    "observed data",
                    "vector quantization",
                    "basic form",
                    "data",
                    "parzen windows",
                    "large population",
                    "random sample",
                    "rescaled histogram"
                ],
                "labels": [
                    "Resource",
                    "Article"
                ],
                "not_helpful_counter": 0,
                "similarity_score": "0.88",
                "title": "Density estimation",
                "uri": "https://en.wikipedia.org/wiki/Density_estimation"
            }
        },
        {
            "data": {
                "abstract": "Cross-validation, sometimes called rotation estimation or out-of-sample testing, is any of various similar model validation techniques for assessing how the results of a statistical analysis will generalize to an independent data set.\nCross-validation is a resampling method that uses different portions of the data to test and train a model on different iterations. It is mainly used in settings where the goal is prediction, and one wants to estimate how accurately a predictive model will perform in practice.  In a prediction problem, a model is usually given a dataset of known data on which training is run (training dataset), and a dataset of unknown data (or first seen data) against which the model is tested (called the validation dataset or testing set). The goal of cross-validation is to test the model's ability to predict new data that was not used in estimating it, in order to flag problems like overfitting or selection bias and to give an insight on how the model will generalize to an independent dataset (i.e., an unknown dataset, for instance from a real problem).\nOne round of cross-validation involves partitioning a sample of data into complementary subsets, performing the analysis on one subset (called the training set), and validating the analysis on the other subset (called the validation set or testing set). To reduce variability, in most methods multiple rounds of cross-validation are performed using different partitions, and the validation results are combined (e.g. averaged) over the rounds to give an estimate of the model's predictive performance.\nIn summary, cross-validation combines (averages) measures of fitness in prediction to derive a more accurate estimate of model prediction performance.\n\n",
                "helpful_counter": 0,
                "id": "https://en.wikipedia.org/wiki/Cross-validation_(statistics)",
                "keyphrases": [
                    "cross - validation combines",
                    "cross - validation",
                    "various similar model validation techniques",
                    "validation dataset",
                    "model prediction performance",
                    "validation results",
                    "predictive model",
                    "validation",
                    "most methods multiple rounds",
                    "unknown data",
                    "independent data",
                    "prediction problem",
                    "model",
                    "cross",
                    "testing set"
                ],
                "labels": [
                    "Resource",
                    "Article"
                ],
                "not_helpful_counter": 0,
                "similarity_score": "0.89",
                "title": "Cross-validation (statistics)",
                "uri": "https://en.wikipedia.org/wiki/Cross-validation_(statistics)"
            }
        },
        {
            "data": {
                "abstract": "The following outline is provided as an overview of and topical guide to machine learning:\nMachine learning – subfield of soft computing within computer science that evolved from the study of pattern recognition and computational learning theory in artificial intelligence. In 1959, Arthur Samuel defined machine learning as a \"field of study that gives computers the ability to learn without being explicitly programmed\". Machine learning explores the study and construction of algorithms that can learn from and make predictions on data. Such algorithms operate by building a model from an example training set of input observations in order to make data-driven predictions or decisions expressed as outputs, rather than following strictly static program instructions.\n\n",
                "helpful_counter": 0,
                "id": "https://en.wikipedia.org/wiki/Outline_of_machine_learning",
                "keyphrases": [
                    "computational learning theory",
                    "machine learning",
                    "computer science",
                    "soft computing",
                    "example training set",
                    "learning",
                    "static program instructions",
                    "machine",
                    "computers",
                    "input observations",
                    "such algorithms",
                    "artificial intelligence",
                    "pattern recognition",
                    "study",
                    "data"
                ],
                "labels": [
                    "Resource",
                    "Article"
                ],
                "not_helpful_counter": 0,
                "similarity_score": "0.92",
                "title": "Outline of machine learning",
                "uri": "https://en.wikipedia.org/wiki/Outline_of_machine_learning"
            }
        },
        {
            "data": {
                "abstract": "Cognitive biases are systematic patterns of deviation from norm and/or rationality in judgment. They are often studied in psychology, sociology and behavioral economics.Although the reality of most of these biases is confirmed by reproducible research, there are often controversies about how to classify these biases or how to explain them. Several theoretical causes are known for some cognitive biases, which provides a classification of biases by their common generative mechanism (such as noisy information-processing). Gerd Gigerenzer has criticized the framing of cognitive biases as errors in judgment, and favors interpreting them as arising from rational deviations from logical thought.Explanations include information-processing rules (i.e., mental shortcuts), called heuristics, that the brain uses to produce decisions or judgments. Biases have a variety of forms and appear as cognitive (\"cold\") bias, such as mental noise, or motivational (\"hot\") bias, such as when beliefs are distorted by wishful thinking. Both effects can be present at the same time.There are also controversies over some of these biases as to whether they count as useless or irrational, or whether they result in useful attitudes or behavior. For example, when getting to know others, people tend to ask leading questions which seem biased towards confirming their assumptions about the person. However, this kind of confirmation bias has also been argued to be an example of social skill; a way to establish a connection with the other person.Although this research overwhelmingly involves human subjects, some findings that demonstrate bias have been found in non-human animals as well. For example, loss aversion has been shown in monkeys and hyperbolic discounting has been observed in rats, pigeons, and monkeys.",
                "helpful_counter": 0,
                "id": "https://en.wikipedia.org/wiki/List_of_cognitive_biases",
                "keyphrases": [
                    "cognitive biases",
                    "biases",
                    "non - human animals",
                    "confirmation bias",
                    "cognitive",
                    "other person",
                    "rational deviations",
                    "noisy information",
                    "processing rules",
                    "bias",
                    "common generative mechanism",
                    "human subjects",
                    "such",
                    "example",
                    "mental noise"
                ],
                "labels": [
                    "Resource",
                    "Article"
                ],
                "not_helpful_counter": 0,
                "similarity_score": "0.89",
                "title": "List of cognitive biases",
                "uri": "https://en.wikipedia.org/wiki/List_of_cognitive_biases"
            }
        },
        {
            "data": {
                "abstract": "In statistics, naive Bayes classifiers are a family of linear \"probabilistic classifiers\" based on applying Bayes' theorem with strong (naive) independence assumptions between the features (see Bayes classifier). They are among the simplest Bayesian network models, but coupled with kernel density estimation, they can achieve high accuracy levels.Naive Bayes classifiers are highly scalable, requiring a number of parameters linear in the number of variables (features/predictors) in a learning problem. Maximum-likelihood training can be done by evaluating a closed-form expression,: 718  which takes linear time, rather than by expensive iterative approximation as used for many other types of classifiers.\nIn the statistics literature, naive Bayes models are known under a variety of names, including simple Bayes and independence Bayes. All these names reference the use of Bayes' theorem in the classifier's decision rule, but naive Bayes is not (necessarily) a Bayesian method.\n\n",
                "helpful_counter": 0,
                "id": "https://en.wikipedia.org/wiki/Naive_Bayes_classifier",
                "keyphrases": [
                    "naive bayes classifier",
                    "naive bayes models",
                    "bayes classifier",
                    "naive bayes",
                    "independence bayes",
                    "simple bayes",
                    "bayes",
                    "probabilistic classifiers",
                    "classifiers",
                    "simplest bayesian network models",
                    "naive",
                    "kernel density estimation",
                    "expensive iterative approximation",
                    "high accuracy levels",
                    "many other types"
                ],
                "labels": [
                    "Resource",
                    "Article"
                ],
                "not_helpful_counter": 0,
                "similarity_score": "0.88",
                "title": "Naive Bayes classifier",
                "uri": "https://en.wikipedia.org/wiki/Naive_Bayes_classifier"
            }
        },
        {
            "data": {
                "abstract": "In statistics, the phi coefficient (or mean square contingency coefficient and denoted by φ or rφ) is a measure of association for two binary variables.\nIn machine learning, it is known as the Matthews correlation coefficient (MCC) and used as a measure of the quality of binary (two-class) classifications, introduced by biochemist Brian W. Matthews in 1975.Introduced by Karl Pearson, and also known as the Yule phi coefficient from its introduction by Udny Yule in 1912 this measure is similar to the Pearson correlation coefficient in its interpretation. \n\n",
                "helpful_counter": 0,
                "id": "https://en.wikipedia.org/wiki/Phi_coefficient",
                "keyphrases": [
                    "yule phi coefficient",
                    "pearson correlation coefficient",
                    "matthews correlation coefficient",
                    "phi coefficient",
                    "square contingency coefficient",
                    "biochemist brian w. matthews",
                    "karl pearson",
                    "udny yule",
                    "binary variables",
                    "measure",
                    "machine learning",
                    "binary",
                    "class",
                    "similar",
                    "classifications"
                ],
                "labels": [
                    "Resource",
                    "Article"
                ],
                "not_helpful_counter": 0,
                "similarity_score": "0.90",
                "title": "Phi coefficient",
                "uri": "https://en.wikipedia.org/wiki/Phi_coefficient"
            }
        },
        {
            "data": {
                "abstract": "In statistical analysis of binary classification, the F-score or F-measure is a measure of a test's accuracy. It is calculated from the precision and recall of the test, where the precision is the number of true positive results divided by the number of all positive results, including those not identified correctly, and the recall is the number of true positive results divided by the number of all samples that should have been identified as positive. Precision is also known as positive predictive value, and recall is also known as sensitivity in diagnostic binary classification. \nThe F1 score is the harmonic mean of the precision and recall. It thus symmetrically represents both precision and recall in one metric. The more generic \n  \n    \n      \n        \n          F\n          \n            β\n          \n        \n      \n    \n    {\\displaystyle F_{\\beta }}\n   score applies additional weights, valuing one of precision or recall more than the other.\nThe highest possible value of an F-score is 1.0, indicating perfect precision and recall, and the lowest possible value is 0, if either precision or recall are zero.\n\n",
                "helpful_counter": 0,
                "id": "https://en.wikipedia.org/wiki/F-score",
                "keyphrases": [
                    "positive predictive value",
                    "true positive results",
                    "perfect precision",
                    "f1 score",
                    "diagnostic binary classification",
                    "highest possible value",
                    "lowest possible value",
                    "precision",
                    "score",
                    "positive results",
                    "binary classification",
                    "f",
                    "recall",
                    "positive",
                    "\\displaystyle f_{\\beta"
                ],
                "labels": [
                    "Resource",
                    "Article"
                ],
                "not_helpful_counter": 0,
                "similarity_score": "0.89",
                "title": "F-score",
                "uri": "https://en.wikipedia.org/wiki/F-score"
            }
        },
        {
            "data": {
                "abstract": "Principal component analysis (PCA) is a popular technique for analyzing large datasets containing a high number of dimensions/features per observation, increasing the interpretability of data while preserving the maximum amount of information, and enabling the visualization of multidimensional data. Formally, PCA is a statistical technique for reducing the dimensionality of a dataset. This is accomplished by linearly transforming the data into a new coordinate system where (most of) the variation in the data can be described with fewer dimensions than the initial data. Many studies use the first two principal components in order to plot the data in two dimensions and to visually identify clusters of closely related data points. Principal component analysis has applications in many fields such as population genetics, microbiome studies, and atmospheric science.The principal components of a collection of points in a real coordinate space are a sequence of \n  \n    \n      \n        p\n      \n    \n    {\\displaystyle p}\n   unit vectors, where the \n  \n    \n      \n        i\n      \n    \n    {\\displaystyle i}\n  -th vector is the direction of a line that best fits the data while being orthogonal to the first \n  \n    \n      \n        i\n        −\n        1\n      \n    \n    {\\displaystyle i-1}\n   vectors. Here, a best-fitting line is defined as one that minimizes the average squared perpendicular distance from the points to the line. These directions constitute an orthonormal basis in which different individual dimensions of the data are linearly uncorrelated. Principal component analysis is the process of computing the principal components and using them to perform a change of basis on the data, sometimes using only the first few principal components and ignoring the rest.\nIn data analysis, the first principal component of a set of  \n  \n    \n      \n        p\n      \n    \n    {\\displaystyle p}\n   variables, presumed to be jointly normally distributed, is the derived variable formed as a linear combination of the original variables that explains the most variance. The second principal component explains the most variance in what is left once the effect of the first component is removed, and we may proceed through  \n  \n    \n      \n        p\n      \n    \n    {\\displaystyle p}\n   iterations until all the variance is explained. PCA is most commonly used when many of the variables are highly correlated with each other and it is desirable to reduce their number to an independent set.\nPCA is used in exploratory data analysis and for making predictive models. It is commonly used for dimensionality reduction by projecting each data point onto only the first few principal components to obtain lower-dimensional data while preserving as much of the data's variation as possible. The first principal component can equivalently be defined as a direction that maximizes the variance of the projected data. The \n  \n    \n      \n        i\n      \n    \n    {\\displaystyle i}\n  -th principal component can be taken as a direction orthogonal to the first \n  \n    \n      \n        i\n        −\n        1\n      \n    \n    {\\displaystyle i-1}\n   principal components that maximizes the variance of the projected data.\nFor either objective, it can be shown that the principal components are eigenvectors of the data's covariance matrix. Thus, the principal components are often computed by eigendecomposition of the data covariance matrix or singular value decomposition of the data matrix. PCA is the simplest of the true eigenvector-based multivariate analyses and is closely related to factor analysis. Factor analysis typically incorporates more domain-specific assumptions about the underlying structure and solves eigenvectors of a slightly different matrix. PCA is also related to canonical correlation analysis (CCA). CCA defines coordinate systems that optimally describe the cross-covariance between two datasets while PCA defines a new orthogonal coordinate system that optimally describes variance in a single dataset. Robust and L1-norm-based variants of standard PCA have also been proposed.\n\n",
                "helpful_counter": 0,
                "id": "https://en.wikipedia.org/wiki/Principal_component_analysis",
                "keyphrases": [
                    "principal component analysis",
                    "first few principal components",
                    "first principal component",
                    "second principal component",
                    "exploratory data analysis",
                    "principal components",
                    "data analysis",
                    "data covariance matrix",
                    "related data points",
                    "data point",
                    "data matrix",
                    "dimensional data",
                    "first component",
                    "multidimensional data",
                    "initial data"
                ],
                "labels": [
                    "Resource",
                    "Article"
                ],
                "not_helpful_counter": 0,
                "similarity_score": "0.87",
                "title": "Principal component analysis",
                "uri": "https://en.wikipedia.org/wiki/Principal_component_analysis"
            }
        },
        {
            "data": {
                "abstract": "A receiver operating characteristic curve, or ROC curve, is a graphical plot that illustrates the performance of a binary classifier model (can be used for multi class classification as well) at varying threshold values.\nThe ROC curve is the plot of the true positive rate (TPR) against the false positive rate (FPR) at each threshold setting.\nThe ROC can also be thought of as a plot of the statistical power as a function of the Type I Error of the decision rule (when the performance is calculated from just a sample of the population, it can be thought of as estimators of these quantities). The ROC curve is thus the sensitivity or recall as a function of false positive rate. \nGiven the probability distributions for both true positive and false positive are known, the ROC curve is obtained as the cumulative distribution function (CDF, area under the probability distribution from \n  \n    \n      \n        −\n        ∞\n      \n    \n    {\\displaystyle -\\infty }\n   to the discrimination threshold) of the detection probability in the y-axis versus the CDF of the false positive probability on the x-axis.\nROC analysis provides tools to select possibly optimal models and to discard suboptimal ones independently from (and prior to specifying) the cost context or the class distribution. ROC analysis is related in a direct and natural way to cost/benefit analysis of diagnostic decision making.\n\n",
                "helpful_counter": 0,
                "id": "https://en.wikipedia.org/wiki/Receiver_operating_characteristic",
                "keyphrases": [
                    "false positive probability",
                    "false positive rate",
                    "roc curve",
                    "roc analysis",
                    "true positive rate",
                    "false positive",
                    "cumulative distribution function",
                    "probability distributions",
                    "true positive",
                    "characteristic curve",
                    "roc",
                    "class distribution",
                    "binary classifier model",
                    "detection probability",
                    "benefit analysis"
                ],
                "labels": [
                    "Resource",
                    "Article"
                ],
                "not_helpful_counter": 0,
                "similarity_score": "0.88",
                "title": "Receiver operating characteristic",
                "uri": "https://en.wikipedia.org/wiki/Receiver_operating_characteristic"
            }
        },
        {
            "data": {
                "abstract": "In applied mathematics, topological data analysis (TDA) is an approach to the analysis of datasets using techniques from topology. Extraction of information from datasets that are high-dimensional, incomplete and noisy is generally challenging. TDA provides a general framework to analyze such data in a manner that is insensitive to the particular metric chosen and provides dimensionality reduction and robustness to noise.  Beyond this, it inherits functoriality, a fundamental concept of modern mathematics, from its topological nature, which allows it to adapt to new mathematical tools.The initial motivation is to study the shape of data. TDA has combined algebraic topology and other tools from pure mathematics to allow mathematically rigorous study of \"shape\". The main tool is persistent homology, an adaptation of homology to point cloud data. Persistent homology has been applied to many types of data across many fields. Moreover, its mathematical foundation is also of theoretical importance. The unique features of TDA make it a promising bridge between topology and geometry.",
                "helpful_counter": 0,
                "id": "https://en.wikipedia.org/wiki/Topological_data_analysis",
                "keyphrases": [
                    "topological data analysis",
                    "new mathematical tools",
                    "such data",
                    "cloud data",
                    "topological nature",
                    "algebraic topology",
                    "mathematical foundation",
                    "pure mathematics",
                    "applied mathematics",
                    "data",
                    "modern mathematics",
                    "topology",
                    "persistent homology",
                    "tda",
                    "other tools"
                ],
                "labels": [
                    "Resource",
                    "Article"
                ],
                "not_helpful_counter": 0,
                "similarity_score": "0.90",
                "title": "Topological data analysis",
                "uri": "https://en.wikipedia.org/wiki/Topological_data_analysis"
            }
        }
    ]
}