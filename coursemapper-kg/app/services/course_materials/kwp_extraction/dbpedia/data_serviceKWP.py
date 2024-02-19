# from kwp_extraction.dbpedia.concept_tagging import DBpediaSpotlight
from ...pdfextractor.text_extractor import PDFTextExtractor
from ...db.neo4_db import NeoDataBase
from ...kwp_extraction.model import KeyphraseExtractor
from ...exceptions.exceptions import PreprocessingException
from ...kwp_extraction.dbpedia.dataAvailability import FoundAtDBpediaSpotlight
from config import Config

import os
import logging
from log import LOG

logger = LOG(name=__name__, level=logging.DEBUG)

ALLOWED_EXTENSIONS = {"pdf"}


class DataService1:
    def __init__(self):
        # NEO4J_URI = os.environ.get("NEO4J_URI")
        # # NEO4J_URI = "bolt://localhost:7687"
        # NEO4J_USER = os.environ.get("NEO4J_USER")
        # # NEO4J_USER = "neo4j"
        # NEO4J_PASSWORD = os.environ.get("NEO4J_PW")
        # # NEO4J_PASSWORD = "root"

        # self.db = NeoDataBase(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
        neo4j_uri = Config.NEO4J_URI
        neo4j_user = Config.NEO4J_USER
        neo4j_pass = Config.NEO4J_PASSWORD

        self.db = NeoDataBase(neo4j_uri, neo4j_user, neo4j_pass)

    def _get_data(
        self,
        materialId,
        materialName,
        file,
        model_name,
        top_n=5,
        #   with_category=True,
        #   with_property=True,
        #   with_doc_sim=True,
        #   whole_text=False
    ):
        """ """

        print("***************************")
        print("hello from kwp data service")
        print("***************************")

        if self.db.lm_exists(materialId):
            print("hello from PDF file already exists")
            logger.info("Found learning material '%s" % materialId)
            concepts, relations = self.db.get_concepts_and_relationships(materialId)

            ser_data = get_serialized_data(concepts, relations)

            return ser_data
        else:
            print("hello from PDF file NOT exist")
            logger.info("Could not find learning material '%s" % materialId)
            if file and is_file_allowed(file.filename):
                try:
                    pdf_extractor = PDFTextExtractor()
                    text, slide_nodes = pdf_extractor.extract_text(file)
                    print("text has been extracted")

                    if not model_name or model_name == "":
                        extractor = KeyphraseExtractor()
                    else:
                        extractor = KeyphraseExtractor(embedding_model=model_name)

                    keyphrases = extractor.extract_keyphrases(
                        text=text,
                        top_n=top_n,
                        use_doc_segmentation=True,
                        use_embedding_alignment=True,
                    )
                    # print('#################################')
                    # print('keyphrases are')
                    # print(keyphrases)
                    kwp = {}
                    serConcepts = []
                    serScores = []
                    # extracting only kwp:
                    for element in keyphrases:
                        elementList = list(element)
                        for i in elementList:
                            if type(i) is str:
                                serConcepts.append(i)
                    # extracting only scores:
                    for element in keyphrases:
                        elementList = list(element)
                        for i in elementList:
                            if type(i) is float:
                                serScores.append(i)

                    kwp["concepts"] = serConcepts
                    # kwp['scores'] = serScores
                    # print (kwp)
                    # print('#################################')

                    conceptFound = FoundAtDBpediaSpotlight()
                    finalKwp = conceptFound.kwpAvailable(keyphrases=serConcepts)
                    # print('finalKwp is', flush=True)
                    # print(finalKwp)

                    kwp["concepts"] = finalKwp
                    return kwp
                    #################################
                except ValueError as e:
                    logger.error(
                        "%s is not a valid TransformerWordEmbeddings model" % model_name
                    )
                except Exception as e:
                    logger.error(
                        "Failed extracting graph data for material '%s' - %s"
                        % (materialId, e)
                    )
            else:
                logger.error("Could not process invalid file %s" % file)
                raise PreprocessingException(
                    "Invalid File. Please upload only %s file" % ALLOWED_EXTENSIONS
                )

    def _get_graph(
        self,
        materialId,
        materialName,
        concepts,
        file,
        model_name,
        userId,
        userEmail,
        username,
        top_n=5,
        with_category=True,
        with_property=True,
        with_doc_sim=True,
        whole_text=False,
    ):
        """ """
        try:
            print("extracting pdf")
            pdf_extractor = PDFTextExtractor()
            text = pdf_extractor.extract_text(file)
            listConcepts = list(concepts.split(","))  # string of concepts into list
            finalList = []
            # adding scores:
            print("concepts to list")
            for concept in listConcepts:
                finalList = finalList + [(concept, float(1))]

            print("before building path")
            dbpedia = FoundAtDBpediaSpotlight()
            nodes = dbpedia.buildPath(
                materialId=materialId,
                keyphrases=finalList,
                text=text,
                with_category=with_category,
                with_property=with_property,
                with_doc_sim=with_doc_sim,
                whole_text=whole_text,
            )
            print("after building path")
            # print(nodes)
            # with open('nodesText.txt','w') as f:
            #     for node in nodes:
            #         f.write(str(node))
            #         f.write('\n')

            concepts, relations = self.db.get_or_create_concepts_and_relationships(
                materialId, materialName, nodes
            )

            ser_data = get_serialized_data(concepts, relations)
            return ser_data
        except ValueError as e:
            logger.error(
                "%s is not a valid TransformerWordEmbeddings model" % model_name
            )
        except Exception as e:
            logger.error(
                "Failed extracting graph data for material '%s' - %s" % (materialId, e)
            )


def get_serialized_data(concepts, relations):
    """ """
    data = {}
    ser_concepts = []
    ser_realations = []

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


def is_file_allowed(filename):
    return "." in filename and filename.split(".")[-1].lower() in ALLOWED_EXTENSIONS
