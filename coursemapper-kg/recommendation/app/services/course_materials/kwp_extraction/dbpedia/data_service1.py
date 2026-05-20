from ...conceptrecommentation.recommendation import Recommendation
from ...conceptrecommentation.sequence_recommendation import Sequence_recommendation
from ..dbpedia.concept_tagging import DBpediaSpotlight
from ...db.neo4_db import NeoDataBase
from ...explanation.explanation_generator import ExplanationGenerator
import time
import os

import logging
from log import LOG
from config import Config

logger = LOG(name=__name__, level=logging.DEBUG)

ALLOWED_EXTENSIONS = {"pdf"}


class RecService:
    def __init__(self):
        # NEO4J_URI = os.environ.get('NEO4J_URI')
        # # NEO4J_URI = "bolt://localhost:7687"
        # NEO4J_USER = os.environ.get('NEO4J_USER')
        # # NEO4J_USER = "neo4j"
        # NEO4J_PASSWORD = os.environ.get('NEO4J_PW')
        # # NEO4J_PASSWORD = "root"
        # self.db = NeoDataBase(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
        neo4j_uri = Config.NEO4J_URI
        neo4j_user = Config.NEO4J_USER
        neo4j_pass = Config.NEO4J_PASSWORD

        self.db = NeoDataBase(neo4j_uri, neo4j_user, neo4j_pass)

        self.recommendation = Recommendation()
        self.sequence_recommendation = Sequence_recommendation()
        self.dbpedia = DBpediaSpotlight()
        self.explanation_generator = ExplanationGenerator()

    def _construct_user(self, user_id, non_understood, understood, new_concepts, mid):
        self.db.construct_user_model(
            user_id, non_understood, understood, new_concepts, mid
        )

    def _extract_vector_relation(self, mid):
        self.db.extract_vector_relation(mid)

    def _set_user_concept_relationship(self, concept_id, user_id, relation_type):
        self.db.get_or_create_user_concept_relationship(
            concept_id, user_id, relation_type
        )

    def _get_concept_recommendation(self, user_id, mid):
        # Get concepts that doesn't interact with user
        concept_list = self.db.get_concept_has_not_read(user_id, mid)
        user = self.db.get_user(user_id)
        # compute the similarity between user and concepts with cos-similarity and select top-5 recommendation concept
        recommend_concepts = self.recommendation.recommend(concept_list, user, top_n=5)
        for i in recommend_concepts:
            info = i["n"]["name"] + " : " + str(i["n"]["score"])
            # logger.info(info)

        # Use paths for interpretability
        # recommend_concepts = self._get_road(recommend_concepts, user_id, mid)
        recommend_concepts = self._get_explanation_roads(recommend_concepts, user_id)
        resp = get_serialized_concepts_data(recommend_concepts)
        return resp

    def _get_concept_sequence_recommendation(self, user_id, mid):
        # Get concepts that doesn't interact with user
        # only related to candidate concept
        # concept_list = self.db.get_concept_has_not_read(user_id, mid)

        #only sequence recommendation candidate concept set
        sequence_concept_list = self.db.get_prerequisite_concept_has_not_read(user_id, mid)

        # get user ids
        user = self.db.get_user(user_id)

        # compute the similarity between user and concepts with cos-similarity and select top-5 recommendation concept
        # recommend_concepts = self.recommendation.recommend(concept_list, user, top_n=5)
        # for i in recommend_concepts:
        #     info = i["n"]["name"] + " : " + str(i["n"]["score"])
        #     logger.info(info)
        # Use paths for interpretability
        # recommend_concepts = self._get_road(recommend_concepts, user_id, mid)
        # get related to top-5 recommended concept and interpretability path
        # resp = get_serialized_concepts_data(recommend_concepts)

        #get seqence recommendation
        sequence_path = self.sequence_recommendation.sequence_recommend(sequence_concept_list, user, top_n=10)

        # get explanation
        sequence_path = self._get_sequence_explanation(sequence_path, user_id)
        return sequence_path

    def _get_road(self, recommend_concepts, uid, mid):
        for recommend_concept in recommend_concepts:
            cid = recommend_concept["n"]["cid"]
            ctype = recommend_concept["n"]["type"]
            if ctype == "main_concept":
                # road: user - concept - related concept - concept
                road1 = self.db.get_road_user_c_related_concept(uid, cid)
                # to avoid too many road, select the max weight path
                road1 = self.get_max_weight_path(road1)
                # road: user - concept - category - concept
                road2 = self.db.get_road_user_c_category_concept(uid, cid)
                road2 = self.get_max_weight_path(road2)
                # road: user - concept - slide - concept
                road3 = self.db.get_road_user_c_slide_concept(uid, cid, mid)
                road3 = self.get_max_weight_path(road3)
                # road: user - concept - related concept
                road4 = self.db.get_road_user_concept_relatedconcept(uid, cid)
                road4 = self.get_max_weight_path4(road4)
                roads = road1 + road2 + road3 + road4

            else:
                # road: user - concept - related concept - concept
                road1 = self.db.get_road_user_c_related_concept(uid, cid)
                # to avoid too many road, select the max weight path
                road1 = self.get_max_weight_path(road1)
                # road: user - concept - category - concept
                road2 = self.db.get_road_user_c_category_concept(uid, cid)
                road2 = self.get_max_weight_path(road2)
                # road: user - concept - related concept
                road3 = self.db.get_road_user_concept_relatedconcept(uid, cid)
                road3 = self.get_max_weight_path4(road3)
                roads = road1 + road2 + road3

            # Save these roads to "roads" property
            recommend_concept["n"]["roads"] = roads

        # logger.info("roads: %s" % recommend_concepts[0]["n"]["roads"])
        return recommend_concepts

    def get_max_weight_path(self, road):
        weights, max_weight, names, list = 0, 0, [], []
        for i in range(len(road)):
            # print("len(road)",len(road))
            # print("names",names)
            if road[i]["name"] not in names:
                names.append(road[i]["name"])
        for name in names:
            for i in range(len(road)):
                if road[i]["name"] == name and road[i]["weight"] is not None:
                    weights = road[i]["weight"]
                else:
                    weights = 0
                if max_weight <= weights:
                    max_weight = weights
                    optimum_name = name
            weights = 0
        for i in range(len(road)):
            if road[i]["name"] == optimum_name and max_weight==road[i]["weight"] :
                list.append(road[i])
        return list

    def get_max_weight_path4(self, road):
        weights, max_weight, names, list = 0, 0, [], []
        for i in range(len(road)):
            # print("len(road)",len(road))
            # print("names",names)
            if road[i]["dnu"] not in names:
                names.append(road[i]["dnu"])
        for name in names:
            for i in range(len(road)):
                if road[i]["dnu"] == name:
                    weights = road[i]["weight"]
                if max_weight <= weights:
                    max_weight = weights
                    optimum_name = name
            weights = 0
        for i in range(len(road)):
            if road[i]["dnu"] == optimum_name:
                list.append(road[i])
        return list

    # def get_max_weight_path(self, road):
    #     weights, max_weight, names, list = 0, 0, [], []
    #     for i in range(len(road)):
    #         # print("len(road)",len(road))
    #         # print("names",names)
    #         if road[i]["name"] not in names:
    #             names.append(road[i]["name"])
    #     for name in names:
    #         for i in range(len(road)):
    #             # print("len(road)",len(road))
    #             # print("name",name)
    #             if road[i]["name"] == name:
    #                 weights = weights + road[i]["weight"]
    #         if max_weight <= weights:
    #             max_weight = weights
    #             optimum_name = name
    #         weights = 0
    #     for i in range(len(road)):
    #         if road[i]["name"] == optimum_name:
    #             list.append(road[i])
    #     return list

    # def get_max_weight_path4(self, road):
    #     weights, max_weight, names, list = 0, 0, [], []
    #     for i in range(len(road)):
    #         print("len(road)",len(road))
    #         print("names",names)
    #         if road[i]["dnu"] not in names:
    #             names.append(road[i]["dnu"])
    #     for name in names:
    #         for i in range(len(road)):
    #             if road[i]["dnu"] == name:
    #                 weights = weights + road[i]["weight"]
    #         if max_weight <= weights:
    #             max_weight = weights
    #             optimum_name = name
    #         weights = 0
    #     for i in range(len(road)):
    #         if road[i]["dnu"] == optimum_name:
    #             list.append(road[i])
    #     return list

    def _get_related_category(self, ids, mid):
        # find these dnu concepts in neo4j
        annotations = self.db.find_concept(ids)
        if annotations != []:
            text = self.db.get_lm_text(mid)
            # get related concepts and categories of concepts user doesn't understand
            nodes = self.dbpedia._get_related_concepts_and_categories(
                annotations=annotations,
                with_category=True,
                with_property=True,
                text=text,
            )
            # create related_concepts, categories and relationships in neo4j
            self.db.create_related_concepts_and_relationships(data=nodes)
            self.db.built_bi_directional_relationships(mid)
            # self._extract_vector_relation(mid)
            # gcn = GCN()
            # gcn.load_data()

    def get_related_category(self, mid, text, annotations, other_concepts):
        # Extract related concepts and categories of top-n main concepts.
        nodes = self.dbpedia._get_related_concepts_and_categories(
            annotations=annotations,
            with_category=True,
            with_property=True,
            text=text,
            other_concepts=other_concepts,
        )
        # creat related concepts, categories and relationships in neo4j
        self.db.create_related_concepts_and_relationships(data=nodes)

    def _get_explanation_roads(self, recommend_concepts, uid):
        cid_list = [rc["n"]["cid"] for rc in recommend_concepts]

        # ExplanationGenerator 内部完成子图提取 + prune + validate + select
        paths_by_cid = self.explanation_generator.generate_for_concept(uid, cid_list)

        # 批量查节点属性
        all_node_ids = set()
        for paths in paths_by_cid.values():
            for path in paths:
                for node in path.get("nodes", []):
                    all_node_ids.add(int(node["id"]))
        node_props = self._get_nodes_by_internal_ids(list(all_node_ids))

        for rc in recommend_concepts:
            cid = rc["n"]["cid"]
            paths = paths_by_cid.get(cid, [])
            rc["n"]["roads"] = self._convert_explanation_to_roads(paths, uid, node_props)

        return recommend_concepts

    def _get_sequence_explanation(self, sequence_output, uid):
        """
        Generate explanations for sequence recommendations:
        Step 1: Per-node explanation subgraphs (via generate_for_concept)
        Step 2: Merge into per-sequence explanation graphs
        Step 3: Per-node: combine all containing sequences' graphs → top-3 + sequence structure
        """
        # Collect all unique cids across all groups
        all_cids = []
        for group in sequence_output.get("nodes", []):
            for item in group.get("data", []):
                all_cids.append(item["cid"])

        if not all_cids:
            return sequence_output

        unique_cids = list(set(all_cids))

        # ── Step 1: Generate per-node explanation subgraphs ──
        # Returns {cid: [validated_path_record, ...]}
        paths_by_cid = self.explanation_generator.generate_for_concept(uid, unique_cids)

        # ── Step 2: Merge into per-sequence explanation graphs ──
        groups = sequence_output.get("nodes", [])
        sequence_graphs = []  # index-aligned with groups
        for group in groups:
            group_cids = [item["cid"] for item in group.get("data", [])]
            merged = []
            seen_keys = set()
            for cid in group_cids:
                for path in paths_by_cid.get(cid, []):
                    key = _path_key(path)
                    if key not in seen_keys:
                        seen_keys.add(key)
                        merged.append(path)
            sequence_graphs.append(merged)

        # Reverse index: cid → list of group indices (a node may appear in multiple sequences)
        cid_to_group_indices = {}
        for gi, group in enumerate(groups):
            for item in group.get("data", []):
                cid_to_group_indices.setdefault(item["cid"], []).append(gi)

        # find PREREQUISITE_TO paths from sequence output directly (no DB read)
        prereq_paths = self._build_prerequisite_paths_from_sequence_output(sequence_output)

        # Gather all internal node ids for explanation path property lookup
        all_node_ids = set()
        for paths in paths_by_cid.values():
            for path in paths:
                for node in path.get("nodes", []):
                    all_node_ids.add(int(node["id"]))
        node_props = self._get_nodes_by_internal_ids(list(all_node_ids))

        # Precompute prereq path cid sets
        prereq_paths_with_cids = []
        for path in prereq_paths:
            path_cids = set()
            for node in path.get("nodes", []):
                cid = node.get("cid")
                if cid:
                    path_cids.add(cid)
            prereq_paths_with_cids.append((path, path_cids))

        # Precompute group cid sets (avoid repeated computation in inner loop)
        group_cid_sets = [
            set(item["cid"] for item in group.get("data", []))
            for group in groups
        ]

        # Build set of direct PREREQUISITE_TO concept pairs for dedup
        prereq_pairs = set()
        for path in prereq_paths:
            nodes = path.get("nodes", [])
            if len(nodes) >= 2:
                cid_a = nodes[0].get("cid", "")
                cid_b = nodes[1].get("cid", "")
                if cid_a and cid_b:
                    prereq_pairs.add((cid_a, cid_b))
                    prereq_pairs.add((cid_b, cid_a))  # bidirectional for overlap filtering

        # ── Step 3: Per-node: union of containing sequences' graphs → top-3 + prereq roads ──
        for gi, group in enumerate(groups):
            items = group.get("data", [])
            concepts = []

            for item in items:
                target_cid = item["cid"]

                # Combine explanation paths from ALL sequences containing this node (deduplicated)
                combined_paths = []
                seen_keys = set()
                for seq_idx in cid_to_group_indices.get(target_cid, []):
                    for path in sequence_graphs[seq_idx]:
                        key = _path_key(path)
                        if key not in seen_keys:
                            seen_keys.add(key)
                            combined_paths.append(path)

                # Select top-3 by average edge weight
                top_paths = self.explanation_generator._select_top_paths(combined_paths, top_k=3)
                roads = self._convert_explanation_to_roads(top_paths, uid, node_props)

                # Filter out explanation roads where adjacent concepts have direct PREREQUISITE_TO
                filtered_roads = []
                for road in roads:
                    p = road["p"]
                    concept_cids = [
                        n.get("cid") for n in p
                        if isinstance(n, dict) and n.get("type") != "user" and n.get("cid")
                    ]
                    has_prereq_overlap = False
                    for j in range(len(concept_cids) - 1):
                        if (concept_cids[j], concept_cids[j + 1]) in prereq_pairs:
                            has_prereq_overlap = True
                            break
                    if not has_prereq_overlap:
                        filtered_roads.append(road)
                roads = filtered_roads


                # Add PREREQUISITE_TO roads from ALL sequences containing this node
                seen_prereq_keys = set()
                for seq_idx in cid_to_group_indices.get(target_cid, []):
                    for p, cids in prereq_paths_with_cids:
                        if target_cid in cids and cids.issubset(group_cid_sets[seq_idx]):
                            key = _path_key(p)
                            if key not in seen_prereq_keys:
                                seen_prereq_keys.add(key)
                                roads.extend(
                                    self._convert_sequence_to_roads([p], node_props)
                                )

                concepts.append({"n": {
                    "name": item.get("name", ""),
                    "cid": item["cid"],
                    "uri": item.get("uri", ""),
                    "type": item.get("type", ""),
                    "wikipedia": item.get("wikipedia", ""),
                    "abstract": item.get("abstract", ""),
                    "score": item.get("score", 0),
                    "roads": roads,
                }})

            serialized = get_serialized_concepts_data(concepts)
            new_data = []
            for entry in serialized.get("nodes", []):
                d = entry["data"]
                d["cid"] = d.pop("id")
                new_data.append(d)
            group["data"] = new_data

        return sequence_output

    def _build_prerequisite_paths_from_sequence_output(self, sequence_output):
        """Build directed prerequisite edges from sequence output.
        Rule: each group [c1, c2, c3] -> c1->c2, c2->c3.
        """
        paths = []
        seen_pairs = set()

        for group in sequence_output.get("nodes", []):
            items = group.get("data", [])
            if len(items) < 2:
                continue

            for i in range(len(items) - 1):
                start = items[i]
                end = items[i + 1]

                start_cid = start.get("cid")
                end_cid = end.get("cid")
                if not start_cid or not end_cid:
                    continue

                pair = (start_cid, end_cid)
                if pair in seen_pairs:
                    continue
                seen_pairs.add(pair)

                paths.append({
                "nodes": [
                {
                "cid": start_cid,
                "name": start.get("name", ""),
                "type": start.get("type", ""),
                "uri": start.get("uri", ""),
                "wikipedia": start.get("wikipedia", ""),
                "abstract": start.get("abstract", ""),
                },
                {
                "cid": end_cid,
                "name": end.get("name", ""),
                "type": end.get("type", ""),
                "uri": end.get("uri", ""),
                "wikipedia": end.get("wikipedia", ""),
                "abstract": end.get("abstract", ""),
                },
                ],
                "edges": [{"type": "PREREQUISITE_TO", "weight": 0.0}],
                "weights": [0.0],
                })

        return paths

    # def _get_prerequisite_paths_between_concepts(self, cid_list):
    #     """Query PREREQUISITE_TO relationships between recommended concepts."""
    #     if len(cid_list) < 2:
    #         return [], set()

    #     with self.db.driver.session() as session:
    #         result = session.run(
    #             """
    #             MATCH (a:Concept)-[r:PREREQUISITE_TO]->(b:Concept)
    #             WHERE a.cid IN $cids AND b.cid IN $cids
    #             RETURN id(a) AS start_id, a.name AS start_name,
    #                 id(b) AS end_id, b.name AS end_name,
    #                 type(r) AS rel_type,
    #                 toFloat(COALESCE(r.weight, r.weighted_weight, 0.0)) AS weight
    #             """,
    #             cids=cid_list,
    #         ).data()

    #     paths = []
    #     node_ids = set()
    #     for record in result:
    #         node_ids.add(record["start_id"])
    #         node_ids.add(record["end_id"])
    #         paths.append({
    #             "nodes": [
    #                 {"id": str(record["start_id"]), "name": record["start_name"]},
    #                 {"id": str(record["end_id"]), "name": record["end_name"]},
    #             ],
    #             "edges": [
    #                 {"type": record["rel_type"], "weight": record["weight"]}
    #             ],
    #             "weights": [record["weight"]],
    #         })

    #     return paths, node_ids

    def _convert_explanation_to_roads(self, paths, uid, node_properties):
        """将验证后的路径转成旧 road["p"] 格式:
        [user_node, "dnu", concept, "EDGE_TYPE", concept, ...]"""
        roads = []
        user_node = {"uid": uid, "type": "user", "name": "user"}

        for path_record in paths:
            nodes = path_record.get("nodes", [])
            edges = path_record.get("edges", [])
            if not nodes:
                continue

            p = [user_node, "dnu"]
            for i, node in enumerate(nodes):
                nid = int(node["id"])
                props = node_properties.get(nid, {})
                p.append({
                    "name": props.get("name", node.get("name", "")),
                    "cid": props.get("cid", ""),
                    "type": props.get("type", ""),
                    "uri": props.get("uri", ""),
                    "wikipedia": props.get("wikipedia", ""),
                    "abstract": props.get("abstract", ""),
                })
                if i < len(edges):
                    p.append(edges[i].get("type", "RELATED_TO"))

            roads.append({"p": p})
        return roads

    def _convert_sequence_to_roads(self, paths, node_properties):
        """Convert prerequisite paths to road format.
        Format: [conceptA, "PREREQUISITE_TO", conceptB] - no user node prefix.
        """
        roads = []

        for path_record in paths:
            nodes = path_record.get("nodes", [])
            edges = path_record.get("edges", [])
            if not nodes:
                continue

            p = []
            for i, node in enumerate(nodes):
                props = {}

                # Backward compatibility: old DB-based path has internal id
                if "id" in node and node.get("id") is not None:
                    try:
                        nid = int(node["id"])
                        props = node_properties.get(nid, {})
                    except Exception:
                        props = {}

                p.append({
                    "name": node.get("name", "") or props.get("name", ""),
                    "cid": node.get("cid", "") or props.get("cid", ""),
                    "type": node.get("type", "") or props.get("type", ""),
                    "uri": node.get("uri", "") or props.get("uri", ""),
                    "wikipedia": node.get("wikipedia", "") or props.get("wikipedia", ""),
                    "abstract": node.get("abstract", "") or props.get("abstract", ""),
                })

                if i < len(edges):
                    p.append(edges[i].get("type", "PREREQUISITE_TO"))

            roads.append({"p": p})

        return roads

    def _build_reasons_from_roads(self, roads):
        """从 road["p"] 列表构建 Reason 结构（供 sequence 节点使用）"""
        reasons = [
            {"dnu": []},
            {"name": "", "type": "Slide", "dnu": []},
            {"name": "", "type": "category", "dnu": []},
            {"name": "", "type": "related_concept", "dnu": []},
            {"name": "", "type": "Related", "dnu": []},
        ]
        for road in roads:
            p = road["p"]
            if len(p) < 5:
                continue
            dnu_name = p[2].get("name", "") if isinstance(p[2], dict) else ""
            if dnu_name and dnu_name not in reasons[0]["dnu"]:
                reasons[0]["dnu"].append(dnu_name)

            if len(p) == 5:
                mid_node = p[4] if isinstance(p[4], dict) else {}
                reasons[4]["name"] = mid_node.get("name", "")
                if dnu_name and dnu_name not in reasons[4]["dnu"]:
                    reasons[4]["dnu"].append(dnu_name)
            elif isinstance(p[4], dict):
                mid_type = p[4].get("type", "")
                mid_name = p[4].get("name", "")
                if mid_type == "main_concept":
                    reasons[3]["name"] = mid_name
                    if dnu_name and dnu_name not in reasons[3]["dnu"]:
                        reasons[3]["dnu"].append(dnu_name)
                else:
                    for reason in reasons[1:4]:
                        if mid_type == reason.get("type"):
                            reason["name"] = mid_name
                            if dnu_name and dnu_name not in reason["dnu"]:
                                reason["dnu"].append(dnu_name)

        return [r for r in reasons if r["dnu"]]

    def _get_nodes_by_internal_ids(self, node_ids):
        """Query Neo4j for full concept properties by their internal node IDs."""
        if not node_ids:
            return {}

        node_properties = {}
        with self.db.driver.session() as session:
            result = session.run(
                """
                MATCH (n)
                WHERE id(n) IN $ids
                RETURN id(n) AS nid, n.name AS name, n.cid AS cid,
                       n.type AS type, n.uri AS uri,
                       n.wikipedia AS wikipedia, n.abstract AS abstract
                """,
                ids=node_ids,
            ).data()

            for record in result:
                node_properties[record["nid"]] = {
                    "name": record.get("name", ""),
                    "cid": record.get("cid", ""),
                    "type": record.get("type", ""),
                    "uri": record.get("uri", ""),
                    "wikipedia": record.get("wikipedia", ""),
                    "abstract": record.get("abstract", ""),
                }

        return node_properties


def get_serialized_concepts_data(concepts):
    data = {}
    ser_concepts = []

    for concept in concepts:
        roads = []
        reasons = [
            {"dnu": []},
            {"name": "", "type": "Slide", "dnu": []},
            {"name": "", "type": "category", "dnu": []},
            {"name": "", "type": "related_concept", "dnu": []},
            {"name": "", "type": "Related", "dnu": []},
            {"name": "", "type": "sequence", "dnu": []},
        ]
        for road in concept["n"]["roads"]:
            list = []

            # Detect sequence road: first element is a concept (not user)
            is_sequence = isinstance(road["p"][0], dict) and road["p"][0].get("type") != "user"

            if is_sequence:
                # Sequence road: [conceptA, "PREREQUISITE_TO", conceptB]
                if len(road["p"]) >= 3:
                    name_a = road["p"][0].get("name", "")
                    name_b = road["p"][2].get("name", "")
                    for reason in reasons:
                        if reason.get("type") == "sequence":
                            if name_a and name_a not in reason["dnu"]:
                                reason["dnu"].append(name_a)
                            if name_b and name_b not in reason["dnu"]:
                                reason["dnu"].append(name_b)
                            break

                for node in road["p"]:
                    if isinstance(node, str):
                        list.append(node)
                    else:
                        list.append({
                            "name": node.get("name", ""),
                            "id": node.get("cid", ""),
                            "uri": node.get("uri", ""),
                            "type": node.get("type", ""),
                            "wikipedia": node.get("wikipedia", ""),
                            "abstract": node.get("abstract", ""),
                        })
                roads.append(list)
                continue

            # Standard dnu road processing (unchanged below)
            if road["p"][2]["name"] not in reasons[0]["dnu"]:
                reasons[0]["dnu"].append(road["p"][2]["name"])

            if len(road["p"]) == 5:
                reasons[4]["name"] = road["p"][4]["name"]
                if road["p"][2]["name"] not in reasons[4]["dnu"]:
                    reasons[4]["dnu"].append(road["p"][2]["name"])
            elif road["p"][4]["type"] == "main_concept":
                reasons[3]["name"] = road["p"][4]["name"]
                if road["p"][2]["name"] not in reasons[3]["dnu"]:
                    reasons[3]["dnu"].append(road["p"][2]["name"])
            else:
                for reason in reasons[1:4]:
                    if road["p"][4]["type"] == reason["type"]:
                        reason["name"] = road["p"][4]["name"]
                        if road["p"][2]["name"] not in reason["dnu"]:
                            reason["dnu"].append(road["p"][2]["name"])

            for node in road["p"]:
                if isinstance(node, str):
                    list.append(node)
                elif node["type"] == "user":
                    user_id = node.get("uid")
                    if user_id is None:
                        user_id = node.get("id")
                    n = {
                        "id": user_id,
                        "type": node["type"],
                    }
                    list.append(n)
                elif node["type"] == "Slide":
                    n = {
                        "name": node["name"],
                        "type": node["type"],
                    }
                    list.append(n)
                else:
                    c = {
                        "name": node["name"],
                        "id": node["cid"],
                        "uri": node["uri"],
                        "type": node["type"],
                        "wikipedia": node["wikipedia"],
                        "abstract": node["abstract"],
                    }
                    list.append(c)
            roads.append(list)

        Reasons = []
        for reason in reasons:
            if reason["dnu"] != []:
                Reasons.append(reason)

        c = {
            "name": concept["n"]["name"],
            "id": concept["n"]["cid"],
            "uri": concept["n"]["uri"],
            "type": concept["n"]["type"],
            "wikipedia": concept["n"]["wikipedia"],
            "abstract": concept["n"]["abstract"],
            "score": concept["n"]["score"],
            "roads": roads,
            "Reason": Reasons,
        }

        ser_concepts.append({"data": c})

    data["nodes"] = ser_concepts
    return data

def _path_key(path):
    """Hashable key for path deduplication.
    Prefer internal id; fallback to cid when id is absent.
    """
    node_keys = []
    for n in path.get("nodes", []):
        if "id" in n and n.get("id") is not None:
            try:
                node_keys.append(("id", int(n["id"])))
                continue
            except Exception:
                pass
        node_keys.append(("cid", str(n.get("cid", ""))))

    edge_types = tuple(e.get("type", "") for e in path.get("edges", []))
    return (tuple(node_keys), edge_types)