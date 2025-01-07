import pandas as pd 
from rdflib import Graph
from langdetect import detect
from bs4 import BeautifulSoup
import requests
import wikipediaapi
from services.wikipedia import WikipediaService


from bertopic import BERTopic
from scipy.stats import entropy
import numpy as np

import threading

class TimeoutException(Exception):
    pass



class DataCleaning():
    def __init__(self,concepts = pd.DataFrame(), config=None):
        np.set_printoptions(threshold = np.inf)
        self.clean_data = concepts
        self.related_relationships = self.clean_data[["name","related_to"]]
        self.clean_data.drop_duplicates(subset= ["name"],keep="last",inplace=True)
        self.concepts = concepts.name.array
        print(len(self.concepts))
        #wiki = wikipediaapi.Wikipedia('CoolBot/0.0 (https://example.org/coolbot/; coolbot@example.org) generic-library/0.0')
        self._wikipedia_service = WikipediaService()  # Initialize WikipediaService with config
        print("getting articles' abstracts...")
        self.clean_data["abstract_contents"] = self.clean_data.apply(lambda x: self.get_abstract(x),axis=1)
        print("getting full articles...")
        #self.clean_data["article_contents"] = self.clean_data.apply(lambda x: self.get_full_article(x["wikipedia"]),axis=1)
        # Assuming self._wikipedia_service is an instance of WikipediaService
        self.clean_data["article_contents"] = self.clean_data.apply(lambda x: self._wikipedia_service.get_full_article(x['wikipedia'], self.concepts), axis=1)
        #print("self.clean_data["abstract_contents"]", self.clean_data["abstract_contents"])
        self.get_dbpedia_data_simple(self.clean_data["uri"])
        print("get inlink and outlink")
        #self.clean_data["link_ratio"] = self.clean_data.apply(lambda x: self.get_inoutlinks(wiki,x["name"]),axis=1)
        print("calculating entropy...")
        self.clean_data["entropy"] = self.get_entropy(self.clean_data["abstract"])
        self.clean_data.reset_index(inplace=True)
        # self.clean_data.to_csv("results/clean_data_simple_test.csv")
        # self.related_relationships.to_csv("results/related_relationships.csv")

    def detect_language(self,text):
        try:
            lang = detect(text)
            return lang
        except:
            print(type(text))
            return ""
        
    # def parse_data(self, url):
    #         def worker(url, result):
    #             g = Graph()
    #             g.parse(url)

    #             data = []

    #             for _, p, o in g:
    #                 data.append({"P": str(p), "O": str(o)})

    #             raw_data = pd.DataFrame(data)

    #             try:
    #                 raw_data["P"] = raw_data["P"].str.replace('http://dbpedia.org/ontology/', '', regex=False)
    #                 raw_data["O"] = raw_data["O"].str.replace('http://dbpedia.org/resource/', '', regex=False)
    #                 raw_data = raw_data.loc[raw_data["P"] == "wikiPageWikiLink"]
    #             except Exception as e:
    #                 print(f"An error occurred while processing data: {e}")

    #             result.append(raw_data)

    #         result = []
    #         thread = threading.Thread(target=worker, args=(url, result))
    #         thread.start()
    #         thread.join(timeout=60)

    #         if thread.is_alive():
    #             raise TimeoutException("Function execution exceeded the time limit")

    #         return result[0] if result else None


    def parse_data(self, url):
        try:
            g = Graph()
            g.parse(url)

            data = [{"P": str(p), "O": str(o)} for _, p, o in g]
            raw_data = pd.DataFrame(data)

            if not raw_data.empty:
                raw_data["P"] = raw_data["P"].str.replace('http://dbpedia.org/ontology/', '', regex=False)
                raw_data["O"] = raw_data["O"].str.replace('http://dbpedia.org/resource/', '', regex=False)
                raw_data = raw_data.loc[raw_data["P"] == "wikiPageWikiLink"]

            return raw_data
        except Exception as e:
            print(f"Error parsing RDF data: {e}")
            return pd.DataFrame()
    
    # def get_category(self,rel_con):
    #     categories = rel_con["O"].loc[rel_con["O"].str.contains("Category:")]
    #     categories = categories.map(lambda x: x.lstrip('Category:')).array
    #     # words = self.get_concepts_mentioned(categories)
    #     return categories
    def get_category(self, rel_con):
        try:
            if not rel_con.empty:
                categories = rel_con["O"].loc[rel_con["O"].str.contains("Category:")]
                return categories.map(lambda x: x.lstrip("Category:")).tolist()
            return []
        except Exception as e:
            print(f"Error extracting categories: {e}")
            return []
    
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
                print(type(eng_text_con))
                relrel_con_abs = np.concatenate((relrel_con_abs,eng_text_con))
            except:
                pass
        relrel_con = self.get_concepts_mentioned(relrel_con)
        relrel_concept = set(relrel_con)
        relrel_concept_abs = set(list(dict.fromkeys(relrel_con_abs)))
        print(relrel_concept_abs)


        category = set(self.get_category(rel_con))
        supercat = []
        
        for word in category:
            url ="http://dbpedia.org/resource/" + word
            try:
                rel_con_2 = self.parse_data(url)
                #rel_con_2 = rel_con_2.str.encode('ascii', 'ignore').str.decode('ascii')
                supercat = supercat + self.get_category(rel_con_2)
            except Exception as e:
                print(e)
        supercat = set(list(dict.fromkeys(supercat)))
        
        return category, supercat, relrel_concept, relrel_concept_abs
    
    
    def get_relrel_concepts(self):
        return 0

    # def get_dbpedia_data_simple(self,url_list):
    #     print("getting dbpedia data...")
    #     cats = []
    #     supercats = []
    #     counter = 0
    #     for url in url_list:
    #         print(counter)
    #         try:
    #             rel_con = self.parse_data(url)
    #             category = set(self.get_category(rel_con))
    #             supercat = []
                
    #             for word in category:
    #                 url ="http://dbpedia.org/resource/" + word
    #                 try:
    #                     rel_con_2 = self.parse_data(url)
    #                     supercat = supercat + self.get_category(rel_con_2)
    #                 except Exception as e:
    #                     print(e)
    #             category = set(self.get_concepts_mentioned(category))
    #             supercat = set(list(dict.fromkeys(supercat)))
    #             cats.append(category)
    #             supercats.append(supercat)
    #             counter +=1
    #         except:
    #             cats.append(set())
    #             supercats.append(set())

    #     self.clean_data["category"] = cats
    #     self.clean_data["super_category"]=supercats
    #     self.clean_data["relrel_concepts"] = self.get_relrel_concepts()
    
    def get_dbpedia_data_simple(self, url_list):
        print("Getting DBpedia data...")
        cats = []
        supercats = []

        def process_url(url):
            try:
                # Parse and process the main URL
                rel_con = self.parse_data(url)
                category = set(self.get_category(rel_con))
                supercat = set()

                # Process categories to fetch supercategories
                category_urls = [f"http://dbpedia.org/resource/{word}" for word in category]
                for category_url in category_urls:
                    try:
                        rel_con_2 = self.parse_data(category_url)
                        supercat.update(self.get_category(rel_con_2))
                    except Exception as e:
                        print(f"Error parsing category URL: {e}")

                return set(self.get_concepts_mentioned(category)), supercat
            except Exception as e:
                print(f"Error processing URL: {e}")
                return set(), set()

        # Use threading for concurrent processing of URLs
        threads = []
        results = [None] * len(url_list)

        def worker(url, idx):
            results[idx] = process_url(url)

        for i, url in enumerate(url_list):
            thread = threading.Thread(target=worker, args=(url, i))
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join()

        # Collect results
        for result in results:
            category, supercategory = result
            cats.append(category)
            supercats.append(supercategory)

        # Store processed data in clean_data
        self.clean_data["category"] = cats
        self.clean_data["super_category"] = supercats
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
            print(e)
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
    
    # def get_concepts_mentioned(self,text):
    #     try:
    #         words = []
    #         for word in self.concepts:
    #             if word in text:
    #                 words.append(word)
    #         return list(dict.fromkeys(words))
    #     except:
    #         return []
    def get_concepts_mentioned(self, text):
        try:
            return [word for word in self.concepts if word in text]
        except Exception as e:
            print(f"Error extracting concepts: {e}")
            return []
    def get_clean_data(self):
        return self.clean_data
    
    def get_related_relationships(self):
        return self.related_relationships