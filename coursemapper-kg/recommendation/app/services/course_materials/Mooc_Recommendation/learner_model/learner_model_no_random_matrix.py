"""
Run:
    pipenv run python -m app.services.course_materials.Mooc_Recommendation.learner_model.learner_model_no_random_matrix

Pipeline:

This file is a test version of learner_model.py.

Main difference:
    This version does NOT use random relation-specific weight matrices.

Original learner_model.py:
    relation component -> random W_rel_dnu / W_rel_interest / W_rel_engagement -> final learner embedding

This test version:
    relation component -> directly weighted average -> final learner embedding

The generated embedding will be stored in CourseMapper Neo4j as:
    User.learner_model_embedding_MOOC_no_random_matrix

This file does not overwrite:
    User.learner_model_embedding_MOOC
"""

import numpy as np

from ..database_connection.mongodb_connection import MongoDBConnection
from ..database_connection.coursemapper_connection import CourseMapperConnection

from .relationship_info import DNUInfo, InterestInfo, EngagementInfo
from .updated_embeddings import ConceptEmbeddingUpdater
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
        4. Directly combine weighted embedding sums.
        5. Divide by total relationship weight.

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
        dnu_info_instance = DNUInfo(
            user_id,
            self.coursemapper_connection,
            self.mongodb_connection
        )
        dnu_dict = dnu_info_instance.get_dnu_info()

        interest_info_instance = InterestInfo(
            user_id,
            self.coursemapper_connection,
            self.mongodb_connection
        )
        interest_dict = interest_info_instance.get_interest_info()

        engagement_info_instance = EngagementInfo(
            user_id,
            self.coursemapper_connection,
            self.mongodb_connection
        )
        engagement_dict = engagement_info_instance.get_engagement_info()

        # ------------------------------------------------
        # 2. Update embeddings for each relationship
        # ------------------------------------------------
        embedding_updater = ConceptEmbeddingUpdater()

        updated_dnu_dict = embedding_updater.update_embeddings(dnu_dict)
        updated_interest_dict = embedding_updater.update_embeddings(interest_dict)
        updated_engagement_dict = embedding_updater.update_embeddings(engagement_dict)

        # ------------------------------------------------
        # 3. Compute relation components
        # ------------------------------------------------
        relation_component_calculator = RelationComponent()

        dnu_relation_component = relation_component_calculator.compute_relation_component(
            updated_dnu_dict
        )

        interest_relation_component = relation_component_calculator.compute_relation_component(
            updated_interest_dict
        )

        engagement_relation_component = relation_component_calculator.compute_relation_component(
            updated_engagement_dict
        )

        # ------------------------------------------------
        # 4. Combine relation components without random matrices
        # ------------------------------------------------
        weighted_embedding_sum_total = np.zeros(EMBEDDING_DIM)
        weight_sum_total = 0.0

        if dnu_relation_component and "dnu" in dnu_relation_component:
            dnu_weight_sum = dnu_relation_component["dnu"]["relationship_weight_sum"]
            dnu_weighted_embedding_sum = dnu_relation_component["dnu"]["weighted_embedding_sum"]

            weighted_embedding_sum_total += dnu_weighted_embedding_sum
            weight_sum_total += dnu_weight_sum

        if interest_relation_component and "INTERESTED_IN" in interest_relation_component:
            interest_weight_sum = interest_relation_component["INTERESTED_IN"]["relationship_weight_sum"]
            interest_weighted_embedding_sum = interest_relation_component["INTERESTED_IN"]["weighted_embedding_sum"]

            weighted_embedding_sum_total += interest_weighted_embedding_sum
            weight_sum_total += interest_weight_sum

        if engagement_relation_component and "ENGAGED_IN" in engagement_relation_component:
            engagement_weight_sum = engagement_relation_component["ENGAGED_IN"]["relationship_weight_sum"]
            engagement_weighted_embedding_sum = engagement_relation_component["ENGAGED_IN"]["weighted_embedding_sum"]

            weighted_embedding_sum_total += engagement_weighted_embedding_sum
            weight_sum_total += engagement_weight_sum

        # If the user has no relationship data, return zero vector.
        if weight_sum_total == 0:
            return np.zeros(EMBEDDING_DIM)

        learner_model_embedding = weighted_embedding_sum_total / weight_sum_total

        return learner_model_embedding

    # Store the test learner model embedding into CourseMapper Neo4j.
    def store_learner_model_embedding(self, user_id, learner_model_embedding):
        with self.coursemapper_connection.get_session() as session:
            session.run("""
                MATCH (u:User {uid: $uid})
                SET u.learner_model_embedding_MOOC_no_random_matrix = $embedding
            """, uid=user_id, embedding=self.array_to_string(learner_model_embedding))

    # Main entry: compute and store the test learner model embedding.
    def generate_and_store_learner_model_embedding(self, user_id):
        learner_model_embedding = self.compute_learner_model_embedding(user_id)

        if learner_model_embedding is not None:
            self.store_learner_model_embedding(
                user_id=user_id,
                learner_model_embedding=learner_model_embedding
            )

        return learner_model_embedding


if __name__ == "__main__":
    test_user_id = "69acb9460e3a21f27e87122f"

    learner_model_emb = LearnerModelNoRandomMatrix()

    try:
        embedding = learner_model_emb.generate_and_store_learner_model_embedding(
            user_id=test_user_id
        )

        print("Test learner model embedding generated without random matrices.")
        print("Stored property: learner_model_embedding_MOOC_no_random_matrix")
        print("Embedding shape:", embedding.shape if embedding is not None else None)

    finally:
        learner_model_emb.close()