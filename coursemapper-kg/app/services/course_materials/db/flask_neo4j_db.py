from neo4j import GraphDatabase

class Neo4j:
    def __init__(self):
        self.driver = None

    def init_app(self, config):
        self.neo4j_uri = config.NEO4J_URI  # type: ignore
        self.neo4j_user = config.NEO4J_USER  # type: ignore
        self.neo4j_pass = config.NEO4J_PASSWORD  # type: ignore
        self.connect()

    def connect(self):
        self.driver = GraphDatabase.driver(self.neo4j_uri,
                                           auth=(self.neo4j_user, self.neo4j_pass),
                                           encrypted=False)
        return self.driver

    def get_db(self):
        if not self.driver:
            return self.connect()
        return self.driver

    def check_slide(self, slide_id):
        with self.get_db().session() as session:
            result = session.run(
                'MATCH(s:Slide)  WHERE s.sid = $sid RETURN s',
                sid=slide_id
            ).data()

        return list(result)

    def get_slide(self, slide_id):
        with self.get_db().session() as session:
            result = session.run(
                'MATCH p=(s: Slide)-[r]->(c: Concept) WHERE s.sid = $sid RETURN LABELS(c) as labels,ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract',
                sid=slide_id
            ).data()

        return list(result)

    def check_material(self, material_id):
        with self.get_db().session() as session:
            result = session.run(
                'MATCH (m:LearningMaterial) WHERE m.mid = $mid RETURN m',
                mid=material_id
            ).data()

        return list(result)

    def get_material(self, material_id):
        with self.get_db().session() as session:
            result = session.run(
                'MATCH (c:Concept) WHERE c.mid = $mid RETURN LABELS(c) as labels,ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract, c.rank as rank',
                mid=material_id
            ).data()

        return list(result)

    def get_material_edges(self, material_id):
        with self.get_db().session() as session:
            result = session.run(
                "MATCH p=(a)-[r]->(b) WHERE TYPE(r) <> 'CONTAINS' AND a.mid = $mid AND b.mid = $mid RETURN TYPE(r) as type, ID(a) as source, ID(b) as target, r.weight as weight",
                mid=material_id
            ).data()

        return list(result)

    def get_material_concept_ids(self, material_id):
        with self.get_db().session() as session:
            result = session.run(
                'MATCH (c:Concept) WHERE c.mid = $mid RETURN c.cid AS id, c.name as name',
                mid=material_id
            ).data()

        return list(result)

    def get_higher_levels_nodes(self, material_ids):
        # f"""MATCH (c:Concept) WHERE (c.mid = "{'" or c.mid = "'.join(material_ids)}") and c.rank<51 and c.type="annotation" RETURN LABELS(c) as labels,ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract, c.rank as rank, c.mid as mid"""
        with self.get_db().session() as session:
            result = session.run(
                """MATCH (c:Concept) WHERE (c.mid IN $mids) and c.rank<51 and c.type="annotation" RETURN LABELS(c) as labels,ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract, c.rank as rank, c.mid as mid""",
                mids=material_ids
            ).data()

        return list(result)

    def get_higher_levels_edges(self, material_ids):
        # f"""MATCH p=(a)-[r]->(b) WHERE TYPE(r) <> "CONTAINS" and (${" or ".join(['(a.mid = "'+id+'" and b.mid = "'+id+'")' for id in material_ids])}) and a.rank<51 and b.rank<51 RETURN TYPE(r) as type, ID(a) as source, ID(b) as target, r.weight as weight"""
        with self.get_db().session() as session:
            result = session.run(
                f"""MATCH p=(a)-[r]->(b) WHERE TYPE(r) <> "CONTAINS" and a.mid = b.mid AND a.min IN $mids and a.rank<51 and b.rank<51 RETURN TYPE(r) as type, ID(a) as source, ID(b) as target, r.weight as weight""",
                mids=material_ids
            ).data()

        return list(result)


    # boby024
    def cro_get_concepts_by_mid(self, mid):
        with self.get_db().session() as session:
            result = session.run(
                """
                MATCH (c:Concept) WHERE c.mid = $mid 
                RETURN c.cid as cid, c.name AS name, c.weight as weight, 
                c.rank as rank, c.mid as mid
                """,
                mid=mid
            ).data()

        return list(result)
    
    def cro_get_concepts_by_slide_id(self, slide_id: str):
        with self.get_db().session() as session:
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

    def cro_save_croform(user_id: str, mid: str, crfom: dict):
        pass

    # def cro_get_concepts_by_user_id_and_mid(self, user_id, mid):
    #     with self.get_db().session() as session:
    #         result = session.run(
    #             """
    #             MATCH (u:User)-[:dnu]->(c:Concept)
    #             WHERE u.uid = $user_id AND c.mid = $mid
    #             RETURN c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, 
    #             c.wikipedia as wikipedia, c.abstract as abstract, c.rank as rank, c.mid as mid
    #             """,
    #             user_id=user_id, mid=mid
    #         ).data()

    #     return list(result)
    
    # def get_concepts_by_cids(self, cids):
    #     print("cids", cids)

    #     with self.get_db().session() as session:
    #         result = session.run(
    #             """MATCH (c: Concept) WHERE ANY (c IN c.cid WHERE c IN $cids) RETURN c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract""",
    #             cids=cids
    #         ).data()
        
    #         print("result ->", result)

    #    return list(result)
    