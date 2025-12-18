"""
Handle Course Enrollment (G10) Activities.

This module manages the initialization of interest relationships in the Personal Knowledge Graph (PKG)
when a user enrolls in a course.
"""

from typing import List, Dict
from neo4j import GraphDatabase, Transaction

# Parameterized Cypher Query
# 1. Matches User and Course nodes
# 2. Traverses Course -> Material -> Slide -> Concept
# 3. Filters for 'main_concept' types
# 4. MERGEs the INTERESTED_IN relationship (creates if not exists)
# 5. ON CREATE: Sets createdAt, leaves interestScore as NULL (unset)
# 6. ON MATCH: Preserves existing interestScore
ENROLLMENT_QUERY = """
MATCH (u:User {uid: $user_id})
MATCH (lm:LearningMaterial {course_id: $course_id})
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

    def handle_course_enrollment(self, user_id: str, course_id: str) -> List[Dict]:
        """
        Handle G10 Activity: Initialize interest for all main concepts in a course.
        
        Args:
            user_id: The unique identifier of the user (User.uid).
            course_id: The unique identifier of the course (Course.course_id).
            
        Returns:
            List of dictionaries containing details of the linked concepts:
            [{'concept_id': '...', 'concept_name': '...'}]
        """
        with self.driver.session() as session:
            result = session.write_transaction(self._execute_enrollment, user_id, course_id)
            
            # Logging
            print(f"User {user_id} enrolled in Course {course_id}.")
            print(f"Initialized interest for {len(result)} main concepts.")
            
            return result

    @staticmethod
    def _execute_enrollment(tx: Transaction, user_id: str, course_id: str) -> List[Dict]:
        """
        Internal method to execute the Cypher query within a transaction.
        """
        result = tx.run(ENROLLMENT_QUERY, user_id=user_id, course_id=course_id)
        
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
    if len(sys.argv) != 3:
        print("Usage: python handle_enrollment.py <user_id> <course_id>")
        sys.exit(1)
    
    user_id = sys.argv[1]
    course_id = sys.argv[2]
    
    # Get Neo4j credentials
    uri = os.getenv("NEO4J_URI", "bolt://127.0.0.1:7687")
    neo4j_user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "password")
    
    # Execute enrollment
    manager = EnrollmentManager(uri, (neo4j_user, password))
    try:
        concepts = manager.handle_course_enrollment(user_id, course_id)
        print(f"Initialized interest for {len(concepts)} main concepts.")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        manager.close()
