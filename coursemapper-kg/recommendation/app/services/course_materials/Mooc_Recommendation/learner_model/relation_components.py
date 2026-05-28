"""
Goal: Compute the relation component for each relationship type (dnu / interested_in / engaged_in) for a learner.

    Will calculate this component for each relationship type (dnu / interested_in / engaged_in):
    relationship_weight_sum = Σω_c
    weighted_embedding_sum = Σ(ω_c * e_c)
"""



import numpy as np
from ..database_connection.mongodb_connection import MongoDBConnection
from ..database_connection.coursemapper_connection import CourseMapperConnection
from .relationship_info import DNUInfo, InterestInfo, EngagementInfo
from .updated_embeddings import ConceptEmbeddingUpdater



class RelationComponent:

    def compute_relation_component(self, relation_info):
        """
        Compute:
            ω_sum
            Σ(ω_c * e_c)

        for one relationship (dnu / interested_in / engaged_in)

        Returns
        -------
        {
            "relationship_name": {
                "relationship_weight_sum": float,
                "weighted_embedding_sum": numpy_array
            }
        }
        where:
        """

        if not relation_info:
            return {
                #"relationship_weight_sum": 0.0,
                #"summation_weighted_embedding": None
            }

        cids = list(relation_info.keys()) # Convert all node ids in relation_info into a list.
       
        # Get the relationship name from the first node.
        # All nodes in this relation_info dictionary should belong to the same relation type.
        relationship_name = relation_info[cids[0]]["relationship"]

        # Collect the position_time value of each node.
        position_time = [relation_info[c]["position_time"] for c in cids]

        # Check whether all nodes have position_time equal to 0.
        # If all position_time values are 0, position information should not affect node weights.
        ignore_position = all(ti == 0 for ti in position_time)

        # ------------------------------------------------
        # Initialize
        # ------------------------------------------------
        relation_weight_sum = 0.0
        weighted_embedding_sum = None
        # ----------------------------------
        # calculate Σ(ωc * ec)
        # ----------------------------------
        for cid in cids:
            
            concept = relation_info[cid] # Get the information dictionary of the current node.

            first_weight_component = concept["first_weight_component"]
            position_weight = concept["position_weight"]
            node_embedding = concept["updated_embedding"]

            # --------------------------------------------
            # Compute relation weight
            # --------------------------------------------

            # If all nodes have position_time = 0, use only the first weight component.
            if ignore_position:
                node_weight = first_weight_component
            else:
                node_weight = (first_weight_component + position_weight) / 2

            # --------------------------------------------
            # Accumulate weighted embeddings and weights.
            # --------------------------------------------

            
            if weighted_embedding_sum is None:
                weighted_embedding_sum = np.zeros_like(node_embedding)

            weighted_embedding_sum += node_weight * node_embedding
            relation_weight_sum += node_weight

        # return dictionary for one relationship type (dnu / interested_in / engaged_in)
        relation_component = {
            relationship_name: {
                "relationship_weight_sum": relation_weight_sum,
                "weighted_embedding_sum": weighted_embedding_sum
            }
        }

        return relation_component
    