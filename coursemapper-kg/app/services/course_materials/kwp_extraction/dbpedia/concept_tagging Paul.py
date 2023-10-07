import requests
from SPARQLWrapper import SPARQLWrapper, JSON
from itertools import product
import math
import networkx as nx
from wikipediaapi import Wikipedia
from flair.embeddings import TransformerDocumentEmbeddings
from sentence_transformers import util
from flair.data import Sentence
from transformers import BertTokenizer, BertModel
from transformers import AutoTokenizer, AutoModel
import torch
from kwp_extraction.utils import get_POSTagger
import numpy as np
import re

import logging
from log import LOG

#set pythonHashSeed to zero to have same hashed value if same input has been given
import os
import sys
# hashseed = os.getenv('PYTHONHASHSEED')
# if not hashseed:
#     os.environ['PYTHONHASHSEED'] = '0'
#     os.execv(sys.executable, [sys.executable] + sys.argv)

logger = LOG(name=__name__, level=logging.DEBUG)

# DBPEDIA_SPOTLIGHT_ADDR = "http://localhost:2222/rest/annotate"
# DBPEDIA_SPOTLIGHT_ADDR = "http://127.0.0.1:2222/rest/annotate"

class DBpediaSpotlight:
    """
    """

    def __init__(self, lang='en'):
        self.url = "https://api.dbpedia-spotlight.org/%s/annotate" % lang
        self.sparql = SPARQLWrapper("http://dbpedia.org/sparql")
        # self.sparql = SPARQLWrapper("http://localhost:8890/sparql")
        self.sparql.setTimeout(60)
        # close long connections and set length of timeout to avoid HTTP connection timeouts and Max retries exceeded with url
        # self.wiki_api = Wikipedia('en',headers={'Connection': 'close'},timeout=20)
        self.wiki_api = Wikipedia('en')
        # self.model = SentenceTransformer('all-mpnet-base-v2')
        #self.model = TransformerDocumentEmbeddings('sentence-transformers/msmarco-distilbert-base-tas-b')
        # self.model = TransformerDocumentEmbeddings('sentence-transformers/all-mpnet-base-v2')
        # self.model = TransformerDocumentEmbeddings('sentence-transformers/all-distilroberta-v1')
        self.model = TransformerDocumentEmbeddings('sentence-transformers/all-MiniLM-L12-v2')
        
    def _chunkstext(self, text, length):
        return (text[0 + i:length + i] for i in range(0, len(text), length))

    def annotate(self, materialId, text, whole_text, keyphrases=[]):
        """
        """
        logger.info("Annotate text")
        logger.info("material_id: %s" % materialId)
        annotations = []
        try:
            texts = []
            if whole_text:
                if len(text) > 5000:
                    texts = list(self._chunkstext(text, 5000))
                else:
                    texts.append(text)
            else:
                if keyphrases:
                    texts.append(". ".join(
                        list(map(lambda x: x[0], keyphrases))))
            for _text in texts:
                params = {"text": _text, "confidence": 0.35, "support": 5}
                headers = {"Accept": "application/json"}
                # r = requests.get(url=DBPEDIA_SPOTLIGHT_ADDR, headers=headers,params=params).json()
                # r = requests.get(url=self.url, headers=headers,params=params, verify=False).json()#activate when DBpedia certificate expires
                r = requests.get(url=self.url, headers=headers,params=params).json()
                if 'Resources' in r:
                    resources = r['Resources']
                    for resource in resources:
                        annotation = {
                            "id": str(abs(hash(resource['@URI']))),
                            "label": resource['@surfaceForm'],
                            "uri": resource['@URI'],
                            "sim_score": resource['@similarityScore'],
                            "type": "annotation",
                            "mid": materialId,
                            "to": [],
                        }

                        label = self._get_label(resource['@URI'])
                        if label != "":
                            annotation["name"] = label

                        # annotation["name"] = annotation["label"]

                        if not self._exists(annotation, annotations):
                            annotations.append(annotation)

        except Exception as e:
            logger.error("Failed to annotate %s - %s" % (texts, e))

        return annotations

    def build_path(self,
                   materialId,
                   text,
                   keyphrases,
                   with_property,
                   whole_text,
                   lm_text="",
                   with_category=True,
                   with_doc_sim=True):
        """
        """
        logger.info("Executing build_path")
        logger.debug("4______________Concept Expansion")

        concepts = self.expand(
            whole_text=whole_text,
            materialId=materialId,
            text=text,
            keyphrases=keyphrases,
            with_category=with_category,
            with_property=with_property)

        ### look for path between every concept pair - takes a long time ###
        # pairs = self._get_concept_pairs(concepts)
        # [self._get_path(pair[0], pair[1]) for pair in pairs]
        logger.debug("5______________Concept Weighting")
        try:
            if with_doc_sim:
                lm_embeddings=self._get_embeddings(lm_text)
                doc_embeddings = self._get_embeddings(text)
                for node in concepts:
                    if node["type"] == "annotation":
                        ann_text = self.wiki_api.page(
                            node['uri'].split("/")[-1]).text
                        # print(self.wiki_api.page(
                        #     node['uri'].split("/")[-1]).text)
                        # print(self.wiki_api.page(
                        #     node['uri']))
                        # break
                        ann_text = self._preprocess(ann_text)
                        ann_embeddings = self._get_embeddings(ann_text)
                        node["initial_embedding"]= ann_embeddings
                        slideScore = self._get_semantic_similarity_score(doc_embeddings, node["initial_embedding"])
                        score = self._get_semantic_similarity_score(lm_embeddings, node["initial_embedding"])
                        node["slide_weight"] = slideScore
                        node["weight"] = score

                    # # Get hashed value for initial embedding and assigne to node['id']
                    node["id"]= str(abs(hash(str(ann_embeddings))))#set id to be initial embeddings as it is the only unique value

                    
                concepts = sorted(concepts, key=lambda x: x["slide_weight"]+x["weight"], reverse=True)
                
                # #If only top [threshold] main concepts per slide is needed
                # threshold = 5
                ## Weighting according to [material_text and node_text] similarity
                # # concepts = sorted(concepts, key=lambda x: x["weight"], reverse=True)[0:threshold]
                ##Weighting according to [material_text and node_text + slide_text and node_text] similarity
                # concepts = sorted(concepts, key=lambda x: x["slide_weight"]+x["weight"], reverse=True)[0:threshold]
            else:
                doc_embeddings = self._get_embeddings(text)
                # node weights
                for node in concepts:
                    if node["type"] == "annotation":
                        node["weight"] = self._get_node_weight_cf(
                            node, text, concepts)
                    elif node["type"] == "property":
                        node["weight"] = self._assign_property_weight(
                            node, text, concepts)
                    elif node["type"] == "category":
                        node["weight"] = self._assign_category_weight(
                            node, text, concepts)
                # get wikipedia page for node
            logger.debug("5______________Concept Weighting End")
            for node in concepts:
                self._get_wikipedia_page(node)
                self._get_wikipedia_abstract(node)

            return concepts
        except Exception as e:
            logger.error("Failure due to - %s" % e)

    def _get_path(self, node_a, node_b):
        """
        """
        try:
            query = """
                ASK { <%s> dbo:wikiPageWikiLink{,1}/dct:subject{,1}/skos:broader{,1} <%s> }
            """ % (node_a['uri'], node_b['uri'])
            self.sparql.setQuery(query)
            self.sparql.setReturnFormat(JSON)
            results = self.sparql.query().convert()
            exists = results["boolean"]
            if exists:
                print("%s -> %s: %s" % (node_a['uri'], node_b['uri'], exists))
                if not self._exists_rel(node_a, node_b):
                    edge_weight = self._get_edge_weight(node_a, node_b)

                    node_a['to'].append({
                        "id":
                            node_b['id'],
                        "name":
                            node_b['name'],
                        "type":
                            node_b['type'],
                        "rel_type":
                            self._relationship_type(node_a, node_b),
                        "path":
                            True,
                        "weight":
                            edge_weight
                    })

        except Exception as e:
            logger.error(
                "Failed executing path property query between (%s, %s) - %s" %
                (node_a['uri'], node_b['uri'], e))

    def _relationship_type(self, node_a, node_b):
        """
        """
        rel_type = ""
        if node_a['type'] != "category" and node_b['type'] != "category":
            rel_type = "RELATED_TO"
        elif node_a['type'] == "category" and node_b['type'] != "category":
            rel_type = "PARENT_OF"
        elif node_a['type'] == "category" and node_b['type'] == "category":
            rel_type = "PARENT_OF"
        elif node_a['type'] != "category" and node_b['type'] == "category":
            rel_type = "BELONGS_TO"

        return rel_type

    def expand(self, whole_text, materialId, text, keyphrases, with_category,
               with_property):
        """
        """
        all_annotations = []
        try:
            # logger.info("---------------%s"%text)
            annotations = self.annotate(materialId=materialId, text=text, keyphrases=keyphrases,
                                        whole_text=whole_text)

            logger.info(annotations)
            for annotation in annotations:
                try:
                    if with_category:
                        logger.info("--------------- with category")
                        self._get_categories(annotation, all_annotations)
                    if with_property:
                        logger.info("--------------- with property")
                        self._get_related_concepts(
                            annotation=annotation,
                            all_annotations=all_annotations)
                except Exception as e:
                    logger.error(
                        "Failed expanding '%s' - %s" % annotation["uri"], e)
        except Exception as e:
            logger.error("Failure in expansion - %s", e)

        if not with_property:
            return annotations
        else:
            return all_annotations

    def _get_categories(self, annotation, all_annotations,doc_embeddings):
        """
        """
        logger.info("Getting categories for '%s'" % annotation["label"])
        concepts=[]
        try:
            query = """
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
                SELECT ?categoryLabel ?category
                FROM <http://dbpedia.org>
                WHERE {
                <%s> dct:subject ?category .
                ?category  rdfs:label  ?categoryLabel .
                FILTER (lang(?categoryLabel) = 'en')}
            """ % (annotation['uri'])

            self.sparql.setQuery(query)
            self.sparql.setReturnFormat(JSON)
            results = self.sparql.query().convert()

            logger.debug("Found %s categories " %
                         len(results["results"]["bindings"]))
            for result in results["results"]["bindings"]:
                node = {
                    "id": str(abs(hash(result['category']['value']))),
                    "name": result['categoryLabel']['value'],
                    "label": annotation['label'],
                    "uri": result['category']['value'],
                    "type": "category",
                    "expanded": True,
                    "mid": annotation["mid"],
                    "to": []
                }
                if not self._exists_rel(node,annotation):
                    node["initial_embedding"] = self._get_embeddings(node["name"])
                    edge_weight = self._get_semantic_similarity_score(
                            annotation["initial_embedding"], node["initial_embedding"])
                    node["concept_weight"] = edge_weight
                    node["weight"] = self._get_semantic_similarity_score(doc_embeddings, node["initial_embedding"])
                    node['to'].append({
                        "id": annotation['id'],
                        "name": annotation['name'],
                        "weight": edge_weight,
                        "rel_type": "BELONGS_TO"
                    })
                    if not self._exists(node, concepts):
                        concepts.append(node)
                # if not self._exists(node, all_annotations):
                #     all_annotations.append(node)
                # if not self._exists_rel(annotation, node):
                #     node["initial_embedding"] = self._get_embeddings(node["name"])
                #     edge_weight = self._get_semantic_similarity_score(
                #             annotation["initial_embedding"], node["initial_embedding"])
                #     annotation['to'].append({
                #         "id": node['id'],
                #         "name": node['name'],
                #         "weight": edge_weight,
                #         "rel_type": "BELONGS_TO"
                #     })
                #     if not self._exists(annotation, all_annotations):
                #         all_annotations.append(annotation)

            # Get only top [threshold] nodes as categories
            threshold = 3
            # concepts = sorted(concepts, key=lambda x: x["weight"], reverse=True)[0:threshold]
            # concepts = sorted(concepts, key=lambda x: x["concept_weight"], reverse=True)[0:threshold]
            concepts = sorted(concepts, key=lambda x: x["weight"]+x["concept_weight"], reverse=True)[0:threshold]
            for concept in concepts:
                flag = False
                for node in all_annotations:
                    if node["id"] == concept["id"]:
                        node["to"] = node["to"] + concept["to"]
                        flag = True
                        break
                if flag == False:
                    all_annotations.append(concept)
        except Exception as e:
            logger.error("Failed to get categories for %s - %s" %
                         (annotation['uri'], e))

    def _get_related_concepts(self, annotation, all_annotations,doc_embeddings):
        """
        """
        logger.info("Getting related concepts for '%s'" % annotation["label"])
        concepts=[]
        try:
            query = """
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
                SELECT ?propertyLabel ?property
                FROM <http://dbpedia.org>
                WHERE {
                <%s> dbo:wikiPageWikiLink ?property .
                ?property  rdfs:label  ?propertyLabel .
                MINUS{ FILTER REGEX(STR(?property), "Category:") } .
                FILTER (lang(?propertyLabel) = 'en') }
            """ % (annotation['uri'])

            self.sparql.setQuery(query)
            self.sparql.setReturnFormat(JSON)
            results = self.sparql.query().convert()

            logger.debug("Found %s related concepts" %
                         len(results["results"]["bindings"]))

            for result in results["results"]["bindings"]:
                node = {
                    "id": str(abs(hash(result['property']['value']))),
                    "name": result['propertyLabel']['value'],
                    "uri": result['property']['value'],
                    "type": "property",
                    "expanded": True,
                    "mid": annotation["mid"],
                    "to": []
                }
                try:
                    if not self._exists_rel(annotation, node):
                        ann_text = self.wiki_api.page(node['uri'].split("/")[-1]).text
                        ann_text = self._preprocess(ann_text)
                        node["initial_embedding"] = self._get_embeddings(ann_text)
                        node["id"]=str(abs(hash(str(node["initial_embedding"]))))#set id to be initial embeddings as it is the only unique value
                        edge_weight = self._get_semantic_similarity_score(
                                annotation["initial_embedding"], node["initial_embedding"])
                        node["concept_weight"] = edge_weight
                        node["weight"] = self._get_semantic_similarity_score(doc_embeddings, node["initial_embedding"])
                        node['to'].append({
                            "id": annotation['id'],
                            "name": annotation['name'],
                            "weight": edge_weight,
                            "rel_type": "RELATED_TO"
                        })
                        if not self._exists(node, concepts):
                            concepts.append(node)
                # if not self._exists(node, all_annotations):
                    #     all_annotations.append(node)

                    # if not self._exists_rel(annotation, node):
                    #     #edge_weight = self._get_edge_weight(annotation, node)
                    #     ann_text = self.wiki_api.page(node['uri'].split("/")[-1]).text
                    #     ann_text = self._preprocess(ann_text)
                    #     node["initial_embedding"] = self._get_embeddings(ann_text)
                    #     # node["weight"] = 0
                    #     edge_weight = self._get_semantic_similarity_score(
                    #             annotation["initial_embedding"], node["initial_embedding"])
                    #     annotation['to'].append({
                    #         "id": node['id'],
                    #         "name": node['name'],
                    #         "weight": edge_weight,
                    #         "rel_type": "RELATED_TO"
                    #     })
                    #     if not self._exists(annotation, all_annotations):
                    #         all_annotations.append(annotation)
                except Exception as e:
                    logger.error("Failure %s - %s" % (node["name"], e))
            
            # Get only top [threshold] nodes as related concepts
            threshold = 20
            # concepts = sorted(concepts, key=lambda x: x["weight"], reverse=True)[0:threshold]
            # concepts = sorted(concepts, key=lambda x: x["concept_weight"], reverse=True)[0:threshold]
            concepts = sorted(concepts, key=lambda x: x["weight"]+x["concept_weight"], reverse=True)[0:threshold]
            for concept in concepts:
                flag = False
                for node in all_annotations:
                    if node["id"] == concept["id"]:
                        node["to"] = node["to"] + concept["to"]
                        flag = True
                        break
                if flag == False:
                    all_annotations.append(concept)

        except Exception as e:
            logger.error("Failed to get properties for %s - %s" %
                         (annotation['uri'], e))

    def _get_related_concepts_and_categories(self, annotations, with_category, with_property,text=" ",other_concepts=[]):
        """
        """
        all_annotations = []
        doc_embeddings = self._get_embeddings(text)
        try:
            #logger.info(annotations)
            for annotation in annotations:
                try:
                    if with_category:
                        logger.info("--------------- with category")
                        self._get_categories(annotation, all_annotations,doc_embeddings)
                    if with_property:
                        logger.info("--------------- with property")
                        self._get_related_concepts(
                            annotation=annotation,
                            all_annotations=all_annotations,
                            doc_embeddings=doc_embeddings)
                except Exception as e:
                    logger.error(
                        "Failed expanding '%s' - %s" % annotation["uri"], e)
            logger.debug("5______________Concept Weighting")
            logger.info(len(all_annotations))
            all_concepts = annotations + all_annotations + other_concepts
            try:
                if text != " ":
                    # Check relationship between related concepts/categories/main concepts and other main concept
                    for other_concept in other_concepts:
                        try:
                            if with_category:
                                # logger.info("--------------- with category")
                                self.get_categories(annotation=other_concept, all_annotations=all_concepts)
                            if with_property:
                                # logger.info("--------------- with property")
                                self.get_related_concepts(
                                    annotation=other_concept,
                                    all_annotations=all_concepts)
                        except Exception as e:
                            logger.error(
                                "Failed expanding '%s' - %s" % annotation["uri"], e)

                    logger.debug("5______________Concept Weighting End")
                for node in all_annotations:
                    if node["type"] == "annotation":
                        continue
                    self._get_wikipedia_page(node)
                    self._get_wikipedia_abstract(node)
                logger.info("end")
            except Exception as e:
                logger.error("Failure due to - %s" % e)

        except Exception as e:
            logger.error("Failure in expansion - %s", e)

        return all_concepts

    
    def check_relationship(self, annotations,all_annotations):
        """
        """
        logger.debug("check relationship")
        try:
            for annotation in annotations:
                logger.info("check relationship for %s", annotation["name"])
                try:
                    # logger.info("--------------- category")
                    self.check_category_relationship(annotation, all_annotations)

                    # logger.info("--------------- property")
                    self.check_related_relationship(annotation,all_annotations)
                except Exception as e:
                    logger.error(
                        "Failed checking '%s' - %s" % annotation["uri"], e)
        except Exception as e:
            logger.error("Failure in expansion - %s", e)

        return all_annotations
    
    def check_category_relationship(self, annotation, all_annotations):
        """
        """
        # logger.info("Getting categories for '%s'" % annotation["label"])
        categories=[]
        try:
            query = """
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
                SELECT ?categoryLabel ?category
                FROM <http://dbpedia.org>
                WHERE {
                <%s> dct:subject ?category .
                ?category  rdfs:label  ?categoryLabel .
                FILTER (lang(?categoryLabel) = 'en')}
            """ % (annotation['uri'])

            self.sparql.setQuery(query)
            self.sparql.setReturnFormat(JSON)
            results = self.sparql.query().convert()

            logger.debug("Found %s categories " %
                         len(results["results"]["bindings"]))
            for result in results["results"]["bindings"]:
                categories.append(result['categoryLabel']['value'])

            categories_result = list(set(categories) - set(annotation["category"])) + list(set(annotation["category"]) - set(categories))

            for item1 in categories_result:
                for item2 in all_annotations:
                    if item2["type"] != "category":
                        continue
                    if item1 == item2["name"]:
                        edge_weight = self._get_semantic_similarity_score(
                        annotation["initial_embedding"], item2["initial_embedding"])
                        item2["concept_weight"] = edge_weight
                        item2['to'].append({
                            "id": annotation['id'],
                            "name": annotation['name'],
                            "weight": edge_weight,
                            "rel_type": "BELONGS_TO"
                        })
                        # logger.info("category name:%s,type:%s, relation:%s" % (item2["name"],item2["type"],item2['to']))

        except Exception as e:
            logger.error("Failed to get categories for %s - %s" %
                         (annotation['uri'], e))
        return all_annotations
    
    def check_related_relationship(self, annotation, all_annotations):
        """
        """
        # logger.info("Getting related concepts for '%s'" % annotation["label"])
        related=[]
        try:
            query = """
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
                SELECT ?propertyLabel ?property
                FROM <http://dbpedia.org>
                WHERE {
                <%s> dbo:wikiPageWikiLink ?property .
                ?property  rdfs:label  ?propertyLabel .
                MINUS{ FILTER REGEX(STR(?property), "Category:") } .
                FILTER (lang(?propertyLabel) = 'en') }
            """ % (annotation['uri'])

            self.sparql.setQuery(query)
            self.sparql.setReturnFormat(JSON)
            results = self.sparql.query().convert()

            logger.debug("Found %s related concepts" %
                         len(results["results"]["bindings"]))

            for result in results["results"]["bindings"]:
                related.append(result['propertyLabel']['value'])

            related_result = list(set(related) - set(annotation["related"])) + list(set(annotation["related"]) - set(related))

            for item1 in related_result:
                for item2 in all_annotations:
                    if item2["type"] == "category":
                        continue
                    if item1 == item2["name"]:
                        edge_weight = self._get_semantic_similarity_score(
                        annotation["initial_embedding"], item2["initial_embedding"])
                        item2["concept_weight"] = edge_weight
                        item2['to'].append({
                            "id": annotation['id'],
                            "name": annotation['name'],
                            "weight": edge_weight,
                            "rel_type": "RELATED_TO"
                        })
                        # logger.info("concept name:%s,type:%s, relation:%s" % (item2["name"],item2["type"],item2['to']))
        except Exception as e:
            logger.error("Failed to get properties for %s - %s" %
                (annotation['uri'], e))
        return all_annotations

    def get_categories(self, annotation, all_annotations):
        """
        """
        # logger.info("Getting categories for '%s'" % annotation["label"])
        try:
            query = """
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
                SELECT ?categoryLabel ?category
                FROM <http://dbpedia.org>
                WHERE {
                <%s> dct:subject ?category .
                ?category  rdfs:label  ?categoryLabel .
                FILTER (lang(?categoryLabel) = 'en')}
            """ % (annotation['uri'])

            self.sparql.setQuery(query)
            self.sparql.setReturnFormat(JSON)
            results = self.sparql.query().convert()

            # logger.debug("Found %s categories " %
            #              len(results["results"]["bindings"]))
            for result in results["results"]["bindings"]:
                node = {
                    "id": str(abs(hash(result['category']['value']))),
                    "name": result['categoryLabel']['value'],
                    "label": annotation['label'],
                    "uri": result['category']['value'],
                    "type": "category",
                    "expanded": True,
                    "mid": annotation["mid"],
                    "to": []
                }
                
                for concept in all_annotations:
                    if node["id"] == concept["id"]:
                        edge_weight = self._get_semantic_similarity_score(
                            annotation["initial_embedding"], concept["initial_embedding"])
                        concept['to'].append({
                            "id": annotation['id'],
                            "name": annotation['name'],
                            "weight": edge_weight,
                            "rel_type": "BELONGS_TO"
                        })
                        break

        except Exception as e:
            logger.error("Failed to get categories for %s - %s" %
                         (annotation['uri'], e))
    
    def get_related_concepts(self, annotation, all_annotations):
        """
        """
        # logger.info("Getting related concepts for '%s'" % annotation["label"])
        try:
            query = """
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
                SELECT ?propertyLabel ?property
                FROM <http://dbpedia.org>
                WHERE {
                <%s> dbo:wikiPageWikiLink ?property .
                ?property  rdfs:label  ?propertyLabel .
                MINUS{ FILTER REGEX(STR(?property), "Category:") } .
                FILTER (lang(?propertyLabel) = 'en') }
            """ % (annotation['uri'])

            self.sparql.setQuery(query)
            self.sparql.setReturnFormat(JSON)
            results = self.sparql.query().convert()

            # logger.debug("Found %s related concepts" %
            #              len(results["results"]["bindings"]))

            for result in results["results"]["bindings"]:
                node = {
                    "id": str(abs(hash(result['property']['value']))),
                    "name": result['propertyLabel']['value'],
                    "uri": result['property']['value'],
                    "type": "property",
                    "expanded": True,
                    "mid": annotation["mid"],
                    "to": []
                }

                for concept in all_annotations:
                    if node["name"] == concept["name"] and node["type"] != "category":
                        edge_weight = self._get_semantic_similarity_score(
                            annotation["initial_embedding"], concept["initial_embedding"])
                        concept['to'].append({
                            "id": annotation['id'],
                            "name": annotation['name'],
                            "weight": edge_weight,
                            "rel_type": "RELATED_TO"
                        })
                        break

        except Exception as e:
            logger.error("Failed to get properties for %s - %s" %
                         (annotation['uri'], e))

    def _assign_category_weight(self, cat_node, text, doc_embeddings,
                                concepts):
        """
        """
        # CategoryDiscount = _get_node_weight_cf (cat) * 1/log(|SP|) * 1/log(|SC|)
        SP = self._get_pages_of_category(cat_node)
        SC = self._get_subcategories_of_category(cat_node)
        try:
            score = self._get_node_weight_cf(cat_node, text, concepts) * (
                    1 / math.log(abs(int(SP)))) * (1 / math.log(abs(int(SC))))
            return score
        except (ZeroDivisionError, ValueError) as e:
            return 0

    def _assign_property_weight(self, prop_node, text, concepts):
        """
        """
        logger.info("Assgning weight to property: %s" % prop_node["name"])
        # ProperyDiscount = _get_node_weight_cf (prop) * 1/log(P)
        try:
            P = self._count_property_occurence(prop_node)

            print(self._get_node_weight_cf(prop_node, text, concepts), P)

            score = self._get_node_weight_cf(
                prop_node, text, concepts) * (1 / math.log(abs(int(P))))
            return score
        except (ZeroDivisionError, ValueError) as e:
            return 0

    def _calculate_similiraty_weight(self, concept, doc_embeddings):
        """
        """
        try:
            concept_embeddings = self._get_embeddings(concept["name"])
            #convert array type "np.array" to string type and store
            concept["initial_embedding"]= concept_embeddings
            score = self._get_semantic_similarity_score(
                concept_embeddings, doc_embeddings)
            return score
        except Exception as e:
            logger.error(
                "Failed to calculate similarity score for concept: '%s' of type: '%s'"
                % (concept["name"], concept["type"]))
            # self.tagger.close()
            return 0

    def _get_embeddings(self, text):
        """
        """
        # self.tagger = get_POSTagger(tagger_model="")
        # sentences = self.tagger.get_sentences(text)
        # sents_embs = self.model.encode(text)
        # embeddings = np.mean(sents_embs, axis=0)
        # self.tagger.close()
        sentence = Sentence(text)
        self.model.embed(sentence)
        sents_embs = sentence.get_embedding().tolist()
        return sents_embs

    # def scibert_vectorize(self, text):
    #     try:
    #         input_ids = torch.tensor(self.scibert_tokenizer.encode(text)).unsqueeze(0)  # Batch size 1
    #         print('input_ids', input_ids)
    #         outputs = self.model(input_ids)
    #         print('outputs', outputs)
    #         last_hidden_states = outputs[0]
    #         print('last_hidden_states', last_hidden_states)
    #         vector = last_hidden_states.mean(1)
    #         vector = vector.detach().numpy()[0]
    #         print('vector', vector)
    #     except Exception as e:
    #         logger.error(e)
    #         pass
    #
    #     return vector
    #
    # def scibert_avg_concept_vectorize(self, concept_list):
    #     vec_list = []
    #     for concept in concept_list:
    #         vector = self.scibert_vectorize(concept)
    #         vec_list.append(vector)
    #
    #     vectors = np.sum(vec_list, axis=0)
    #     print(vectors)
    #     # dividing by the sum of weights
    #     average_vector = vectors / len(vec_list)
    #
    #     return average_vector

    def _get_semantic_similarity_score(self, doc_embeddings, page_embeddings):
        """ 
        """

        cos_sim = util.cos_sim(doc_embeddings, page_embeddings)
        score = round(cos_sim.item(), 2)

        return score

    def _get_pages_of_category(self, category):
        """
        """
        logger.info("Counting pages of category: %s" % category["name"])

        try:
            condition = re.sub(r"[^a-zA-Z0-9]+", ' ', category["name"]).strip()
            condition = condition.replace(" ", "_")
            query = """
                SELECT COUNT(*) AS ?count
                WHERE { 
                SELECT DISTINCT  ?s
                WHERE { 
                    ?s rdfs:label ?l .
                    FILTER langMatches(lang(?l), "en")
                    FILTER EXISTS { 
                        ?s dct:subject ?cc .
                        ?cc rdfs:label ?name .
                        ?name bif:contains "%s"
                    }
                }
            }     
            """ % condition
            self.sparql.setQuery(query)
            self.sparql.setReturnFormat(JSON)
            results = self.sparql.query().convert()
            count = results["results"]["bindings"][0]["count"]["value"]
            logger.info("Found %s pages" % count)
            return count
        except Exception as e:
            logger.error("Failed to count pages of category %s - %s" %
                         (category['name'], e))
            return 0

    def _get_subcategories_of_category(self, category):
        """
        """
        logger.info("Counting subcategories of category: %s" %
                    category["name"])

        try:
            condition = re.sub(r"[^a-zA-Z0-9]+", ' ', category["name"]).strip()
            condition = condition.replace(" ", "_")

            query = """
                SELECT COUNT(*) AS ?count
                WHERE { 
                SELECT DISTINCT  ?s
                WHERE { 
                    ?s rdfs:label ?l .
                    FILTER langMatches(lang(?l), "en")
                    FILTER EXISTS { 
                        ?s skos:broader ?cc .
                        ?cc rdfs:label ?name .
                        ?name bif:contains "%s"
                    }
                }
            }     
            """ % condition
            self.sparql.setQuery(query)
            self.sparql.setReturnFormat(JSON)
            results = self.sparql.query().convert()
            count = results["results"]["bindings"][0]["count"]["value"]
            logger.info("Found %s subcategories" % count)

            return count
        except Exception as e:
            logger.error("Failed to count subcategories of category %s - %s" %
                         (category['name'], e))
            return 0

    def _get_node_weight_cf(self, node, text, concepts):
        """
        """
        try:
            # CF w_cf(r_i, c) = f_c,R_i
            countInText = 0
            countInExpansion = 0

            if node["type"] == "annotation":
                countInText = text.lower().count(
                    node["label"].split(":")[-1].lower())
            else:
                countInText = text.lower().count(
                    node["name"].split(":")[-1].lower())

            for _node in concepts:
                _ns = _node["to"]
                if any(node["name"].split(":")[-1] == _n["name"].split(":")[-1]
                       for _n in _ns):
                    countInExpansion += 1

            # expandedConcepts = list(
            #     filter(lambda x: x["type"] != "annotation", concepts))
            # for c in expandedConcepts:
            #     if node["type"] == "annotation":
            #         if node["label"].lower() in c["name"].lower():
            #             countInExpansion += 1
            #     else:
            #         if node["name"].lower() in c["name"].lower():
            #             countInExpansion += 1

            totalCount = countInText + countInExpansion
            totalLength = len(text.split())

            # totalLength = len(text.split()) + len(expandedConcepts)

            return totalCount / totalLength
        except Exception as e:
            logger.error("Failed to get node weight for %s - %s" %
                         (node["name"], e))
            return 0

    def _get_edge_weight(self, source, target, beta=0.5, max_length=2):
        """
        """
        # The Semantic Connectivity Score (SCS)
        sum = 0.0
        for l in range(1, max_length + 1):
            sum += (math.pow(beta, l) *
                    float(self._count_path_length(source, target, l)))
        score = 1 - (1 / (1 + sum))

        return score

    def _count_path_length(self, source, target, length):
        """
        """
        try:
            query = """
                SELECT (COUNT(*) AS ?length) {
                     <%(start)s> dbo:wikiPageWikiLink{%(length)s}|dct:subject{%(length)s}|skos:broader{%(length)s} <%(end)s> .
                }
            """ % {
                "start": source["uri"],
                "end": target["uri"],
                "length": length
            }
            self.sparql.setQuery(query)
            self.sparql.setReturnFormat(JSON)
            results = self.sparql.query().convert()
            _length = results["results"]["bindings"][0]["length"]["value"]

            return _length
        except Exception as e:
            logger.error(
                "Failed to get path between between (<%s>, <%s>) - %s" %
                (source['uri'], target['uri'], e))
            return 0

    def _count_property_occurence(self, property):
        """
        """
        logger.info("Counting property occurence '%s'" % property["name"])
        try:
            condition = re.sub(r"[^a-zA-Z0-9]+", ' ',
                               property["name"]).strip().replace(" ", "_")
            query = """
                SELECT COUNT(*) AS ?count
                WHERE { 
                SELECT DISTINCT  ?s
                WHERE { 
                    ?s rdfs:label ?l .
                    FILTER langMatches(lang(?l), "en")
                    FILTER EXISTS { 
                        ?s dbo:wikiPageWikiLink ?cc .
                        ?cc rdfs:label ?name .
                        ?name bif:contains "%s"
                    }
                }
            }     
            """ % condition

            self.sparql.setQuery(query)
            self.sparql.setReturnFormat(JSON)
            results = self.sparql.query().convert()

            count = results["results"]["bindings"][0]["count"]["value"]
            logger.debug("Found %s properties" % count)

            return count
        except Exception as e:
            logger.error(
                "Failed to count of occurence of property: '%s' - %s" %
                (property["uri"], e))
            return 0

    def _get_wikipedia_abstract(self, node):
        """
        """
        try:
            if node["type"] != "category":
                query = """
                    PREFIX dbpedia: <http://dbpedia.org/resource/>
                    PREFIX dbpedia-owl: <http://dbpedia.org/ontology/>

                    SELECT ?abstract  WHERE { 
                    <%s> dbpedia-owl:abstract ?abstract .
                    FILTER(langMatches(lang(?abstract),"en"))
                    }
                """ % node["uri"]
                self.sparql.setQuery(query)
                self.sparql.setReturnFormat(JSON)
                results = self.sparql.query().convert()
                abstract = results["results"]["bindings"][0]["abstract"][
                    "value"]
                node["abstract"] = abstract
            else:
                node["abstract"] = ""

        except Exception as e:
            logger.warning("Failled to retrieve abstract of page %s - %s" %
                           (node["uri"], e))
            node["abstract"] = ""

    def _get_wikipedia_page(self, node):
        """
        """
        try:
            if node["type"] != "category":
                query = """
                    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
                    SELECT ?wikipedia 
                    WHERE {
                    ?url foaf:primaryTopic <%s> .
                    BIND(STR(?url) AS ?wikipedia)
                    }
                """ % node["uri"]

                self.sparql.setQuery(query)
                self.sparql.setReturnFormat(JSON)
                results = self.sparql.query().convert()
                wikipedia = results["results"]["bindings"][0]["wikipedia"][
                    "value"]
                node["wikipedia"] = wikipedia
            else:
                node["wikipedia"] = ""

        except Exception as e:
            logger.warning("Failled to retrieve wikipedia page for %s - %s" %
                           (node["uri"], e))
            node["wikipedia"] = ""

    def _get_label(self, uri):
        """
        """
        label = ""
        try:
            query = """
                SELECT ?label
                FROM <http://dbpedia.org>
                WHERE {
                    <%s> rdfs:label ?label .
                    FILTER (lang(?label) = 'en')
                }
            """ % uri

            self.sparql.setQuery(query)
            self.sparql.setReturnFormat(JSON)
            results = self.sparql.query().convert()
            label = results["results"]["bindings"][0]["label"]["value"]

        except Exception as e:
            logger.warning("Failed to get label for '%s' - %s" % (uri, e))

        return label

    def _exists(self, node, nodes):
        return any(node['id'] == _node['id'] for _node in nodes)

    def _exists_rel(self, a, b):
        """
        """
        return any(b['id'] == node['id'] for node in a['to'])

    def _get_concept_pairs(self, nodes):
        """
        """
        return [(a, b) for a, b in product(nodes, nodes) if a != b
                and not self._exists_rel(a, b) and not self._exists_rel(b, a)]

    def _preprocess(self, text):
        """
        """
        text = text.encode("cp1251", errors='ignore').decode('utf-8', 'ignore')
        text = re.sub(r'\n{1,}', ' ', text)
        text = re.sub(r'\s{1,}', ' ', text)
        text = re.sub(r'\t{1,}', ' ', text)

        return text
