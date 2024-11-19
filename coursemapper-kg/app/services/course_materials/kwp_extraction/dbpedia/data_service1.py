from ...conceptrecommentation.recommendation import Recommendation
from ...conceptrecommentation.sequence_recommendation import Sequence_recommendation
from ..dbpedia.concept_tagging import DBpediaSpotlight
from ...db.neo4_db import NeoDataBase
import time
import os

import logging
from log import LOG
from config import Config

logger = LOG(name=__name__, level=logging.DEBUG)

ALLOWED_EXTENSIONS = {"pdf"}


class RecService:
    def __init__(self):
        # NEO4J_URI = os.environ.get('NEO4J_URI')
        # # NEO4J_URI = "bolt://localhost:7687"
        # NEO4J_USER = os.environ.get('NEO4J_USER')
        # # NEO4J_USER = "neo4j"
        # NEO4J_PASSWORD = os.environ.get('NEO4J_PW')
        # # NEO4J_PASSWORD = "root"
        # self.db = NeoDataBase(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
        neo4j_uri = Config.NEO4J_URI
        neo4j_user = Config.NEO4J_USER
        neo4j_pass = Config.NEO4J_PASSWORD

        self.db = NeoDataBase(neo4j_uri, neo4j_user, neo4j_pass)

        self.recommendation = Recommendation()
        self.sequence_recommendation = Sequence_recommendation()
        self.dbpedia = DBpediaSpotlight()

    def _construct_user(self, user_id, non_understood, understood, new_concepts, mid):
        self.db.construct_user_model(
            user_id, non_understood, understood, new_concepts, mid
        )

    def _extract_vector_relation(self, mid):
        self.db.extract_vector_relation(mid)

    def _set_user_concept_relationship(self, concept_id, user_id, relation_type):
        self.db.get_or_create_user_concept_relationship(
            concept_id, user_id, relation_type
        )

    def _get_concept_recommendation_bak(self, user_id, mid):
        # Get concepts that doesn't interact with user
        concept_list = self.db.get_concept_has_not_read(user_id, mid)
        user = self.db.get_user(user_id)
        # compute the similarity between user and concepts with cos-similarity and select top-5 recommendation concept
        recommend_concepts = self.recommendation.recommend(concept_list, user, top_n=5)
        for i in recommend_concepts:
            info = i["n"]["name"] + " : " + str(i["n"]["score"])
            logger.info(info)

        # Use paths for interpretability
        recommend_concepts = self._get_road(recommend_concepts, user_id, mid)

        resp = get_serialized_concepts_data(recommend_concepts)
        return resp

    def _get_concept_recommendation(self, user_id, mid):
        # Get concepts that doesn't interact with user
        # only related to candidate concept
        concept_list = self.db.get_concept_has_not_read(user_id, mid)

        #only sequence recommendation candidate concept set
        sequence_concept_list = self.db.get_prerequisite_concept_has_not_read(user_id, mid)

        #get user ids
        user = self.db.get_user(user_id)

        # compute the similarity between user and concepts with cos-similarity and select top-5 recommendation concept
        recommend_concepts = self.recommendation.recommend(concept_list, user, top_n=5)
        for i in recommend_concepts:
            info = i["n"]["name"] + " : " + str(i["n"]["score"])
            logger.info(info)
        # Use paths for interpretability
        recommend_concepts = self._get_road(recommend_concepts, user_id, mid)
        # get related to top-5 recommended concept and interpretability path
        resp = get_serialized_concepts_data(recommend_concepts)

        #get seqence recommendation
        sequence_path = self.sequence_recommendation.sequence_recommend(sequence_concept_list, user, top_n=10)
        return resp,sequence_path
    def _get_road(self, recommend_concepts, uid, mid):
        for recommend_concept in recommend_concepts:
            cid = recommend_concept["n"]["cid"]
            ctype = recommend_concept["n"]["type"]
            if ctype == "main_concept":
                # road: user - concept - related concept - concept
                road1 = self.db.get_road_user_c_related_concept(uid, cid)
                # to avoid too many road, select the max weight path
                road1 = self.get_max_weight_path(road1)
                # road: user - concept - category - concept
                road2 = self.db.get_road_user_c_category_concept(uid, cid)
                road2 = self.get_max_weight_path(road2)
                # road: user - concept - slide - concept
                road3 = self.db.get_road_user_c_slide_concept(uid, cid, mid)
                road3 = self.get_max_weight_path(road3)
                # road: user - concept - related concept
                road4 = self.db.get_road_user_concept_relatedconcept(uid, cid)
                road4 = self.get_max_weight_path4(road4)
                roads = road1 + road2 + road3 + road4

            else:
                # road: user - concept - related concept - concept
                road1 = self.db.get_road_user_c_related_concept(uid, cid)
                # to avoid too many road, select the max weight path
                road1 = self.get_max_weight_path(road1)
                # road: user - concept - category - concept
                road2 = self.db.get_road_user_c_category_concept(uid, cid)
                road2 = self.get_max_weight_path(road2)
                # road: user - concept - related concept
                road3 = self.db.get_road_user_concept_relatedconcept(uid, cid)
                road3 = self.get_max_weight_path4(road3)
                roads = road1 + road2 + road3

            # Save these roads to "roads" property
            recommend_concept["n"]["roads"] = roads
   
        # logger.info("roads: %s" % recommend_concepts[0]["n"]["roads"])
        return recommend_concepts

    def get_max_weight_path(self, road):
        weights, max_weight, names, list = 0, 0, [], []
        for i in range(len(road)):
            # print("len(road)",len(road))
            # print("names",names)
            if road[i]["name"] not in names:
                names.append(road[i]["name"])
        for name in names:
            for i in range(len(road)):
                print("len(road)",len(road))
                print("name",name)
                if road[i]["name"] == name and road[i]["weight"] is not None:
                    weights = road[i]["weight"]
                else:
                    weights = 0
                if max_weight <= weights:
                    max_weight = weights
                    optimum_name = name
            weights = 0
        for i in range(len(road)):
            if road[i]["name"] == optimum_name and max_weight==road[i]["weight"] :
                list.append(road[i])
        return list
    def get_max_weight_path4(self, road):
        weights, max_weight, names, list = 0, 0, [], []
        for i in range(len(road)):
            # print("len(road)",len(road))
            # print("names",names)
            if road[i]["dnu"] not in names:
                names.append(road[i]["dnu"])
        for name in names:
            for i in range(len(road)):
                if road[i]["dnu"] == name:
                    weights = road[i]["weight"]
                if max_weight <= weights:
                    max_weight = weights
                    optimum_name = name
            weights = 0
        for i in range(len(road)):
            if road[i]["dnu"] == optimum_name:
                list.append(road[i])
        return list    
    
    # def get_max_weight_path(self, road):
    #     weights, max_weight, names, list = 0, 0, [], []
    #     for i in range(len(road)):
    #         # print("len(road)",len(road))
    #         # print("names",names)
    #         if road[i]["name"] not in names:
    #             names.append(road[i]["name"])
    #     for name in names:
    #         for i in range(len(road)):
    #             # print("len(road)",len(road))
    #             # print("name",name)
    #             if road[i]["name"] == name:
    #                 weights = weights + road[i]["weight"]
    #         if max_weight <= weights:
    #             max_weight = weights
    #             optimum_name = name
    #         weights = 0
    #     for i in range(len(road)):
    #         if road[i]["name"] == optimum_name:
    #             list.append(road[i])
    #     return list

    # def get_max_weight_path4(self, road):
    #     weights, max_weight, names, list = 0, 0, [], []
    #     for i in range(len(road)):
    #         print("len(road)",len(road))
    #         print("names",names)
    #         if road[i]["dnu"] not in names:
    #             names.append(road[i]["dnu"])
    #     for name in names:
    #         for i in range(len(road)):
    #             if road[i]["dnu"] == name:
    #                 weights = weights + road[i]["weight"]
    #         if max_weight <= weights:
    #             max_weight = weights
    #             optimum_name = name
    #         weights = 0
    #     for i in range(len(road)):
    #         if road[i]["dnu"] == optimum_name:
    #             list.append(road[i])
    #     return list    

    def _get_related_category(self, ids, mid):
        # find these dnu concepts in neo4j
        annotations = self.db.find_concept(ids)
        if annotations != []:
            text = self.db.get_lm_text(mid)
            # get related concepts and categories of concepts user doesn't understand
            nodes = self.dbpedia._get_related_concepts_and_categories(
                annotations=annotations,
                with_category=True,
                with_property=True,
                text=text,
            )
            # create related_concepts, categories and relationships in neo4j
            self.db.create_related_concepts_and_relationships(data=nodes)
            self.db.built_bi_directional_relationships(mid)
            # self._extract_vector_relation(mid)
            # gcn = GCN()
            # gcn.load_data()

    def get_related_category(self, mid, text, annotations, other_concepts):
        # Extract related concepts and categories of top-n main concepts.
        nodes = self.dbpedia._get_related_concepts_and_categories(
            annotations=annotations,
            with_category=True,
            with_property=True,
            text=text,
            other_concepts=other_concepts,
        )
        # creat related concepts, categories and relationships in neo4j
        self.db.create_related_concepts_and_relationships(data=nodes)


def get_serialized_concepts_data(concepts):
    """ """
    data = {}
    ser_concepts = []

    for concept in concepts:
        roads = []
        reasons = [
            {"dnu": []},
            {"name": "", "type": "Slide", "dnu": []},
            {"name": "", "type": "category", "dnu": []},
            {"name": "", "type": "related_concept", "dnu": []},
            {"name": "", "type": "Related", "dnu": []},
        ]
        for road in concept["n"]["roads"]:
            list = []
            if road["p"][2]["name"] not in reasons[0]["dnu"]:
                reasons[0]["dnu"].append(road["p"][2]["name"])

            if len(road["p"]) == 5:
                reasons[4]["name"] = road["p"][4]["name"]
                if road["p"][2]["name"] not in reasons[4]["dnu"]:
                    reasons[4]["dnu"].append(road["p"][2]["name"])
            elif road["p"][4]["type"] == "main_concept":
                reasons[3]["name"] = road["p"][4]["name"]
                if road["p"][2]["name"] not in reasons[3]["dnu"]:
                    reasons[3]["dnu"].append(road["p"][2]["name"])
            else:
                for reason in reasons[1:4]:
                    if road["p"][4]["type"] == reason["type"]:
                        reason["name"] = road["p"][4]["name"]
                        if road["p"][2]["name"] not in reason["dnu"]:
                            reason["dnu"].append(road["p"][2]["name"])

            for node in road["p"]:
                if isinstance(node, str):
                    list.append(node)
                elif node["type"] == "user":
                    n = {
                        "id": node["uid"],
                        "type": node["type"],
                    }
                    list.append(n)
                elif node["type"] == "Slide":
                    n = {
                        "name": node["name"],
                        "type": node["type"],
                    }
                    list.append(n)
                else:
                    c = {
                        "name": node["name"],
                        "id": node["cid"],
                        "uri": node["uri"],
                        "type": node["type"],
                        "wikipedia": node["wikipedia"],
                        "abstract": node["abstract"],
                    }
                    list.append(c)
            roads.append(list)

        Reasons = []
        for reason in reasons:
            if reason["dnu"] != []:
                Reasons.append(reason)

        c = {
            "name": concept["n"]["name"],
            "id": concept["n"]["cid"],
            "uri": concept["n"]["uri"],
            "type": concept["n"]["type"],
            "wikipedia": concept["n"]["wikipedia"],
            "abstract": concept["n"]["abstract"],
            "score": concept["n"]["score"],
            "roads": roads,
            "Reason": Reasons,
        }

        ser_concepts.append({"data": c})

    data["nodes"] = ser_concepts

    return data
