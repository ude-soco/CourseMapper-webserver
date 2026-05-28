"""
Purpose of This File
--------------------
This file prepares the input information needed before computing updated embeddings and relation components.
For a given learner, this file collects information from three relation types: dnu, INTEREST_IN, and ENGAGED_IN.





DNU Relation Information Pipeline

1. Query Neo4j (CourseMapper)
   - Find all DNU Concept nodes connected to the User node via :dnu.
   - Retrieve:
        • cid (concept id)
        • dnu weight (as the first weight component)
        • concept final_embedding (rrgcn embedding)

2. Query MongoDB
   - Retrieve timestamps from user's "conceptTimestamps"

3. Group concepts by timestamp

4. Compute position_weight
   - position_weight = group_id / (concept_numbers - 1)

5. Build concept dictionary

    Output:
        {
            cid: {
                "relation": "dnu",
                "unupdated_embedding": numpy_array,
                "first_weight_component": float,
                "timestamp": datetime,
                "position_weight": float,
                "position_time": int
            }
        }

        
INTERESTED_IN Relation Information Pipeline

1. Query Neo4j (CourseMapper)
   - Find all INTERESTED_IN Concept nodes connected to the User node via :INTERESTED_IN.
   - Retrieve:
        • cid (concept id)
        • interest score (as the first weight component)
        • concept final_embedding (rrgcn embedding)
        • timestamp (relationship updatedAt)


2. Group concepts by timestamp

3. Compute position_weight
   - position_weight = group_id / (concept_numbers - 1)

4. Build concept dictionary        
   
   Output:
   {
       cid: {
           "relationship": "INTERESTED_IN",
           "unupdated_embedding": numpy_array,
           "first_weight_component": float,
           "timestamp": datetime,
           "position_weight": float,
           "position_time": int
       }
   }

ENGAGED_IN Relation Information Pipeline

1. Query Neo4j (CourseMapper)
   - Find all ENGAGED_IN Course nodes connected to the User node via :ENGAGED_IN.
   - Retrieve:
        • cid (course id)
        • engagement level (as the first weight component)
        • course_embedding
        • timestamp (relationship timestamp)

2. Group concepts by timestamp

3. Compute position_weight
   - position_weight = group_id / (concept_numbers - 1)

4. Build concept dictionary
   
   Output:
   {
       cid: {
           "relationship": "ENGAGED_IN",
           "unupdated_embedding": numpy_array,
           "first_weight_component": float,
           "timestamp": datetime,
           "position_weight": float,
           "position_time": int
       }
   }
   
"""


import numpy as np
from datetime import datetime
from bson import ObjectId

from ..database_connection.mongodb_connection import MongoDBConnection
from ..database_connection.coursemapper_connection import CourseMapperConnection


class RelationshipBase:
    
    valid_material_ids_cache = None
    valid_course_ids_cache = None
    
    def __init__(self, uid, coursemapper_db, mongodb_db):
        self.uid = uid
        self.coursemapper_connection = coursemapper_db
        self.mongodb_connection = mongodb_db


        # get materials collection and valid material ids
        self.materials = self.mongodb_connection.get_collection("materials")
        # self.valid_material_ids = set(str(mid) for mid in self.materials.distinct("_id"))
        if RelationshipBase.valid_material_ids_cache is None:
            RelationshipBase.valid_material_ids_cache = set(
                str(mid) for mid in self.materials.distinct("_id")
            )
        self.valid_material_ids = RelationshipBase.valid_material_ids_cache

        # courses collection
        self.courses = self.mongodb_connection.get_collection("courses")
        if RelationshipBase.valid_course_ids_cache is None:
            RelationshipBase.valid_course_ids_cache = set(
                str(cid) for cid in self.courses.distinct("_id")
            )

        self.valid_course_ids = RelationshipBase.valid_course_ids_cache        
        #


    def string_to_array(self, emb_str):
        if emb_str is None:
            return None

        parts = [x.strip() for x in str(emb_str).split(",") if x.strip() != ""]
        if not parts:
            return None

        try:
            return np.array([float(x) for x in parts], dtype=float)
        except ValueError:
            return None

    # --------------------------------------------- 
    # Compute position_weight and position_time based on timestamps
    # --------------------------------------------- 

    def compute_time_features(self, node_timestamps, info_dict):
        # concept_timestamps is a dictionary, key is cid, value is timestamp, used for later position_weight calculation
        
        if any(ts is None for ts in node_timestamps.values()):
            raise ValueError("Found None timestamp in node_timestamps")
        
        concept_numbers = len(node_timestamps)

        if concept_numbers == 1:
            for cid in info_dict:
                info_dict[cid]["position_weight"] = 0
                info_dict[cid]["position_time"] = 0
            return info_dict
        """
        Compute position_weight and position_time
        """
        # -----------------------------
        # `set()` removes duplicates, and `sorted()` sorts them.
        # the same timestamp will be grouped together, group_id starts from 0, sorted by time from past to recent
        unique_timestamps = sorted(set(node_timestamps.values()))
        timestamp_group = {ts: i for i, ts in enumerate(unique_timestamps)}

        #total_groups = len(unique_timestamps)

        # -----------------------------
        # Compute position_weight
        # -----------------------------
        for cid, ts in node_timestamps.items():

            group_id = timestamp_group[ts]

            position_weight = (
                group_id / (concept_numbers - 1)
                if concept_numbers > 1
                else 0.0
            )

            info_dict[cid]["position_weight"] = position_weight
            info_dict[cid]["position_time"] = group_id
        info_dict = dict(sorted(info_dict.items(),key=lambda x: x[1]["position_time"]))
        return info_dict
    
# =========================================================
# DNU
# =========================================================
# The DNU class inherits from RelationshipBase and reuses the string_to_array and compute_time_features methods.

class DNUInfo(RelationshipBase):

    def get_dnu_info(self):

        dnu_info = {}
        concept_timestamps = {}
        
       
        # -----------------------------
        # 1 Query Neo4j
        # -----------------------------
        with self.coursemapper_connection.get_session() as session:

            result = session.run(
                """
                MATCH (u:User {uid:$uid})-[r:dnu]->(c:Concept)
                RETURN
                    c.cid AS cid,
                    c.mid AS mid,
                    c.final_embedding AS concept_rrgcn_embedding,
                    r.weight AS first_weight_component
                """,
                uid=self.uid
            )

            for record in result:

                if str(record["mid"]) not in self.valid_material_ids:
                    continue

                cid = str(record["cid"])
                embedding = self.string_to_array(record["concept_rrgcn_embedding"])
                if embedding is None:
                    continue

                dnu_info[cid] = {
                    "relationship": "dnu",
                    "unupdated_embedding": embedding,
                    "first_weight_component": float(record["first_weight_component"]),
                    "timestamp": None
                }

        if not dnu_info:
            return {}
        
        # -----------------------------
        # 2 Query MongoDB timestamps
        # -----------------------------
        user_collection = self.mongodb_connection.get_collection("users")
        user_doc = user_collection.find_one({"_id": ObjectId(self.uid)})

        #print("user_doc:", user_doc)
        if not user_doc:
            return {}
        timestamps_obj = user_doc.get("conceptTimestamps", {}) if user_doc else {}
        """
        timestamps_obj structure:
            {
            key: timestamp,
            key: timestamp,
            ...
            }
        """
        # choose a default timestamp
        # if len(timestamps_obj) > 0:
        #     default_timestamp = next(iter(timestamps_obj.values()))
        # else:
        #     # datetime.min = 0001-01-01
        #     default_timestamp = datetime.min

        #concept_timestamps = {}


        # Match each DNU concept with its timestamp from MongoDB.
        for cid in dnu_info.keys():
            matched = timestamps_obj.get(cid)

            if matched is None:
                raise ValueError(f"Missing timestamp for DNU concept: {cid}")
            
            concept_timestamps[cid] = matched       # Store timestamp separately for position feature computation.
            dnu_info[cid]["timestamp"] = matched    # Also store timestamp inside the DNU information dictionary.

        dnu_info = self.compute_time_features(concept_timestamps, dnu_info)

        return dnu_info




class InterestInfo(RelationshipBase):


    def get_interest_info(self):

        interest_info = {}
        concept_timestamps = {}
   

        with self.coursemapper_connection.get_session() as session:

            result = session.run("""
            MATCH (u:User {uid:$uid})-[r:INTERESTED_IN]->(c:Concept)
            RETURN
            c.cid AS cid,
            c.mid AS mid,
            c.final_embedding AS concept_rrgcn_embedding,
            r.interestScore AS first_weight_component,
            r.updatedAt AS timestamp
            """, uid=self.uid)

            # query from neo4j and then should check if the mid in the mongodb materials collection
            # if not, ignore this record from neo4j, because it means the material has been deleted in the website 
            # but node still remains in neo4j
            
            for record in result:

                if str(record["mid"]) not in self.valid_material_ids:
                    continue

                
                cid = str(record["cid"])
            
                #timestamp = record["timestamp"] if record["timestamp"] else datetime.min
                timestamp = record["timestamp"]
                if timestamp is None:
                    raise ValueError(f"Missing timestamp for INTERESTED_IN concept: {cid}")

                embedding = self.string_to_array(record["concept_rrgcn_embedding"])
                if embedding is None:
                    continue

                interest_info[cid] = {
                    "relationship": "INTERESTED_IN",
                    "unupdated_embedding": embedding,
                    "first_weight_component": float(record["first_weight_component"]),
                    "timestamp": timestamp
                }
                concept_timestamps[cid] = timestamp
        # add position_weight and position_time
        interest_info = self.compute_time_features(concept_timestamps, interest_info)

        return interest_info

# =========================================================
# ENGAGEMENT
# =========================================================

class EngagementInfo(RelationshipBase):

    LEVEL_MAP = {
        "low": 0.1,
        "medium": 0.3,
        "high": 0.6
    }

    def get_engagement_info(self):

        engagement_info = {}
        course_timestamps = {}
       

        with self.coursemapper_connection.get_session() as session:

            result = session.run(
                """
                MATCH (u:User {uid:$uid})-[r:ENGAGED_IN]->(c:Course)
                RETURN
                    c.cid AS cid,
                    c.course_embedding AS course_embedding,
                    r.level AS level,
                    r.timestamp AS timestamp
                """,
                uid=self.uid
            )
 
            for record in result:
                cid = str(record["cid"])

                # check if course exists in MongoDB
                if cid not in self.valid_course_ids:
                    continue


                # weight mapping based on engagement level
                first_weight_component = self.LEVEL_MAP.get(record["level"], 0.0)

                #timestamp = record["timestamp"] if record["timestamp"] else None
                timestamp = record["timestamp"]
                if timestamp is None:
                    raise ValueError(f"Missing timestamp for ENGAGED_IN course: {cid}")

                # embedding string convert to numpy array
                embedding = self.string_to_array(record["course_embedding"])
                if embedding is None:
                    continue
                engagement_info[cid] = {
                    "relationship": "ENGAGED_IN",
                    "unupdated_embedding": embedding,
                    "first_weight_component": first_weight_component,
                    "timestamp": timestamp
                }
                # a dictionary, key is cid, value is timestamp, used for later position_weight calculation
                course_timestamps[cid] = timestamp

        # if no data, return directly 
        if not engagement_info:
            return {}
        engagement_info = self.compute_time_features(course_timestamps, engagement_info)

        return engagement_info