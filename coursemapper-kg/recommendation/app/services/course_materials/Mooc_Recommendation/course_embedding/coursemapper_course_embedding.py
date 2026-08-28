
"""
Goal:
-----
Generate and store two types of embeddings for each course:
1. name_embedding
2. course_embedding

Pipeline
========
Step 1: Find Course nodes without name_embedding.
Step 2: Generate course name embeddings using SBERT.
Step 3: Store the generated course name embeddings back into Neo4j as the property: c.name_embedding.
Step 4: Read courseId from the MongoDB materials collection, and sync it into Neo4j LearningMaterial nodes that do not have course_id yet.
Step 5: Build the course -> concept mapping.
        derived from the LearningMaterial -> Concept relationship in Neo4j, together with LearningMaterial.course_id.
Step 6: Read all course name embeddings from Neo4j.
Step 7: Read all concept final embeddings from Neo4j.(RRGCN)
Step 8: For each course, collect all valid concept embeddings according to the course -> concept mapping.
Step 9:
--------
Compute the final course embedding of each course using:

    course_embedding = (1 / weight_sum) * Σ (w_i * concept_i_rrgcn_emb)

where

    w_i = cosine(course_name_emb, concept_i_rrgcn_emb)
    weight_sum = Σ w_i


Special case:
-------------
If a course has no valid concepts,
then its final course embedding degenerates to its name embedding.


Step 10: Store the computed course embeddings back into Neo4j as the property: c.course_embedding


Output:
-------------
Each Course node in CourseMapper Neo4j will finally contain two embeddings:
1. c.name_embedding
2. c.course_embedding
"""



# type this command to run this file:
# pipenv run python -m app.services.course_materials.Mooc_Recommendation.course_embedding.coursemapper_course_embedding



from ..database_connection.CourseMapper_connection import CourseMapperConnection
from ..database_connection.MongoDB_connection import MongoDBConnection

from bson import ObjectId
from sentence_transformers import SentenceTransformer

import numpy as np



class CourseMapperCourseEmbedding:

    def __init__(self):

        self.coursemapper_db = CourseMapperConnection()
        self.mongodb_db = MongoDBConnection()

        self.coursemapper_driver = self.coursemapper_db.driver
        # MongoDB
        self.materials = self.mongodb_db.get_collection("materials")
       
        self.model = SentenceTransformer("all-mpnet-base-v2")

    def close(self):
        self.coursemapper_db.close()
        self.mongodb_db.close()
        

    """
                np.array([0.1, 0.2, 0.3])
                    ↓ tolist()
                [0.1, 0.2, 0.3]
                    ↓ map(str)
                ["0.1","0.2","0.3"]
                    ↓ join
                "0.1,0.2,0.3"
    """
    # ---------------------------------------------------
    # convert string to numpy array
    # convert numpy array to string
    # ---------------------------------------------------    
    # def string_to_array(self, emb_str):
    #     return np.array([float(x) for x in emb_str.split(",")])
    
    def array_to_string(self, emb_array):
        return ",".join(map(str, emb_array.tolist()))
    def string_to_array(self, emb_str):
        
        if emb_str is None:
            return None

        # Split the string by commas.
        # strip() removes spaces around each number.
        # if x.strip() != "" filters empty strings to avoid float("") errors.
        parts = [x.strip() for x in emb_str.split(",") if x.strip() != ""]

         # If no number remains after filtering, the embedding is invalid, so return None.
        if len(parts) == 0:
            return None

        # convert the list of strings to a numpy array of floats. 
        return np.array([float(x) for x in parts], dtype=np.float32)

    # ---------------------------------------------------
    # get course nodes which have no course name embedding attribute in Neo4j
        # means they are new courses that have not been embedded by SBERT yet.
        # or the first time to generate course name embeddings for all courses
    # ---------------------------------------------------

    def get_new_courses(self):

        with self.coursemapper_driver.session() as session:

            result = session.run("""
            MATCH (c:Course)
            WHERE c.name_embedding IS NULL
            RETURN c.cid as cid, c.name as name
            """)

            courses_id_to_name_dict = {}

            for r in result:
                courses_id_to_name_dict[r["cid"]] = r["name"]
        
        # Return the dictionary in the format course_id -> course_name.
        return courses_id_to_name_dict

    # ---------------------------------------------------
    # generate embeddings using SBERT
    # ---------------------------------------------------

    def generate_sbert_embeddings(self, name_dict):

        if len(name_dict) == 0:
            return {}

        ids = list(name_dict.keys())
        texts = list(name_dict.values())

        embeddings = self.model.encode(texts)

        emb_dict = {}

        for i, id_ in enumerate(ids):
            emb_dict[id_] = embeddings[i]

        return emb_dict


    # --------------------------------------------------
    # get course name embedding from CourseMapper Neo4j
    # --------------------------------------------------

    def get_course_name_embeddings(self):

        with self.coursemapper_driver.session() as session:

            result = session.run("""
            MATCH (c:Course)
            WHERE c.name_embedding IS NOT NULL
            RETURN c.cid AS course_id, c.name_embedding AS embedding
            """)

            course_name_embeddings_dict = {}

            for record in result:
                course_name_embeddings_dict[record["course_id"]] = self.string_to_array(record["embedding"])

        return course_name_embeddings_dict


    
    # --------------------------------------------------
    # get concept rrgcn embedding from CourseMapper Neo4j
    # --------------------------------------------------

    # def get_concept_rrgcn_embeddings(self):

    #     with self.coursemapper_driver.session() as session:

    #         result = session.run("""
    #         MATCH (c:Concept)
    #         WHERE c.final_embedding IS NOT NULL
    #         RETURN c.cid AS concept_id, c.final_embedding AS embedding
    #         """)

    #         concept_rrgcn_embeddings_dict = {}

    #         for record in result:
    #             concept_rrgcn_embeddings_dict[record["concept_id"]] = self.string_to_array(record["embedding"])

    #     return concept_rrgcn_embeddings_dict
    

    # Because the rrgcn embedding was generated by an earlier version, there may be some formatting issues, causing string_to_array to fail.
    def get_concept_rrgcn_embeddings(self):

        with self.coursemapper_driver.session() as session:

            result = session.run("""
            MATCH (c:Concept)
            WHERE c.final_embedding IS NOT NULL
            RETURN c.cid AS concept_id, c.final_embedding AS embedding
            """)

            concept_rrgcn_embeddings_dict = {}

            for record in result:
                concept_id = record["concept_id"]
                emb_str = record["embedding"]

                try:
                    # Convert the string embedding into a numpy array.
                    emb_array = self.string_to_array(emb_str)

                    # If the converted result is empty, the embedding is invalid, so skip this Concept.
                    if emb_array is None or len(emb_array) == 0:
                        print(f"Skip concept {concept_id}: empty or invalid final_embedding")
                        continue

                    concept_rrgcn_embeddings_dict[concept_id] = emb_array

                except Exception as e:
                    print(f"Skip concept {concept_id}: invalid final_embedding")
                    print(f"Raw embedding string: {emb_str}")
                    print(f"Error: {e}")

        return concept_rrgcn_embeddings_dict

    # -----------------------------------
    # Sync course_id from MongoDB to Neo4j, and write course_id into LearningMaterial nodes which have no course_id property yet.
    # -----------------------------------

    def sync_course_id(self):

        # Step 1: Find all LearningMaterial nodes in Neo4j that do not have course_id.
        with self.coursemapper_driver.session() as session:

            result = session.run("""
            MATCH (lm:LearningMaterial)
            WHERE lm.course_id IS NULL
            RETURN lm.mid AS mid
            """)

            mids = [record["mid"] for record in result]
            print(f"Found {len(mids)} LearningMaterial without course_id in CourseMapper Neo4j database.")

        if not mids:
            print("All LearningMaterial already have course_id.")
            return

        # Step 2: Use the mid list to find corresponding courseId in MongoDB materials collection.

        cursor = self.materials.find(
            {"_id": {"$in": [ObjectId(str(mid)) for mid in mids]}},
            {"_id": 1, "courseId": 1}
        )

        rows = []

        for doc in cursor:
            rows.append({
                "mid": str(doc["_id"]),
                "course_id": str(doc["courseId"])
            })
        print(f"Found {len(rows)} matching materials in MongoDB and write course_id mapping to Neo4j.")
        if not rows:
            print("No matching materials found in MongoDB.")
            return
        
        # Step 3: Write back to Neo4j

        with self.coursemapper_driver.session() as session:

            session.run("""
            UNWIND $rows AS row
            MATCH (lm:LearningMaterial {mid:row.mid})
            SET lm.course_id = row.course_id
            """, rows=rows)

        print(f"{len(rows)} course_id synced.")
   

    #--------------------------------------------------
    # get course -> concept (only main concepts) mapping
    # assume the course_id has been synced to LearningMaterial nodes, and all concepts related to the course have rrgcn embeddings
    #--------------------------------------------------
    
    def get_course_concepts_mapping(self):
        with self.coursemapper_driver.session() as session:
            result = session.run(
                """
                MATCH (lm:LearningMaterial)-[:LM_CONSISTS_OF]->(c:Concept) 
                WHERE lm.course_id IS NOT NULL 
                RETURN lm.course_id AS course_id, c.cid AS concept_id
                """)
            course_concept_mapping_dict = {}
            for record in result:
                course_id = record["course_id"]
                concept_id = record["concept_id"]
                if course_id not in course_concept_mapping_dict:
                    course_concept_mapping_dict[course_id] = []
                course_concept_mapping_dict[course_id].append(concept_id)
        return course_concept_mapping_dict
    

    # --------------------------------------------------
    # Store course embedding into Neo4j
    # --------------------------------------------------
    
    def store_course_embeddings(self, embeddings_dict):
        with self.coursemapper_driver.session() as session:
            for cid in embeddings_dict:
                emb_str = self.array_to_string(embeddings_dict[cid])
                session.run("""MATCH (c:Course) WHERE c.cid = $cid SET c.course_embedding = $emb""", cid=cid, emb=emb_str)

    # --------------------------------------------------
    # Store course name embedding into Neo4j
    # --------------------------------------------------
    
    def store_course_name_embeddings(self, embeddings_dict):

        with self.coursemapper_driver.session() as session:
            for cid in embeddings_dict:
                emb_str = self.array_to_string(embeddings_dict[cid])
                session.run("""MATCH (c:Course) WHERE c.cid = $cid SET c.name_embedding = $emb""", cid=cid, emb=emb_str)

    

    # ---------------------------------------------------
    # compute course embedding
    #
    # equation:
    #   course_embedding = (1 / weight_sum) * Σ (w_i * concept_i_rrgcn_emb)
    #
    #   w_i = cosine(course_name_emb, concept_i_rrgcn_emb)
    #   weight_sum = Σ w_i
    #
    # special case:
    #   if a course has no valid concept,
    #   then the  course embedding = course_name_emb
    # ---------------------------------------------------
   
    def compute_course_embedding(self):
        
        # ---------------------------------------------------
        # Step 1: Load all required data.
        # ---------------------------------------------------

        course_name_emb_dict = self.get_course_name_embeddings()            # course_id -> course_name_embedding (numpy array)
        concept_rrgcn_emb_dict = self.get_concept_rrgcn_embeddings()        # concept_id -> concept_rrgcn_embedding (numpy array)
        course_concepts_mapping_dict = self.get_course_concepts_mapping()   # course_id -> list of concept_id   
        course_emb_dict = {}    # Store the course embeddings.

        # ---------------------------------------------------
        # Step 2: Compute the embedding for each course.
        # ---------------------------------------------------

        for course_id, course_name_emb in course_name_emb_dict.items():

            concept_ids_list = course_concepts_mapping_dict.get(course_id, [])   # Get all concept IDs linked to the current course.
            valid_concept_rrgcn_emb_list = []   # Create a list to store all valid Concept RGCN embeddings for the current course.

            for concept_id in concept_ids_list:
                if concept_id in concept_rrgcn_emb_dict:
                    valid_concept_rrgcn_emb_list.append(concept_rrgcn_emb_dict[concept_id])
            
            # ---------------------------------------------------
            # Step 3: If no valid concepts exist, use the course name embedding.
            # ---------------------------------------------------

            if len(valid_concept_rrgcn_emb_list) == 0:
                course_emb_dict[course_id] = course_name_emb
                continue

            # ---------------------------------------------------
            # Step 4: Stack concept embeddings into a matrix.            #
            # Shape: (number_of_concepts, embedding_dimension)
            # ---------------------------------------------------

            concept_rrgcn_matrix = np.vstack(valid_concept_rrgcn_emb_list)

            # ---------------------------------------------------
            # Step 5: Compute cosine similarity weights.
            # ---------------------------------------------------

            weight_list = []

            for concept_rrgcn_emb in concept_rrgcn_matrix:

                dot_product = np.dot(course_name_emb, concept_rrgcn_emb)
                course_name_emb_norm = np.linalg.norm(course_name_emb)
                concept_rrgcn_emb_norm = np.linalg.norm(concept_rrgcn_emb)
                weight = dot_product / (course_name_emb_norm * concept_rrgcn_emb_norm)
                weight_list.append(weight) # Store the weight in the weight list.

            weights_emb = np.array(weight_list) # Convert cosine similarity weights to a numpy array.

            # ---------------------------------------------------
            # Step 6: Compute the sum of all weights: weight_sum = Σ w_i
            # ---------------------------------------------------
            weight_sum = np.sum(weights_emb)

            # ---------------------------------------------------
            # Step 7: Compute the weighted sum of concept embeddings.
                        # weighted_sum = Σ (w_i * concept_i_EMB)
            # ---------------------------------------------------
            
            # np.newaxis changes weights_emb from shape (number_of_concepts,) to shape (number_of_concepts, 1).
            # This allows NumPy to multiply each weight with the corresponding row in concept_rrgcn_matrix.
            # After multiplication, sum along axis=0 to get one weighted embedding vector.

            weighted_emb_sum = (weights_emb[:, np.newaxis] * concept_rrgcn_matrix).sum(axis=0)


   
            # ---------------------------------------------------
            # Step 8: Compute the course embedding:
                        # course_embedding = (1 / weight_sum) * Σ (w_i * concept_i_EMB)
            # ---------------------------------------------------

            course_emb = weighted_emb_sum / weight_sum

            course_emb_dict[course_id] = course_emb # Store the computed course embedding in the dictionary with course_id as the key.

        return course_emb_dict  # Return all computed course embeddings.
 



    # def generate_and_store_course_embeddings(self):
    #     self.sync_course_id()

    #     courses = self.get_new_courses()

    #     if len(courses) > 0:
    #         course_name_embeddings = self.generate_sbert_embeddings(courses)
    #         self.store_course_name_embeddings(course_name_embeddings)

    #     course_embeddings = self.compute_course_embedding()
    #     self.store_course_embeddings(course_embeddings)




    # ---------------------------------------------------
    # generate_and_store_course_embeddings
    # ---------------------------------------------------

    def generate_and_store_course_embeddings(self):
        print("\n==========================================================================================\n")
        print("Sync MongoDB → Neo4j course_id")

        self.sync_course_id()
        
        print("Checking how many CourseMapper courses which have no name embeddings...")
        courses = self.get_new_courses()
        print(f"Found {len(courses)} new courses")

        if len(courses) >0:
            print(f"Generating course name embedding for these {len(courses)} new courses")
            course_name_embeddings = self.generate_sbert_embeddings(courses)

            print("Writing generated course name embeddings into CourseMapper database...")
            self.store_course_name_embeddings(course_name_embeddings)

            print("CourseMapper: Course name embedding generation finished and stored in database.")
        else:
            print("No new courses found, skip generating course name embeddings.")


        print("Star calculating course embedding.")
        course_embeddings = self.compute_course_embedding()

        print("Writing generated course embeddings into CourseMapper database...") 
        self.store_course_embeddings(course_embeddings)

        print("CourseMapper: Course embedding generation finished and stored in database.")    
        print("\n==========================================================================================\n")




if __name__ == "__main__":
    coursemapper_course_emb_generator = CourseMapperCourseEmbedding()

    try:
        coursemapper_course_emb_generator.generate_and_store_course_embeddings()
    finally:
        coursemapper_course_emb_generator.close()






