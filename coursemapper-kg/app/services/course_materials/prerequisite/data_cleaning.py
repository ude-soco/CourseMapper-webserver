import pandas as pd 
from rdflib import Graph
from langdetect import detect
from bs4 import BeautifulSoup
import requests
import wikipediaapi

from bertopic import BERTopic
from scipy.stats import entropy
import numpy as np


class DataCleaning():
    def __init__(self,concepts = pd.DataFrame()):
        np.set_printoptions(threshold = np.inf)
        self.clean_data = concepts
        self.related_relationships = self.clean_data[["name","related_to"]]
        self.clean_data.drop_duplicates(subset= ["name"],keep="last",inplace=True)
        self.concepts = concepts.name.array
        wiki = wikipediaapi.Wikipedia('CoolBot/0.0 (https://example.org/coolbot/; coolbot@example.org) generic-library/0.0')
        self.clean_data["abstract_contents"] = self.clean_data.apply(lambda x: self.get_abstract(x),axis=1)
        self.clean_data["article_contents"] = self.clean_data.apply(lambda x: self.get_full_article(x["wikipedia"]),axis=1)
        self.get_dbpedia_data_simple(self.clean_data["uri"])
        self.clean_data["link_ratio"] = self.clean_data.apply(lambda x: self.get_inoutlinks(wiki,x["name"]),axis=1)
        self.clean_data["entropy"] = self.get_entropy(self.clean_data["abstract"])
        self.clean_data.reset_index(inplace=True)

    def detect_language(self,text):
        try:
            lang = detect(text)
            return lang
        except:
            return ""
        
    def parse_data(self,url):
        g = Graph()
        g.parse(url)
        raw_data = pd.DataFrame()

        for _, p, o in g:
            dict_temp = { "P":p ,"O":o}
            raw_data = pd.concat([raw_data,pd.DataFrame.from_dict([dict_temp])], ignore_index=True)
        try:
            raw_data["P"] = raw_data["P"].map(lambda x: x.lstrip('http://dbpedia.org/ontology/'))
            raw_data["O"] = raw_data["O"].map(lambda x: x.lstrip('http://dbpedia.org/resource/'))
            raw_data = raw_data.loc[raw_data["P"] == "wikiPageWikiLink"]
        except:
            pass
        return raw_data
    
    def get_category(self,rel_con):
        categories = rel_con["O"].loc[rel_con["O"].str.contains("Category:")]
        categories = categories.map(lambda x: x.lstrip('Category:')).array
        # words = self.get_concepts_mentioned(categories)
        return categories
    
    def get_inoutlinks(self,wiki,concept):
        li= wiki.page(concept)
        try:
            ratio = len(li.backlinks) / len(li.links)
            return ratio
        except:
            return 0


    def get_dbpedia_data(self,url):
        rel_con = self.parse_data(url)
        relrel_con = np.array([])
        relrel_con_abs = np.array([])


        for con in rel_con["O"].values:
            con = con.lstrip('Category:')
            url ="http://dbpedia.org/resource/" + con
            try:
                rel_con_1 = self.parse_data(url)
                relrel_con = np.concatenate((relrel_con,rel_con_1["O"].to_numpy()))

                text = pd.DataFrame(relrel_con["O"].loc[relrel_con["P"] == "stract"])
                text["language"] = text.map(lambda text:self.detect_language(text))
                try:
                    eng_text = text["O"].loc[text["language"]=="en"].item()
                except:
                    eng_text = ""
                eng_text_con = self.get_concepts_mentioned(eng_text)
                relrel_con_abs = np.concatenate((relrel_con_abs,eng_text_con))
            except:
                pass
        relrel_con = self.get_concepts_mentioned(relrel_con)
        relrel_concept = set(relrel_con)
        relrel_concept_abs = set(list(dict.fromkeys(relrel_con_abs)))


        category = set(self.get_category(rel_con))
        supercat = []
        
        for word in category:
            url ="http://dbpedia.org/resource/" + word
            try:
                rel_con_2 = self.parse_data(url)
                #rel_con_2 = rel_con_2.str.encode('ascii', 'ignore').str.decode('ascii')
                supercat = supercat + self.get_category(rel_con_2)
            except Exception as e:
                pass
        supercat = set(list(dict.fromkeys(supercat)))
        
        return category, supercat, relrel_concept, relrel_concept_abs
    
    def get_dbpedia_data_all(self,url_list):
        counter = 0
        cats = []
        supercats = []
        relrel_concepts = []
        relrel_concept_abss = []
        for url in url_list:
            category, supercat, relrel_concept,relrel_concept_abs =  self.get_dbpedia_data(url)
            cats.append(category)
            supercats.append(supercat)
            relrel_concepts.append(relrel_concept)
            relrel_concept_abss.append(relrel_concept_abs)
            counter += 1

        self.clean_data["category"] = cats
        self.clean_data["super_category"]=supercats
        self.clean_data["relrel_concepts"] = relrel_concepts
        self.clean_data["relrel_concept_abs"] = relrel_concept_abss
    
    def get_relrel_concepts(self):
        return 0

    def get_dbpedia_data_simple(self,url_list):

        cats = []
        supercats = []
        counter = 0
        for url in url_list:

            rel_con = self.parse_data(url)
            category = set(self.get_category(rel_con))
            supercat = []
            
            for word in category:
                url ="http://dbpedia.org/resource/" + word
                try:
                    rel_con_2 = self.parse_data(url)
                    supercat = supercat + self.get_category(rel_con_2)
                except Exception as e:
                    pass

            category = set(self.get_concepts_mentioned(category))
            supercat = set(list(dict.fromkeys(supercat)))
            cats.append(category)
            supercats.append(supercat)
            counter +=1

        self.clean_data["category"] = cats
        self.clean_data["super_category"]=supercats
        self.clean_data["relrel_concepts"] = self.get_relrel_concepts()
    
    def get_full_article(self,url):
        try:
            page = requests.get(url)
            soup = BeautifulSoup(page.content, 'html.parser')
            words = []
            for p in range(0,len(soup.find_all('p'))-1):
                text = soup.find_all('p')[p].get_text()
                words = words + self.get_concepts_mentioned(text)
            words = list(dict.fromkeys(words))
            return words
        except Exception as e:
            pass
        return 0
    
    def get_entropy(self,abstracts):
        abstracts = abstracts.str.encode('ascii', 'ignore').str.decode('ascii')
        # Fit model so we can get the probability of each documents containing each topics based on its abstracts
        topic_model = BERTopic(calculate_probabilities=True)
        _, probs = topic_model.fit_transform(list(abstracts.astype('str').array))
        ent = []
        for probability in probs:
            ent.append(entropy(probability, base=10))
        return ent
    
    def get_abstract(self,line):
        abstract = line.str.encode('ascii', 'ignore').str.decode('ascii')["abstract"]
        words = self.get_concepts_mentioned(abstract)
        return list(dict.fromkeys(words))
    
    def get_concepts_mentioned(self,text):
        try:
            words = []
            for word in self.concepts:
                if word in text:
                    words.append(word)
            return list(dict.fromkeys(words))
        except:
            return []
    
    def get_clean_data(self):
        return self.clean_data
    
    def get_related_relationships(self):
        return self.related_relationships