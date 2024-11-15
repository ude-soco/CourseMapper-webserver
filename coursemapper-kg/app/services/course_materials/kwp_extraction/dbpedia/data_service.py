from ...pdfextractor.text_extractor import PDFTextExtractor
from ...GCN.gcn import GCN
from ...Relational_ConceptGCN.relational_conceptgcn_rrgcn import RRGCN
import json
import numpy as np

from ..singlerank_method.singlerank import SingleRank
from .concept_tagging import DBpediaSpotlight
from ...db.neo4_db import NeoDataBase
from ..model import KeyphraseExtractor
from ...exceptions.exceptions import PreprocessingException
from matplotlib import pyplot as plt
from config import Config

import pandas as pd
import csv
import re

# global kwpCandidates
# kwpCandidates=pd.DataFrame()
# # kwpCandidates=pd.DataFrame([{'keyphrase_1','keyphrase_2','keyphrase_3','keyphrase_4','keyphrase_5','keyphrase_6','keyphrase_7','keyphrase_8','keyphrase_9','keyphrase_10','keyphrase_11','keyphrase_12','keyphrase_13','keyphrase_14','keyphrase_15'}])
# global annotatedConcepts
# annotatedConcepts=pd.DataFrame()
# # annotatedConcepts=pd.DataFrame([{'concept_1','concept_2','concept_3','concept_4','concept_5'}])
# global annotatedConceptsNoEmbeddingSim
# annotatedConceptsNoEmbeddingSim=pd.DataFrame()
# global kwpCandidatesTopDown
# kwpCandidatesTopDown=pd.DataFrame()
# global annotatedConceptsPerSlide
# annotatedConceptsPerSlide=pd.DataFrame()

totalKeyphrasesLength = 0
totalKeyphrases = []
totalConcepts = []
conceptsWithWeight = []
allConceptsForEachSlide = []

import time
import os

import logging
from log import LOG

logger = LOG(name=__name__, level=logging.DEBUG)

ALLOWED_EXTENSIONS = {"pdf"}


class DataService:
    def __init__(self):
        neo4j_uri = Config.NEO4J_URI
        neo4j_user = Config.NEO4J_USER
        neo4j_pass = Config.NEO4J_PASSWORD
            
        self.db = NeoDataBase(neo4j_uri, neo4j_user, neo4j_pass)
        # start_time = time.time()
        # NEO4J_URI = current_app.config.get("NEO4J_URI") # type: ignore
        # NEO4J_USER = current_app.config.get("NEO4J_USER") # type: ignore
        # NEO4J_PASSWORD = current_app.config.get("NEO4J_PASSWORD") # type: ignore
        # NEO4J_URI = os.environ.get("NEO4J_URI")
        # NEO4J_URI = "bolt://localhost:7687"
        # end_time = time.time()
        # print("NEO4J_URI Execution time: ", end_time - start_time, flush=True)

        # NEO4J_USER = os.environ.get("NEO4J_USER")
        # NEO4J_USER = "neo4j"
        # end_time = time.time()
        # print("NEO4J_USER Execution time: ", end_time - start_time, flush=True)

        # NEO4J_PASSWORD = os.environ.get("NEO4J_PW")
        # NEO4J_PASSWORD = "1234qwer!"
        # end_time = time.time()
        # print("NEO4J_PASSWORD Execution time: ", end_time - start_time, flush=True)
        # self.db = NeoDataBase(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
        # print("NeoDataBase Execution time: ", end_time - start_time, flush=True)

        self.dbpedia = DBpediaSpotlight()
        # print("DBpediaSpotlight Execution time: ", end_time - start_time, flush=True)

        self.slide_text = ""
        self.slide_concepts = []
        # print("slide_concepts Execution time: ", end_time - start_time, flush=True)

    def _extract_vector_relation(self, mid):
        self.db.extract_vector_relation(mid)

    def _set_user_concept_relationship(self, concept_id, user_id, relation_type):
        self.db.get_or_create_user_concept_relationship(
            concept_id, user_id, relation_type
        )

    def _get_data(
        self,
        materialId,
        materialName,
        file,
        model_name,
        with_property,
        whole_text,
        top_n=5,
        with_category=True,
        with_doc_sim=True,
    ):
        """ """
        if self.db.lm_exists(materialId):
            logger.info("Found learning material '%s" % materialId)
            concepts, relations = self.db.get_concepts_and_relationships(materialId)
            ser_data = get_serialized_data(concepts, relations)
            return ser_data
        else:
            logger.info("Could not find learning material '%s" % materialId)

            try:
                pdf_extractor = PDFTextExtractor()
                lm_text = pdf_extractor.extract_text(file)
                Pages = pdf_extractor.get_pagenumbers(file)
                # Build slide KG one by one, each slide KG just contain main concept, no related concept, no category
                start_time = time.time()
                for Page in range(1, Pages + 1):
                    ser_data = self._get_dataSlide(
                        material_id=materialId,
                        material_name=materialName,
                        file=file,
                        current_page=Page,
                        lm_text=lm_text,
                        model_name=model_name,
                        top_n=15,
                        with_category=False,
                        with_property=False,  # concept expansion
                        whole_text=False,  # true avoids extracting keyphrases
                    )
                end_time = time.time()

                global totalKeyphrasesLength
                print("Number of extracted keyphrases: ", totalKeyphrasesLength)
                global totalKeyphrases
                print(
                    "number of unique extracted keyphrases is: ",
                    len(totalKeyphrases),
                )

                global totalConcepts
                print("number of unique main-concepts is: ", len(totalConcepts))
                global conceptsWithWeight
                for concept in conceptsWithWeight:
                    print(concept["name"])
                    print(concept["weight"])
                print("End of unordered concepts")

                global allConceptsForEachSlide
                print(
                    "total values for this materials: "
                    + str(len(allConceptsForEachSlide))
                )

                print(
                    "Build all slide kg Execution time: ",
                    end_time - start_time,
                    flush=True,
                )
                concepts = self.db.retrieve_all_main_concepts(materialId)

                ## Activate if only a specific amount of expanded concepts is needed, and dectivate the following 2-lines
                # threshold = 15
                # top_concepts = sorted(concepts, key=lambda x: x["weight"], reverse=True)[0:threshold]
                # other_concepts = sorted(concepts, key=lambda x: x["weight"], reverse=True)[threshold:]

                other_concepts = []  # if not all concepts need to be expanded
                top_concepts = sorted(
                    concepts, key=lambda x: x["weight"], reverse=True
                )
                print("sorted")

                ##Rank main concepts based on weight: highset weight --> rank=1
                rank = 1
                for node in top_concepts:
                    node["rank"] = rank
                    rank += 1
                print("ranked")

                ## Update main concepts values by assigning rank attribute
                try:
                    # Assign rank to nodes
                    for node in top_concepts:
                        self.db.update_concept(node)
                except e:
                    print("unable to update more!")
                    print("Received Error Message: ", e)

                ## Expand concepts one by one (build relations)
                total_counter = 0
                top_concepts_bulk = []
                try:
                    for node in top_concepts:  # foreach node
                        top_concepts_bulk.append(node)  # append node to list
                        print("expanding nodes at index: ", total_counter)
                        total_counter += 1  # if error occured, the index of node with error could be known from "total_counter". Also, this var could be used if expansion is needed for more than one node at a time: if(total_counter==x):expand for x nodes
                        self.get_related_category(
                            mid=materialId,
                            text=lm_text,
                            annotations=top_concepts_bulk,
                            other_concepts=other_concepts,
                        )
                        top_concepts_bulk = (
                            []
                        )  # erase the value of nodes list to append new node(s)
                except e:
                    print("Failed to expand at index: ", total_counter)
                    print("Received Error Message: ", e)

                end_time = time.time()
                print(
                    "get_related_category Execution time: ",
                    end_time - start_time,
                    flush=True,
                )

                # use GCN to get final embedding of each node
                start_time = time.time()
                logger.info("GCN")
                print("start extraction")
                self._extract_vector_relation(materialId)
                print("End extraction")
                print("initiate GCN class")
                gcn = RRGCN()
                print("done initiate GCN class")
                print("load gcn data")
                gcn.rrgcn_1_2()
                print("done load gcn data")
                end_time = time.time()
                print("use gcn Execution time: ", end_time - start_time, flush=True)

                # self.save_data(materialId,Pages)
                concepts, relations = self.db.get_concepts_and_relationships(
                    materialId
                )
                ser_data = get_serialized_data(concepts, relations)
                return ser_data
            except ValueError as e:
                logger.error(
                    "%s is not a valid TransformerWordEmbeddings model" % model_name
                )
            except Exception as e:
                logger.error(
                    "Failed extracting graph data for material '%s' - %s"
                    % (materialId, e)
                )

    def _get_dataSlide(
        self,  # Building a KG for current slide "Extending KG by Amr"
        material_id,
        material_name,
        file,
        current_page,
        model_name,
        with_property,
        whole_text,
        top_n=5,
        lm_text="",
        with_category=True,
        with_doc_sim=True,
    ):
        """ """
        try:
            current_page = int(current_page)
            logger.info("current_page '%s" % current_page)
        except Exception as e:
            logger.error("Failed parse page number  '%s' to int %s" % (current_page, e))
        slide_id = str(material_id) + "_slide_" + str(current_page)
        # self.db.get_or_create_user(user_id=user_id, username=username, user_email=user_email)

        if self.db.slide_exists(slide_id):
            logger.info("Found slide '%s" % slide_id)

            concepts, relations = self.db.get_or_create_concepts_and_relationships(
                slide_id=slide_id,
                material_id=material_id,
                material_name=material_name,
                data=[],
            )
            ser_data = get_serialized_data(concepts, relations)

            logger.info(ser_data)
            return ser_data

        else:
            logger.info("Could not find Slide '%s" % slide_id)

            try:
                pdf_extractor = PDFTextExtractor()
                self.slide_text = pdf_extractor.extract_text_on_page(
                    file, current_page
                )

                name = "slide_" + str(current_page)
                slide_node = {
                    "slide_id": slide_id,
                    "name": name,
                    "slide_text": self.slide_text,
                    "mid": material_id,
                    "initial_embedding": "",
                    "type": "Slide",
                }
                keyphrases = []
                start_time = time.time()
                if not whole_text:
                    if not model_name or model_name == "":
                        extractor = KeyphraseExtractor()
                    elif model_name == "singlerank":
                        print("singleRank slide level activated")
                        print("Current page is: ", current_page)
                        pos = {"NOUN", "PROPN", "ADJ"}
                        extractor = SingleRank()
                        extractor.load_document(
                            input=self.slide_text, language="en"
                        )
                        extractor.candidate_selection(pos=pos)
                        extractor.candidate_weighting(window=10, pos=pos)
                        keyphrases = extractor.get_n_best(n=top_n)

                    else:
                        print(
                            model_name
                            + " is activated for page: "
                            + str(current_page)
                        )
                        extractor = KeyphraseExtractor(embedding_model=model_name)
                        keyphrases = extractor.extract_keyphrases(
                            text=self.slide_text,
                            top_n=top_n,
                            use_doc_segmentation=True,
                            use_embedding_alignment=True,
                        )
                end_time = time.time()
                print(
                    "Extract_keyphrases Execution time: ",
                    end_time - start_time,
                    flush=True,
                )

                # Count new unique keyphrases
                global totalKeyphrases
                print(
                    "number of extracted keyphrases befor appending is: ",
                    len(totalKeyphrases),
                )
                # Append only unique keyphrases to be counted
                for k in keyphrases:
                    if k not in totalKeyphrases:
                        totalKeyphrases.append(k)

                print(
                    "number of extracted keyphrases after appending is: ",
                    len(totalKeyphrases),
                )

                global totalKeyphrasesLength
                totalKeyphrasesLength += len(keyphrases)

                nodes = self.dbpedia.build_path(
                    materialId=material_id,
                    text=self.slide_text,
                    lm_text=lm_text,
                    keyphrases=keyphrases,
                    with_category=with_category,
                    with_property=with_property,
                    with_doc_sim=with_doc_sim,
                    whole_text=whole_text,
                )

                # Count new unique extracted concepts
                global totalConcepts
                global conceptsWithWeight
                global allConceptsForEachSlide
                print(
                    "number of extracted concepts befor appending is: ",
                    len(totalConcepts),
                )
                # Append only unique extracted concepts to be counted
                for n in nodes:
                    allConceptsForEachSlide.append(n["name"])
                    if n["id"] not in totalConcepts:
                        totalConcepts.append(n["id"])
                        conceptsWithWeight.append(n)
                print(
                    "number of extracted concepts after appending is: ",
                    len(totalConcepts),
                )

                self.slide_concepts = [node["name"] for node in nodes]
                slide_node["initial_embedding"] = self.dbpedia._get_embeddings(
                    self.slide_text
                )
                sum_embeddings, sum_weights = 0, 0
                for node in nodes:
                    sum_embeddings = (
                        sum_embeddings
                        + np.array(node["initial_embedding"]) * node["slide_weight"]
                    )
                    sum_weights = sum_weights + node["slide_weight"]
                slide_node["weighted_embedding_of_concept"] = np.divide(
                    sum_embeddings, sum_weights
                )
                # logger.info("nodes", nodes)
                # logger.debug("3______________Concept Identification")
                (
                    concepts,
                    relations,
                ) = self.db.get_or_create_concepts_and_relationships(
                    slide_id=slide_id,
                    material_id=material_id,
                    material_name=material_name,
                    data=nodes,
                    slide_text=self.slide_text,
                    lm_text=lm_text,
                    slide_node=slide_node,
                    slide_concepts=self.slide_concepts,
                )

                # for concept in concepts:
                # related_videos = self.youtube.get_videos_related_to_concept(concept.name)
                # logger.info("Concept's name extracted: %s", concepts.name)
                # logger.info("Related videos: %s", related_videos)
                logger.debug("6______________Serialization")

                ser_data = get_serialized_data(concepts, relations)
                logger.debug("6______________Serialization End")
                # logger.info(ser_data)
                return ser_data
            except ValueError as e:
                logger.error(
                    "%s is not a valid TransformerWordEmbeddings model" % model_name
                )
            except Exception as e:
                logger.error(
                    "Failed extracting graph data for material '%s' - %s"
                    % (material_id, e)
                )

    def _set_concept_as_not_understood(self, conceptId, userId):
        relation_type = "NOT_UNDERSTOOD"

        self.db.create_user_concept_relationship(userId, conceptId, relation_type)

    def relationships_complement(self, mid):
        all_annotations = self.db.get_all_concepts(mid)
        annotations = self.db.get_related_category_of_main_concept(mid)
        all_annotations = self.dbpedia.check_relationship(annotations, all_annotations)
        self.db.relationships_complement(all_annotations)
        self.db.built_bi_directional_relationships(mid)

    def get_related_category(self, mid, text, annotations, other_concepts=[]):
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

    def save_data(self, materialId, Pages):
        dic = {}
        for Page in range(1, Pages + 1):
            slide_id = str(materialId) + "_slide_" + str(Page)
            slide_concept_list = self.db.get_concepts_of_slide(sid=slide_id)
            value = slide_concept_list[0]["concepts"]
            key = slide_concept_list[0]["name"]
            dic[key] = value
        concepts = self.db.retrieve_all_main_concepts(materialId)
        threshold = 15
        lm_list = sorted(concepts, key=lambda x: x["weight"], reverse=True)[0:threshold]
        lm_concept_list = []
        for i in lm_list:
            lm_concept_list.append(i["name"])
        key = materialId
        dic[key] = lm_concept_list
        print(dic)
        with open("my_file.csv", "w") as f:
            [f.write("{0},{1}\n".format(key, value)) for key, value in dic.items()]


def save_plot_data(data, file):
    x = data.index  # Sample data.

    # Note that even in the OO-style, we use `.pyplot.figure` to create the Figure.
    fig, ax = plt.subplots(figsize=(10, 5), layout="constrained")
    ax.plot(x, data["concept_based_similarity"], label="concept_based_similarity")
    ax.plot(x, data["document_based_similarity"], label="document_based_similarity")
    ax.plot(x, data["fused_similarity"], label="fused_similarity")

    # ax.plot(x, data["user_concept_based_similarity"], label='user_concept_based_similarity')
    # ax.plot(x, data["user_document_based_similarity"], label='user_document_based_similarity')
    # ax.plot(x, data["fused_user_similarity"], label='fused_user_similarity')

    ax.set_ylabel("Cosine Similarity")  # Add an x-label to the axes.
    ax.set_xlabel("index")  # Add a y-label to the axes.
    ax.set_title("Similarity Plot")  # Add a title to the axes.
    ax.legend()
    # Add a legend.

    fig.savefig(file, bbox_inches="tight")


def plot_distribution_chart(data, similarity_type, file=""):
    # Generate two normal distributions
    dist = data[similarity_type]

    fig, ax = plt.subplots(figsize=(10, 7), sharey=True, tight_layout=True)

    # We can set the number of bins with the *bins* keyword argument.
    ax.hist(dist)
    ax.set_title("Similarity Distribution \nType: %s" % similarity_type)

    if len(file) != 0:
        fig.savefig(file, bbox_inches="tight")


def get_serialized_data(concepts, relations):
    """ """
    data = {}
    ser_concepts = []
    ser_realations = []
    # "id": str(concept["cid"]),
    for concept in concepts:
        c = {
            "name": concept["name"],
            "id": concept["id"],
            "weight": concept["weight"],
            "uri": concept["uri"],
            "type": concept["type"],
            "wikipedia": concept["wikipedia"],
            "abstract": concept["abstract"],
        }
        ser_concepts.append({"data": c})

    for relation in relations:
        r = {
            "type": relation["type"],
            "source": relation["source"],
            "target": relation["target"],
            "weight": relation["weight"],
        }
        ser_realations.append({"data": r})

    data["nodes"] = ser_concepts
    data["edges"] = ser_realations

    return data
