from neo4j import GraphDatabase, Result, Record
import numpy as np
import re
import logging
from log import LOG

#set pythonHashSeed to zero to have same hashed value if same input has been given
import os
import sys
# hashseed = os.getenv('PYTHONHASHSEED')
# if not hashseed:
#     os.environ['PYTHONHASHSEED'] = '0'
#     os.execv(sys.executable, [sys.executable] + sys.argv)

from datetime import datetime

logger = LOG(name=__name__, level=logging.DEBUG)


def create_concept(tx, node):
    """
    """
    initial_embedding = ','.join(str(i) for i in node["initial_embedding"])
    # logger.info(
    #     "Creating concept '%s'" % node["id"])
    tx.run(
        """MERGE (c:Concept {name: $name, cid: $cid, uri: $uri, type: $type, mid: $mid, weight: $weight,
        wikipedia: $wikipedia, abstract: $abstract,initial_embedding:$initial_embedding,
        final_embedding:$final_embedding})""",
        name=node["name"],
        cid=node["id"],
        uri=node["uri"],
        type=node["type"],
        mid=node["mid"],
        weight=node["weight"],
        wikipedia=node["wikipedia"],
        initial_embedding=initial_embedding,
        final_embedding="",
        abstract=node["abstract"])


def create_slide(tx, slide_concepts, slide_node):
    """
    """
    initial_embedding = ','.join(str(i) for i in slide_node["initial_embedding"])
    weighted_embedding_of_concept = ','.join(str(i) for i in slide_node["weighted_embedding_of_concept"])
    logger.info(
        "Creating slide '%s'" % slide_node["name"])
    result = tx.run(
        """MERGE (c:Slide {name: $name, sid: $sid, text: $text, mid: $mid,concepts: $concepts,
        initial_embedding:$initial_embedding,type:$type,
        final_embedding:$final_embedding,weighted_embedding_of_concept:$weighted_embedding_of_concept})""",
        sid=slide_node["slide_id"],
        name=slide_node["name"],
        text=slide_node["slide_text"],
        mid=slide_node["mid"],
        type=slide_node["type"],
        concepts=slide_concepts,
        initial_embedding=initial_embedding,
        final_embedding="",
        weighted_embedding_of_concept=weighted_embedding_of_concept)

    return result


def create_video_resource(tx, node, recommendation_type=''):
    """
    """
    logger.info(
        "Creating youtube resource '%s'" % node["id"])

    tx.run(
        """MERGE (c:Resource:Video {rid: $rid, uri: $uri, title: $title, 
        description: $description, description_full: $description_full, keyphrases: $keyphrases, text: $text, document_embedding: $document_embedding, 
        keyphrase_embedding: $keyphrase_embedding, similarity_score: $similarity_score, thumbnail: $thumbnail, 
        duration: $duration, views: $views, publish_time: $pub_time, helpful_count: $helpful_count, 
        not_helpful_count: $not_helpful_count, saves_count: $saves_count, like_count: $like_count, channel_title: $channel_title
        })
        """,
        rid=node["id"],
        uri="https://www.youtube.com/embed/%s?autoplay=1" % node["id"],
        title=node["title"],
        description=node["description"],
        description_full=node["description_full"],
        thumbnail="https://i.ytimg.com/vi/%s/hqdefault.jpg" % node["id"],
        keyphrases=node["keyphrases"] if "keyphrases" in node.index else [],
        text=node["text"],
        duration=node["duration"],
        views=node["views"],
        pub_time=node["publishTime"],
        similarity_score=node[recommendation_type] if recommendation_type in node.index else 0,
        keyphrase_embedding=str(node["keyphrase_embedding"] if "keyphrase_embedding" in node.index else ""),
        document_embedding=str(node["document_embedding"] if "document_embedding" in node.index else ""),
        helpful_count=0,
        not_helpful_count=0,
        saves_count=0,
        like_count=node["like_count"],
        channel_title=node["channel_title"]
        )


def create_wikipedia_resource(tx, node, recommendation_type=''):
    """
    """
    logger.info(
        "Creating wikipedia resource '%s'" % node["id"])
    tx.run(
        """MERGE (c:Resource:Article {rid: $rid, uri: $uri, 
        title: $title, abstract:$abstract, keyphrases: $keyphrases, text: $text, document_embedding: $document_embedding, 
        keyphrase_embedding: $keyphrase_embedding, similarity_score: $similarity_score, helpful_count: $helpful_count, 
        not_helpful_count: $not_helpful_count, saves_count: $saves_count
        })
        """,
        rid=node["id"],
        uri=node["id"],
        title=node["title"],
        abstract=node["abstract"],
        keyphrases=node["keyphrases"] if "keyphrases" in node.index else [],
        text=node["text"],
        similarity_score=node[recommendation_type] if recommendation_type in node.index else 0,
        keyphrase_embedding=str(node["keyphrase_embedding"] if "keyphrase_embedding" in node.index else ""),
        document_embedding=str(node["document_embedding"] if "document_embedding" in node.index else ""),
        helpful_count=0,
        not_helpful_count=0,
        saves_count=0
        )

def create_external_source_resource(tx, node):
    """
        Create ExternalSource Node
    """
    logger.info(
        "Creating ExternalSource resource '%s'" % node["id"])
    tx.run(
        """MERGE (c:Resource:ExternalSource {rid: $rid, uri: $uri, 
        publish_time: $created_at, cid: $cid, description: $description, helpful_count: $helpful_count,
        not_helpful_count: $not_helpful_count, saves_count: $saves_count})""",
        rid=node["uri"],
        uri=node["uri"],
        publish_time=node["created_at"],
        description=node["description"],
        cid=node["cid"],
        helpful_count=0,
        not_helpful_count=0,
        saves_count=0
        )
    

def create_concept_relationships(tx, node):
    """
    """
    # logger.info(
    #     "Creating concept relationships to concepts '%s'" % node["id"])
    relations = node["to"]
    for relation in relations:
        tx.run("""MATCH (a:Concept) WHERE a.cid = $s_cid AND a.mid = $mid
            OPTIONAL MATCH(b:Concept) WHERE b.cid = $t_cid AND b.mid = $mid
            MERGE (a)-[r: %s {weight: $weight}]->(b)
            """ % relation["rel_type"],
               s_cid=node["id"],
               t_cid=relation["id"],
               mid=node["mid"],
               weight=relation["weight"])


def create_concept_relationships1(tx, node):
    """
    """
    # logger.info(
    #     "Creating concept relationships to concepts '%s'" % node["id"])
    relations = node["to"]
    for relation in relations:
        if node["id"] == relation["id"]:
            continue
        tx.run("""MATCH (a:Concept) WHERE a.cid = $s_cid AND a.mid = $mid
            OPTIONAL MATCH(b:Concept) WHERE b.cid = $t_cid AND b.mid = $mid
            MERGE (a)-[r: %s {weight: $weight}]->(b)
            """ % relation["rel_type"],
               t_cid=node["id"],
               s_cid=relation["id"],
               mid=node["mid"],
               weight=relation["weight"])


def create_resource_to_concept_relationships(tx, rid, cid, relation_type, weight=0):
    """
    """
    cid = str(cid)
    logger.info(
        "Creating resource relationships to concept '%s'" % cid)

    tx.run("""MATCH (a:Resource) WHERE a.rid = $s_rid
        OPTIONAL MATCH(b:Concept) WHERE b.cid = $t_cid
        MERGE (a)-[r: %s {weight: $weight}]->(b)
        """ % relation_type,
           s_rid=rid,
           t_cid=cid,
           weight=weight)


def create_resource_slide_relationships(tx, rid, sid, relation_type):
    """
    """
    logger.info(
        "Creating resource relationships to slide '%s'" % sid)

    tx.run("""MATCH (a:Resource) WHERE a.rid = $s_rid
            OPTIONAL MATCH(b:Slide) WHERE b.sid = $t_sid
            MERGE (a)-[r: %s]->(b)
            """ % relation_type,
           s_rid=rid,
           t_sid=sid)


def create_user_slide_relationships(tx, uid, sid):
    """
    """

    logger.info(
        "Creating user relationships to slide '%s'" % sid)
    tx.run("""MATCH (u:User) WHERE u.uid = $uid
            OPTIONAL MATCH(s:Slide) WHERE s.sid = $sid
            MERGE (u)-[r:HAS_READ]->(s)
            """,
           uid=uid,
           sid=sid)


def create_user_concept_relationships(tx, uid, cid, relation_type):
    """
    """
    logger.info(
        "Creating user relationships to concept '%s'" % cid)
    tx.run("""MATCH (u:User) WHERE u.uid = $uid
            OPTIONAL MATCH(c:Concept) WHERE c.cid = $cid
            MERGE (u)-[r: %s]->(c)
            """ % relation_type,
           uid=uid,
           cid=cid)


def edit_resource(tx, resource, recommendation_type):
    """
    """
    logger.info(
        "Editing resource '%s'" % resource["id"])
    
    tx.run("""
        MATCH (b: Resource)
        WHERE b.rid = $rid 
        SET b.similarity_score = $similarity_score, b.views = $views, b.like_count = $like_count, b.channel_title = $channel_title
        RETURN b
        """, rid=resource["id"],
            views=resource["views"],
            like_count=resource["like_count"],
            channel_title=resource["channel_title"],
           concepts=resource["keyphrases"] if "keyphrases" in resource.index else [],
           similarity_score=resource[recommendation_type] if recommendation_type in resource.index else 0,
           keyphrase_embedding=str(resource["keyphrase_embedding"] if "keyphrase_embedding" in resource.index else ""),
           document_embedding=str(resource["document_embedding"] if "document_embedding" in resource.index else ""))


def create_or_replace_user_resource_relationships(tx, rid, uid, relation_type, concepts=None):
    # Retrieve and delete all existing relationships
    r_types = tx.run("""
        MATCH p=(a:User)-[r:HELPFUL|NOT_HELPFUL]->(b:Resource)
        WHERE a.uid = $uid
        AND b.rid = $rid
        WITH r, type(r) AS r_type
        DELETE r
        RETURN r_type
        """,
        uid=uid,
        rid=rid)
    r_types = [r["r_type"] for r in list(r_types)]

    # Create new relationships if needed
    if relation_type not in r_types:
        tx.run("""
            MATCH (u:User) WHERE u.uid = $uid
            OPTIONAL MATCH(b:Resource) WHERE b.rid = $rid
            MERGE (u)-[r: %s {concepts: $concepts}]->(b)
            RETURN r
            """ % relation_type,
            uid=uid,
            rid=rid,
            concepts=concepts).data()

    # Update counts
    result: Result = tx.run("""
        MATCH (b1:Resource) WHERE b1.rid = $rid
        OPTIONAL MATCH ()-[r_helpful:HELPFUL]->(b2:Resource) WHERE b2.rid = $rid
        OPTIONAL MATCH ()-[r_not_helpful:NOT_HELPFUL]->(b3:Resource) WHERE b3.rid = $rid
        WITH b1, count(r_helpful) AS helpful_count, count(r_not_helpful) AS not_helpful_count
        SET b1.helpful_count = helpful_count
        SET b1.not_helpful_count = not_helpful_count
        RETURN helpful_count, not_helpful_count
        """,
        rid=rid)

    counts: Record = result.single()

    return {
        "helpful_count": counts["helpful_count"],
        "not_helpful_count": counts["not_helpful_count"],
        "voted": relation_type if relation_type not in r_types else None
    }


def create_lr_relationships(tx, mid, node):
    """
    """
    # logger.info(
    #     "Creating concepts relationships to learning material '%s'" % mid)
    tx.run("""MATCH (m:LearningMaterial) WHERE m.mid = $mid 
            OPTIONAL MATCH (c:Concept) WHERE c.cid = $cid and c.mid = $mid
            MERGE (m)-[r:CONTAINS {weight: $weight}]->(c)""",
           weight=node["weight"],
           cid=node["id"],
           mid=mid)


def create_slide_concept_relationships(tx, sid, node):
    """
    """
    # logger.info(
    #     "Creating slide relationships to concepts '%s'" % node["id"])
    tx.run("""MATCH (s:Slide) WHERE s.sid = $sid 
            OPTIONAL MATCH (c:Concept) WHERE c.cid = $cid and c.mid = $mid
            MERGE (s)-[r:CONTAINS {weight: $weight}]->(c)""",
           sid=sid,
           cid=node["id"],
           mid=node["mid"],
           weight=node["slide_weight"])


def create_lm_slide_relationships(tx, mid, sid):
    """
    """
    logger.info(
        "Creating learning material relationships to slide '%s'" % sid)
    tx.run("""MATCH (m:LearningMaterial) WHERE m.mid = $mid 
            OPTIONAL MATCH (s:Slide) WHERE s.sid = $sid
            MERGE (s)-[r:BELONGS_TO]->(m)""",
           mid=mid,
           sid=sid)


def exist_user_concept_relationship(tx, uid, cid, relation_type):
    """
    """
    logger.info("Check if user has relationship to concept %s" % cid)
    result = tx.run(
        "MATCH p=(a)-[r: %s]->(b) "
        "WHERE a.uid = $uid "
        "AND b.cid = $cid "
        "RETURN TYPE(r) as type, ID(a) as source, ID(b) as target""" % relation_type,
        uid=uid, cid=cid)

    if list(result):
        logger.info("%s relationship between user and concept" % relation_type)
        return True
    else:
        logger.info("No %s relationship between user and concept" % relation_type)
        return False


def exist_resource_to_concept_relationship(tx, rid, cid, relation_type):
    """
    """
    logger.info("Check if resource has relationship to concept %s" % cid)
    result = tx.run(
        "MATCH p=(a)-[r: %s]->(b) "
        "WHERE a.rid = $rid "
        "AND b.cid = $cid "
        "RETURN TYPE(r) as type, ID(a) as source, ID(b) as target""" % relation_type,
        rid=rid, cid=cid)

    if list(result):
        logger.info("%s relationship between resource and concept" % relation_type)
        return True
    else:
        logger.info("No %s relationship between resource and concept" % relation_type)
        return False


def exist_resource_slide_relationship(tx, rid, sid, relation_type):
    """
    """
    logger.info("Check if resource has relationship to slide %s" % sid)
    result = tx.run(
        "MATCH p=(a)-[r: %s]->(b) "
        "WHERE a.rid = $rid "
        "AND b.sid = $sid "
        "RETURN TYPE(r) as type, ID(a) as source, ID(b) as target""" % relation_type,
        rid=rid, sid=sid)

    if list(result):
        logger.info("%s relationship between resource and slide" % relation_type)
        return True
    else:
        logger.info("No %s relationship between resource and slide" % relation_type)
        return False


def get_learning_material(tx, mid):
    """
    """
    logger.info(
        "Get learning material '%s'" % mid)
    result = tx.run(
        "MATCH (m:LearningMaterial) WHERE m.mid = $mid RETURN m",
        mid=mid).data()

    return list(result)


def create_learning_material(tx, mid, name, lm_text=""):
    """
    """
    logger.info("Creating learning material '%s'" % mid)
    result = tx.run(
        "MERGE (m:LearningMaterial {mid: $mid, name: $name,text:$text}) RETURN m",
        mid=mid,
        name=name,
        text=lm_text)
    record = result.single()
    return record["m"]


def get_user(tx, uid):
    """
    """
    logger.info(
        "Get user '%s'" % uid)
    result = tx.run(
        "MATCH (u:User) WHERE u.uid = $uid RETURN u",
        uid=uid).single()

    return list(result)


# def get_user_v2(tx, uid):
#     """
#     """
#     logger.info(
#         "Get user '%s'" % uid)
#     result = tx.run(
#         "MATCH (u:User) WHERE u.uid = $uid RETURN u.uid as uid",
#         uid=uid).single()

#     return result


def retrieve_all_concepts(tx, mid):
    """
    """
    logger.info("Geting the concepts of learning material '%s'" % mid)
    result = tx.run("""MATCH (c:Concept)
        WHERE c.mid = $mid 
        RETURN LABELS(c) as labels, ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, 
        c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract""",
                    mid=mid)

    return list(result)


def retrieve_slide_concepts(tx, sid):
    """
    """
    logger.info("Getting the concepts of slide '%s'" % sid)
    result = tx.run("""MATCH p=(s: Slide)-[r]->(c: Concept) WHERE s.sid = $sid RETURN LABELS(c) as labels, 
    ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as 
    wikipedia, c.abstract as abstract""",
                    sid=sid)

    return list(result)


def retrieve_slide_resources(tx, sid):
    """
    """
    logger.info("Getting the resources for slide '%s'" % sid)
    result_video = tx.run("""
    MATCH p=(a: Video)-[r]->(s: Slide) 
    WHERE s.sid = $sid 
    RETURN LABELS(a) as labels, ID(a) as id, a.rid as rid, a.uri as uri, a.title as title, 
    a.description as description, a.description_full as description_full, a.keyphrases as keyphrases, a.thumbnail as thumbnail,
    a.duration as duration, a.views as views, a.publish_time as pub_time, a.helpful_count as helpful_count, 
    a.not_helpful_count as not_helpful_count""", sid=sid)

    result_article = tx.run("""
    MATCH p=(a: Article)-[r]->(s: Slide) 
    WHERE s.sid = $sid 
    RETURN LABELS(a) as labels, ID(a) as id, a.rid as rid, a.uri as uri, a.title as title, 
    a.abstract as abstract, a.keyphrases as keyphrases, a.helpful_count as helpful_count, 
        a.not_helpful_count as not_helpful_count""",
                            sid=sid)
    return list(result_video) + list(result_article)


def retrieve_concept_resources(tx, mid, cid):
    """
    """
    cid = str(cid)
    mid = str(mid)
    logger.info("Getting the resources for concept '%s'" % cid)
    result_video = tx.run("""
    MATCH p=(a: Video)-[r: CONTAINS]->(c: Concept)
    WHERE c.cid = $cid AND c.mid = $mid
    RETURN LABELS(a) as labels, ID(a) as id, a.rid as rid, a.uri as uri, a.title as title,
    a.description as description, a.description_full as description_full, a.keyphrases as keyphrases, a.thumbnail as thumbnail, a.duration as duration, a.views as views, 
        a.publish_time as publish_time, r.weight as similarity_score, a.helpful_count as helpful_count, 
        a.not_helpful_count as not_helpful_count""",
                          cid=cid, mid=mid).data()

    result_article = tx.run("""
    MATCH p=(a: Article)-[r: CONTAINS]->(c: Concept)
    WHERE c.cid = $cid AND c.mid = $mid
    RETURN LABELS(a) as labels, ID(a) as id, a.rid as rid, a.uri as uri, a.title as title,
    a.abstract as abstract, a.keyphrases as keyphrases, a.helpful_count as helpful_count, 
        a.not_helpful_count as not_helpful_count, r.weight as similarity_score""",
                            cid=cid, mid=mid).data()
    return list(result_video) + list(result_article)


def retrieve_relationships(tx, mid):
    """
    """
    logger.info("Geting the relationships of learning material '%s'" % mid)
    result = tx.run("""
        MATCH p=(a)-[r]->(b) 
        WHERE TYPE(r) <> 'CONTAINS'
        AND a.mid = $mid 
        AND b.mid = $mid 
        RETURN TYPE(r) as type, ID(a) as source, ID(b) as target, r.weight as weight""",
                    mid=mid)

    return list(result)


def create_user(tx, user):
    """
    """
    tx.run(
        """MERGE (u:User {name: $name, uid: $uid, type: $type, email: $userEmail, embedding:$embedding})""",
        name=user["name"],
        uid=user["id"],
        type="user",
        userEmail=user["user_email"],
        embedding="")

def create_user_v2(tx, user):
    """
    """
    user_id = tx.run(
        """MERGE (u:User {name: $name, uid: $uid, type: $type, email: $userEmail, embedding:$embedding}) RETURN u.uid""",
        name=user["name"],
        uid=user["id"],
        type="user",
        userEmail=user["user_email"],
        embedding="").single()
    return user_id
    

def retrieve_user_concept_relationships(tx, uid, relation_type):
    """
    """
    logger.info("Geting the user relationships to concepts")
    result = tx.run("""
        MATCH p=(a)-[r]->(b:Concept) 
        WHERE TYPE(r) <> '%s'
        AND a.uid = $uid 
        RETURN TYPE(r) as type, ID(a) as source, ID(b) as target, r.weight as weight""" % relation_type,
                    uid=uid)

    return list(result)


def retrieve_slide_to_concepts_relationships(tx, sid):
    """
    """

    logger.info("Getting the relationships of slide '%s'" % sid)
    result = tx.run("""
        MATCH p=(a: Slide)-[r]->(b: Concept) 
        WHERE a.sid = $sid  
        RETURN TYPE(r) as type, ID(a) as source, ID(b) as target, r.weight as weight""",
                    sid=sid)

    return list(result)


def retrieve_resource_to_slide_relationships(tx, sid):
    """
    """

    logger.info("Getting the relationships of resource '%s'" % sid)

    result = tx.run("""
            MATCH p=(a: Resource)-[r]->(b: Slide) 
            WHERE b.sid = $sid  
            RETURN TYPE(r) as type, ID(a) as source, ID(b) as target""",
                    sid=sid)

    return list(result)


def retrieve_resource_to_concept_relationships(tx, cid):
    """
    """
    cid = str(cid)
    logger.info("Getting the relationships of resource to concept '%s'" % cid)

    result = tx.run("""
            MATCH p=(a: Resource)-[r: CONTAINS]->(b: Concept) 
            WHERE b.cid = $cid  
            RETURN TYPE(r) as type, ID(a) as source, ID(b) as target, r.weight as weight""",
                    cid=cid)

    return list(result)


def retrieve_user_to_concept_relationships(tx, uid):
    """
    """
    uid = str(uid)
    logger.info("Getting the relationships of user '%s' to concept" % uid)

    result = tx.run("""
            MATCH p=(a: User)-[r]->(b: Concept) 
            WHERE a.uid = $uid  
            RETURN TYPE(r) as type, ID(a) as source, ID(b) as target""",
                    uid=uid)

    return list(result)


def connect_user_concept(tx, user, concepts):
    """
    """
    logger.info("Connect user and concept")
    for concept in concepts:
        if concept[1] == 1:
            # If user doesn't understand the concept, the relationship is "dnu"
            tx.run("""MATCH (u:User) WHERE u.uid = $uid 
                OPTIONAL MATCH (c:Concept) WHERE c.name = $name  And c.type <> $type
                MERGE (u)-[r:dnu {weight: 1}]->(c)""",
                   uid=user["id"],
                   name=concept[0],
                   type="category")

            tx.run('''MATCH p=(u)-[r:u]->(c) where u.uid=$uid And c.name = $name  delete r''',
                   uid=user["id"],
                   name=concept[0])
        else:
            # If user understand the concept, the relationship is "u"
            tx.run("""MATCH (u:User) WHERE u.uid = $uid 
                OPTIONAL MATCH (c:Concept) WHERE c.name = $name  And c.type <> $type
                MERGE (u)-[r:u {weight: 1}]->(c)""",
                   uid=user["id"],
                   name=concept[0],
                   type="category")

            tx.run('''MATCH p=(u)-[r:dnu]->(c) where u.uid=$uid And c.name = $name  delete r''',
                   uid=user["id"],
                   name=concept[0])


def connect_user_dnu_concept(tx, user, non_understood):
    """
    """
    logger.info("Connect user with concept doesn't understand")
    uid=user["id"]
    for id in non_understood:
        query='MATCH (u:User) WHERE u.uid = "' + str(uid) + '" OPTIONAL MATCH (c:Concept) WHERE c.cid ="'+str(id)+'"MERGE (u)-[r:dnu {weight: 1}]->(c)'
        # user doesn't understand the concept, the relationship is "dnu"
        # tx.run("""MATCH (u:User) WHERE u.uid = $uid 
        #     OPTIONAL MATCH (c:Concept) WHERE c.cid = $cid
        #     MERGE (u)-[r:dnu {weight: 1}]->(c)""",
        #        uid=user["id"],
        #        cid=id)
        tx.run(query)

        tx.run('''MATCH p=(u)-[r:u]->(c) where u.uid=$uid And c.cid = $cid  delete r''',
               uid=user["id"],
               cid=id)


def connect_user_u_concept(tx, user, understood):
    """
    """
    logger.info("Connect user with concept understand")
    for id in understood:
        # user understand the concept, the relationship is "u"
        tx.run("""MATCH (u:User) WHERE u.uid = $uid 
            OPTIONAL MATCH (c:Concept) WHERE c.cid = $cid
            MERGE (u)-[r:u {weight: 1}]->(c)""",
               uid=user["id"],
               cid=id)

        tx.run('''MATCH p=(u)-[r:dnu]->(c) where u.uid=$uid And c.cid = $cid  delete r''',
               uid=user["id"],
               cid=id)


def reset_user_concept_relationships(tx, user, new_concepts):
    """
    """
    logger.info("Connect user with concept understand")
    for id in new_concepts:
        tx.run('''MATCH p=(u)-[r:dnu]->(c) where u.uid=$uid And c.cid = $cid  delete r''',
               uid=user["id"],
               cid=id)
        tx.run('''MATCH p=(u)-[r:u]->(c) where u.uid=$uid And c.cid = $cid  delete r''',
               uid=user["id"],
               cid=id)


def get_user_embedding(tx, user, mid):
    """
    """
    logger.info("Getting User embeddings")
    # Find concept embeddings that user doesn't understand
    results = tx.run(
        """MATCH p=(u)-[r:dnu]->(c) where u.uid=$uid and c.mid=$mid RETURN c.final_embedding as embedding, c.weight as weight""",
        uid=user["id"],
        mid=mid)
    embeddings = list(results)
    # If the user does not have concepts that he does not understand, the list is empty
    if not embeddings:
        tx.run("""MATCH (u:User) WHERE u.uid=$uid set u.embedding=$embedding""",
               uid=user["id"],
               embedding="")
        logger.info("reset user embedding")
    else:
        sum_embeddings = 0
        sum_weights = 0
        # Convert string type to array type 'np.array'
        # Sum and average these concept embeddings to get user embedding
        for embedding in embeddings:
            list1 = embedding["embedding"].split(',')
            list2 = []
            for j in list1:
                list2.append(float(j))
            arr = np.array(list2)
            sum_embeddings = sum_embeddings + arr * embedding["weight"]
            sum_weights = sum_weights + embedding["weight"]
        # The weighted average of final embeddings of all dnu concepts
        average = np.divide(sum_embeddings, sum_weights)
        tx.run("""MATCH (u:User) WHERE u.uid=$uid set u.embedding=$embedding""",
               uid=user["id"],
               embedding=','.join(str(i) for i in average))
        logger.info("get user embedding")


def _truncate(num):
    return re.sub(r'^(\d+\.\d{,2})\d*$', r'\1', str(num))


class NeoDataBase:

    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri,
                                           auth=(user, password),
                                           encrypted=False)


    def close(self):
        self.driver.close()

    def create_user_concept_relationship(self, concept_id, user_id, relation_type):
        logger.info(relation_type)
        session = self.driver.session()
        tx = session.begin_transaction()

        try:
            if not exist_user_concept_relationship(tx=tx,
                                                   uid=user_id, cid=concept_id, relation_type=relation_type):
                create_user_concept_relationships(tx, concept_id, user_id, relation_type)

            tx.commit()

        except Exception as e:
            logger.error("Failure retrieving or creating user - concept relationship %s" % e)
            tx.rollback()
            session.close()
            self.close()

    def create_or_edit_user_rating(self, resource, user_id, relation_type, concepts=[]):
        logger.info("Create_or_edit_user_rating")
        session = self.driver.session()
        tx = session.begin_transaction()
        try:
            logger.info("Check if user has relationship to resource %s" % resource['id'])
            result = create_or_replace_user_resource_relationships(tx, rid=resource['id'], uid=user_id,             relation_type=relation_type, concepts=concepts)
            print(result)
            tx.commit()
            return result
        except Exception as e:
            logger.error("Failure retrieving or creating user - concept relationship %s" % e)
            tx.rollback()
            session.close()
            self.close()

    def get_lm_text(self, mid):
        """
        """
        try:
            # logger.info("get_lm_text '%s'" % mid)
            with self.driver.session() as session:
                result = session.run(
                    "MATCH (m:LearningMaterial) WHERE m.mid = $mid RETURN m.text as text",
                    mid=mid).data()
            return result[0]['text']
        except Exception as e:
            logger.error("Failure retrieving or creating user - %s" % e)
            session.close()
            self.close()

    def get_or_create_user(self, user_id, username="", user_email=""):
        """
        """
        session = self.driver.session()
        tx = session.begin_transaction()

        try:
            _uid = get_user(tx, user_id)
            if _uid:
                return _uid
            else:
                # print(tx)
                create_user(tx, user_id, username, user_email)
                tx.commit()
        except Exception as e:
            logger.error("Failure retrieving or creating user - %s" % e)
            tx.rollback()
            session.close()
            self.close()

    # def get_or_create_user_v2(self, user):
    #     """
    #     """
    #     session = self.driver.session()
    #     tx = session.begin_transaction()
    #     user = None
        
    #     # _uid = get_user(tx, user_id)
    #     user = get_user_v2(tx, user["id"])
    #     print("get_user_v2 -> ->", user)

    #     if user == None:
    #         user = create_user_v2(tx, user)
    #         # create_user(tx, user)
    #     print("user -> ->", user)

    #     return user

    def get_concepts_and_relationships(self, materialId):
        """
        """
        session = self.driver.session()
        tx = session.begin_transaction()
        concepts = []
        relations = []
        try:
            concepts = self.retrieve_all_concepts(tx, materialId)
            relations = self.retrieve_relationships(tx, materialId)
            tx.commit()

        except Exception as e:
            logger.error("Failure retrieving or creating concepts - %s" % e)
            tx.rollback()
            session.close()
            self.close()
            concepts = []
            relations = []
        return concepts, relations

    def retrieve_all_concepts(self, tx, mid):
        """
        """
        logger.info("Geting the concepts of learning material '%s'" % mid)
        result = tx.run("""MATCH (c:Concept)
            WHERE c.mid = $mid 
            RETURN LABELS(c) as labels, ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract""",
                        mid=mid)

        return list(result)

    def retrieve_relationships(self, tx, mid):
        """
        """
        logger.info("Geting the relationships of learning material '%s'" % mid)
        result = tx.run("""
            MATCH p=(a)-[r]->(b) 
            WHERE TYPE(r) <> 'CONTAINS'
            AND a.mid = $mid 
            AND b.mid = $mid 
            RETURN TYPE(r) as type, ID(a) as source, ID(b) as target, r.weight as weight""",
                        mid=mid)

        return list(result)

    def get_nodes_and_relationships(self, materialId):
        """
        """
        session = self.driver.session()
        tx = session.begin_transaction()
        nodes = []
        relations = []
        try:
            nodes = self.retrieve_all_nodes(tx, materialId)
            relations = self.retrieve_all_relationships(tx, materialId)
            tx.commit()

        except Exception as e:
            logger.error("Failure retrieving or creating concepts - %s" % e)
            tx.rollback()
            session.close()
            self.close()
            nodes = []
            relations = []
        return nodes, relations

    def retrieve_all_nodes(self, tx, mid):
        """
        """
        logger.info("Geting all nodes of learning material '%s'" % mid)
        concepts = tx.run("""MATCH (c:Concept)
                        WHERE c.mid = $mid 
                        RETURN LABELS(c) as labels, ID(c) AS id, c.abstract as abstract, c.cid as cid, c.final_embedding as final_embedding, c.initial_embedding as initial_embedding, c.mid as mid, c.name AS name, c.type as type, c.uri as uri, c.weight as weight, c.wikipedia as wikipedia""",
                          mid=mid)
        slides = tx.run("""MATCH (c:Slide)
                        WHERE c.mid = $mid 
                        RETURN LABELS(c) as labels, ID(c) AS id, c.concepts as concepts, c.final_embedding as final_embedding, c.initial_embedding as initial_embedding, c.mid as mid, c.name AS name, c.sid as sid, c.text as text, c.type as type""",
                        mid=mid)
        LMs = tx.run("""MATCH (c:LearningMaterial)
                        WHERE c.mid = $mid 
                        RETURN LABELS(c) as labels, ID(c) AS id, c.mid as mid, c.name AS name""",
                     mid=mid)
        results = list(concepts) + list(slides) + list(LMs)
        return results

    def retrieve_all_relationships(self, tx, mid):
        """
        """
        logger.info("Geting all relationships of learning material '%s'" % mid)
        # result = tx.run("""
        #     MATCH p=(a)-[r]->(b) WHERE a.mid = $mid AND b.mid = $mid RETURN p""",
        #     mid=mid)
        rel1 = tx.run("""
            MATCH p=(a:Slide)-[r:BELONGS_TO]->(b:LearningMaterial)
            WHERE a.mid = $mid 
            AND b.mid = $mid 
            RETURN TYPE(r) as type, ID(a) as source, ID(b) as target""",
                      mid=mid)
        rel2 = tx.run("""
            MATCH p=(a)-[r]->(b) 
            WHERE NOT EXISTS {MATCH (a:Slide)-[r:BELONGS_TO]->(b:LearningMaterial)}
            AND a.mid = $mid 
            AND b.mid = $mid 
            RETURN TYPE(r) as type, ID(a) as source, ID(b) as target, r.weight as weight""",

                      mid=mid)
        results = list(rel1) + list(rel2)
        return results

    def get_or_create_concepts_and_relationships(self, slide_id, material_id,
                                                 material_name, user_id, data, slide_node=[], slide_text="", lm_text="",
                                                 slide_concepts=[]):
        """
        """
        session = self.driver.session()
        tx = session.begin_transaction()
        concepts = []
        relations = []
        try:
            if not self.lm_exists(material_id):
                logger.info("Could not find learning material '%s" % material_name)
                create_learning_material(tx, material_id, material_name, lm_text)
                # concepts = self.retrieve_all_concepts(tx, material_id)
                # relations = self.retrieve_relationships(tx, material_id)

            if not self.slide_exists(slide_id):
                create_slide(tx, slide_concepts, slide_node)

                create_user_slide_relationships(tx, user_id, slide_id)
                create_lm_slide_relationships(tx, material_id, slide_id)

                # concepts
                logger.info("Creating concepts for Slide '%s'" % slide_id)
                # logger.info(data)
                logger.info("Creating Concepts relationships for slide")
                for node in data:
                    if not self.concept_existed(node):
                        create_concept(tx, node)
                    else:
                        logger.info("node %s already exists" % node["name"])
                    create_slide_concept_relationships(tx, slide_id, node)
                    create_lr_relationships(tx, material_id, node)
                # relationships
                # logger.info(
                #     "Creating Concepts relationships for slide '%s'" % slide_id)

                # for node in data:
                #     create_concept_relationships(tx, node)

            concepts = retrieve_slide_concepts(tx, slide_id)
            relations = retrieve_slide_to_concepts_relationships(tx, slide_id)
            tx.commit()
        except Exception as e:
            logger.error("Failure retrieving or creating concepts - %s" % e)
            tx.rollback()
            session.close()
            self.close()
            concepts = []
            relations = []

        return concepts, relations

    def get_or_create_resoures_relationships(self, user_id,material_id, concept_ids, recommendation_type,
                                             youtube_videos=[], wikipedia_articles=[]):
        logger.info("get or create resources relationships")
        resources = []
        relationships = []
        session = self.driver.session()
        tx = session.begin_transaction()

        try:
            if len(wikipedia_articles) != 0:
                for index, resource in wikipedia_articles.iterrows():
                    rid = resource['id']
                    weight = _truncate(resource[recommendation_type] if recommendation_type in resource.index else 0)
                    logger.info("Wikipedia Resource '%s" % rid)

                    if not self.resource_exists(rid):
                        logger.info("Could not find resource '%s" % rid)
                        create_wikipedia_resource(tx, resource, recommendation_type)
                        for cid in concept_ids:
                            if not exist_resource_to_concept_relationship(tx, rid, cid, "CONTAINS"):
                                create_resource_to_concept_relationships(tx, rid, cid, "CONTAINS", weight)
                            else:
                                self.edit_resource_to_concept_relationship(rid=rid, cid=cid, weight=weight,
                                                                           relation_type="CONTAINS")
                    else:
                        edit_resource(tx, resource, recommendation_type)
                        for cid in concept_ids:
                            if not exist_resource_to_concept_relationship(tx, rid, cid, "CONTAINS"):
                                create_resource_to_concept_relationships(tx, rid, cid, "CONTAINS", weight=weight)
                            else:
                                self.edit_resource_to_concept_relationship(rid=rid, cid=cid, weight=weight,
                                                                           relation_type="CONTAINS")
            if len(youtube_videos) != 0:
                for index, resource in youtube_videos.iterrows():
                    rid = resource['id']
                    weight = _truncate(resource[recommendation_type] if recommendation_type in resource.index else 0)
                    logger.info("Youtube Resource '%s" % rid)

                    if not self.resource_exists(rid):
                        logger.info("Could not find resource '%s" % rid)
                        create_video_resource(tx, resource, recommendation_type)
                        for cid in concept_ids:
                            if not exist_resource_to_concept_relationship(tx, rid, cid, "CONTAINS"):
                                create_resource_to_concept_relationships(tx, rid, cid, "CONTAINS", weight=weight)
                            else:
                                self.edit_resource_to_concept_relationship(rid=rid, cid=cid, weight=weight,
                                                                           relation_type="CONTAINS")
                    else:
                        edit_resource(tx, resource, recommendation_type)
                        for cid in concept_ids:
                            if not exist_resource_to_concept_relationship(tx, rid, cid, "CONTAINS"):
                                create_resource_to_concept_relationships(tx, rid, cid, "CONTAINS", weight=weight)
                            else:
                                self.edit_resource_to_concept_relationship(rid=rid, cid=cid, weight=weight,
                                                                           relation_type="CONTAINS")

            user_to_concept_relationships = retrieve_user_to_concept_relationships(tx, user_id)
            relationships.extend([r for r in user_to_concept_relationships if r not in relationships])

            for cid in concept_ids:
                resource = retrieve_concept_resources(tx, material_id, cid)
                # logger.info(resource)
                relationship = retrieve_resource_to_concept_relationships(tx, cid)
                # logger.info(relationship)
                resources.extend([r for r in resource if r not in resources])
                relationships.extend([r for r in relationship if r not in relationships])

            tx.commit()
        except Exception as e:
            logger.error("Failure retrieving or creating Resources - %s" % e)
            tx.rollback()
            session.close()
            self.close()
            resources = []
            relationships = []
        return resources, relationships

    def get_concept_resources(self, concept_id, user_id):
        logger.info("get concept/resources relationships")
        resources = []
        relationships = []
        session = self.driver.session()
        tx = session.begin_transaction()

        try:
            user_to_concept_relationships = retrieve_user_to_concept_relationships(tx, user_id)
            relationships.extend([r for r in user_to_concept_relationships if r not in relationships])

            if self.concept_exists(concept_id):
                logger.info("Concept '%s' exists" % concept_id)
                resources = retrieve_concept_resources(tx, concept_id)
                relationships = retrieve_resource_to_concept_relationships(tx, concept_id)
                tx.commit()
            else:
                logger.info("Concept '%s' not found" % concept_id)
        except Exception as e:
            logger.error("Failure retrieving Resources - %s" % e)
            tx.rollback()
            session.close()
            self.close()
            resources = []
        return resources, relationships

    def get_or_create_lm_relationships(self, material_id,
                                       material_name, data):
        """
        """
        session = self.driver.session()
        tx = session.begin_transaction()
        concepts = []
        relations = []
        try:
            print(tx)
            _mid = get_learning_material(tx, material_id)
            if _mid:
                logger.info("Found learning material '%s" % material_name)
                concepts = retrieve_all_concepts(tx, material_id)
                relations = retrieve_relationships(tx, material_id)
            else:
                logger.info("Could not find learning material '%s" %
                            material_id)
                create_learning_material(tx, material_id, material_name)
                # concepts

                logger.info("Creating concepts for learning material '%s'" %
                            material_id)
                for node in data:
                    create_concept(tx, node)

                # relationships
                logger.info(
                    "Creating relationships for learning material '%s'" %
                    material_id)
                for node in data:
                    create_concept_relationships(tx, node)

                create_lr_relationships(tx, material_id)
                concepts = retrieve_all_concepts(tx, material_id)
                relations = retrieve_relationships(tx, material_id)
            tx.commit()
        except Exception as e:
            logger.error("Failure retrieving or creating concepts - %s" % e)
            tx.rollback()
            session.close()
            self.close()
            concepts = []
            relations = []

        return concepts, relations

    def lm_exists(self, mid):
        """
        """
        logger.info(
            "Check if learning material '%s' exists" % mid)
        with self.driver.session() as session:
            result = session.run(
                "MATCH (m:LearningMaterial) WHERE m.mid = $mid RETURN m",
                mid=mid)

            if list(result):
                return True
            else:
                return False

    def resource_exists(self, rid):
        """
        """
        logger.info(
            "Check if resource '%s' exists" % rid)
        with self.driver.session() as session:
            result = session.run(
                "MATCH (r:Resource) WHERE r.rid = $rid RETURN r",
                rid=rid)
            if list(result):
                return True
            else:
                return False

    def slide_exists(self, sid):
        """
        """
        logger.info(
            "Check if slide '%s' exists" % sid)
        with self.driver.session() as session:
            result = session.run(
                "MATCH (s:Slide) WHERE s.sid = $sid RETURN s",
                sid=sid)
            # logger.info("exist %s"%list(result))
            if list(result):
                return True
            else:
                return False

    def concept_exists(self, cid):
        """
        """
        # logger.info(
        #     "Check if concept '%s' exists" % cid)
        with self.driver.session() as session:
            result = session.run(
                "MATCH (c:Concept) WHERE c.cid = $cid RETURN c",
                cid=cid)
            if list(result):
                return True
            else:
                return False

    def concept_existed(self, node):
        """
        """
        # logger.info(
        #     "Check if concept '%s' exists" % cid)
        initial_embedding = ','.join(str(i) for i in node["initial_embedding"])
        with self.driver.session() as session:
            result = session.run(
                "MATCH (c:Concept) WHERE c.initial_embedding = $initial_embedding and c.mid = $mid RETURN c.cid as id",
                initial_embedding=initial_embedding,
                mid=node["mid"]).data()
            if result != []:
                # logger.info("concept existed")
                # logger.info(result)
                node["id"] = result[0]["id"]
                return True
            else:
                return False

    def get_concept_cid(self, node):
        with self.driver.session() as session:
            result = session.run(
                "MATCH (c:Concept) WHERE c.name = $name and c.mid = $mid RETURN c.cid as id",
                name=node["name"],
                mid=node["mid"]).data()
        if result == []:
            return node["id"]
        else:
            return result[0]["id"]

    def concept_exists1(self, node):
        """
        """
        # logger.info(
        #     "Check if concept '%s' exists" % cid)
        with self.driver.session() as session:
            if node["type"] == "property":
                result = session.run(
                    "MATCH (c:Concept) WHERE c.name = $name and c.mid=$mid RETURN c",
                    name=node["name"],
                    mid=node["mid"])
            elif node["type"] == "category":
                result = session.run(
                    "MATCH (c:Concept) WHERE c.cid = $cid RETURN c",
                    cid=node["id"])
            elif node["type"] == "annotation":
                return True

            if list(result):
                return True
            else:
                return False

    def exist_resource_to_concept_relationship(self, rid, cid, relation_type):
        """
        """
        logger.info("Check if resource has relationship to concept %s" % cid)
        with self.driver.session() as session:
            result = session.run(
                "MATCH p=(a)-[r: %s]->(b) "
                "WHERE a.rid = $rid "
                "AND b.cid = $cid "
                "RETURN TYPE(r) as type, ID(a) as source, ID(b) as target""" % relation_type,
                rid=rid, cid=cid)

        if list(result):
            logger.info("%s relationship between resource and concept" % relation_type)
            return True
        else:
            logger.info("No %s relationship between resource and concept" % relation_type)
            return False

    def edit_resource_to_concept_relationship(self, rid, cid, weight, relation_type):
        """
        """
        logger.info("Check if resource has relationship to concept %s" % cid)
        with self.driver.session() as session:
            result = session.run(
                "MATCH p=(a)-[r: %s]->(b) "
                "WHERE a.rid = $rid "
                "AND b.cid = $cid "
                "SET r.weight = $weight "
                "RETURN TYPE(r) as type, ID(a) as source, ID(b) as target""" % relation_type,
                rid=rid, cid=cid, weight=weight)

    def get_slide(self, sid):
        """
        """
        logger.info("Get slide %s" % sid)
        with self.driver.session() as session:
            result = session.run(
                "MATCH (s:Slide) WHERE s.sid = $sid RETURN s",
                sid=sid)
            # logger.info("hier is the result %s"%list(result))
            return list(result)

    def get_concept_name_by_id(self, cid):
        cid = str(cid)
        logger.info(
            "Get concept '%s'" % cid)
        with self.driver.session() as session:
            result = session.run(
                "MATCH (c:Concept) WHERE c.cid = $cid RETURN c",
                cid=cid).data()

        return list(result)

    def get_concept_id_by_name(self, name):
        logger.info(
            "Get concept id for '%s'" % name)
        with self.driver.session() as session:
            result = session.run(
                "MATCH (c:Concept) WHERE c.name = $name RETURN c.cid as cid",
                name=name).data()

        return result

    def get_top_n_concept_by_name(self, name):
        """
        """
        with self.driver.session() as session:
            logger.info("Get concept id for '%s'" % name)
            concepts = session.run(
                """MATCH p=(s: Slide)-[r: CONTAINS]->(c: Concept) 
                WHERE c.name = $name RETURN ID(c) as id, c.cid as cid, c.name as name, c.weight as weight""",
                name=name).data()

        return concepts

    def retrieve_lm_concepts(self, mid):
        """
        """
        with self.driver.session() as session:
            print("Getting the concepts of slide '%s'" % mid)
        concepts = session.run(
            """MATCH p=(s: LearningMaterial)-[r: CONTAINS]->(c: Concept) WHERE s.mid = $mid RETURN c.cid as cid, c.name AS name""",
            mid=mid).data()

        if len(concepts) != 0:
            concept_names = []
            for concept in concepts:
                concept_names.append(concept['name'])

            return concept_names
        else:
            return []

    def construct_user_model(self, user, non_understood, understood, new_concepts, mid):
        """
        """
        session = self.driver.session()
        tx = session.begin_transaction()

        try:
            if self.user_exists(user["id"]):
                logger.info("Found  user")
            else:
                # logger.info("create  user %s" % user)
                create_user(tx, user)
            connect_user_dnu_concept(tx, user, non_understood)
            connect_user_u_concept(tx, user, understood)
            reset_user_concept_relationships(tx, user, new_concepts)
            get_user_embedding(tx, user, mid)

            tx.commit()
        except Exception as e:
            logger.error("Failure connect user and concept")
            logger.error(e)
            tx.rollback()
            session.close()
            self.close()

    def user_exists(self, user_id):
        """
        """
        with self.driver.session() as session:
            result = session.run(
                "MATCH (u:User) WHERE u.uid = $uid RETURN u",
                uid=user_id)
            if list(result):
                return True
            else:
                return False

    def get_concept_has_not_read(self, user_id, mid):
        logger.info("Get concept")
        with self.driver.session() as session:
            result = session.run(
                """MATCH (n:Concept)
                    WHERE NOT EXISTS {MATCH (u:User)-[r]->(n:Concept) where u.uid = $uid}
                    AND NOT EXISTS {MATCH (u:User)-[r]->(m:Concept) where u.uid =$uid and n.initial_embedding =m.initial_embedding}
                    AND n.mid =$mid 
                    AND n.type <> $type
                    return n
                    """,
                uid=user_id,
                mid=mid,
                type="category"
            ).data()

        return list(result)

    def get_user(self, user_id):
        logger.info("Get user")
        with self.driver.session() as session:
            result = session.run(
                "MATCH (u:User) WHERE u.uid = $uid RETURN u",
                uid=user_id).data()

        return list(result)

    def get_road_user_c_related_concept(self, uid, cid):
        """
        """
        logger.info("get_road_user_c_related_concept")
        with self.driver.session() as session:
            result = session.run("""
                MATCH p = (u:User)-[r:dnu]->(c:Concept)-[r1]->(f:Concept)<-[r2]-(d:Concept) 
                where u.uid=$uid and d.cid=$cid and f.type <> $type
                RETURN r1.weight+r2.weight as weight,f.name as name,p,c.name as dnu,f.type as type""",
                                 uid=uid,
                                 cid=cid,
                                 type="category").data()
        return list(result)

    def get_road_user_c_category_concept(self, uid, cid):
        """
        """
        logger.info("get_road_user_c_category_concept")
        with self.driver.session() as session:
            result = session.run("""
                MATCH p = (u:User)-[r:dnu]->(c:Concept)-[r1]->(f:Concept)<-[r2]-(d:Concept) 
                where u.uid=$uid and d.cid=$cid and f.type= $type
                RETURN r1.weight+r2.weight as weight,f.name as name,p, c.name as dnu,f.type as type""",
                                 uid=uid,
                                 cid=cid,
                                 type="category").data()

        return list(result)

    def get_road_user_c_slide_concept(self, uid, cid, mid):
        """
        """
        logger.info("get_road_user_c_slide_concept")
        with self.driver.session() as session:
            result = session.run("""
                MATCH p = (u:User)-[r:dnu]->(c:Concept)<-[r1]-(s:Slide)-[r2]->(d:Concept) 
                where u.uid=$uid and d.cid=$cid and s.mid=$mid
                RETURN r1.weight+r2.weight as weight, s.name as name,p,c.name as dnu,s.type as type""",
                                 uid=uid,
                                 mid=mid,
                                 cid=cid).data()

        return list(result)

    def get_road_user_concept_relatedconcept(self, uid, cid):
        """
        """
        # logger.info("get_road_user_concept_relatedconcept %s" % uid)
        # logger.info("get_road_user_concept_relatedconcept %s" % cid)
        with self.driver.session() as session:
            result = session.run("""
                MATCH p = (u:User)-[r:dnu]->(c:Concept)-[r1]->(d:Concept) 
                where u.uid=$uid and d.cid=$cid
                RETURN r1.weight,p,c.name as dnu""",
                                 uid=uid,
                                 cid=cid).data()

        return list(result)

    def find_concept(self, ids):
        nodes = []
        for cid in ids:
            # Determine if concept already have related concepts and categories. If yes, skip
            with self.driver.session() as session:
                node = session.run("""MATCH (n:Concept)
                    WHERE NOT EXISTS {MATCH (n:Concept)-[r:BELONGS_TO]->(c:Concept)}
                    And n.cid = $cid RETURN n.name as label , n.cid as id, n.uri as uri, n.type as type, n.mid as mid, n.initial_embedding as initial_embedding""",
                                   cid=cid).data()
                if node == []:
                    continue
                nodes.append(node)
        annotations = []
        if nodes == []:
            return annotations
        for node in nodes:
            list1 = node[0]["initial_embedding"].split(',')
            list2 = []
            for i in list1:
                list2.append(float(i))
            node[0]["initial_embedding"] = list2
            c = {
                "id": node[0]["id"],
                "label": node[0]["label"],
                "name": node[0]["label"],
                "uri": node[0]["uri"],
                "type": node[0]["type"],
                "mid": node[0]["mid"],
                "initial_embedding": node[0]["initial_embedding"],
                "to": [],
            }
            annotations.append(c)
        # logger.info("find concept %s" % annotations)
        return annotations

    def retrieve_all_main_concepts(self, mid):
        logger.info("retrieve all main concepts %s" % mid)
        with self.driver.session() as session:
            nodes = session.run("""MATCH (n:Concept)
                WHERE n.mid = $mid and n.type="annotation"
                RETURN n.name as label, n.cid as id, n.uri as uri, n.type as type, n.mid as mid, n.initial_embedding as initial_embedding, n.weight as weight""",
                                mid=mid).data()
        annotations = []

        for node in nodes:
            list1 = node["initial_embedding"].split(',')
            list2 = []
            for i in list1:
                list2.append(float(i))
            node["initial_embedding"] = list2
            c = {
                "id": node["id"],
                "label": node["label"],
                "name": node["label"],
                "uri": node["uri"],
                "type": node["type"],
                "mid": node["mid"],
                "initial_embedding": node["initial_embedding"],
                "to": [],
                "weight": node["weight"]
            }
            annotations.append(c)
        return annotations

    
    def get_all_concepts(self,mid):
        logger.info("get all concepts %s" % mid)
        with self.driver.session() as session:
            nodes = session.run("""MATCH (n:Concept)
                WHERE n.mid = $mid 
                RETURN n.name as label, n.cid as id, n.uri as uri, n.type as type, n.mid as mid, n.initial_embedding as initial_embedding, n.weight as weight""",
                                mid=mid).data()
        annotations = []

        for node in nodes:
            list1 = node["initial_embedding"].split(',')
            list2 = []
            for i in list1:
                list2.append(float(i))
            node["initial_embedding"] = list2
            c = {
                "id": node["id"],
                "label": node["label"],
                "name": node["label"],
                "uri": node["uri"],
                "type": node["type"],
                "mid": node["mid"],
                "initial_embedding": node["initial_embedding"],
                "to": [],
                "weight": node["weight"]
            }
            annotations.append(c)
        return annotations

    def get_related_category_of_main_concept(self,mid):
        main_concepts=self.retrieve_all_main_concepts(mid=mid)
        for main_concept in main_concepts:
            main_concept["category"],main_concept["related"]=[],[]
            with self.driver.session() as session:
                categories = session.run("""MATCH (n:Concept) WHERE n.mid = $mid and n.cid = $cid
                                        OPTIONAL MATCH p=(n)-[r:BELONGS_TO]->(m)
                                        RETURN m.name as neighbor""",
                                        mid=mid,
                                        cid=main_concept["id"]).data()
                for category in categories:
                    main_concept["category"].append(category["neighbor"])
                related = session.run("""MATCH (n:Concept) WHERE n.mid = $mid and n.cid = $cid
                                        OPTIONAL MATCH p=(n)-[r:RELATED_TO]->(m) where m.type="property"
                                        RETURN m.name as neighbor""",
                                        mid=mid,
                                        cid=main_concept["id"]).data()
                for relat in related:
                    main_concept["related"].append(relat["neighbor"])
        return main_concepts



    def find_concept_for_each_slide(self, mid, name):
        logger.info("find concept from %s" % name)
        with self.driver.session() as session:
            nodes = session.run("""MATCH p=(s:Slide)-[r:CONTAINS]->(n:Concept) 
                WHERE s.mid = $mid and s.name = $name and NOT EXISTS {MATCH (n:Concept)-[d:RELATED_TO]->(c:Concept)}
                RETURN n.name as label , n.cid as id, n.uri as uri, n.type as type, n.mid as mid, n.initial_embedding as initial_embedding""",
                                mid=mid,
                                name=name).data()
        annotations = []

        for node in nodes:
            list1 = node["initial_embedding"].split(',')
            list2 = []
            for i in list1:
                list2.append(float(i))
            node["initial_embedding"] = list2
            c = {
                "id": node["id"],
                "label": node["label"],
                "name": node["label"],
                "uri": node["uri"],
                "type": node["type"],
                "mid": node["mid"],
                "initial_embedding": node["initial_embedding"],
                "to": [],
            }
            annotations.append(c)
        return annotations

    def get_top_n_dnu_concepts(self, user_id, material_id, top_n=5):
        """
        """
        logger.info("Getting User top dnu concepts")

        # Find concept embeddings that user doesn't understand
        with self.driver.session() as session:
            concepts = session.run(
                """MATCH p=(u:User)-[r:dnu]->(c:Concept) where u.uid=$uid and c.mid=$mid RETURN c.cid as cid, c.name as name, ID(c) as id, c.weight as weight""",
                uid=user_id,
                mid=material_id).data()
        # concepts = list(result)
        logger.info("User dnu concepts")
        # logger.info(concepts)

        concepts.sort(key=lambda x: x["weight"], reverse=True)

        return concepts[:top_n]

    def create_related_concepts_and_relationships(self, data):
        """
        """
        logger.info("create_related_concepts_and_relationships")
        session = self.driver.session()
        tx = session.begin_transaction()
        try:
            logger.info("Creating concept")
            for node in data:
                if not self.concept_existed(node):
                    create_concept(tx, node)
                else:
                    logger.info("node %s already exists" % node["name"])
            # relationships
            logger.info("Creating concept relationships to concepts")
            for node in data:
                # if node["type"] == "property":
                # node["id"] = self.get_concept_cid(node)
                # logger.info(node["id"])
                create_concept_relationships1(tx, node)
            tx.commit()
            session.close()# session must be closed after each iteration to not consume all available sessions within a pool [after experiments it throws errors after 101 opened sessions]

        except Exception as e:
            logger.error("Failure retrieving or creating concepts - %s" % e)
            tx.rollback()
            session.close()
            self.close()

    def relationships_complement(self, data):
        """
        """
        logger.info("relationships_complement")
        session = self.driver.session()
        tx = session.begin_transaction()
        try:
            for node in data:
                create_concept_relationships(tx, node)
            tx.commit()

        except Exception as e:
            logger.error("Failure to complement relationships - %s" % e)
            tx.rollback()
            session.close()
            self.close()

    def built_bi_directional_relationships(self, mid):
        """
        """
        logger.info("built bi-directional relationships")
        session = self.driver.session()
        tx = session.begin_transaction()
        try:
            tx.run("""MATCH (n:Concept)-[r:RELATED_TO]->(m:Concept) WHERE n.type <> "category"  
                    and m.type <> "category"
                    and n.mid = $mid
                    and m.mid = $mid
                    MERGE (m)-[r1:RELATED_TO]->(n) on create set r1.weight=r.weight""", mid=mid)
            tx.commit()

        except Exception as e:
            logger.error("Failure built bi-directional relationships - %s" % e)
            tx.rollback()
            session.close()
            self.close()

    def creat_link_between_lm_main_concepts(self, data, mid):
        """
        """
        logger.info("creat_link_between_lm_main_concepts")
        session = self.driver.session()
        tx = session.begin_transaction()
        try:
            for node in data:
                create_lr_relationships(tx, mid, node)
            tx.commit()

        except Exception as e:
            logger.error("Failure retrieving or creating concepts - %s" % e)
            tx.rollback()
            session.close()
            self.close()

    def extract_vector_relation(self, mid):
        """
        """
        # Get ids and initial embeddings of nodes
        # Nodes: concept, related concept, category and slide
        self.idfeature(mid)
        # Get relationships between nodes
        self.relation(mid)


    def idfeature(self, mid):
        # Get ids, initial embeddings and types of nodes (concept, related concept, category)
        with self.driver.session() as session:
            concept_result = session.run(
                """MATCH (n:Concept) where n.mid = $mid RETURN n.initial_embedding as embedding, n.cid as id, n.type as type""",
                mid=mid).data()
            # Get ids, initial embeddings and types of slides
            slide_result = session.run(
                """MATCH (n:Slide) where n.mid = $mid RETURN n.initial_embedding as embedding, n.sid as id, n.type as type""",
                mid=mid).data()
        nodes = list(concept_result) + list(slide_result)
        idx_features = []
        # use hash(id + type) to get new id:
        # 1.In order to distinguish between two nodes with the same id but different types
        # 2.The type of id is a string type which needs to be turned into an integer type for subsequent processing.
        for node in nodes:
            c = {
                "id": node["id"],
                "embedding": node["embedding"],
                "newid": hash(node["id"] + node["type"])
            }
            idx_features.append(c)
        # Save ids and initial embeddings of nodes in text
        # The first column is the new id, the second column is the original id, and the rest is the initial embedding
        with open("idfeature.txt", "w") as f:
            for idx_feature in idx_features:
                con = list(idx_feature["embedding"].split(","))
                f.write(str(idx_feature["newid"]) + " " + str(idx_feature["id"]) + " " + " ".join(con) + "\n")

    def relation(self,mid):
        # Get relationships between nodes (concept-related concept, concept-category)
        with self.driver.session() as session:
            concept_result = session.run(
                """MATCH p=(u:Concept)-[r]->(c:Concept) where u.mid = $mid and c.mid =$mid RETURN u.cid as source, u.type as stype, r.weight as weight, c.cid as target, c.type as ttype""",
                mid=mid).data()
            # Get relationships between nodes (slide-concept)
            slide_result = session.run(
                """MATCH p=(u:Slide)-[r]->(c:Concept) where u.mid = $mid and c.mid = $mid RETURN u.sid as source, u.type as stype, r.weight as weight, c.cid as target, c.type as ttype""",
                mid=mid).data()
        relations = list(concept_result) + list(slide_result)
        relationships = []
        for relation in relations:
            r = {
                "source": hash(relation["source"] + relation["stype"]),
                "target": hash(relation["target"] + relation["ttype"]),
                "weight": round(relation["weight"], 2)
            }
            relationships.append(r)
        # Save relationships between nodes in text
        # first column is source node, second column is weight of relationship, third column is target node
        with open("relation.txt", "w") as f:
            for relationship in relationships:
                f.write(str(relationship["source"]) + " " + str(relationship["weight"])
                        + " " + str(relationship["target"]) + "\n")

    def get_concepts_of_slide(self, sid):
        with self.driver.session() as session:
            concept_list = session.run(
                """MATCH (s:Slide) where s.sid =$sid RETURN s.concepts as concepts, s.name as name""",
                sid=sid).data()
        return list(concept_list)

    def get_concepts_of_LM(self, mid):
        with self.driver.session() as session:
            concept_list = session.run(
                """MATCH p=(l:LearningMaterial)-[r:CONTAINS]->(n:Concept) where l.mid =$mid RETURN n.name as name""",
                mid=mid).data()
        return list(concept_list)
    
    def update_concept(self, node):
        """
        Add rank to each node
        """
        print('adding rank to node: '+ str(node['id'])+' with rank: '+ str(node['rank']))
        session = self.driver.session()
        session.run(
            """Match (c:Concept) WHERE c.cid=$cid and c.mid=$mid SET c.rank=$rank """,
            cid=node["id"],
            mid=node["mid"],
            rank=node["rank"])
        session.commit()
        session.close()


    ###########
    # boby024 #
    ###########

    def get_or_create_user_v2(self, user):
        """
        """
        tx = self.driver.session()
        user_node = tx.run(
            "MATCH (u:User) WHERE u.uid = $uid RETURN u.uid as uid",
            uid=user["user_id"]
        ).single()

        if user_node is None:
            user_node = tx.run(
                    """MERGE (u:User {name: $name, uid: $uid, type: $type, email: $userEmail, embedding:$embedding}) RETURN u.uid""",
                    name=user["name"],
                    uid=user["user_id"],
                    type="user",
                    userEmail=user["user_email"],
                    embedding=""
                ).single()
            
        return user_node

    def create_or_update_video_resource(self, tx, node: dict, recommendation_type='', update_embedding_values=False):
        '''
            Creating Resource YouTube
            r.similarity_score = $similarity_score,
        '''
        # logger.info(" Creating Resource YouTube")
        try:
            if update_embedding_values == True: # node.get("keyphrases") != None or node.get("document_embedding") != None or node.get("keyphrase_embedding") != None:
                tx.run(
                    '''
                        MATCH (r:Resource: Video)
                        WHERE r.rid = $rid
                        SET   r.keyphrases = $keyphrases, r.keyphrase_embedding = $keyphrase_embedding, r.document_embedding = $document_embedding 
                    ''',
                    rid=node["rid"],
                    keyphrases=node["keyphrases"] if "keyphrases" in node else [],
                    keyphrase_embedding=str(node["keyphrase_embedding"] if "keyphrase_embedding" in node else ""),
                    document_embedding=str(node["document_embedding"] if "document_embedding" in node else ""),
                )
            else:
                tx.run(
                    '''
                        MERGE (r:Resource:Video {rid: $rid})
                        ON CREATE SET 
                        r.uri = $uri, r.title = $title, r.description = $description, r.description_full = $description_full, r.text = $text, 
                        r.keyphrases = $keyphrases, r.document_embedding = $document_embedding, r.keyphrase_embedding = $keyphrase_embedding, 
                        r.thumbnail = $thumbnail, r.duration = $duration, r.views = $views, 
                        r.publish_time = $pub_time, r.channel_title = $channel_title, r.like_count = $like_count,
                        r.helpful_count = $helpful_count, r.not_helpful_count = $not_helpful_count, r.saves_count = $saves_count, 
                        r.updated_at = $updated_at
                        ON MATCH SET 
                        r.title = $title, r.description = $description, r.description_full = $description_full, r.text = $text, 
                        r.keyphrases = $keyphrases, r.document_embedding = $document_embedding, r.keyphrase_embedding = $keyphrase_embedding, 
                        r.thumbnail = $thumbnail, r.duration = $duration, r.views = $views, 
                        r.publish_time = $pub_time, r.channel_title = $channel_title, r.like_count = $like_count,
                        r.updated_at = $updated_at
                    ''',
                    rid=node["id"],
                    uri="https://www.youtube.com/embed/%s?autoplay=1" % node["id"],
                    title=node["title"],
                    description=node["description"],
                    description_full=node["description_full"],
                    thumbnail="https://i.ytimg.com/vi/%s/hqdefault.jpg" % node["id"],
                    text=node["text"],
                    duration=node["duration"],
                    views=node["views"],
                    pub_time=node["publishTime"],
                    # similarity_score=node[recommendation_type] if recommendation_type in node.index else 0,
                    keyphrases=node["keyphrases"] if "keyphrases" in node else [],
                    keyphrase_embedding=str(node["keyphrase_embedding"] if "keyphrase_embedding" in node else ""),
                    document_embedding=str(node["document_embedding"] if "document_embedding" in node else ""),
                    helpful_count=node["helpful_count"] if "helpful_count" in node else 0,
                    not_helpful_count=node["not_helpful_count"] if "not_helpful_count" in node else 0,
                    saves_count=node["saves_count"] if "saves_count" in node else 0,
                    like_count=node["like_count"],
                    channel_title=node["channel_title"],
                    updated_at=datetime.now().isoformat()
                )
        except Exception as e:
            print(e)
            pass

    def create_or_update_wikipedia_resource(self, tx, node, recommendation_type='', update_embedding_values=False):
        '''
            Creating Resource Wikipedia
        '''
        # logger.info("Creating Resource Wikipedia")
        try:
            if update_embedding_values == True: # node.get("keyphrases") != None or node.get("document_embedding") != None or node.get("keyphrase_embedding") != None:
                tx.run(
                    '''
                        MATCH (r:Resource: Article)
                        WHERE r.rid = $rid
                        SET   r.keyphrases = $keyphrases, r.keyphrase_embedding = $keyphrase_embedding, r.document_embedding = $document_embedding 
                    ''',
                    rid=node["rid"],
                    keyphrases=node["keyphrases"] if "keyphrases" in node else [],
                    keyphrase_embedding=str(node["keyphrase_embedding"] if "keyphrase_embedding" in node else ""),
                    document_embedding=str(node["document_embedding"] if "document_embedding" in node else ""),
                )
            else:
                tx.run(
                    '''
                        MERGE (r:Resource:Article {rid: $rid})
                        ON CREATE SET 
                        r.uri = $uri, r.title = $title, r.abstract = $abstract, r.text = $text, 
                        r.keyphrases = $keyphrases, r.document_embedding = $document_embedding, r.keyphrase_embedding = $keyphrase_embedding, 
                        r.helpful_count = $helpful_count, r.not_helpful_count = $not_helpful_count, r.saves_count = $saves_count,
                        r.updated_at = $updated_at
                        ON MATCH SET 
                        r.uri = $uri, r.title = $title, r.abstract = $abstract, r.text = $text, 
                        r.keyphrases = $keyphrases, r.document_embedding = $document_embedding, r.keyphrase_embedding = $keyphrase_embedding, 
                        r.updated_at = $updated_at
                    ''',
                    rid=node["id"],
                    uri=node["id"],
                    title=node["title"],
                    abstract=node["abstract"],
                    keyphrases=node["keyphrases"] if "keyphrases" in node else [],
                    text=node["text"],
                    # similarity_score=node[recommendation_type] if recommendation_type in node.index else 0,
                    keyphrase_embedding=str(node["keyphrase_embedding"] if "keyphrase_embedding" in node else ""),
                    document_embedding=str(node["document_embedding"] if "document_embedding" in node else ""),
                    helpful_count=node["helpful_count"] if "helpful_count" in node else 0,
                    not_helpful_count=node["not_helpful_count"] if "not_helpful_count" in node else 0,
                    saves_count=node["saves_count"] if "saves_count" in node else 0,
                    updated_at=datetime.now().isoformat()
                )
        except Exception as e:
            print(e)
            pass

    def get_top_n_concept_by_slide_id(self, slide_id: str, names: list = None, top_n=5):
        '''
            Get top n concept by slide ID and concept names
        '''
        concepts = []
        if names:
            with self.driver.session() as session:
                        logger.info("Get top n concept by slide ID")
                        concepts = session.run(
                            '''
                                MATCH p=(s: Slide)-[r: CONTAINS]->(c: Concept)
                                WHERE s.sid = $slide_id AND c.name IN $names
                                RETURN ID(c) as id, c.cid as cid, c.name as name, c.weight as weight
                                ORDER BY c.weight DESC
                                LIMIT $top_n
                            ''',
                            slide_id=slide_id,
                            names=names,
                            top_n=top_n
                        ).data()
        else:
            with self.driver.session() as session:
                logger.info("Get top n concept by slide ID and concept names")
                concepts = session.run(
                    '''
                        MATCH p=(s: Slide)-[r: CONTAINS]->(c: Concept)
                        WHERE s.sid = $slide_id
                        RETURN ID(c) as id, c.cid as cid, c.name as name, c.weight as weight
                        ORDER BY c.weight DESC
                    ''',
                    slide_id=slide_id
                ).data()

        return concepts
    
    def create_concept_modified(self, cid: str):
        '''
            Creating node 'Concept_modified'
        '''
        tx = self.driver.session()
        concept = None

        # get original Concept node
        concept_original = tx.run(
            '''
                MATCH (c:Concept) WHERE c.cid = $cid
                RETURN c.cid as cid, c.final_embedding as final_embedding
            ''',
            cid=cid
        ).single()

        if concept_original:
            concept = tx.run(
                '''
                    MERGE (c:Concept_modified { cid:$cid, final_embedding:$final_embedding })
                    RETURN ID(c) as node_id, c.cid as cid
                ''',
                cid=concept_original["cid"],
                final_embedding=concept_original["final_embedding"]
            ).single()
            concept = {"node_id": concept["node_id"], "cid": concept["cid"]}

        return concept

    """
    def get_concepts_modified_by_user_id_and_cids(self, user_id: str, cids: list):
        '''
            Get 'Concept_modified' by user_id and cids
        '''
        concepts = []
        with self.driver.session() as session:
            concepts = session.run(
                '''
                    MATCH (a:User)-[r:HAS_MODIFIED]->(b: Concept_modified)
                    WHERE r.user_id = $user_id AND b.cid IN $cids
                    RETURN DISTINCT b.cid as cid, r.weight as weight
                ''',
                user_id=user_id,
                cids=cids
            ).data()
            concepts = [{"cid": concept["cid"], "weight": concept["weight"]} for concept in concepts]
        return concepts
    """

    def update_rs_btw_user_and_cm(self, user_id: str, cid: str, weight: float, mid: str, status: str, only_status=False):
        '''
            Create or Update relationship between nodes 'User' and 'Concept_modified'
            typ: remove (from understood_list)
        '''
        tx = self.driver.session()

        if only_status == True:
            tx.run(
                '''
                    MATCH (a:User)-[r:HAS_MODIFIED]->(b:Concept_modified)
                    WHERE a.uid = $user_id AND r.user_id = $user_id AND b.cid = $cid
                    SET r.status = $status
                ''',
                user_id=user_id,
                cid=cid,
                status=status
            ).single()

        else:
            r_detail = tx.run(
                '''
                    MATCH (a:User {uid: $user_id}), (b:Concept_modified {cid: $cid})
                    MERGE (a)-[r:HAS_MODIFIED]->(b)
                    ON CREATE SET r.user_id = $user_id, r.weight = $weight, r.mid = $mid, r.status = $status
                    ON MATCH SET  r.user_id = $user_id, r.weight = $weight, r.mid = $mid, r.status = $status
                    RETURN ID(b) as cm_id, b.cid as cid, r.weight as weight, r.mid as mid, r.status as status
                ''',
                user_id=user_id,
                cid=cid,
                weight=weight,
                mid=mid,
                status=status
            ).single()

            r_detail = { "cm_id": r_detail["cm_id"], "cid": r_detail["cid"], 
                        "weight": r_detail["weight"], "mid": r_detail["mid"], 
                        "status": r_detail["status"]
                    }
            return r_detail

    def update_rs_btw_user_and_cms(self, user_id: str, cids: list, special_status):
        '''
            Create or Update relationship between nodes 'User' and list of cids ('Concept_modified') given
            relationship: dnu_reset
            for dnus that should be used for recommendations
        '''
        logger.info("User Concepts not used: DNU Reset")
        with self.driver.session() as session:
            result = session.run(
                '''
                    MATCH (a:User)-[r:HAS_MODIFIED]->(b:Concept_modified)
                    WHERE r.user_id = $user_id AND NOT b.cid IN $cids
                    SET r.status = "dnu_reset"
                ''',
                user_id=user_id,
                cids=cids
            )

    def get_user_embedding_with_concept_modified(self, user_id: str, mid: str, status: str):
        """
            Update User Embedding value based on nodes 'Concept_modified'
        """
        embedding = ""
        tx = self.driver.session()

        # Find concept embeddings that user doesn't understand
        embeddings = tx.run(
            '''
                MATCH (a:User)-[r:HAS_MODIFIED]->(b:Concept_modified)
                WHERE   a.uid = $user_id AND r.user_id = $user_id AND 
                        r.mid = $mid AND r.status = $status
                RETURN b.final_embedding as embedding, r.weight as weight
            ''',
            user_id=user_id,
            mid=mid,
            status=status
        ).data()

        # If the user does not have concepts that he does not understand, the list is empty
        if len(embeddings) == 0:
            tx.run(
                '''
                MATCH (u:User) WHERE u.uid=$user_id set u.embedding=$embedding
                ''',
                user_id=user_id,
                embedding=""
            )
            # logger.info("reset user embedding")
        else:
            sum_embeddings = 0
            sum_weights = 0
            # Convert string type to array type 'np.array'
            # Sum and average these concept embeddings to get user embedding
            for embedding in embeddings:
                list1 = embedding["embedding"].split(',')
                list2 = []
                for j in list1:
                    list2.append(float(j))
                arr = np.array(list2)
                sum_embeddings = sum_embeddings + arr * embedding["weight"]
                sum_weights = sum_weights + embedding["weight"]
            # The weighted average of final embeddings of all dnu concepts
            average = np.divide(sum_embeddings, sum_weights)
            embedding=','.join(str(i) for i in average)

            tx.run("""MATCH (u:User) WHERE u.uid=$user_id set u.embedding=$embedding""",
                user_id=user_id,
                embedding=embedding
            )
            # logger.info("get user embedding")

        return embedding

    def user_rates_resources(self, rating: dict, resource: dict):
        '''
            User rates Resource(s)
            rating: {
                "user_id": " 43dukl8",
                "cid": "dsfis23sd"
                "value": "HELPFUL" | "NOT_HELPFUL",
                "rid": "bnm565j",
                "mid": "sdddfe"
            }
        '''
        logger.info("Saving or Removing: User Resource")
        tx = self.driver.session()

        # Add or Update rating
        if rating["value"] != "HELPFUL":
            tx.run(
                    '''
                        MATCH (a:User {uid: $user_id}), (b:Resource {rid: $rid})
                        MERGE (a)-[r:HAS_RATED {user_id: $user_id, rid: $rid}]->(b)
                        ON CREATE SET r.cids = $cids, r.value = $value
                        ON MATCH SET r.user_id = $user_id, r.rid = $rid, r.value = $value, r.cids = $cids
                    ''',
                    user_id=rating["user_id"],
                    rid=rating["rid"],
                    value=rating["value"],
                    cids=[]
                )
        else:
            # apoc.coll.toSet(apoc.coll.union(r.cids, $cids))
            tx.run(
                    '''
                        MATCH (a:User {uid: $user_id}), (b:Resource {rid: $rid})
                        MERGE (a)-[r:HAS_RATED {user_id: $user_id, rid: $rid}]->(b)
                        ON CREATE SET r.cids = $cids, r.value = $value
                        ON MATCH SET r.user_id = $user_id, r.rid = $rid, r.value = $value, r.cids = r.cids + [x IN $cids WHERE NOT x IN r.cids]
                    ''',
                    user_id=rating["user_id"],
                    rid=rating["rid"],
                    value=rating["value"],
                    cids=rating["cids"]
                )

        # Update Resources: helpful_count and not_helpful_count
        count_helpful_count = tx.run(
            '''
                MATCH p=(a: User)-[r:HAS_RATED {value: 'HELPFUL'}]->(b:Resource {rid: $rid}) 
                RETURN COUNT(r) AS count
            ''',
            rid=rating["rid"]
        ).single()

        count_not_helpful_counter = tx.run(
            '''
                MATCH p=(a: User)-[r:HAS_RATED {value: 'NOT_HELPFUL'}]->(b:Resource {rid: $rid}) 
                RETURN COUNT(r) AS count
            ''',
            rid=rating["rid"]
        ).single()

        resource_has_rated_detail = tx.run(
            '''
                MATCH (a:Resource {rid: $rid})
                SET a.helpful_count = $count_helpful_count, a.not_helpful_count = $count_not_helpful_counter
                RETURN a.helpful_count as helpful_count, a.not_helpful_count as not_helpful_count
            ''',
            rid=rating["rid"],
            count_helpful_count=count_helpful_count["count"],
            count_not_helpful_counter=count_not_helpful_counter["count"]
        ).single()

        """
        resource_has_rated_detail = tx.run(
                '''
                    MATCH (a:Resource {rid: $rid})
                    OPTIONAL MATCH (a)<-[r:HAS_RATED {value: 'HELPFUL'}]-()
                    OPTIONAL MATCH (a)<-[r2:HAS_RATED {value: 'NOT_HELPFUL'}]-()
                    WITH a, COUNT(r) AS helpful_counter, COUNT(r2) AS not_helpful_counter
                    SET a.helpful_count = helpful_counter, a.not_helpful_count = not_helpful_counter
                    RETURN a.helpful_count as helpful_count, a.not_helpful_count as not_helpful_count
                ''',
                rid=rating["rid"]
            ).single()
        

        # create or remove realtion between Resources and Concept_modified
        # helpful_count count < not_helpful_count => delete relationship
        if rating["value"] == "HELPFUL":
            for cid in rating["cids"]:
                self.update_rs_btw_resource_and_cm(rid=rating["rid"], cid=cid, action=True)
        else:
            resource = tx.run(
                        '''
                            MATCH (n:Resource) 
                            WHERE n.rid = $rid
                            RETURN  COALESCE(toInteger(n.helpful_count), 0) AS helpful_count,
                                    COALESCE(toInteger(n.not_helpful_count), 0) AS not_helpful_count
                        ''',
                        rid=rating["rid"]
                    ).single()
            if resource["helpful_count"] < resource["not_helpful_count"]:
                self.update_rs_btw_resource_and_cm(rid=rating["rid"], cid=cid, action=False)
        """

        return {
                    "voted": rating["value"],
                    "helpful_count": resource_has_rated_detail["helpful_count"],
                    "not_helpful_count": resource_has_rated_detail["not_helpful_count"],
                }

    def update_rs_btw_resource_and_cm(self, rid: str, cid: str, action=True):
        '''
            Update by: Create and Delete Relationship
            between Resource and Concept_modified
            concepts: Concept list
            cid: cid (from concepts)
            action: True (create) | False (delete)
        '''
        # logger.info("Updating Relationship between Resource and Concept_modified")
        # print(rid, cid)
        try:
            tx = self.driver.session()
            if action:
                tx.run(
                    '''
                        MATCH (u:Resource {rid: $rid}), (a:Concept_modified {cid: $cid})
                        MERGE (u)-[r:BASED_ON]->(a)
                        RETURN r
                    ''',
                    rid=rid,
                    cid=cid
                )
            else:
                tx.run(
                        '''
                        MATCH (u:Resource {rid: $rid})-[r:BASED_ON]->(a:Concept_modified {cid: $cid})
                        DELETE r
                        ''',
                        rid=rid,
                        cid=cid
                    )
        except Exception as e:
            print("update_rs_btw_resource_and_cm: Issue on this function either with rid or cid is None value")
            print(e)
            pass

    def user_saves_or_removes_resource(self, data: dict, resource: dict):
        '''
            User saves or remove Resource(s)
            data: {
                "user_id": "vhf",
                "mid": "dsdsd",
                "slider_number": "slide_1",
                "cid": "rewtg423",
                "rid": "2gdsg",
                "status": True (create) | False (remove) => (to create or remove a resource saved from the user list)
            }
        '''
        logger.info("Saving or Removing from Resource Saved List")
        result = {"msg": ""}
        tx = self.driver.session()

        if data["status"] == True:
            tx.run(
                    '''
                        MATCH (a:User {uid: $user_id}), (b:Resource {rid: $rid})
                        MERGE (a)-[r:HAS_SAVED {user_id: $user_id, rid: $rid}]->(b)
                    ''',
                    user_id=data["user_id"],
                    rid=data["rid"]
                )
            result["msg"] = "saved"
            
        else:
            tx.run(
                    '''
                        MATCH (a:User {uid: $user_id})-[r:HAS_SAVED {user_id: $user_id, rid: $rid}]->(b:Resource {rid: $rid})
                        DELETE r
                    ''',
                    user_id=data["user_id"],
                    rid=data["rid"]
                )
            result["msg"] = "removed"
        
        # Update Resources: saves_count
        tx.run(
            '''
                MATCH (a:Resource {rid: $rid})
                OPTIONAL MATCH (a)<-[r:HAS_SAVED {rid: $rid}]-()
                WITH a, COUNT(r) AS saves_counter
                SET a.saves_count = saves_counter
            ''',
            rid=data["rid"]
        )
        logger.info("Saving or Removing from Resource Saved List: Done")

        """
        # create or remove realtion between Resources and Concept_modified
        if data["status"] == True:
            self.update_rs_btw_resource_and_cm(rid=data["rid"], cid=data["rid"], action=True)
        
        else:
            resource = tx.run(
                        '''
                            MATCH (n:Resource) 
                            WHERE n.rid = $rid
                            RETURN COALESCE(toInteger(n.saves_count), 0) AS saves_count
                        ''',
                        rid=data["rid"]
                    ).single()
            if resource["saves_count"] < resource["saves_count"]:
                self.update_rs_btw_resource_and_cm(rid=data["rid"], cid=data["rid"], action=False)
        """
        
        return result

    def store_resources(self, resources_dict: dict, cid: str, recommendation_type="", resources_list: list=None, resources_form="dict"):
        '''
            Store Resources
            Create relationshop between Resource and Concept_modified
            resources_dict: {"articles": [], "vidoes": []}
            cid: str
            recommendation_type: str ('1' | '2' | '3' | '4')
            algorithm_model: (str) which algorithm was used for the recommendation
            content_type: video | article # currently not usued
            resources_form: dict | list
        '''

        def get_resource_primary_key(resource: dict):
            return resource["rid"] if "rid" in resource else resource["id"]
            
        logger.info("Store Resources: Videos | Articles")
        result = []

        tx = self.driver.session()
        if resources_form == "dict":
            for key, resources in resources_dict.items():
                if key == "videos":
                    
                    if len(resources) > 0:
                        logger.info(f"Creating Resources YouTube AND Updating Relationship between Resource and Concept_modified: {len(resources)} Resources")
                        for resource in resources:
                            self.create_or_update_video_resource(tx, resource, recommendation_type)
                            rid=get_resource_primary_key(resource)
                            self.update_rs_btw_resource_and_cm(rid=rid, cid=cid, action=True)

                elif key == "articles":

                    if len(resources) > 0:
                        logger.info(f"Creating Resources Article AND Updating Relationship between Resource and Concept_modified {len(resources)} Resources")
                        for resource in resources:
                            self.create_or_update_wikipedia_resource(tx, resource, recommendation_type)
                            rid=get_resource_primary_key(resource)
                            self.update_rs_btw_resource_and_cm(rid=rid, cid=cid, action=True)
        
        elif resources_form == "list":
            for resource in resources_list:
                if "Video" in resource["labels"]:
                    self.create_or_update_video_resource(tx, resource, update_embedding_values=True)
                elif "Article" in resource["labels"]:
                    self.create_or_update_wikipedia_resource(tx, resource, update_embedding_values=True)

    def retrieve_resources(self, concepts: dict, embedding_values=False):
        '''
            Getting List of Resources connected to Concept_modified
            algorithm_model: (str) which algorithm was used for the recommendation
            query_form: 
        '''
        def resource_replace_none_value(value):
            if value == None:
                return 0
            return int(value)
        
        # logger.info("Getting List of Resources Containing Concept_modified")

        if embedding_values == True:
            query = '''
                    MATCH p=(a:Resource)-[r:BASED_ON]->(b:Concept_modified)
                    WHERE b.cid IN $cids
                    RETURN  DISTINCT LABELS(a) as labels, ID(a) as id, a.rid as rid, a.title as title, a.text as text,
                            a.thumbnail as thumbnail, a.abstract as abstract, a.post_date as post_date, 
                            a.author_image_url as author_image_url, a.author_name as author_name,
                            a.keyphrases as keyphrases, a.description as description, a.description_full as description_full,
                            a.publish_time as publish_time, a.uri as uri, a.duration as duration,
                            COALESCE(toInteger(a.views), 0) AS views,
                            COALESCE(toFloat(a.similarity_score), 0.0) AS similarity_score,
                            COALESCE(toInteger(a.helpful_count), 0) AS helpful_count,
                            COALESCE(toInteger(a.not_helpful_count), 0) AS not_helpful_count,
                            COALESCE(toInteger(a.bookmarked_count), 0) AS bookmarked_count,
                            COALESCE(toInteger(a.like_count), 0) AS like_count,
                            a.channel_title as channel_title,
                            a.updated_at as updated_at,
                            a.keyphrase_embedding as keyphrase_embedding,
                            a.document_embedding as document_embedding

                '''
        else:
            query = '''
                    MATCH p=(a:Resource)-[r:BASED_ON]->(b:Concept_modified)
                    WHERE b.cid IN $cids
                    RETURN  DISTINCT LABELS(a) as labels, ID(a) as id, a.rid as rid, a.title as title, a.text as text,
                            a.thumbnail as thumbnail, a.abstract as abstract, a.post_date as post_date, 
                            a.author_image_url as author_image_url, a.author_name as author_name,
                            a.keyphrases as keyphrases, a.description as description, a.description_full as description_full,
                            a.publish_time as publish_time, a.uri as uri, a.duration as duration,
                            COALESCE(toInteger(a.views), 0) AS views,
                            COALESCE(toFloat(a.similarity_score), 0.0) AS similarity_score,
                            COALESCE(toInteger(a.helpful_count), 0) AS helpful_count,
                            COALESCE(toInteger(a.not_helpful_count), 0) AS not_helpful_count,
                            COALESCE(toInteger(a.bookmarked_count), 0) AS bookmarked_count,
                            COALESCE(toInteger(a.like_count), 0) AS like_count,
                            a.channel_title as channel_title,
                            a.updated_at as updated_at
                '''

        result = []
        cids = [node["cid"] for node in concepts]
        with self.driver.session() as session:
            result = session.run(
                query,
                cids=cids
            ).data()
            result = self.resources_wrapper_from_query(data=result)
        return result

    def resources_wrapper_from_query(self, data: list):
        resources = []
        if data:
            for resource in data:
                # print([key for key, value in result[0].items() ])
                r = {
                    "id": resource["id"],
                    "title": resource["title"],
                    "rid": resource["rid"],
                    "uri": resource["uri"],
                    "helpful_count": resource["helpful_count"], # int(resource["helpful_count"]),
                    "not_helpful_count": resource["not_helpful_count"], # int(resource["not_helpful_count"]),
                    "labels": resource["labels"],
                    "similarity_score": resource["similarity_score"], # float(resource["similarity_score"]),
                    "keyphrases": resource["keyphrases"],
                    "text": resource["text"],
                    "bookmarked_count": resource["bookmarked_count"],
                    "updated_at": resource["updated_at"],
                    "keyphrase_embedding": resource["keyphrase_embedding"].strip("[]").replace("'", "").split(',') if "keyphrase_embedding" in resource and len(resource["keyphrase_embedding"]) > 5 else [],
                    "document_embedding": resource["document_embedding"].strip("[]").replace("'", "").split(',') if "document_embedding" in resource and len(resource["document_embedding"]) > 5 else [],
                    # "keyphrase_embedding": [float(value.strip()) for value in resource["keyphrase_embedding"].strip("[]").replace("'", "").split(',')] if "keyphrase_embedding" in resource and len(resource["keyphrase_embedding"]) > 5 else [],
                    # "document_embedding": [float(value.strip()) for value in resource["document_embedding"].strip("[]").replace("'", "").split(',')] if "document_embedding" in resource and len(resource["document_embedding"]) > 5  else []
                    "is_bookmarked_fill": resource["is_bookmarked_fill"] if "is_bookmarked_fill" in resource else False
                }

                if "Video" in r["labels"]:
                    r["description"] = resource["description"]
                    r["description_full"] = resource["description_full"]
                    r["thumbnail"] = resource["thumbnail"]
                    r["duration"] = resource["duration"]
                    r["views"] = resource["views"] # int(resource["views"])
                    r["publish_time"] = resource["publish_time"]
                    r["like_count"] = resource["like_count"]
                    r["channel_title"] = resource["channel_title"]

                elif "Article" in r["labels"]:
                    r["abstract"] = resource["abstract"]

                resources.append(r)
        return resources

    def update_resource_action(self, resource: dict, action=False):
        '''
            Save or Update Resource Node from Ne4j
            resource: resource detail
            action: True (adding new resource) | 
                    False (update the resource by attributes such as: similarity_score, views, like_count, channel_title)
        '''

        tx = self.driver.session()
        if action:
            if "Video" in resource["labels"]:
                create_video_resource(tx=tx, node=resource)
            elif "Article" in resource["labels"]:
                create_wikipedia_resource(tx=tx, node=resource)
        else:
            # update
            pass
    
    def filter_user_resources_saved_by(self, data: dict):
        '''
            Getting User Resources Saved
            Filtering by: user_id, cid: concept cid, mid: learning material and slide_number: silder number
            data: {
                user_id: 'assad83'
                content_type: 'video | article',
                text: 'neo4j node'
            }
            is_bookmarked_fill: default value: True because these resources belong to the user_id given
        '''
        logger.info("Filtering User Resources Saved")
        result = { "articles": [], "videos": [] }

        with self.driver.session() as session:
            nodes = session.run(
                """
                MATCH p=(b: User)-[r:HAS_SAVED {user_id: $user_id}]->(a:Resource) 
                WHERE   toLower(a.text) CONTAINS toLower($search_text) OR
                        ANY(keyphrase IN a.keyphrases WHERE keyphrase CONTAINS toLower($search_text))
                RETURN  DISTINCT LABELS(a) as labels, ID(a) as id, a.rid as rid, a.title as title, a.text as text,
                        a.thumbnail as thumbnail, a.abstract as abstract, a.post_date as post_date, 
                        a.author_image_url as author_image_url, a.author_name as author_name,
                        a.keyphrases as keyphrases, a.description as description, a.description_full as description_full,
                        a.publish_time as publish_time, a.uri as uri, a.duration as duration,
                        COALESCE(toInteger(a.views), 0) AS views,
                        COALESCE(toFloat(a.similarity_score), 0.0) AS similarity_score,
                        COALESCE(toInteger(a.helpful_count), 0) AS helpful_count,
                        COALESCE(toInteger(a.not_helpful_count), 0) AS not_helpful_count,
                        COALESCE(toInteger(a.bookmarked_count), 0) AS bookmarked_count,
                        COALESCE(toInteger(a.like_count), 0) AS like_count,
                        a.channel_title as channel_title,
                        a.updated_at as updated_at,
                        true AS is_bookmarked_fill
                """,
                user_id=data["user_id"],
                search_text=data["text"]
            ).data()
            resources = self.resources_wrapper_from_query(data=nodes)

            if len(resources) > 0:
                if data["content_type"] == "video":
                    result["videos"] = [resource for resource in resources if "Video" in resource["labels"]]
                elif data["content_type"] == "article":
                    result["articles"] = [resource for resource in resources if "Article" in resource["labels"]]
                else:
                    result = {   
                                "articles": [resource for resource in resources if "Article" in resource["labels"]],
                                "videos": [resource for resource in resources if "Video" in resource["labels"]]
                            }
        return result

    def get_rids_from_user_saves(self, user_id: str):
        '''
            Getting rids from User Resources Saved
        '''
        logger.info("Getting rids from User Resources Saved")
        nodes = []
        with self.driver.session() as session:
            nodes = session.run(
                '''
                    MATCH (b:User)-[r:HAS_SAVED {user_id: $user_id}]->(a:Resource)
                    RETURN a.rid as rid
                ''',
                user_id=user_id
            ).data()
            nodes = [node["rid"] for node in nodes]
        return nodes






    def user_saves_or_removes_resource2(self, data: dict, resource: dict):
        '''
            User saves or remove Resource(s)
            data: {
                "user_id": "vhf",
                "mid": "dsdsd",
                "slider_number": "slide_1",
                "cid": "rewtg423",
                "rid": "2gdsg",
                "status": True (create) | False (remove) => (to create or remove a resource saved from the user list)
            }
        '''
        logger.info("Saving or Removing from Resource Saved List")
        tx = self.driver.session()

        if data["status"] == True:
            tx.run(
                    '''
                        MATCH (a:User {uid: $user_id}), (b:Resource {rid: $rid})
                        MERGE (a)-[r:HAS_SAVED {user_id: $user_id, mid: $mid, slider_number: $slider_number, rid: $rid}]->(b)
                    ''',
                    user_id=data["user_id"],
                    mid=data["mid"],
                    slider_number=data["slider_number"],
                    # cid=data["cid"],
                    rid=data["rid"]
                )
            
        else:
            tx.run(
                    '''
                        MATCH (a:User {uid: $user_id})-[r:HAS_SAVED {user_id: $user_id, mid: $mid, slider_number: $slider_number, rid: $rid}]->(b:Resource {rid: $rid})
                        DELETE r
                    ''',
                    user_id=data["user_id"],
                    mid=data["mid"],
                    slider_number=data["slider_number"],
                    # cid=data["cid"],
                    rid=data["rid"]
                )
        
        # Update Resources: saves_count
        tx.run(
            '''
                MATCH (a:Resource {rid: $rid})
                OPTIONAL MATCH (a)<-[r:HAS_SAVED {rid: $rid}]-()
                WITH a, COUNT(r) AS saves_counter
                SET a.saves_count = saves_counter
            ''',
            rid=data["rid"]
        )

        """
        # create or remove realtion between Resources and Concept_modified
        if data["status"] == True:
            self.update_rs_btw_resource_and_cm(rid=data["rid"], cid=data["rid"], action=True)
        
        else:
            resource = tx.run(
                        '''
                            MATCH (n:Resource) 
                            WHERE n.rid = $rid
                            RETURN COALESCE(toInteger(n.saves_count), 0) AS saves_count
                        ''',
                        rid=data["rid"]
                    ).single()
            if resource["saves_count"] < resource["saves_count"]:
                self.update_rs_btw_resource_and_cm(rid=data["rid"], cid=data["rid"], action=False)
        """

    def get_concepts_mids_sliders_numbers_for_user_resources_saved(self, data: dict):
        '''
            Getting Parms Data to Filtering User Resource Saved: Concepts, learning material and Slider Numbers
            By filtering using: cids, cids and mids
            data: {
                "user_id": "65e0536db1effed771dbdbb9",
                "cids": ['2156985142238936538', '7075428280044039726'],
                "mids": ["6662201fec6bb9067ff71cc9"],
                "slider_numbers": []
            }
        '''

        logger.info("Getting Parms Data to Filtering User Resource Saved")
        result = {
            "cids": [],
            "mids": [],
            "slider_numbers": []
        }
        
        # check if query params have keys (cids, mids, slider_numbers)
        if "cids" not in data:
            data["cids"] = []
        if "mids" not in data:
            data["mids"] = []
        if "slide_numbers" not in data:
            data["slide_numbers"] = []

        with self.driver.session() as session:
            if len(data["cids"]) == 0 and len(data["mids"]) == 0 and len(data["slide_numbers"]) == 0:
                nodes = session.run(
                    '''
                        MATCH   (a:User)-[r:HAS_SAVED]->(b:Resource)
                                -[r2:BASED_ON]->(c:Concept_modified),
                                (d:Concept)
                        WHERE   r.user_id = $user_id AND
                                c.cid = d.cid
                        RETURN DISTINCT d.cid as cid, d.name as name
                    ''',
                    user_id=data["user_id"]
                ).data()
                result["cids"] = [ {"cid": node["cid"], "name": node["name"] } for node in nodes ]

            # filtering with: cids
            if len(data["cids"]) > 0 and len(data["mids"]) == 0 and len(data["slide_numbers"]) == 0:
                nodes = session.run(
                    '''
                    MATCH   (a:User)-[r:HAS_SAVED]->(b:Resource)
                            -[r2:BASED_ON]->(c:Concept_modified),
                            (d:Concept),
                            (e:Slide)-[r3:BELONGS_TO]->(f:LearningMaterial)
                    WHERE   r.user_id = $user_id AND
                            r.cid IN $cids
                    RETURN DISTINCT f.mid as mid, f.name as name
                    ''',
                    user_id=data["user_id"],
                    cids=data["cids"]
                ).data()
                result["mids"] = [ {"mid": node["mid"], "name": node["name"] } for node in nodes ]

            # filtering with: cids and mids
            if len(data["cids"]) > 0 and len(data["mids"]) > 0: #  and len(data["slide_numbers"]) == 0:
                nodes = session.run(
                    '''
                        MATCH   (a:User)-[r:HAS_SAVED]->(b:Resource)
                                -[r2:BASED_ON]->(c:Concept_modified),
                                (e:Slide)-[r3:CONTAINS]->(d:Concept),
                                (e:Slide)-[r4:BELONGS_TO]->(f:LearningMaterial)
                        WHERE   r.user_id = $user_id AND
                                r.cid IN $cids AND
                                r.mid IN $mids
                        RETURN DISTINCT e.name as name
                        ORDER BY name
                    ''',
                    user_id=data["user_id"],
                    cids=data["cids"],
                    mids=data["mids"]
                ).data()
                result["slider_numbers"] = [ {"name": node["name"] } for node in nodes ]

            return result

    def filter_user_resources_saved_by2(self, data: dict):
        '''
            Getting User Resources Saved
            By filtering using: user_id, cid: concept cid, mid: learning material and slide_number: silder number
            data: {
                "user_id": "65e0536db1effed771dbdbb9",
                "cids": ["2156985142238936538", "3328549365608809871"],
                "mids": ["6662201fec6bb9067ff71cc9"],
                "slide_numbers": ["slide_1"]
            }
        '''
        logger.info("Filtering User Resources Saved")

        result = []
        nodes = []
        with self.driver.session() as session:
            resource_query_form = """
                            RETURN  DISTINCT LABELS(b) as labels, ID(b) as id, b.rid as rid, b.title as title, b.text as text,
                                b.thumbnail as thumbnail, b.abstract as abstract, b.post_date as post_date, 
                                b.author_image_url as author_image_url, b.author_name as author_name,
                                b.keyphrases as keyphrases, b.description as description, b.description_full as description_full,
                                b.publish_time as publish_time, b.uri as uri, b.duration as duration,
                                COALESCE(toInteger(b.views), 0) AS views,
                                COALESCE(toFloat(b.similarity_score), 0.0) AS similarity_score,
                                COALESCE(toInteger(b.helpful_count), 0) AS helpful_count,
                                COALESCE(toInteger(b.not_helpful_count), 0) AS not_helpful_count,
                                COALESCE(toInteger(b.bookmarked_count), 0) AS bookmarked_count,
                                COALESCE(toInteger(b.like_count), 0) AS like_count,
                                b.channel_title as channel_title
                            """

            # filtering with: cids
            if len(data["cids"]) > 0 and len(data["mids"]) == 0 and len(data["slide_numbers"]) == 0:
                nodes = session.run(
                    f"""
                        MATCH (a:User)-[r:HAS_SAVED]->(b:Resource)
                        WHERE   r.user_id = $user_id AND
                                r.cid IN $cids
                        {resource_query_form}
                    """,
                    user_id=data["user_id"],
                    cids=data["cids"]
                ).data()

            # filtering with: cids and mids
            if len(data["cids"]) > 0 and len(data["mids"]) > 0 and len(data["slide_numbers"]) == 0:
                nodes = session.run(
                    f"""
                        MATCH (a:User)-[r:HAS_SAVED]->(b:Resource)
                        WHERE   r.user_id = $user_id AND
                                r.cid IN $cids AND
                                r.mid IN $mids
                        {resource_query_form}
                    """,
                    user_id=data["user_id"],
                    cids=data["cids"],
                    mids=data["mids"]
                ).data()

            # filtering with: cids, mids and silder_numbers
            if len(data["cids"]) > 0 and len(data["mids"]) > 0 and len(data["slide_numbers"]) > 0:
                nodes = session.run(
                    f"""
                        MATCH (a:User)-[r:HAS_SAVED]->(b:Resource)
                        WHERE   r.user_id = $user_id AND
                                r.cid IN $cids AND
                                r.mid IN $mids AND
                                r.slide_number IN $slide_numbers
                        {resource_query_form}
                    """,
                    user_id=data["user_id"],
                    cids=data["cids"],
                    mids=data["mids"],
                    slide_numbers=data["slide_numbers"]
                ).data()

            result = self.resources_wrapper_from_query(data=nodes)
        return result
    
    """
    def edit_relationship_btw_concepts_and_resources(self, concepts_cro: list, resources: list):
    self.db.edit_relationship_btw_concepts_and_resources(concepts_cro=concepts_cro, 
                                                                resources=resources,
                                                                old_relationship=True
                                                                )

    def edit_relationship_btw_concepts_and_resources(self, concepts: list, resources: list, old_relationship=True):
        '''
            update (create or remove) relationship btw Resource and Concept_modified
            whether the list of result still contain the Resource
            returned by the algorithm
        '''
        logger.info("Editing Relationship between Resource and Concept_modified")

        if old_relationship:
            self.remove_relation_btw_resource_and_concepts(concepts=concepts)

        resources_ids = [node["node_id"] for node in resources]
        cids = [node["node_id"] for node in concepts]
        with self.driver.session() as session:
            session.run(
                '''
                    MATCH (a:Resource),(b:Concept_modified)
                    WHERE ID(a) IN $resources_ids AND ID(b) IN $cids
                    MERGE (a)-[r:BASED_ON]->(b)
                    RETURN r
                ''',
                resources_ids=resources_ids,
                cids=cids
            )

    def remove_relation_btw_resource_and_concepts(self, concepts: list):
        '''
            Remove Relationship between Resource and Concept_modified
        '''

        logger.info("Remove Relationship between Resource and Concept_modified")

        concept_ids = [node["node_id"] for node in concepts]
        with self.driver.session() as session:
            session.run(
                    '''
                            MATCH p=(a:Resource)-[r:BASED_ON]->(b:Concept_modified)
                            WHERE ID(b) IN $concept_ids
                            DELETE r
                    ''',
                    concept_ids=concept_ids
                )


    """
