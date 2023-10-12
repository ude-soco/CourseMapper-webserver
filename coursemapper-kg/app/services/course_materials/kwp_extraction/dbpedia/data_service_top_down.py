import json
import numpy as np
from flask import current_app

from ...recommendation.recommender import Recommender
from ...recommendation.youtube_service import YoutubeService
from ...pdfextractor.text_extractor import PDFTextExtractor
from ...conceptrecommentation.recommendation import Recommendation
from ...GCN.gcn import GCN
from ..singlerank_method.singlerank import SingleRank
from .concept_tagging import DBpediaSpotlight
from .concept_tagging_top_down import DBpediaSpotlight as DBpediaSpotlight1
from ...db.neo4_db_top_down import NeoDataBase
from ..model_top_down import KeyphraseExtractor
from ...exceptions.exceptions import PreprocessingException

from matplotlib import pyplot as plt
from threading import Thread
import concurrent.futures
from time import sleep
import time
import os

import logging
from log import LOG
import csv

import pandas as pd
global kwpCandidatesTopDown
totalConcepts=[]
kwpCandidatesTopDown=pd.DataFrame()

uniqueNodes=[]

allConceptsForEachSlide=[]
logger = LOG(name=__name__, level=logging.DEBUG)

ALLOWED_EXTENSIONS = {'pdf'}


class DataServiceTopDown:

    def __init__(self):
        neo4j_uri = current_app.config.get("NEO4J_URI")  # type: ignore
        neo4j_user = current_app.config.get("NEO4J_USER")  # type: ignore
        neo4j_pass = current_app.config.get("NEO4J_PASSWORD")  # type: ignore

        self.db = NeoDataBase(neo4j_uri, neo4j_user, neo4j_pass)
        # start_time = time.time()
        # NEO4J_URI = os.environ.get('NEO4J_URI')
        # NEO4J_URI = "bolt://localhost:7687"
        # end_time = time.time()
        # print('NEO4J_URI Execution time: ', end_time - start_time, flush=True)

        # NEO4J_USER = os.environ.get('NEO4J_USER')
        # NEO4J_USER = "neo4j"
        # end_time = time.time()
        # print('NEO4J_USER Execution time: ', end_time - start_time, flush=True)

        # NEO4J_PASSWORD = os.environ.get('NEO4J_PW')
        # NEO4J_PASSWORD = "root"
        # end_time = time.time()
        # print('NEO4J_PASSWORD Execution time: ', end_time - start_time, flush=True)

        # self.db = NeoDataBase(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
        # print('NeoDataBase Execution time: ', end_time - start_time, flush=True)

        self.youtube_service = YoutubeService()
        # print('YoutubeService Execution time: ', end_time - start_time, flush=True)

        self.recommender = Recommender()
        # print('Recommender Execution time: ', end_time - start_time, flush=True)

        self.recommendation = Recommendation()
        # print('Recommendation Execution time: ', end_time - start_time, flush=True)

        self.dbpedia = DBpediaSpotlight()
        self.dbpedia1 = DBpediaSpotlight1()
        # print('DBpediaSpotlight Execution time: ', end_time - start_time, flush=True)

        self.slide_text = ""
        self.slide_concepts = []
        # print('slide_concepts Execution time: ', end_time - start_time, flush=True)

    def old_construct_user(self, user, non_understood, understood):
        concepts = []
        logger.info(non_understood)
        for concept_id in non_understood:
            concept = self.db.get_concept_name_by_id(str(concept_id))
            logger.info(concept)

            concept_name = concept[0]['c']['name']
            concepts.append((concept_name, 1))

        for concept_id in understood:
            concept_name = self.db.get_concept_name_by_id(str(concept_id))[0]['c']['name']
            concepts.append((concept_name, 0))

        self.db.construct_user_model(user, concepts)

    def _construct_user(self, user, non_understood, understood):
            self.db.construct_user_model(user, non_understood, understood)
        
    def _extract_vector_relation(self,mid):
        self.db.extract_vector_relation(mid)

    def _set_user_concept_relationship(self, concept_id, user_id, relation_type):
        self.db.get_or_create_user_concept_relationship(concept_id, user_id, relation_type)

    def _get_data(self,
                  materialId,
                  materialName,
                  file,
                  userId,
                  userEmail,
                  username,
                  model_name,
                  with_property,
                  whole_text,
                  top_n=100,
                  with_category=True,
                  with_doc_sim=True):
        """
        """
        if self.db.lm_exists(materialId):
            logger.info("Found learning material '%s" % materialId)
            pdf_extractor = PDFTextExtractor()
            Pages = pdf_extractor.get_pagenumbers(file)
            self.save_data(materialId,Pages)
            concepts, relations = self.db.get_concepts_and_relationships(materialId)
            ser_data = get_serialized_data(concepts, relations)         
            return ser_data
        else:
            logger.info("Could not find learning material '%s" % materialId)

            if file and is_file_allowed(file.filename):
                try:
                    pdf_extractor = PDFTextExtractor()
                    lm_text = pdf_extractor.extract_text(file)
                    # lm_text=lm_text[0:32767] #Maximum valid number of charecters for singlerank
                    print(len(lm_text))
                    # lm_text='Course Content Recommender Systems 2 What? Data, Environments, Context Why? Objectives How? Methods Who? Stakeholders Learning Analytics Machine Learning / Data Mining Social Network Analysis (SNA) Information Visualization & Visual Analytics Recommender Systems Privacy Hadoop Ecosystem Big Data Personalization Learner Modeling'

                    # get text's length for unique words (no duplicates) number of unique words
                    print('text length before removing duplicates: ',len(lm_text))
                    l=lm_text.split()
                    print('number of words before:', len(l))
                    
                    # e=[]
                    # for i in l:
                    #     if (lm_text.count(i)>=1 and (i not in e)):
                    #         e.append(i)
                    # uniqueText= ' '.join(e)
                    
                    # print('text length after removing duplicates: ',len(uniqueText))
                    # print('number of words before:', len(uniqueText.split()))
                    # return
                    Pages = pdf_extractor.get_pagenumbers(file)
                    # top_n=Pages*10 # set top_n to equal 10_times number_of_pages, then at each page only top_5 will be kept
                    start_timeKWP =time.time()
                    totalNodesNum=''
                    # kwpCandidatesTopDown.to_csv('TopDown-kwpCandidates-singlerank.csv')
                    keyphrases = []
                    keyphrasesList=[]
                    start_time1 = time.time()
                    start_time = time.time()
                    print('top-n value: ',top_n)
                    top_n=15*Pages #roughly 15 keyphrase per slide
                    print('top-n value: ',top_n)
                    print('whole_text value: ', whole_text)
                    if not whole_text:
                        print('model_name: ', model_name)
                        if not model_name or model_name == "":
                            extractor = KeyphraseExtractor()
                        elif model_name=="singlerank":
                            print('singlerank activated')
                            pos = {'NOUN', 'PROPN', 'ADJ'}
                            extractor = SingleRank()
                            extractor.load_document(input=lm_text, language='en')
                            extractor.candidate_selection(pos=pos)
                            extractor.candidate_weighting(window=10, pos=pos)
                            keyphrases = extractor.get_n_best(n=top_n)
                            print('keyphrases length is: ', len(keyphrases))
                            # return

                            # for key in keyphrases:
                            #     keyphrasesList.append(key)
                            # with open('TopDown-kwpCandidates-singlerank.csv','a') as f:
                                # f.write(str(keyphrasesList) + "\n")
                            
                            end_timeKwp=time.time()
                            print('kwp_extraction time: ', end_timeKwp-start_timeKWP)

                        else:
                            print('data_service_top_down || sifrank activated')
                            extractor = KeyphraseExtractor(
                                embedding_model=model_name)
                            keyphrases = extractor.extract_keyphrases(
                                text=lm_text,
                                top_n=top_n,
                                use_doc_segmentation=True,
                                use_embedding_alignment=True)

                    df = pd.DataFrame(keyphrases).to_csv(f'TopDown-extractedKeyphrases-sifrank-25perSlide.csv', mode='w', index=False, header=False)
                    print('keyphrases length: ', len(keyphrases))
                    print('Time to extract keyphrases: ', time.time() - start_time, flush=True)


                    all_keyphrases=keyphrases
                    nodes=[]
                    concepts_list=[]
                    keyphrasesBulk=[]
                    concepts_listBulk=[]
                    keyphrasesCounter=1
                    generalCounter=1
                    keyphrasesLength=0
                    last_element=len(all_keyphrases)

                    for keyphrase in all_keyphrases:
                        # if by appending current keyphrase, the count of charachters will remain less than 6000
                        if (keyphrasesLength + len(keyphrase[0]))<6000:
                            # append current keyphrase
                            keyphrasesBulk.append(keyphrase)
                            keyphrasesLength=keyphrasesLength + len(keyphrase[0])
                            keyphrasesCounter+=1
                        else: #Send an annotation request 
                            print('else condition')
                            print('general counter value:', generalCounter)
                            # print(keyphrasesCounter % 299)
                            # print(keyphrasesBulk)
                            nodesBulk,concepts_listBulk= self.dbpedia1.build_path1(materialId=materialId,
                                                            text='',
                                                            lm_text=lm_text,
                                                            keyphrases=keyphrasesBulk,
                                                            with_category=False,
                                                            with_property=False,
                                                            with_doc_sim=with_doc_sim,
                                                            whole_text=whole_text)
                            
                            print('finished bulk iteration')
                            if nodesBulk is not None: # avoid error of concatinating "NoneType" if remote server disconnected
                                nodes=nodes+nodesBulk
                                concepts_list=concepts_list+concepts_listBulk

                            keyphrasesCounter=1
                            keyphrasesBulk=[]
                            concepts_listBulk=[]
                            print('Keyphrases length: ',keyphrasesLength)
                            keyphrasesBulk.append(keyphrase)
                            keyphrasesLength=len(keyphrase[0])
                        
                        if (generalCounter==last_element): #last element has been reached
                            print('last element condition')
                            # print(keyphrasesBulk)
                            nodesBulk,concepts_listBulk= self.dbpedia1.build_path1(materialId=materialId,
                                                            text='',
                                                            lm_text=lm_text,
                                                            keyphrases=keyphrasesBulk,
                                                            with_category=False,
                                                            with_property=False,
                                                            with_doc_sim=with_doc_sim,
                                                            whole_text=whole_text)
                            
                            print('finished bulk iteration')
                            if nodesBulk is not None: # avoid error of concatinating "NoneType" if remote server disconnected
                                nodes=nodes+nodesBulk
                                concepts_list=concepts_list+concepts_listBulk
                        
                        generalCounter+=1

                    # nodes,concepts_list = self.dbpedia1.build_path1(materialId=materialId,
                    #                                 text=lm_text,
                    #                                 keyphrases=keyphrases,
                    #                                 with_category=False,
                    #                                 with_property=False,
                    #                                 with_doc_sim=with_doc_sim,
                    #                                 whole_text=whole_text)
                    # print('finished appending')
                    
                    print(concepts_list)
                    totalNodesNum='Number of annotated concepts: '+ str(len(nodes))
                    print('Number of annotated concepts: ', len(nodes))
                    print('Number of concepts_list: ', len(concepts_list))

                    
                    totalConceptsTopDown=[]
                    finalNodes=[]
                    totalConceptsNames=[]
                    print('number of extracted concepts befor appending is: ',len(totalConceptsTopDown))
                    for n in nodes:
                        if n['id'] not in totalConceptsTopDown:
                            totalConceptsTopDown.append(n['id'])
                            finalNodes.append(n)
                            totalConceptsNames.append(n['name'])

                    nodes=finalNodes
                    concepts_list=totalConceptsNames

                    print('number of extracted concepts after appending is: ',len(totalConceptsTopDown))

                    

                    concepts, relations = self.db.get_or_create_lm_relationships1(material_id=materialId,
                                                                                           material_name=materialName,
                                                                                           data=nodes,
                                                                                           text=lm_text)
                    end_time = time.time()
                    print('Build LM-kg ', end_time - start_time, flush=True)
                    # Build slide KG one by one, each slide KG just contain main concept, no related concept, no category
                    start_time = time.time()
                    # model_name="singlerank"
                    for Page in range(1,Pages+1):
                        ser_data = self._get_dataSlide(material_id=materialId,
                                                material_name=materialName,
                                                file=file,
                                                current_page=Page,
                                                lm_text=lm_text,
                                                nodes=nodes,
                                                concepts_list=concepts_list,
                                                model_name=model_name,
                                                top_n=15,
                                                user_id=userId,
                                                user_email=userEmail,
                                                username=username,
                                                with_category=False,
                                                with_property=False,  # concept expansion
                                                whole_text=False  # false avoids extracting keyphrases
                                                )
                    
                    print('number of words:', len(l))

                    print('keyphrases length: ', len(keyphrases))

                    global uniqueNodes
                    print('number of used nodes after building KG is: ',len(uniqueNodes))

                    global totalConcepts
                    print('number of unique main-concepts is: ',len(totalConcepts))

                    global allConceptsForEachSlide
                    print('total values for this materials: ' + str(len(allConceptsForEachSlide)))

                    end_time = time.time()
                    print('Build all slide kg Execution time: ', end_time - start_time, flush=True)
                    end_time1 = time.time()
                    print('Build LM kg Execution time: ', end_time1 - start_time1, flush=True)
                    # start_time = time.time()
                    concepts = self.db.retrieve_all_main_concepts(materialId)
                    top_concepts = sorted(concepts, key=lambda x: x["weight"], reverse=True)
                    print('sorted')

                    ##Rank main concepts based on weight: highset weight --> rank=1
                    rank=1
                    for node in top_concepts:
                        node['rank']=rank
                        rank +=1
                    print('ranked')

                     ## Update main concepts values by assigning rank attribute
                    try:
                        # Assign rank to nodes
                        for node in top_concepts:
                            self.db.update_concept(node)
                    except e:
                        print('unable to update more!')
                        print('Received Error Message: ',e)


                    # threshold = 15
                    # top_concepts = sorted(concepts, key=lambda x: x["weight"], reverse=True)[0:threshold]
                    # other_concepts = sorted(concepts, key=lambda x: x["weight"], reverse=True)[threshold:]
                    # end_time = time.time()
                    # print('get_Top-15 main concept Execution time: ', end_time - start_time, flush=True)
                    
                    # start_time = time.time()
                    # self.get_related_category(mid=materialId,text=lm_text,annotations=top_concepts,other_concepts=other_concepts)
                    # end_time = time.time()
                    # print('get_related_category Execution time: ', end_time - start_time, flush=True)

                    # # use GCN to get final embedding of each node
                    # start_time = time.time()
                    # logger.info("GCN")
                    # self._extract_vector_relation(materialId)
                    # gcn = GCN()
                    # gcn.load_data()
                    # end_time = time.time()
                    # print('use gcn Execution time: ', end_time - start_time, flush=True)

                    self.save_data(materialId,Pages)
                    concepts, relations = self.db.get_concepts_and_relationships(materialId)
                    print('Concepts length: '+ str(len(concepts)))
                    print('Relations length: '+ str(len(relations)))
                    ser_data = get_serialized_data(concepts, relations)
                    
                    print('keyphrases length: ', len(keyphrases))
                    # global uniqueNodes
                    print('number of used nodes after building KG is: ',len(uniqueNodes))
                    print('total values for this materials: ' + str(len(allConceptsForEachSlide)))
                    print(totalNodesNum)
                    return ser_data 
                except ValueError as e:
                    logger.error(
                        "%s is not a valid TransformerWordEmbeddings model" %
                        model_name)
                    print('actual error is: ', e)
                except Exception as e:
                    logger.error(
                        "Failed extracting graph data for material '%s' - %s" %
                        (materialId, e))
            else:
                logger.error("Could not process invalid file %s" % file)
                raise PreprocessingException(
                    "Invalid File. Please upload only %s file" %
                    ALLOWED_EXTENSIONS)
   
    def _get_only_keyphrases(model_name,text,top_n):
            
        extractor = KeyphraseExtractor(
                                    embedding_model=model_name)
        keyphrases = extractor.extract_keyphrases(
        text=text,
        top_n=top_n,
        use_doc_segmentation=True,
        use_embedding_alignment=True)
        return keyphrases

    def _get_dataSlide(self,  # Building a KG for current slide "Extending KG by Amr"
                       material_id,
                       material_name,
                       file,
                       current_page,
                       model_name,
                       nodes,
                       concepts_list,
                       user_id,
                       user_email,
                       username,
                       with_property,
                       whole_text,
                       top_n=5,
                       lm_text="",
                       with_category=True,
                       with_doc_sim=True
                       ):
        """
        """
        try:
            current_page = int(current_page)
            logger.info("current_page '%s" % current_page)
        except Exception as e:
            logger.error(
                "Failed parse page number  '%s' to int %s" %
                (current_page, e))
        slide_id = str(material_id) + "_slide_" + str(current_page)
        # self.db.get_or_create_user(user_id=user_id, username=username, user_email=user_email)

        if self.db.slide_exists(slide_id):
            logger.info("Found slide '%s" % slide_id)

            concepts, relations = self.db.get_or_create_concepts_and_relationships(slide_id=slide_id,
                                                                                   material_id=material_id,
                                                                                   user_id=user_id,
                                                                                   material_name=material_name, data=[])
            ser_data = get_serialized_data_user(concepts, relations, username)

            logger.info(ser_data)
            return ser_data

        else:
            logger.info("Could not find Slide '%s" % slide_id)

            if file and is_file_allowed(file.filename):
                try:
                    pdf_extractor = PDFTextExtractor()
                    self.slide_text = pdf_extractor.extract_text_on_page(file, current_page)
                    #logger.info('text is: %s' % self.slide_text)
                    # self.slide_concepts = [annotation["label"] for annotation in
                    #                        self.dbpedia.annotate(materialId=slide_id, text=self.slide_text,
                    #                                              whole_text=True)]
                    name = "slide_" + str(current_page)
                    slide_node = {"slide_id": slide_id, "name": name, "slide_text": self.slide_text, "mid": material_id, "initial_embedding":"", "type": "Slide"}
                    keyphrases = []
                    start_time = time.time()
                    if not whole_text:
                        if not model_name or model_name == "":
                            extractor = KeyphraseExtractor()
                        elif model_name=="singlerank":
                            print('singlerank activated')
                            pos = {'NOUN', 'PROPN', 'ADJ'}
                            extractor = SingleRank()
                            extractor.load_document(input=self.slide_text, language='en')
                            extractor.candidate_selection(pos=pos)
                            extractor.candidate_weighting(window=10, pos=pos)
                            keyphrases = extractor.get_n_best(n=top_n)                        

                        else:
                            print('sifrank activated')
                            extractor = KeyphraseExtractor(
                                embedding_model=model_name)
                            keyphrases = extractor.extract_keyphrases(
                                text=self.slide_text,
                                top_n=top_n,
                                use_doc_segmentation=True,
                                use_embedding_alignment=True)
                    end_time = time.time()
                    print('Extract_keyphrases Execution time: ', end_time - start_time, flush=True)

                    nodes,slide_concepts = self.dbpedia1.build_path(materialId=material_id,
                                                    text=self.slide_text,
                                                    lm_text=lm_text,
                                                    keyphrases=keyphrases,
                                                    datas=nodes,
                                                    concepts_list=concepts_list,
                                                    with_category=with_category,
                                                    with_property=with_property,
                                                    with_doc_sim=with_doc_sim,
                                                    whole_text=whole_text)
                    global uniqueNodes
                    print('number of used nodes befor appending is: ',len(uniqueNodes))
                    for con in slide_concepts:
                        if con not in uniqueNodes:
                            uniqueNodes.append(con)

                    print('number of used nodes after appending is: ',len(uniqueNodes))

                    global totalConcepts
                    global allConceptsForEachSlide
                    print('number of extracted concepts befor appending is: ',len(totalConcepts))
                    for n in nodes:
                        allConceptsForEachSlide.append(n['name'])
                        if n['id'] not in totalConcepts:
                            totalConcepts.append(n['id'])

                    print('number of extracted concepts after appending is: ',len(totalConcepts))

                    # logger.info("nodes", nodes)
                    # logger.debug("3______________Concept Identification")
                    concepts, relations = self.db.get_or_create_concepts_and_relationships(slide_id=slide_id,
                                                                                           material_id=material_id,
                                                                                           material_name=material_name,
                                                                                           user_id=user_id, data=nodes,
                                                                                           slide_text= self.slide_text,
                                                                                           lm_text=lm_text,
                                                                                           slide_node = slide_node,
                                                                                           slide_concepts=slide_concepts)

                    # for concept in concepts:
                    # related_videos = self.youtube.get_videos_related_to_concept(concept.name)
                    # logger.info("Concept's name extracted: %s", concepts.name)
                    # logger.info("Related videos: %s", related_videos)
                    logger.debug("6______________Serialization")

                    ser_data = get_serialized_data_user(concepts, relations, username)
                    logger.debug("6______________Serialization End")
                    # logger.info(ser_data)
                    return ser_data
                except ValueError as e:
                    logger.error(
                        "%s is not a valid TransformerWordEmbeddings model" %
                        model_name)
                except Exception as e:
                    logger.error(
                        "Failed extracting graph data for material '%s' - %s" %
                        (material_id, e))
            else:
                logger.error("Could not process invalid file %s" % file)
                raise PreprocessingException(
                    "Invalid File. Please upload only %s file" %
                    ALLOWED_EXTENSIONS)

    def _set_concept_as_not_understood(self, conceptId, userId):
        relation_type = "NOT_UNDERSTOOD"

        self.db.create_user_concept_relationship(userId, conceptId, relation_type)

    def _get_concept_recommendation(self,user_id,mid):
        # Get concepts that doesn't interact with user
        concept_list = self.db.get_concept_has_not_read(user_id,mid)
        user = self.db.get_user(user_id)
        # compute the similarity between user and concepts with cos-similarity and select top-5 recommendation concept
        recommend_concepts = self.recommendation.recommend(concept_list,user,top_n=5)
        for i in recommend_concepts:
            info =  i["n"]["name"] + " : " + str(i["n"]["score"])
            logger.info(info)

        # Use paths for interpretability
        recommend_concepts = self._get_road(recommend_concepts, user_id)

        resp = get_serialized_concepts_data(recommend_concepts)
        return resp
    
    def _get_road(self,recommend_concepts,uid):
        for recommend_concept in recommend_concepts:
            cid = recommend_concept["n"]["cid"]
            ctype = recommend_concept["n"]["type"]
            if ctype == "annotation":
                #road: user - concept - related concept - concept
                road1 = self.db.get_road_user_c_related_concept(uid,cid)
                #to avoid too many road, select the max weight path
                road1 = self.get_max_weight_path(road1)
                #road: user - concept - category - concept
                road2 = self.db.get_road_user_c_category_concept(uid,cid)
                road2 = self.get_max_weight_path(road2)
                #road: user - concept - slide - concept
                road3 = self.db.get_road_user_c_slide_concept(uid,cid)
                road3 = self.get_max_weight_path(road3)
                #road: user - concept - related concept
                road4 = self.db.get_road_user_concept_relatedconcept(uid,cid)
                roads = road1+road2+road3+road4              
            else:
                #road: user - concept - related concept
                roads = self.db.get_road_user_concept_relatedconcept(uid,cid)

            #Save these roads to "roads" property
            recommend_concept["n"]["roads"] = roads
        #logger.info("roads: %s" % recommend_concepts[0]["n"]["roads"])    
        return recommend_concepts

    def get_max_weight_path(self,road):
        weights,max_weight,names,list =0,0,[],[]
        for i in range(len(road)):
            if road[i]["name"] not in names:
                names.append(road[i]["name"])
        for name in names:
            for i in range(len(road)):
                if road[i]["name"] == name:
                    weights = weights + road[i]["weight"]
            if max_weight <= weights:
                max_weight = weights
                optimum_name = name
            weights = 0
        for i in range(len(road)):
            if road[i]["name"] == optimum_name:
                list.append(road[i])    
        return list

    def _get_related_category(self,ids,mid):
        #find these dnu concepts in neo4j
        annotations = self.db.find_concept(ids)
        if annotations != []:
            text= self.db.get_lm_text(mid)
            #get related concepts and categories of concepts user doesn't understand
            nodes = self.dbpedia._get_related_concepts_and_categories(annotations=annotations,
                                                                        with_category=True,
                                                                        with_property=True,
                                                                        text=text)
            #create related_concepts, categories and relationships in neo4j                                                            
            self.db.create_related_concepts_and_relationships(data = nodes)
            logger.info("GCN")
            self._extract_vector_relation(mid)
            gcn = GCN()
            gcn.load_data()
    
    def get_related_category(self,mid,text,annotations,other_concepts):
        # Extract related concepts and categories of top-n main concepts.
        nodes = self.dbpedia._get_related_concepts_and_categories(annotations=annotations,
                                                                    with_category=True,
                                                                    with_property=True,
                                                                    text=text,
                                                                    other_concepts=other_concepts)
        # creat related concepts, categories and relationships in neo4j                                                          
        self.db.create_related_concepts_and_relationships(data=nodes) 


    def _get_resources(self, concept_ids, user_id, slide_id, recommendation_type, material_id):
        """
        """
        wikipedia_articles = []
        youtube_videos = []
        not_understood_concept_list = []
        resource_list = []
        relationship_list = []
        if recommendation_type != "without_embedding" and self.db.user_exists(user_id):
            logger.info("Get User embedding")
            user_embedding = self.db.get_or_create_user(user_id)[0]['u']['embedding']

        for cid in concept_ids:
            logger.info("Get Resources for concept %s" % cid)

            resources, relationships = self.db.get_concept_resources(cid, user_id,material_id)

            if not resources:
                logger.info("No Resources found")
                if self.db.concept_exists(cid):
                    logger.info("Retrieve Concept Name")
                    concept_name = self.db.get_concept_name_by_id(cid)[0]['c']['name']
                    logger.info(concept_name)
                    not_understood_concept_list.append(concept_name)
                else:
                    logger.info("Concept doesn't exist")
            else:
                logger.info("Resources found")
                logger.info(resources)
                logger.info("Extend Resources and relationship lists")
                resource_list.extend([r for r in resources if r not in resource_list])
                relationship_list.extend([r for r in relationships if r not in relationship_list])

        if len(not_understood_concept_list) <= 0 < len(resource_list):
            logger.info("Resources and relationships already exists for the concepts")
            logger.info(resource_list)

            return get_serialized_resource_data(resource_list, relationship_list)

        if self.db.slide_exists(slide_id):
            logger.info("Slide exists")
            _slide = self.db.get_slide(slide_id)
            threads = []
            slide_text = _slide[0]["s"]["text"]
            slide_concepts = _slide[0]["s"]["concepts"]
            logger.debug(slide_concepts)

            # wikipedia_articles = self.recommender.recommend(not_understood_concept_list, slide_text, slide_concepts, user_embedding=user_embedding, video=False)
            # youtube_videos = self.recommender.recommend(not_understood_concept_list, slide_text, slide_concepts, user_embedding=user_embedding, video=True)
            wikipedia_articles = []
            youtube_videos = []
            # initialize a thread for this particular username and password
            # _thread1 = Thread(target = self.recommender.recommend, args=(not_understood_concept_list, slide_text, slide_concepts, user_embedding, False))
            # _thread2 = Thread(target = self.recommender.recommend, args=(not_understood_concept_list, slide_text, slide_concepts, user_embedding, True))
            # _thread1.start()
            # threads.append(_thread1)
            # sleep(0.2) # wait a bit before next account thread creation
            # _thread2.start()
            # threads.append(_thread2) #maintain a list for all created and running threads, simply we are appending every new thread to the list
            #
            # for t in threads:
            #     #for each thread wait for its completion
            #     t.join()

            with concurrent.futures.ThreadPoolExecutor() as executor:
                futures = {}
                resource_types = ["Youtube", "Wikipedia"]
                if recommendation_type != "without_embedding":
                    for resource_type in resource_types:
                        # Start the load operations and mark each future with its URL
                        future = executor.submit(self.recommender.recommend,
                                                 not_understood_concept_list=not_understood_concept_list,
                                                 slide_text=slide_text,
                                                 slide_concepts=slide_concepts,
                                                 user_embedding=user_embedding,
                                                 video=True if resource_type == "Youtube" else False,
                                                 recommendation_type=recommendation_type)
                        futures[future] = resource_type
                else:
                    for resource_type in resource_types:
                        # Start the load operations and mark each future with its URL
                        future = executor.submit(self.recommender.recommend,
                                                 not_understood_concept_list=not_understood_concept_list,
                                                 slide_text=slide_text,
                                                 slide_concepts=slide_concepts,
                                                 video=True if resource_type == "Youtube" else False,
                                                 recommendation_type=recommendation_type)
                        futures[future] = resource_type

                for future in concurrent.futures.as_completed(futures, 3000):
                    print("future value")
                    print(future)
                    data_type = futures[future]
                    try:
                        if data_type == "Youtube":
                            youtube_videos = future.result()
                            print(youtube_videos)
                        else:
                            wikipedia_articles = future.result()
                            print(wikipedia_articles)
                    except Exception as exc:
                        print('%r generated an exception: %s' % (data_type, exc))

            logger.info("Slide doesn't exists")

        resources, relationships = self.db.get_or_create_resoures_relationships(wikipedia_articles=wikipedia_articles,
                                                                                youtube_videos=youtube_videos,
                                                                                user_id=user_id, slide_id=slide_id,
                                                                                concept_ids=concept_ids,
                                                                                recommendation_type=recommendation_type)

        # youtube_videos = youtube_videos.drop(columns=['thumbnails', 'channelTitle', 'liveBroadcastContent', 'kind', 'publishedAt', 'channelId', 'publishTime', 'document_embedding', "concept_embedding"])

        # file_path_youtube = "recommendation/dat2/video_data_all_without_user.png"
        # file_path_wikipedia = "recommendation/dat2/articles_data_all_without_user.png"
        # file_path_youtube_document_based_similarity = "recommendation/data/dist2/video_document_based_similarity.png"
        # file_path_wikipedia_document_based_similarity = "recommendation/data/dist2/articles_document_based_similarity.png"
        # file_path_youtube_concept_based_similarity = "recommendation/data/dist2/video_concept_based_similarity.png"
        # file_path_wikipedia_concept_based_similarity = "recommendation/data/dist2/articles_concept_based_similarity.png"
        # file_path_youtube_user_document_based_similarity = "recommendation/data/dist2/video_user_document_based_similarity.png"
        # file_path_wikipedia_user_document_based_similarity = "recommendation/data/dist2/articles_user_document_based_similarity.png"
        # file_path_youtube_user_concept_based_similarity = "recommendation/data/dist2/video_user_concept_based_similarity.png"
        # file_path_wikipedia_user_concept_based_similarity = "recommendation/data/dist2/articles_user_concept_based_similarity.png"
        # file_path_youtube_fused_similarity = "recommendation/data/dist2/video_fused_similarity.png"
        # file_path_wikipedia_fused_similarity = "recommendation/data/dist2/articles_fused_similarity.png"
        # file_path_youtube_fused_user_similarity = "recommendation/data/dist2/video_fused_user_similarity.png"
        # file_path_wikipedia_fused_user_similarity = "recommendation/data/dist2/articles_fused_user_similarity.png"
        #
        # save_plot_data(youtube_videos, file_path_youtube)
        # save_plot_data(wikipedia_articles, file_path_wikipedia)
        #
        #
        # plot_distribution_chart(youtube_videos, "document_based_similarity", file_path_youtube_document_based_similarity)
        # plot_distribution_chart(wikipedia_articles, "document_based_similarity", file_path_wikipedia_document_based_similarity)
        # plot_distribution_chart(youtube_videos, "concept_based_similarity", file_path_youtube_concept_based_similarity)
        # plot_distribution_chart(wikipedia_articles, "concept_based_similarity", file_path_wikipedia_concept_based_similarity)
        # plot_distribution_chart(youtube_videos, "user_document_based_similarity", file_path_youtube_user_document_based_similarity)
        # plot_distribution_chart(wikipedia_articles, "user_document_based_similarity", file_path_wikipedia_user_document_based_similarity)
        # plot_distribution_chart(youtube_videos, "user_concept_based_similarity", file_path_youtube_user_concept_based_similarity)
        # plot_distribution_chart(wikipedia_articles, "user_concept_based_similarity", file_path_wikipedia_user_concept_based_similarity)
        # plot_distribution_chart(youtube_videos, "fused_similarity", file_path_youtube_fused_similarity)
        # plot_distribution_chart(wikipedia_articles, "fused_similarity", file_path_wikipedia_fused_similarity)
        # plot_distribution_chart(youtube_videos, "fused_user_similarity", file_path_youtube_fused_user_similarity)
        # plot_distribution_chart(wikipedia_articles, "fused_user_similarity", file_path_wikipedia_fused_user_similarity)

        resp = get_serialized_resource_data(resources, relations=relationships)
        return resp

    def set_rating(self, resource, user_id, rating, rating_state, concepts=[]):
        self.db.create_or_edit_user_rating(resource, user_id, rating_state, relation_type=rating, concepts=concepts)
    
    def save_data(self,materialId,Pages):
        # return all nodes and all relations of learningmaterial 
        nodes, relations = self.db.get_nodes_and_relationships(materialId)
        ser_data = get_serialized_all_data(nodes, relations)
        with open("ser_data.txt", "w") as f:
            f.write(json.dumps(ser_data))
        dic={}
        for Page in range(1,Pages+1):
            slide_id = str(materialId) + "_slide_" + str(Page)
            slide_concept_list = self.db.get_concepts_of_slide(sid=slide_id)
            value = slide_concept_list[0]["concepts"]
            key=slide_concept_list[0]["name"]
            dic[key] = value
        
        concepts = self.db.retrieve_all_main_concepts(materialId)
        threshold = 15
        lm_list = sorted(concepts, key=lambda x: x["weight"], reverse=True)[0:threshold]
        lm_concept_list =[]
        for i in lm_list:
            lm_concept_list.append(i["name"])
        key=materialId
        dic[key]=lm_concept_list
        print(dic)
        with open('my_file.csv', 'w') as f:
            [f.write('{0},{1}\n'.format(key, value)) for key, value in dic.items()]



def save_data_to_file(data, file_path):
    data.to_csv(file_path, sep='\t', encoding='utf-8')


def save_plot_data(data, file):
    x = data.index  # Sample data.


    # Note that even in the OO-style, we use `.pyplot.figure` to create the Figure.
    fig, ax = plt.subplots(figsize=(10, 5), layout='constrained')
    ax.plot(x, data["concept_based_similarity"], label='concept_based_similarity')
    ax.plot(x, data["document_based_similarity"], label='document_based_similarity')
    ax.plot(x, data["fused_similarity"], label='fused_similarity')

    # ax.plot(x, data["user_concept_based_similarity"], label='user_concept_based_similarity')
    # ax.plot(x, data["user_document_based_similarity"], label='user_document_based_similarity')
    # ax.plot(x, data["fused_user_similarity"], label='fused_user_similarity')

    ax.set_ylabel('Cosine Similarity')  # Add an x-label to the axes.
    ax.set_xlabel('index')  # Add a y-label to the axes.
    ax.set_title("Similarity Plot")  # Add a title to the axes.
    ax.legend();  # Add a legend.

    fig.savefig(file, bbox_inches='tight')

def plot_distribution_chart(data, similarity_type, file=""):
    # Generate two normal distributions
    dist = data[similarity_type]

    fig, ax = plt.subplots(figsize =(10, 7), sharey=True, tight_layout=True)

    # We can set the number of bins with the *bins* keyword argument.
    ax.hist(dist)
    ax.set_title("Similarity Distribution \nType: %s"%similarity_type)

    if len(file) != 0:
        fig.savefig(file, bbox_inches='tight')

def get_serialized_data(concepts, relations):
    """
    """
    data = {}
    ser_concepts = []
    ser_realations = []
    #"id": str(concept["cid"]),
    for concept in concepts:
        c = {
            "name": concept["name"],
            "id": concept["id"],
            "weight": concept["weight"],
            "uri": concept["uri"],
            "type": concept["type"],
            "wikipedia": concept["wikipedia"],
            "abstract": concept["abstract"]
        }
        ser_concepts.append({'data': c})

    for relation in relations:
        r = {
            "type": relation["type"],
            "source": relation["source"],
            "target": relation["target"],
            "weight": relation["weight"]
        }
        ser_realations.append({"data": r})

    data["nodes"] = ser_concepts
    data["edges"] = ser_realations

    return data

def get_serialized_all_data(nodes, relations):
    """
    """
    data = {}
    ser_nodes = []
    ser_realations = []
    #"id": str(concept["cid"]),
    for node in nodes:
        if node["labels"] == ['Concept']:
            n = {
                "label": node["labels"],
                "id": node["id"],
                "abstract": node["abstract"],
                "cid": node["cid"],
                "final_embedding": node["final_embedding"],
                "initial_embedding": node["initial_embedding"],
                "mid": node["mid"],
                "name": node["name"],
                "type": node["type"],
                "uri": node["uri"],
                "weight": node["weight"],
                "wikipedia": node["wikipedia"],
            }
        elif node["labels"] == ['Slide']:    
            n = {
                "label": node["labels"],
                "id": node["id"],
                "concepts": node["concepts"],
                "final_embedding": node["final_embedding"],
                "initial_embedding": node["initial_embedding"],
                "mid": node["mid"],
                "name": node["name"],
                "sid": node["sid"],
                "text": node["text"],
                "type": node["type"],
            }
        elif node["labels"] == ['LearningMaterial']:
            n = {
                "label": node["labels"],
                "id": node["id"],
                "mid": node["mid"],
                "name": node["name"],
            }
        ser_nodes.append({'data': n})

    for relation in relations:
        if "weight" in relation:
            r = {
                "type": relation["type"],
                "source": relation["source"],
                "target": relation["target"],
                "weight": relation["weight"]
            }
        else:
            r = {
                "type": relation["type"],
                "source": relation["source"],
                "target": relation["target"],
            }
        ser_realations.append({"data": r})

    data["nodes"] = ser_nodes
    data["edges"] = ser_realations

    return data

def get_serialized_concepts_data(concepts):
    """
    """
    data = {}
    ser_concepts = []

    for concept in concepts:
        roads=[]
        reasons=[{"dnu":[]},
                {"name":"","type":"Slide","dnu":[]},
                {"name":"","type":"category","dnu":[]},
                {"name":"","type":"property","dnu":[]},
                {"name":"","type":"Related","dnu":[]}]
        for road in concept["n"]["roads"]:
            list=[]
            if road["p"][2]["name"] not in reasons[0]["dnu"]:  
                reasons[0]["dnu"].append(road["p"][2]["name"])

            if len(road["p"]) == 5:
                reasons[4]["name"] = road["p"][4]["name"]
                if road["p"][2]["name"] not in reasons[4]["dnu"]:
                    reasons[4]["dnu"].append(road["p"][2]["name"])
            else:
                for reason in reasons[1:4]:
                    if road["p"][4]["type"] == reason["type"]:
                        reason["name"] = road["p"][4]["name"]
                        if road["p"][2]["name"] not in reason["dnu"]:
                            reason["dnu"].append(road["p"][2]["name"])

            for node in road["p"]:
                if isinstance(node,str):
                    list.append(node)
                elif node["type"] == "user" or node["type"] == "Slide":
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

        Reasons=[]
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
            "score":concept["n"]["score"],
            "roads":roads,
            "Reason":Reasons
            }

        ser_concepts.append({'data': c})

    data["nodes"] = ser_concepts

    return data

def get_serialized_resource_data(resources, relations):
    """
    """
    data = {}
    ser_resources = []
    ser_realations = []

    logger.info(relations)
    for resource in resources:
        r = {
            "title": resource["title"],
            "id": resource["rid"],
            "uri": resource["uri"],
            "helpful_counter": resource["helpful_count"],
            "not_helpful_counter": resource["not_helpful_count"],
            "labels": resource["labels"],
            "similarity_score": resource["similarity_score"],
            "concepts": resource["concepts"],
        }

        if "Video" in r["labels"]:
            r["description"] = resource["description"]
            r["description_full"] = resource["description_full"]
            r["thumbnail"] = resource["thumbnail"]
            r["duration"] = resource["duration"]
            r["views"] = resource["views"]
            r["publish_time"] = resource["publish_time"]


        elif "Article" in r["labels"]:
            r["abstract"] = resource["abstract"]

        ser_resources.append({'data': r})
    for relation in relations:
        r = {
            "type": relation["type"],
            "source": relation["source"],
            "target": relation["target"],
        }
        ser_realations.append({"data": r})

    data["nodes"] = ser_resources
    data["edges"] = ser_realations

    return data


def get_serialized_data_user(concepts, relations, username):
    """
    """
    data = {}
    ser_concepts = []
    ser_realations = []
    # ser_User = []
    # ser_User.append({"data": userName})
    user_name = username.replace(' ', '\n')

    print('username: ', user_name)

    for concept in concepts:
        c = {
            "name": concept["name"],
            "id": concept["cid"],
            "weight": concept["weight"],
            "uri": concept["uri"],
            "type": concept["type"],
            "wikipedia": concept["wikipedia"],
            "abstract": concept["abstract"]
        }
        ser_concepts.append({'data': c})

    u = {
        "name": user_name,
        # "id": concept["id"],
        # "weight": concept["weight"],
        # "uri": concept["uri"],
        "type": 'user',
        # "wikipedia": concept["wikipedia"],
        # "abstract": concept["abstract"]
    }
    ser_concepts.append({'data': u})


    for relation in relations:
        r = {
            "type": relation["type"],
            "source": relation["source"],
            "target": relation["target"],
            "weight": relation["weight"]
        }
        ser_realations.append({"data": r})

    data["nodes"] = ser_concepts
    data["edges"] = ser_realations
    # data["user"] = ser_User


    return data


def is_file_allowed(filename):
    return '.' in filename and filename.split(
        '.')[-1].lower() in ALLOWED_EXTENSIONS
