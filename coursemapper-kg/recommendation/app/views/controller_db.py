from ..services.course_materials.db.neo4_db import NeoDataBase
from config import Config

neo4j_uri = Config.NEO4J_URI
neo4j_user = Config.NEO4J_USER
neo4j_pass = Config.NEO4J_PASSWORD
db = NeoDataBase(neo4j_uri, neo4j_user, neo4j_pass)


def update_concept_modified_node(result, user_id=None):
    result_final = []
    if result and len(result) > 0:
        if user_id:
            concepts_modified = get_concepts_modified_by_user_id(user_id=user_id)

        for node in result:
            # node["weight_updated"] = node["weight"] * 100
            node["status"] = False
            
            # Update Concept weight modified by the User
            for concept_modified in concepts_modified:
                if node["cid"] == concept_modified["cid"]:
                    node["weight"] = concept_modified["weight"]

            result_final.append(node)
        result_final = sorted(result_final, key=lambda d: d['name'])

    return result_final


def get_concepts_modified_by_user_id(user_id):
    '''
        Get List of Concept_smodified by user_id
    '''
    with db.driver.session() as session:
        result = session.run(
            '''
                MATCH (a:User)-[r:HAS_MODIFIED]->(b:Concept_modified)
                WHERE r.user_id = $user_id
                RETURN DISTINCT r.user_id as user_id, b.cid as cid, r.weight as weight
            '''
            ,
            user_id=user_id
        ).data()

    return list(result)

def get_concepts_modified_by_mid(mid):
    '''
        Get List of Concept by mid
    '''
    with db.driver.session() as session:
        result = session.run(
            """
            MATCH (c:Concept) WHERE c.mid = $mid 
            RETURN c.cid as cid, c.name AS name, c.weight as weight, 
            c.rank as rank, c.mid as mid
            """,
            mid=mid
        ).data()

    return list(result)
    
def get_concepts_modified_by_slide_id(slide_id: str):
    '''
        Get List of Concept by slide_id
    '''
    with db.driver.session() as session:
        result = session.run(
            """
            MATCH (s:Slide)-[:CONTAINS]->(c:Concept)
            WHERE s.sid = $slide_id
            RETURN c.cid as cid, c.name AS name, c.weight as weight, 
            c.rank as rank, c.mid as mid
            """,
            slide_id=slide_id
        ).data()

    return list(result)

def get_concepts_by_cids(user_id, cids):
    '''
        Get List of Concept_smodified by user_id
    '''
    concepts = []
    with db.driver.session() as session:
        """
            nodes = session.run(
                '''
                    MATCH (a:User)-[r:HAS_MODIFIED]->(b:Concept_modified)
                    WHERE b.cid IN $cids
                    RETURN DISTINCT b.cid as cid, r.weight as weight
                '''
                ,
                cids=cids
            ).data()
        """
        concepts = session.run(
                '''
                    MATCH (c:Concept)
                    WHERE c.cid IN $cids
                    RETURN DISTINCT c.name as name, c.cid as cid, c.weight as weight
                ''',
                cids=cids
            ).data()

        if concepts:
            concepts = list(concepts)
            concepts_modified = get_concepts_modified_by_user_id(user_id=user_id)
            for concept in concepts:
                for concept_m in concepts_modified:
                    if concept["cid"] == concept_m["cid"]:
                        concept["weight"] = concept_m["weight"]

    return concepts

def get_concepts_modified_by_user_from_saves(user_id: str):
    '''
        Get Concept_modified by the given user
    '''
    result = []
    with db.driver.session() as session:
        nodes = session.run(
            """
                MATCH (a:User)-[r:HAS_SAVED]->(b:Resource)
                -[r2:BASED_ON]->(c:Concept_modified),
                (d:Concept)
                WHERE r.user_id = $user_id
                RETURN DISTINCT d.cid as cid, d.name as name
            """,
            user_id=user_id,
        ).data()
        result = [ {"cid": node["cid"], "name": node["name"] } for node in nodes ]
    return result
