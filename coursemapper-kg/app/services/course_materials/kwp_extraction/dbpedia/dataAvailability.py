#Chack availability of keyphrase in DBpedia
import requests
from SPARQLWrapper import SPARQLWrapper, JSON
from wikipediaapi import Wikipedia
from sentence_transformers import util, SentenceTransformer
from itertools import product
import re
import math

import logging
from log import LOG

logger = LOG(name=__name__, level=logging.DEBUG)

class FoundAtDBpediaSpotlight:
    """
    """

    def __init__(self, lang='en'):
        self.url = "https://api.dbpedia-spotlight.org/%s/annotate" % lang
        self.sparql = SPARQLWrapper("http://dbpedia.org/sparql")
        self.sparql.setTimeout(60)
        self.wiki_api = Wikipedia('en')
        self.model = SentenceTransformer('all-mpnet-base-v2')

    def kwpAvailable(self, keyphrases):#extract keyphrases for semi-automatic annotations process
        """
        """
        print('hello from kwpAvailable')
        finalList = []
        kwpList = []
        try:
            for kp in keyphrases:
                params = {"text": kp, "confidence": 0.35, "support": 5}
                headers = {"Accept": "application/json"}
                r = requests.get(self.url, headers=headers,
                                 params=params).json()

                if 'Resources' in r:
                    resources = r['Resources']
                    # finalList.append(kp)
                    for resource in resources:
                        kwp = {
                            "id": abs(hash(resource['@URI'])),
                            "label": resource['@surfaceForm'],
                            "uri": resource['@URI'],
                            # "sim_score": resource['@similarityScore'],
                            # "type": "annotation",
                            # "mid": material_id,
                            # "to": [],
                        }
                    label = self._get_label(resource['@URI'])
                    if label != "":
                        kwp["name"] = label

                    if not self._exists(kwp, kwpList):
                                kwpList.append(kwp)
            for kw in kwpList:
                finalList.append(kw['label'])


        except Exception as e:
            logger.error("Failed to check availability of %s - %s" % (kp, e))
        
        # print('$$$$$$$$$$$$$$$$$$$$$$$$$$$$')
        # print('Final keyphrases list is:')
        # print(type(finalList))
        # print(finalList)
        # print('$$$$$$$$$$$$$$$$$$$$$$$$$$$$')
        return finalList
    
    
    def buildPath(self, 
        materialId,
        keyphrases,
        text,
        with_category=True,
        with_property=True,
        with_doc_sim=True,
        whole_text=False):
        """
        """
        print('expand')
        concepts = self.expand(materialId=materialId,
                               text=text,
                               keyphrases=keyphrases,
                               with_category=with_category,
                               with_property=with_property,
                               whole_text=whole_text)

        ### look for path between every concept pair - takes a long time ###
        #pairs = self._get_concept_pairs(concepts)
        #[self._get_path(pair[0], pair[1]) for pair in pairs]
        
        # print('concepts:')
        # print(concepts)

        try:
            if with_doc_sim:
                doc_embeddings = self._get_embeddings(text)
                for node in concepts:
                    if node["type"] == "main_concept" or node[
                            "type"] == "property":
                        ann_text = self.wiki_api.page(
                            node['uri'].split("/")[-1]).text
                        ann_text = self._preprocess(ann_text)
                        ann_embeddings = self._get_embeddings(ann_text)

                        score = self._get_semantic_similarity_score(
                            doc_embeddings, ann_embeddings)
                        node["weight"] = score

                    if node["type"] == "category":
                        score = self._calculate_similiraty_weight(
                            node, doc_embeddings)
                        node["weight"] = score
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
            for node in concepts:
                self._get_wikipedia_page(node)
                self._get_wikipedia_abstract(node)

            return concepts
        except Exception as e:
            logger.error("Failure due to - %s" % e)

    

    def expand(self, materialId, text, keyphrases, with_category,
               with_property, whole_text):
        """
        """
        all_annotations = []
        try:
            # print('keyphrases:')
            # print(keyphrases)
            annotations = self.annotate(materialId, text, keyphrases,
                                        whole_text)

            # print('annotations are:')
            # print(annotations)
            for annotation in annotations:
                try:
                    if with_category:
                        self._get_categories(annotation, all_annotations)
                    if with_property:
                        self._get_related_concepts(
                            annotation=annotation,
                            all_annotations=all_annotations)
                except Exception as e:
                    logger.error(
                        "Failed expanding '%s' - %s" % annotation["uri"], e)
        except Exception as e:
            logger.error("Failure in expansion - %s", e)
        return all_annotations

    def annotate(self, materialId, text, keyphrases, whole_text=False):
        """
        """
        # print('Keyphrases from annotate')
        # print(keyphrases)
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
                    texts.append(". ".join(#consider case sensetivity
                        list(map(lambda x: x[0].capitalize(), keyphrases))))
            print('Appended keyphrases')
            print(texts)
            for _text in texts:
                params = {"text": _text, "confidence": 0.35, "support": 5}
                headers = {"Accept": "application/json"}
                r = requests.get(self.url, headers=headers,
                                 params=params).json()
                # print('response is:')
                # print(r)
                if 'Resources' in r:
                    resources = r['Resources']

                    for resource in resources:
                        annotation = {
                            "id": abs(hash(resource['@URI'])),
                            "label": resource['@surfaceForm'],
                            "uri": resource['@URI'],
                            "sim_score": resource['@similarityScore'],
                            "type": "main_concept",
                            "mid": materialId,
                            "to": [],
                        }
                        label = self._get_label(resource['@URI'])
                        if label != "":
                            annotation["name"] = label

                        if not self._exists(annotation, annotations):
                            annotations.append(annotation)

        except Exception as e:
            logger.error("Failed to annotate %s - %s" % (texts, e))

        return annotations

    def _get_categories(self, annotation, all_annotations):
        """
        """
        logger.info("Getting categories for '%s'" % annotation["name"])
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
                    "id": abs(hash(result['category']['value'])),
                    "name": result['categoryLabel']['value'],
                    "uri": result['category']['value'],
                    "type": "category",
                    "expanded": True,
                    "mid": annotation["mid"],
                    "to": []
                }
                if not self._exists(node, all_annotations):
                    all_annotations.append(node)
                if not self._exists_rel(annotation, node):
                    edge_weight = self._get_edge_weight(annotation, node)
                    annotation['to'].append({
                        "id": node['id'],
                        "name": node['name'],
                        "weight": edge_weight,
                        "rel_type": "HAS_CATEGORY"
                    })
                    if not self._exists(annotation, all_annotations):
                        all_annotations.append(annotation)
        except Exception as e:
            logger.error("Failed to get categories for %s - %s" %
                         (annotation['uri'], e))

    def _get_related_concepts(self, annotation, all_annotations):
        """
        """
        logger.info("Getting related concepts for '%s'" % annotation["name"])

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
                    "id": abs(hash(result['property']['value'])),
                    "name": result['propertyLabel']['value'],
                    "uri": result['property']['value'],
                    "type": "property",
                    "expanded": True,
                    "mid": annotation["mid"],
                    "to": []
                }
                try:
                    if not self._exists(node, all_annotations):
                        all_annotations.append(node)

                    if not self._exists_rel(annotation, node):
                        edge_weight = self._get_edge_weight(annotation, node)

                        annotation['to'].append({
                            "id": node['id'],
                            "name": node['name'],
                            "weight": edge_weight,
                            "rel_type": "RELATED_TO"
                        })
                        if not self._exists(annotation, all_annotations):
                            all_annotations.append(annotation)
                except Exception as e:
                    logger.error("Failure %s - %s" % (node["name"], e))

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
        #self.tagger = get_POSTagger(tagger_model="")
        #sentences = self.tagger.get_sentences(text)

        sents_embs = self.model.encode(text)
        # embeddings = np.mean(sents_embs, axis=0)

        # self.tagger.close()

        return sents_embs

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

            if node["type"] == "main_concept":
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

            #totalLength = len(text.split()) + len(expandedConcepts)

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
