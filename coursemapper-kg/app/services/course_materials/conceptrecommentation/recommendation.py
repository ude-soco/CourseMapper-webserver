from ..kwp_extraction.dbpedia.concept_tagging import DBpediaSpotlight
from sentence_transformers import util
import numpy as np
import logging
from log import LOG
logger = LOG(name=__name__, level=logging.DEBUG)


def compute_cos_sim_score(embedding1, embedding2):
        """ 
        """
        # cos_sim = util.cos_sim(embedding1, embedding2)
        # score = round(cos_sim.item(), 2)

        return util.cos_sim(embedding1, embedding2).item()

class Recommendation:
    def __init__(self):
        self.dbpedia = DBpediaSpotlight()

    def recommend(self,concept_list,user,top_n):
        
        user_embedding_str = user[0]["u"]["embedding"].split(',')
        list2 = []
        for j in user_embedding_str:
            list2.append(float(j))
        user_embedding = np.array(list2)

        for concept in concept_list:
            concept_embedding_str = concept["n"]["final_embedding"].split(',')
            list2 = []
            for j in concept_embedding_str:
                list2.append(float(j))
            concept_embedding= np.array(list2)
            concept["n"]["score"] = compute_cos_sim_score(concept_embedding, user_embedding)
        
        return sorted(concept_list, key=lambda x: x["n"]["score"], reverse=True)[0:top_n]
        