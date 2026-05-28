"""
Run:
    pipenv run python -m app.services.course_materials.Mooc_Recommendation.learner_model.learner_model
"""
"""
Pipline:

For each relationship (dnu / interested_in / engaged_in):

1. get each node's unupdated_embedding, first_weight_component, timestamp, and other information such as position_time and position_weight from relationship_info.py.
2. updated_embeddings.py uses the information from relationship_info.py to compute the updated_embedding for each node.
3. relation_component.py computes the relation_component for each relationship.
    ω_sum 
    Σ(ω_c * e_c)
4. according to the formula in utils.py, random weight matrices: W_dnu, W_int, and W_eng are generated.
5. compute the final learner model embedding:
    E_L = 1 / (ω_dnu_sum + ω_int_sum + ω_eng_sum) * [ W_dnu * (1 / ω_dnu_sum) * Σ(ω_dnu_c * e_dnu_c) + W_int * (1 / ω_int_sum) * Σ(ω_int_c * e_int_c) + W_eng * (1 / ω_eng_sum) * Σ(ω_eng_c * e_eng_c)]
    The generated final embedding also needs to be stored back into CourseMapper Neo4j.
"""

import numpy as np
from ..database_connection.mongodb_connection import MongoDBConnection
from ..database_connection.coursemapper_connection import CourseMapperConnection
from .relationship_info import DNUInfo, InterestInfo, EngagementInfo
from .updated_embeddings import ConceptEmbeddingUpdater
from .relation_components import RelationComponent

from .utils import glorot_seed, EMBEDDING_DIM

class LearnerModelEmbedding:

    def __init__(self):
        self.coursemapper_connection = CourseMapperConnection()
        self.mongodb_connection = MongoDBConnection()

    def close(self):
        self.coursemapper_connection.close()
        self.mongodb_connection.close()

    def string_to_array(self, emb_str):
        return np.array([float(x) for x in emb_str.split(",")]) 
        
    def array_to_string(self, emb_array):
        return ",".join(map(str, emb_array.tolist()))


    def compute_learner_model_embedding(self, user_id):
        """
        1. Get relationship info dict for dnu, interested_in, engaged_in
        2. Update node embeddings for each relationship
        3. Compute relation component for each relationship
        4. Generate random weight matrices for each relationship
        5. Compute final learner model embedding
        """
        """
            relationship_dict structure:
            {
                cid: {
                    "relationship": str,
                    "updated_embedding": numpy_array,
                    "weight": float,
                    "timestamp": datetime,
                    "position_weight": float,
                    "position_time": int,
                    "updated_embedding": numpy_array
                }
            }

        """
        # ------------------------------------------------
        # 1. Get relationship info for dnu, interested_in, engaged_in
        # ------------------------------------------------
        dnu_info_instance = DNUInfo(user_id, self.coursemapper_connection, self.mongodb_connection)
        dnu_dict = dnu_info_instance.get_dnu_info()

        interest_info_instance = InterestInfo(user_id, self.coursemapper_connection, self.mongodb_connection)
        interest_dict = interest_info_instance.get_interest_info()

        engagement_info_instance = EngagementInfo(user_id, self.coursemapper_connection, self.mongodb_connection)
        engagement_dict = engagement_info_instance.get_engagement_info()

        # ------------------------------------------------
        # 2. Update embeddings for each relationship
        # ------------------------------------------------
        embedding_updater = ConceptEmbeddingUpdater()

        updated_dnu_dict = embedding_updater.update_embeddings(dnu_dict)
        updated_interest_dict = embedding_updater.update_embeddings(interest_dict)
        updated_engagement_dict = embedding_updater.update_embeddings(engagement_dict)

        # ------------------------------------------------
        # 3. Compute relation component for each relationship
        # ------------------------------------------------
        """
        {
            "relationship_name": {
                "relationship_weight_sum": float,
                "weighted_embedding_sum": numpy_array
            }
        }
        """
        relation_component_calculator = RelationComponent()

        dnu_relation_component = relation_component_calculator.compute_relation_component(updated_dnu_dict)
        interest_relation_component = relation_component_calculator.compute_relation_component(updated_interest_dict)
        engagement_relation_component = relation_component_calculator.compute_relation_component(updated_engagement_dict)
        
 

        # ------------------------------------------------
        # 4. Generate random weight matrices for each relationship
        # ------------------------------------------------

        W_rel_dnu = glorot_seed((EMBEDDING_DIM, EMBEDDING_DIM)).numpy()
        W_rel_interest = glorot_seed((EMBEDDING_DIM, EMBEDDING_DIM)).numpy()
        W_rel_engagement = glorot_seed((EMBEDDING_DIM, EMBEDDING_DIM)).numpy()
                
        # 5. Compute final learner model embedding
        # ------------------------------------------------
        # Equation：E_learner =1/(ω_dnu_sum+ω_interest_sum+ω_engagement_sum) *[(1/ω_dnu_sum)*[W_rel_dnu * ∑(ω_dnu_c*e_dnu_c)] + (1/ω_interest_sum)*[W_rel_interest * ∑(ω_interest_c*e_interest_c)] +(1/ω_engagement_sum)*[W_rel_engagement * ∑(ω_engagement_c*e_engagement_c)]]
        # ------------------------------------------------

        """
        # # calculate：ω_dnu_sum + ω_interest_sum + ω_engagement_sum
        # w_sum = dnu_relation_component["dnu"]["relationship_weight_sum"] + interest_relation_component["INTERESTED_IN"]["relationship_weight_sum"] + engagement_relation_component["ENGAGED_IN"]["relationship_weight_sum"]
        # if w_sum == 0:
        #     return None  # or some default embedding
        # dnu_term = (1 / dnu_relation_component["dnu"]["relationship_weight_sum"]) * W_rel_dnu.dot(dnu_relation_component["dnu"]["weighted_embedding_sum"]) if dnu_relation_component["dnu"]["relationship_weight_sum"] > 0 else 0
        # interest_term = (1 / interest_relation_component["INTERESTED_IN"]["relationship_weight_sum"]) * W_rel_interest.dot(interest_relation_component["INTERESTED_IN"]["weighted_embedding_sum"]) if interest_relation_component["INTERESTED_IN"]["relationship_weight_sum"] > 0 else 0
        # engagement_term = (1 / engagement_relation_component["ENGAGED_IN"]["relationship_weight_sum"]) * W_rel_engagement.dot(engagement_relation_component["ENGAGED_IN"]["weighted_embedding_sum"]) if engagement_relation_component["ENGAGED_IN"]["relationship_weight_sum"] > 0 else 0
        # learner_model_embedding = (dnu_term + interest_term + engagement_term) / w_sum  
        
        # return learner_model_embedding
        """

        # has_*_relationship=False means the user does not have this relationship.
        has_dnu_relationship = bool(dnu_relation_component and "dnu" in dnu_relation_component)
        has_interest_relationship = bool(interest_relation_component and "INTERESTED_IN" in interest_relation_component)
        has_engagement_relationship = bool(engagement_relation_component and "ENGAGED_IN" in engagement_relation_component)
        
        dnu_weight_sum = (
            dnu_relation_component["dnu"]["relationship_weight_sum"] 
            if has_dnu_relationship else None)
        
        interest_weight_sum = (
            interest_relation_component["INTERESTED_IN"]["relationship_weight_sum"]
            if has_interest_relationship else None
        )
        engagement_weight_sum = (
            engagement_relation_component["ENGAGED_IN"]["relationship_weight_sum"]
            if has_engagement_relationship else None
        )

        w_sum = 0
        
        if has_dnu_relationship:
            w_sum += dnu_weight_sum
        if has_interest_relationship:
            w_sum += interest_weight_sum
        if has_engagement_relationship:
            w_sum += engagement_weight_sum

        # means user has no interactions at all, has no relationships, return zero vector
        if w_sum == 0:
            return np.zeros(EMBEDDING_DIM)

        dnu_term = (
            (1 / dnu_weight_sum) * W_rel_dnu.dot(dnu_relation_component["dnu"]["weighted_embedding_sum"])
            if (has_dnu_relationship and dnu_weight_sum != 0) else np.zeros(EMBEDDING_DIM)
        )

        interest_term = (
            (1 / interest_weight_sum)
            * W_rel_interest.dot(interest_relation_component["INTERESTED_IN"]["weighted_embedding_sum"])
            if (has_interest_relationship and interest_weight_sum != 0) else np.zeros(EMBEDDING_DIM)
        )

        engagement_term = (
            (1 / engagement_weight_sum)
            * W_rel_engagement.dot(engagement_relation_component["ENGAGED_IN"]["weighted_embedding_sum"])
            if (has_engagement_relationship and engagement_weight_sum != 0) else np.zeros(EMBEDDING_DIM)
        )

        learner_model_embedding = (dnu_term + interest_term + engagement_term) / w_sum

        return learner_model_embedding


    def store_learner_model_embedding(self, user_id, learner_model_embedding):
        """
        Store the learner model embedding back to Neo4j
        """
        with self.coursemapper_connection.get_session() as session:
            session.run("""
            MATCH (u:User {uid:$uid})
            SET u.learner_model_embedding_MOOC = $embedding
            """, uid=user_id, embedding=",".join(map(str, learner_model_embedding)))


    def generate_and_store_learner_model_embedding(self, user_id):
        learner_model_embedding = self.compute_learner_model_embedding(user_id)

        if learner_model_embedding is not None:
            self.store_learner_model_embedding(user_id, learner_model_embedding)

        return learner_model_embedding


if __name__ == "__main__":
    test_user_id = "69acb9460e3a21f27e87122f"

    learner_model_emb = LearnerModelEmbedding()

    try:
        embedding = learner_model_emb.generate_and_store_learner_model_embedding(user_id=test_user_id)
        print("Learner model embedding generated.")
        print("Embedding shape:", embedding.shape if embedding is not None else None)
    finally:
        learner_model_emb.close()