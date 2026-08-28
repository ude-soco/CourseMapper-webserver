"""
Pipeline:

   - Read the current user's learner_model_embedding_MOOC from CooursMapper neo4j.
   - Read CourseMapper courses that the user has not ENGAGED_IN.
   - Read all MoocCentral courses.
   - Merge candidate courses.
   - Compute cosine similarity between user embedding and candidate course embedding.
   - Sort by score and return Top-20 courses.

   
This file provides two entry points:
   - generate_simple_recommendations(user_id): return simple recommendation results.
   - generate_detailed_recommendations(user_id): return detailed recommendation results.

Run command:
    pipenv run python -m app.services.course_materials.Mooc_Recommendation.recommendation_list.mooc_recommendation_list_no_random_matrix
"""


"""
Returned coursemapper recommended course format:
[
    {
        "source": "CourseMapper",
        "score": 0.950947,
        "course_id": "...",
        "name": "...",
        "node_properties": {
            "cid": "...",
            "name": "..."
        }
    }
]

Returned mooccentral recommended course format:
[
    {
        "source": "MoocCentral",
        "score": 0.620783,
        "course_id": "...",
        "name": "...",
        "institutions": [...],
        "teachers": [...],
        "platforms": [...],
        "node_properties": {
            "audience": "...",
            "certification": "...",
            "course_category": "...",
            "course_content": "...",
            "course_id": "...",
            "description": "...",
            "duration": "...",
            "goal": "...",
            "keywords": "...",
            "language": "...",
            "level": "...",
            "link": "...",
            "name": "...",
            "number_of_participants": "...",
            "prerequisites": "...",
            "price": "...",
            "rating": "...",
            "recommendations": "..."
        }
    }
]
"""


import numpy as np
import textwrap

from ..database_connection.CourseMapper_connection import CourseMapperConnection
from ..database_connection.MoocCentral_connection import MoocCentralConnection


class MOOCRecommendationList:

    # Initialize two Neo4j database connections.
    def __init__(self):
        self.coursemapper_connection = CourseMapperConnection()
        self.mooccentral_connection = MoocCentralConnection()

    # Close both database connections.
    def close(self):
        self.coursemapper_connection.close()
        self.mooccentral_connection.close()

    # Convert an embedding string from database into a numpy array.
    def string_to_array(self, emb_str):
        return np.array([float(x) for x in emb_str.split(",")])

    # Convert a numpy array into a string for database storage.
    def array_to_string(self, emb_array):
        return ",".join(map(str, emb_array.tolist()))
    
    

    # Remove large embedding fields from node properties.
    def remove_embedding_fields(self, node_properties):
        for field in [
            "course_embedding",
            "name_embedding",
            "initial_embedding",
            "final_embedding"
        ]:
            node_properties.pop(field, None)

        return node_properties

    # Sort dictionary keys from A to Z.
    def sort_dict_by_key(self, data_dict):
        return {
            key: data_dict[key]
            for key in sorted(data_dict.keys())
        }


    
    # Read the current user's learner_model_embedding_MOOC from CourseMapper neo4j.
    def get_user_embedding(self, user_id):
        with self.coursemapper_connection.get_session() as session:
            record = session.run("""
                MATCH (u:User {uid: $uid})
                WHERE u.learner_model_embedding_MOOC_no_random_matrix IS NOT NULL
                RETURN u.learner_model_embedding_MOOC_no_random_matrix AS embedding
            """, uid=user_id).single()

        if record is None:
            print(f"No learner_model_embedding_MOOC_no_random_matrix found for uid: {user_id}")
            return None

        return self.string_to_array(record["embedding"])

    # Read CourseMapper courses that the current user has not engaged in.
    def get_coursemapper_candidate_courses(self, user_id):
        coursemapper_candidates = []

        with self.coursemapper_connection.get_session() as session:
            result = session.run("""
                MATCH (course:Course)
                WHERE course.course_embedding IS NOT NULL

                OPTIONAL MATCH (:User {uid: $uid})-[r:ENGAGED_IN]->(course)

                WITH course, r
                WHERE r IS NULL

                RETURN
                    course.cid AS course_id,
                    course.name AS name,
                    course.course_embedding AS embedding
            """, uid=user_id)

            for record in result:
                coursemapper_candidates.append({
                    "source": "CourseMapper",
                    "course_id": record["course_id"],
                    "name": record["name"],
                    "embedding": self.string_to_array(record["embedding"])
                })

        return coursemapper_candidates

    #  Read all MoocCentral courses with course_embedding.
    def get_mooccentral_candidate_courses(self):
        mooccentral_candidates = []

        with self.mooccentral_connection.get_session() as session:
            result = session.run("""
                MATCH (course:Course)
                WHERE course.course_embedding IS NOT NULL

                RETURN
                    course.course_id AS course_id,
                    course.name AS name,
                    course.course_embedding AS embedding
            """)

            for record in result:
                mooccentral_candidates.append({
                    "source": "MoocCentral",
                    "course_id": record["course_id"],
                    "name": record["name"],
                    "embedding": self.string_to_array(record["embedding"])
                })

        return mooccentral_candidates

    # Merge candidate courses from both MoocCentral and CourseMapper neo4j database.
    def get_all_candidate_courses(self, user_id):
        coursemapper_courses = self.get_coursemapper_candidate_courses(user_id)
        mooccentral_courses = self.get_mooccentral_candidate_courses()
        candidate_courses = coursemapper_courses + mooccentral_courses

        return candidate_courses

    # Compute cosine similarity between user embedding and course embedding.
    def cosine_similarity(self, user_embedding, course_embedding):
        user_norm = np.linalg.norm(user_embedding)
        course_norm = np.linalg.norm(course_embedding)

        if user_norm == 0 or course_norm == 0:
            return 0.0

        return float(
            np.dot(user_embedding, course_embedding) / (user_norm * course_norm)
        )



    # Read detailed information of one CourseMapper course.
    def get_coursemapper_course_details(self, course_id):
        node_properties = {}

        with self.coursemapper_connection.get_session() as session:
            record = session.run("""
                MATCH (course:Course {cid: $course_id})
                RETURN properties(course) AS node_properties
            """, course_id=course_id).single()

        if record is None:
            print(f"No course found with cid: {course_id}")
            return {"node_properties": node_properties}

        node_properties = dict(record["node_properties"])

        # Remove large embedding fields.
        node_properties = self.remove_embedding_fields(node_properties)

        # CourseMapper Course only needs cid and name in node_properties.
        node_properties = {
            "cid": node_properties.get("cid"),
            "name": node_properties.get("name")
        }

        return {"node_properties": node_properties}


    # Read detailed information of one MoocCentral course, including neighbor nodes.
    def get_mooccentral_course_details(self, course_id):
        course_details = {
            "institutions": [],
            "teachers": [],
            "platforms": [],
            "node_properties": {}
        }

        with self.mooccentral_connection.get_session() as session:
            record = session.run("""
                MATCH (course:Course {course_id: $course_id})

                OPTIONAL MATCH (institution:Institution)-[:OFFERS]-(course)
                WITH course,
                    [item IN collect(DISTINCT institution)
                    WHERE item IS NOT NULL | properties(item)] AS institutions

                OPTIONAL MATCH (teacher:Teacher)-[:TEACHES]-(course)
                WITH course, institutions,
                    [item IN collect(DISTINCT teacher)
                    WHERE item IS NOT NULL | properties(item)] AS teachers

                OPTIONAL MATCH (course)-[:AVAILABLE_ON]-(platform:Platform)

                RETURN
                    properties(course) AS node_properties,
                    institutions AS institutions,
                    teachers AS teachers,
                    [item IN collect(DISTINCT platform)
                    WHERE item IS NOT NULL | properties(item)] AS platforms
            """, course_id=course_id).single()

        if record is None:
            print(f"No MoocCentral course found with course_id: {course_id}")
            return course_details

        node_properties = dict(record["node_properties"])

        # Remove large embedding fields.
        node_properties = self.remove_embedding_fields(node_properties)

        # Sort course node properties from A to Z.
        node_properties = self.sort_dict_by_key(node_properties)

        # Sort neighbor node properties from A to Z.
        institutions = [
            self.sort_dict_by_key(dict(item))
            for item in record["institutions"]
        ]

        teachers = [
            self.sort_dict_by_key(dict(item))
            for item in record["teachers"]
        ]

        platforms = [
            self.sort_dict_by_key(dict(item))
            for item in record["platforms"]
        ]

        course_details = {
            "institutions": institutions,
            "teachers": teachers,
            "platforms": platforms,
            "node_properties": node_properties
        }

        return course_details 


    # Score all candidate courses, sort them, and return Top-20.
    def rank_candidate_courses(self, user_id):
        top_k = 20

        user_embedding = self.get_user_embedding(user_id)

        if user_embedding is None:
            return []

        candidate_courses = self.get_all_candidate_courses(user_id)

        ranked_courses = []

        for course in candidate_courses:
            score = self.cosine_similarity(
                user_embedding=user_embedding,
                course_embedding=course["embedding"]
            )

            ranked_courses.append({
                "source": course["source"],
                "course_id": course["course_id"],
                "name": course["name"],
                "score": score
            })

        ranked_courses.sort(key=lambda x: x["score"], reverse=True)

        return ranked_courses[:top_k]


    # Entry 1. Return simple recommendation results.
    def generate_simple_recommendations(self, user_id):
        recommendations = self.rank_candidate_courses(user_id)

        return recommendations

    
    # Entry 2. Return detailed recommendation results.
    def generate_detailed_recommendations(self, user_id):
        ranked_courses = self.rank_candidate_courses(user_id)

        detailed_recommendations = []

        for course in ranked_courses:
            recommendation = {
                "source": course["source"],
                "score": course["score"],
                "course_id": course["course_id"],
                "name": course["name"]
            }

            if course["source"] == "CourseMapper":
                details = self.get_coursemapper_course_details(
                    course_id=course["course_id"]
                )

            elif course["source"] == "MoocCentral":
                details = self.get_mooccentral_course_details(
                    course_id=course["course_id"]
                )

            else:
                details = {}

            recommendation.update(details)

            detailed_recommendations.append(recommendation)

        return detailed_recommendations

    
    
    
    
    # Print one key-value property with line wrapping.
    # This is only used for terminal display.
    # It does not change the returned recommendation list.
    def print_wrapped_property(self, key, value, indent="      ", width=100):
        if value is None:
            value_text = "None"
        else:
            value_text = str(value).replace("\n", " ")

        wrapped_lines = textwrap.wrap(value_text, width=width)

        if not wrapped_lines:
            print(f"{indent}{key}:")
            return

        print(f"{indent}{key}: {wrapped_lines[0]}")

        extra_indent = indent + " " * (len(key) + 2)

        for line in wrapped_lines[1:]:
            print(f"{extra_indent}{line}")

    # Print a list of connected nodes, such as institutions, teachers, or platforms.
    # Each node is a dictionary.
    def print_node_list(self, title, node_list):
        print(f"   {title}:")

        if not node_list:
            print("      None")
            return

        for idx, node in enumerate(node_list, start=1):
            print(f"      {idx}.")

            for key, value in node.items():
                self.print_wrapped_property(
                    key,
                    value,
                    indent="         ",
                    width=90
                )

    # Print node properties of one recommended course.
    # The node_properties dictionary has already been cleaned and sorted.
    def print_node_properties(self, node_properties):
        print("   Node Properties:")

        if not node_properties:
            print("      None")
            return

        for key, value in node_properties.items():
            self.print_wrapped_property(key, value)

    # Print detailed recommendation list in a readable terminal format.
    # recommendations is a Python list.
    # Each element in this list is a dictionary representing one recommended course.
    def print_detailed_recommendations(self, recommendations):
        print("\n===== Detailed Top-20 MOOC Recommendations =====")

        for idx, rec in enumerate(recommendations, start=1):
            print(f"\n{idx}.")
            print(f"   Source    : {rec['source']}")
            print(f"   Score     : {rec['score']:.6f}")
            print(f"   Course ID : {rec['course_id']}")
            print(f"   Name      : {rec['name']}")

            if rec["source"] == "MoocCentral":
                self.print_node_list("Institutions", rec.get("institutions", []))
                self.print_node_list("Teachers", rec.get("teachers", []))
                self.print_node_list("Platforms", rec.get("platforms", []))

            self.print_node_properties(rec.get("node_properties", {}))





if __name__ == "__main__":

    user_id = "69acb9460e3a21f27e87122f"

    recommendation_list = MOOCRecommendationList()

    try:
        detailed_recommendations = recommendation_list.generate_detailed_recommendations(
            user_id=user_id
        )

        recommendation_list.print_detailed_recommendations(
            detailed_recommendations
        )

    finally:
        recommendation_list.close()
