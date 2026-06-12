"""
Run:
    pipenv run python -m app.services.course_materials.Mooc_Recommendation.learner_model.learner_model_no_random_matrix

Pipeline:

This file is a test version of learner_model.py.

Main difference:
    This version does NOT use random relation-specific weight matrices.

The generated embedding will be stored in CourseMapper Neo4j as:
    User.learner_model_embedding_MOOC_no_random_matrix

This file does not overwrite:
    User.learner_model_embedding_MOOC
"""


import numpy as np

from ..database_connection.mongodb_connection import MongoDBConnection
from ..database_connection.coursemapper_connection import CourseMapperConnection

from .relationship_info import DNUInfo, InterestInfo, EngagementInfo
from .updated_embeddings import NodeEmbeddingUpdater
from .relation_components import RelationComponent

from .utils import EMBEDDING_DIM


class LearnerModelNoRandomMatrix:

    # Initialize CourseMapper Neo4j connection and MongoDB connection.
    def __init__(self):
        self.coursemapper_connection = CourseMapperConnection()
        self.mongodb_connection = MongoDBConnection()

    # Close database connections.
    def close(self):
        self.coursemapper_connection.close()
        self.mongodb_connection.close()

    # Convert embedding string to numpy array.
    def string_to_array(self, emb_str):
        return np.array([float(x) for x in emb_str.split(",")])

    # Convert numpy array to embedding string.
    def array_to_string(self, emb_array):
        return ",".join(map(str, emb_array.tolist()))

    # Compute learner model embedding without random relation-specific matrices.
    def compute_learner_model_embedding(self, user_id):
        """
        Steps:
        1. Get relationship information for dnu, INTERESTED_IN, and ENGAGED_IN.
        2. Update embeddings for nodes in each relationship.
        3. Compute relation component for each relationship.
        4. Compute final learner model embedding

        Formula in this test version:
            E_user =
                (
                    Σ(weight_dnu * updated_embedding_dnu)
                    + Σ(weight_interest * updated_embedding_interest)
                    + Σ(weight_engagement * updated_embedding_engagement)
                )
                /
                (
                    weight_sum_dnu
                    + weight_sum_interest
                    + weight_sum_engagement
                )

        No random W matrix is used.
        """

        # ------------------------------------------------
        # 1. Get relationship information
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
        embedding_updater = NodeEmbeddingUpdater()

        updated_dnu_dict = embedding_updater.update_embeddings(dnu_dict)
        updated_interest_dict = embedding_updater.update_embeddings(interest_dict)
        updated_engagement_dict = embedding_updater.update_embeddings(engagement_dict)

        # ------------------------------------------------
        # 3. Compute relation components
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
        # 4. Combine relation components without random matrices
        # ------------------------------------------------
        """
        Equation:
        E_learner =
        1 / (ω_dnu_sum + ω_interest_sum + ω_engagement_sum)
        *
        [
          (1 / ω_dnu_sum) * Σ(ω_dnu_c * e_dnu_c)
        + (1 / ω_interest_sum) * Σ(ω_interest_c * e_interest_c)
        + (1 / ω_engagement_sum) * Σ(ω_engagement_c * e_engagement_c)
        ]
        """


        # has_*_relationship=False means the user does not have this relationship.
        has_dnu_relationship = bool(dnu_relation_component and "dnu" in dnu_relation_component)
        has_interest_relationship = bool(interest_relation_component and "INTERESTED_IN" in interest_relation_component)
        has_engagement_relationship = bool(engagement_relation_component and "ENGAGED_IN" in engagement_relation_component)
        
        dnu_weight_sum = (
            dnu_relation_component["dnu"]["relationship_weight_sum"] 
            if has_dnu_relationship else 0.0)
        
        interest_weight_sum = (
            interest_relation_component["INTERESTED_IN"]["relationship_weight_sum"]
            if has_interest_relationship else 0.0
        )

        engagement_weight_sum = (
            engagement_relation_component["ENGAGED_IN"]["relationship_weight_sum"]
            if has_engagement_relationship else 0.0
        )

        w_sum = dnu_weight_sum + interest_weight_sum + engagement_weight_sum
        
        valid_relation_names = []    # record user has which relationships.

        if has_dnu_relationship and dnu_weight_sum != 0:
            valid_relation_names.append("dnu")

        if has_interest_relationship and interest_weight_sum != 0:
            valid_relation_names.append("INTERESTED_IN")

        if has_engagement_relationship and engagement_weight_sum != 0:
            valid_relation_names.append("ENGAGED_IN")
        
        # If the user has no valid relationship, return zero vector. Has no interactions.
        if len(valid_relation_names) == 0:
            return np.zeros(EMBEDDING_DIM)


        dnu_term = (
            (1 / dnu_weight_sum) * dnu_relation_component["dnu"]["weighted_embedding_sum"]
            if ("dnu" in valid_relation_names) else np.zeros(EMBEDDING_DIM)
        )

        interest_term = (
            (1 / interest_weight_sum) * interest_relation_component["INTERESTED_IN"]["weighted_embedding_sum"]
            if ("INTERESTED_IN" in valid_relation_names) else np.zeros(EMBEDDING_DIM)
        )

        engagement_term = (
            (1 / engagement_weight_sum) * engagement_relation_component["ENGAGED_IN"]["weighted_embedding_sum"]
            if ("ENGAGED_IN" in valid_relation_names) else np.zeros(EMBEDDING_DIM)
        )

        term_sum = dnu_term + interest_term + engagement_term

        # If the user only has one relationship,
        # do not divide by the outer w_sum again.
        if len(valid_relation_names) == 1:
            learner_model_embedding = term_sum
        else:
            learner_model_embedding = term_sum / w_sum

        return learner_model_embedding


    # Store the test learner model embedding into CourseMapper Neo4j.
    def store_learner_model_embedding(self, user_id, learner_model_embedding):
        """
        Store the test learner model embedding back to Neo4j
        """
        with self.coursemapper_connection.get_session() as session:
            session.run("""
                MATCH (u:User {uid: $uid})
                SET u.learner_model_embedding_MOOC_no_random_matrix = $embedding
            """, uid=user_id, embedding=self.array_to_string(learner_model_embedding))

    # Main entry: compute and store the test learner model embedding.
    def generate_and_store_learner_model_embedding(self, user_id):
        learner_model_embedding = self.compute_learner_model_embedding(user_id)

        if learner_model_embedding is not None:
            self.store_learner_model_embedding(user_id, learner_model_embedding)

        return learner_model_embedding


# if __name__ == "__main__":
#     test_user_id = "69acb9460e3a21f27e87122f"

#     learner_model_emb = LearnerModelNoRandomMatrix()

#     try:
#         embedding = learner_model_emb.generate_and_store_learner_model_embedding(
#             user_id=test_user_id
#         )

#         print("Test learner model embedding generated without random matrices.")
#         print("Stored property: learner_model_embedding_MOOC_no_random_matrix")
#         print("Embedding shape:", embedding.shape if embedding is not None else None)

#     finally:
#         learner_model_emb.close()