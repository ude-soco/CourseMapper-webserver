"""
Handle Course Enrollment (G10) Activities.

This module manages the initialization of interest relationships in the Personal Knowledge Graph (PKG)
when a user enrolls in a course.
"""

from typing import List, Dict
from neo4j import GraphDatabase, Transaction
import os
import sys
from dotenv import load_dotenv


# Parameterized Cypher Query
# 1. Matches User node
# 2. Matches LearningMaterials by their mid property (filtering by material IDs from MongoDB)
# 3. Traverses LearningMaterial -> Slide -> Concept
# 4. Filters for 'main_concept' types
# 5. MERGEs the INTERESTED_IN relationship (creates if not exists)
# 6. ON CREATE: Sets createdAt, leaves interestScore as NULL (unset)
# 7. ON MATCH: Preserves existing interestScore
ENROLLMENT_QUERY = """
MATCH (u:User {uid: $user_id})
MATCH (lm:LearningMaterial)
WHERE lm.mid IN $material_ids
MATCH (lm)-[:CONTAINS]->(s:Slide)-[:CONSISTS_OF]->(c:Concept)
WHERE c.type = 'main_concept'
MERGE (u)-[r:INTERESTED_IN]->(c)
ON CREATE SET 
    r.createdAt = datetime()
    // interestScore is implicitly NULL (property is not set)
RETURN c.cid as concept_id, c.name as concept_name
"""


class EnrollmentManager:
    def __init__(self, uri: str, auth: tuple):
        """
        Initialize Neo4j driver.
        
        Args:
            uri: Neo4j URI (e.g., "bolt://localhost:7687")
            auth: Tuple of (username, password)
        """
        self.driver = GraphDatabase.driver(uri, auth=auth)

    def close(self):
        self.driver.close()

    def handle_course_enrollment(self, user_id: str, course_id: str, material_ids: List[str]) -> List[Dict]:
        """
        Handle G10 Activity: Initialize interest for all main concepts in a course.
        
        Args:
            user_id: The unique identifier of the user (User.uid from MongoDB).
            course_id: The unique identifier of the course (Course._id from MongoDB).
            material_ids: List of material IDs (from MongoDB) that belong to this course.
            
        Returns:
            List of dictionaries containing details of the linked concepts:
            [{'concept_id': '...', 'concept_name': '...'}]
        """
        if not material_ids:
            print(f"Warning: No materials provided for course {course_id}")
            return []
        
        print(f"Processing {len(material_ids)} materials for course {course_id}")
        
        # Execute Neo4j query with the material IDs
        with self.driver.session() as session:
            result = session.write_transaction(self._execute_enrollment, user_id, material_ids)
            
            # Logging
            print(f"User {user_id} enrolled in Course {course_id}.")
            print(f"Initialized interest for {len(result)} main concepts.")
            
            return result

    @staticmethod
    def _execute_enrollment(tx: Transaction, user_id: str, material_ids: List[str]) -> List[Dict]:
        """
        Internal method to execute the Cypher query within a transaction.
        
        Args:
            tx: Neo4j transaction
            user_id: User UID
            material_ids: List of material IDs (mid values) from MongoDB
        """
        result = tx.run(ENROLLMENT_QUERY, user_id=user_id, material_ids=material_ids)
        
        # Collect results
        concepts = []
        for record in result:
            concepts.append({
                "concept_id": record["concept_id"],
                "concept_name": record["concept_name"]
            })
            
        return concepts

if __name__ == "__main__":
    import sys
    import os
    from dotenv import load_dotenv
    
    # Load environment variables
    env_path = os.path.join(os.path.dirname(__file__), '../../../../webserver/.env')
    load_dotenv(env_path)
    
    # Check command line arguments
    if len(sys.argv) != 4:
        print("Usage: python handle_enrollment.py <user_id> <course_id> <material_ids>")
        print("  material_ids: comma-separated list of material IDs")
        sys.exit(1)
    
    user_id = sys.argv[1]
    course_id = sys.argv[2]
    material_ids_str = sys.argv[3]
    
    # Parse comma-separated material IDs
    material_ids = [mid.strip() for mid in material_ids_str.split(',') if mid.strip()]
    
    if not material_ids:
        print("Error: No material IDs provided")
        sys.exit(1)
    
    # Get Neo4j credentials
    uri = os.getenv("NEO4J_URI", "bolt://127.0.0.1:7687")
    neo4j_user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "password")
    
    # Execute enrollment
    manager = EnrollmentManager(uri, (neo4j_user, password))
    try:
        concepts = manager.handle_course_enrollment(user_id, course_id, material_ids)
        print(f"Initialized interest for {len(concepts)} main concepts.")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        manager.close()
