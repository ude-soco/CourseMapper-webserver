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
        not_helpful_count: $not_helpful_count})""",
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
        not_helpful_count=0)


def create_wikipedia_resource(tx, node, recommendation_type=''):
    """
    """
    logger.info(
        "Creating wikipedia resource '%s'" % node["id"])
    tx.run(
        """MERGE (c:Resource:Article {rid: $rid, uri: $uri, 
        title: $title, abstract:$abstract, keyphrases: $keyphrases, text: $text, document_embedding: $document_embedding, 
        keyphrase_embedding: $keyphrase_embedding, similarity_score: $similarity_score, helpful_count: $helpful_count, 
        not_helpful_count: $not_helpful_count})""",
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
        not_helpful_count=0)


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
        SET b.similarity_score = $similarity_score
        RETURN b
        """, rid=resource["id"],
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

#1
def create_lr_relationships(tx, mid, node):
    """
    """
    # logger.info(
    #     "Creating concepts relationships to learning material '%s'" % mid)
    # MERGE (m)-[r:CONTAINS {weight: $weight}]->(c)""",
    tx.run("""MATCH (m:LearningMaterial) WHERE m.mid = $mid 
            OPTIONAL MATCH (c:Concept) WHERE c.cid = $cid and c.mid = $mid
            MERGE (m)-[r:LM_CONSISTS_OF {weight: $weight}]->(c)""",
           weight=node["weight"],
           cid=node["id"],
           mid=mid)

#2
def create_slide_concept_relationships(tx, sid, node):
    """
    """
    # logger.info(
    #     "Creating slide relationships to concepts '%s'" % node["id"])
    tx.run("""MATCH (s:Slide) WHERE s.sid = $sid 
            OPTIONAL MATCH (c:Concept) WHERE c.cid = $cid and c.mid = $mid
            MERGE (s)-[r:CONSISTS_OF {weight: $weight}]->(c)""",
           sid=sid,
           cid=node["id"],
           mid=node["mid"],
           weight=node["slide_weight"])

#3
def create_lm_slide_relationships(tx, mid, sid):
    """
    """
    logger.info(
        "Creating learning material relationships to slide '%s'" % sid)
    tx.run("""MATCH (s:Slide) WHERE s.sid = $sid
            OPTIONAL MATCH (m:LearningMaterial) WHERE m.mid = $mid 
            MERGE (m)-[r:CONTAINS]->(s)""",
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
        uid=uid).data()

    return list(result)


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

#4
def retrieve_relationships(tx, mid):
    """
    """
    logger.info("Geting the relationships of learning material '%s'" % mid)
    result = tx.run("""
        MATCH p=(a)-[r]->(b) 
        WHERE TYPE(r) <> 'LM_CONSISTS_OF'
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

# MUSNT BE WEIGHT = 0
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
            WHERE TYPE(r) <> 'LM_CONSISTS_OF'
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
            MATCH p=(a:Slide)-[r:CONSISTS_OF]->(b:LearningMaterial)
            WHERE a.mid = $mid 
            AND b.mid = $mid 
            RETURN TYPE(r) as type, ID(a) as source, ID(b) as target""",
                      mid=mid)
        rel2 = tx.run("""
            MATCH p=(a)-[r]->(b) 
            WHERE NOT EXISTS {MATCH (a:Slide)-[r:CONSISTS_OF]->(b:LearningMaterial)}
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
            if node["type"] == "related_concept":
                result = session.run(
                    "MATCH (c:Concept) WHERE c.name = $name and c.mid=$mid RETURN c",
                    name=node["name"],
                    mid=node["mid"])
            elif node["type"] == "category":
                result = session.run(
                    "MATCH (c:Concept) WHERE c.cid = $cid RETURN c",
                    cid=node["id"])
            elif node["type"] == "main_concept":
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
# to be changed
    def get_top_n_concept_by_name(self, name):
        """
        """
        with self.driver.session() as session:
            logger.info("Get concept id for '%s'" % name)
            concepts = session.run(
                """MATCH p=(s: Slide)-[r: CONSISTS_OF]->(c: Concept) 
                WHERE c.name = $name RETURN ID(c) as id, c.cid as cid, c.name as name, c.weight as weight""",
                name=name).data()

        return concepts
# to be changed
    def retrieve_lm_concepts(self, mid):
        """
        """
        with self.driver.session() as session:
            print("Getting the concepts of slide '%s'" % mid)
        concepts = session.run(
            """MATCH p=(s: LearningMaterial)-[r: LM_CONSISTS_OF]->(c: Concept) WHERE s.mid = $mid RETURN c.cid as cid, c.name AS name""",
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
# why not final embeddings
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
                    WHERE NOT EXISTS {MATCH (n:Concept)-[r:HAS_CATEGORY]->(c:Concept)}
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
                WHERE n.mid = $mid and n.type="main_concept"
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
                                        OPTIONAL MATCH p=(n)-[r:HAS_CATEGORY]->(m)
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


# to be changed
    def find_concept_for_each_slide(self, mid, name):
        logger.info("find concept from %s" % name)
        with self.driver.session() as session:
            nodes = session.run("""MATCH p=(s:Slide)-[r:CONSISTS_OF]->(n:Concept) 
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
        logger.info(concepts)

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
                logger.info("data complmemet",data)
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
# to be changed
    def get_concepts_of_LM(self, mid):
        with self.driver.session() as session:
            concept_list = session.run(
                """MATCH p=(l:LearningMaterial)-[r:LM_CONSISTS_OF]->(n:Concept) where l.mid =$mid RETURN n.name as name""",
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
        session.close()
