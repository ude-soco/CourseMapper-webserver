"""
Goal:
-----
Generate and store embeddings for courses and concepts in MoocCentral Neo4j.

This module generates:
1. Course.name_embedding
2. concept.name_embedding
3. Course.course_embedding

Main entry:
    MoocCentralCourseEmbedding.generate_and_store_course_embeddings()
"""
"""
Pipeline:
---------
Step 1: Find Course nodes without name_embedding.
Step 2: Generate course name embeddings using SBERT.
Step 3: Store course name embeddings into Neo4j.

Step 4: Find Concept nodes without name_embedding.
Step 5: Generate concept name embeddings using SBERT.
Step 6: Store concept name embeddings into MoocCentral Neo4j.

Step 7: Read course name embeddings from MoocCentral Neo4j.
Step 8: Read concept name embeddings from MoocCentral Neo4j.
Step 9: Read the course -> concept mapping from MoocCentral Neo4j.

Step 10: For each course, collect valid concept name embeddings.
Step 11: Compute the final course embedding using:

    course_embedding = Σ(w_i * concept_i_name_embedding) / Σ(w_i)

where:

    w_i = cosine(course_name_embedding, concept_i_name_embedding)

Special case:
-------------
If a course has no valid concept embeddings,
its course embedding will be the same as its course name embedding.

Step 12: Store course embeddings into MoocCentral Neo4j as Course.course_embedding.


Output:
-------
After running this script, Neo4j will contain:
1. Course.name_embedding
2. Concept.name_embedding
3. Course.course_embedding
"""

# type this command to run this file:
# pipenv run python -m app.services.course_materials.Mooc_Recommendation.course_embedding.mooccentral_course_embedding



from ..database_connection.MoocCentral_connection import MoocCentralConnection
from sentence_transformers import SentenceTransformer

import numpy as np


class MoocCentralCourseEmbedding:


    def __init__(self):
        self.mooccentral_db = MoocCentralConnection()
        self.mooccentral_driver = self.mooccentral_db.driver
        self.model = SentenceTransformer("all-mpnet-base-v2")

    # ---------------------------------------------------
    # close database connection
    # -
    def close(self):
        self.mooccentral_db.close()
    
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
    def string_to_array(self, emb_str):

        return np.array([float(x) for x in emb_str.split(",")])
    
    def array_to_string(self, emb_array):

        return ",".join(map(str, emb_array.tolist()))


    # ---------------------------------------------------
    # get course nodes which have no name embedding attribute
        # means they are new courses which have not been embedded by SBERT before
        # or the first time to generate name embeddings for all courses
    # ---------------------------------------------------

    def get_new_courses(self):

        with self.mooccentral_driver.session() as session:

            result = session.run("""
            MATCH (c:Course)
            WHERE c.name_embedding IS NULL
            RETURN c.course_id as cid, c.name as name
            """)

            courses_id_to_name_dict = {}
            for r in result:
                courses_id_to_name_dict[r["cid"]] = r["name"]

        return courses_id_to_name_dict


    # ---------------------------------------------------
    # get concept nodes which have no name embedding attribute
        # means they are new concepts which have not been embedded by SBERT before
        # or the first time to generate embeddings for all concepts
    # ---------------------------------------------------

    def get_new_concepts(self):

        with self.mooccentral_driver.session() as session:

            result = session.run("""
            MATCH (c:concept)
            WHERE c.name_embedding IS NULL
            RETURN elementId(c) AS cid, c.name AS name
            """)

            concepts_id_to_name_dict = {}

            for r in result:
                concepts_id_to_name_dict[r["cid"]] = r["name"]

        return concepts_id_to_name_dict


    # ---------------------------------------------------
    # generate SBERT embeddings
    # ---------------------------------------------------

    def generate_sbert_embeddings(self, name_dict):

        if len(name_dict) == 0:
            return {}

        ids = list(name_dict.keys())
        texts = list(name_dict.values())

        #embeddings = self.model.encode(texts)
        # Encode texts in batches to reduce memory usage.
        embeddings = self.model.encode(
            texts,
            batch_size=64,
            show_progress_bar=True,
            convert_to_numpy=True
        )

        emb_dict = {}

        for i, id_ in enumerate(ids):
            emb_dict[id_] = embeddings[i]

        return emb_dict

    # ---------------------------------------------------
    # get course name embedding from MoocCentral database
    # ---------------------------------------------------

    def get_course_name_embeddings(self):

        with self.mooccentral_driver.session() as session:

            result = session.run("""
            MATCH (c:Course)
            WHERE c.name_embedding IS NOT NULL
            RETURN c.course_id AS course_id, c.name_embedding AS embedding
            """)

            course_name_embeddings_dict = {}

            for r in result:
                course_name_embeddings_dict[r["course_id"]] = self.string_to_array(r["embedding"])

        return course_name_embeddings_dict


    # ---------------------------------------------------
    # get all concept name embeddings
    # ---------------------------------------------------

    def get_concept_name_embeddings(self):

        with self.mooccentral_driver.session() as session:

            result = session.run("""
            MATCH (c:concept)
            WHERE c.name_embedding IS NOT NULL
            RETURN elementId(c) AS cid, c.name_embedding AS embedding
            """)

            concept_name_embeddings_dict = {}

            for r in result:
                concept_name_embeddings_dict[r["cid"]] = self.string_to_array(r["embedding"])

        return concept_name_embeddings_dict


    # ---------------------------------------------------
    # get course-concept mapping
    # ---------------------------------------------------

    def get_course_concepts_mapping(self):

        with self.mooccentral_driver.session() as session:

            result = session.run("""
            MATCH (course:Course)-[:CONTAINS_CONCEPT]->(concept:concept)
            RETURN course.course_id as course_id, elementId(concept) as concept_id
            """)

            course_concept_mapping_dict = {}

            for r in result:
                course_id = r["course_id"]
                concept_id = r["concept_id"]

                if course_id not in course_concept_mapping_dict:
                    course_concept_mapping_dict[course_id] = []

                course_concept_mapping_dict[course_id].append(concept_id)

        return course_concept_mapping_dict

    # --------------------------------------------------
    # Store course name embedding into MoocCental database
    # --------------------------------------------------    
    
    def store_course_name_embeddings(self, embeddings_dict, batch_size=200):

        rows = []
        for cid, vec in embeddings_dict.items():
            rows.append({
                "cid": cid,
                "emb": self.array_to_string(vec)
            })

        with self.mooccentral_driver.session() as session:
            total = len(rows)

            for start in range(0, total, batch_size):
                batch_rows = rows[start:start + batch_size]

                session.run("""
                UNWIND $rows AS row
                MATCH (c:Course {course_id: row.cid})
                SET c.name_embedding = row.emb
                """, rows=batch_rows).consume()

                print(f"Course name embeddings written: {start + len(batch_rows)} / {total}")

    # --------------------------------------------------
    # Store concept name embedding into MoocCental database
    # -------------------------------------------------- 

    def store_concept_name_embeddings(self, embeddings_dict, batch_size=200):

        rows = []
        for cid, vec in embeddings_dict.items():
            rows.append({
                "cid": cid,
                "emb": self.array_to_string(vec)
            })

        with self.mooccentral_driver.session() as session:
            total = len(rows)

            for start in range(0, total, batch_size):
                batch_rows = rows[start:start + batch_size]

                session.run("""
                UNWIND $rows AS row
                MATCH (c:concept)
                WHERE elementId(c) = row.cid
                SET c.name_embedding = row.emb
                """, rows=batch_rows).consume()

                print(f"Concept name embeddings written: {start + len(batch_rows)} / {total}")

    # --------------------------------------------------
    # Store course embedding into MoocCental database
    # -------------------------------------------------- 

    def store_course_embeddings(self, embeddings_dict, batch_size=200):

        rows = []
        for cid, vec in embeddings_dict.items():
            rows.append({
                "cid": cid,
                "emb": self.array_to_string(vec)
            })

        with self.mooccentral_driver.session() as session:
            total = len(rows)

            for start in range(0, total, batch_size):
                batch_rows = rows[start:start + batch_size]

                session.run("""
                UNWIND $rows AS row
                MATCH (c:Course {course_id: row.cid})
                SET c.course_embedding = row.emb
                """, rows=batch_rows).consume()

                print(f"Course embeddings written: {start + len(batch_rows)} / {total}")



    # ---------------------------------------------------
    # compute course embedding
    #
    # equation:
    #   course_embedding = (1 / weight_sum) * Σ (w_i * concept_i_name_emb)
    #
    #   w_i = cosine(course_name_emb, concept_i_name_emb)
    #   weight_sum = Σ w_i
    #
    # special case:
    #   if a course has no valid concept,
    #   then the final course embedding = course_name_emb
    # ---------------------------------------------------

    def compute_course_embedding(self):

        # ---------------------------------------------------
        # Step 1: Load all required data.
        # ---------------------------------------------------

        course_name_emb_dict = self.get_course_name_embeddings()
        concepts_name_emb_dict = self.get_concept_name_embeddings()
        course_concepts_mapping_dict = self.get_course_concepts_mapping()
        course_emb_dict = {}

        # ---------------------------------------------------
        # Step 2: Compute the embedding for each course.
        # ---------------------------------------------------

        for course_id, course_name_emb in course_name_emb_dict.items():
            concept_ids_list = course_concepts_mapping_dict.get(course_id, [])

            valid_concept_name_embs_list = []

            # Collect valid concept name embeddings linked to this course.
            for concept_id in concept_ids_list:
                if concept_id in concepts_name_emb_dict:
                    valid_concept_name_embs_list.append(concepts_name_emb_dict[concept_id])

            # ---------------------------------------------------
            # Step 3: If no valid concepts exist, use the course name embedding.
            # ---------------------------------------------------

            if len(valid_concept_name_embs_list) == 0:
                course_emb_dict[course_id] = course_name_emb
                continue

            # ---------------------------------------------------
            # Step 4: Stack concept embeddings into a matrix.
            # Shape: (number_of_concepts, embedding_dimension)
            # ---------------------------------------------------

            concept_name_matrix = np.vstack(valid_concept_name_embs_list)

            # ---------------------------------------------------
            # Step 5: Compute cosine similarity weights.
            # ---------------------------------------------------

            weight_list = []

            for concept_name_emb in concept_name_matrix:

                dot_product = np.dot(course_name_emb, concept_name_emb)
                course_name_emb_norm = np.linalg.norm(course_name_emb)
                concept_name_emb_norm = np.linalg.norm(concept_name_emb)

                weight = dot_product / (course_name_emb_norm * concept_name_emb_norm)

                weight_list.append(weight)  
            weights_emb = np.array(weight_list) # Convert cosine similarity weights to a numpy array.

            # ---------------------------------------------------
            # Step 6: Compute the sum of all weights: weight_sum = Σ w_i
            # ---------------------------------------------------

            weight_sum = np.sum(weights_emb)

            # ---------------------------------------------------
            # Step 7: Compute the weighted sum of concept embeddings.
            # Formula: weighted_sum = Σ(w_i * concept_i_name_embedding)
            # ---------------------------------------------------

            # np.newaxis changes weights_emb from shape (number_of_concepts,)
            # to shape (number_of_concepts, 1).
            # This allows NumPy to multiply each weight with the corresponding row
            # in concept_name_matrix.
            # Then sum along axis=0 to get one weighted embedding vector.

            weighted_emb_sum = (weights_emb[:, np.newaxis] * concept_name_matrix).sum(axis=0)

            # ---------------------------------------------------
            # Step 8: Compute the course embedding:
                        # course_embedding = (1 / weight_sum) * Σ (w_i * concept_i_EMB)
            # ---------------------------------------------------

            course_emb = weighted_emb_sum / weight_sum

            course_emb_dict[course_id] = course_emb
        
        return course_emb_dict

    
    # ---------------------------------------------------
    # generate_and_store_course_embeddings
    # ---------------------------------------------------

    def generate_and_store_course_embeddings(self):
        print("\n==========================================================================================\n")
        print("Checking how many MOOCCentral courses which have no name embeddings...")
        courses = self.get_new_courses()
        print(f"Found {len(courses)} new courses")

        if len(courses) >0:
            print(f"Generating course name embedding for these {len(courses)} new courses")
            course_name_embeddings = self.generate_sbert_embeddings(courses)

            print("Writing generated course name embeddings into MOOCCentral database...")
            self.store_course_name_embeddings(course_name_embeddings)

            print("MOOCCentral: Course name embedding generation finished and stored in database.")
        else:
            print("No new courses found, skip generating course name embeddings.")


        print("Checking how many concepts which have no name embeddings...")
        concepts = self.get_new_concepts()
        print(f"Found {len(concepts)} new concepts")

        if len(concepts) > 0:
            print(f"Generating concept name embedding for these {len(concepts)} new concepts")
            concept_name_embeddings = self.generate_sbert_embeddings(concepts)

            print("Writing generated concept name embeddings into MOOCCentral database...")
            self.store_concept_name_embeddings(concept_name_embeddings)

            print("MOOCCentral: Concept name embedding generation finished and stored in database.")
        else:
            print("No new concepts found, skip generating concept name embeddings.")


        print("Start calculating MOOCCentral course embedding.")
        course_embeddings = self.compute_course_embedding()

        print("Writing generated course embeddings into MOOCCentral database...") 
        self.store_course_embeddings(course_embeddings)

        print("MOOCCentral: Course embedding generation finished and stored in database.")    
        print("\n==========================================================================================\n")




if __name__ == "__main__":
    mooccentral_course_emb_generator = MoocCentralCourseEmbedding()

    try:
        mooccentral_course_emb_generator.generate_and_store_course_embeddings()
    finally:
        mooccentral_course_emb_generator.close()
