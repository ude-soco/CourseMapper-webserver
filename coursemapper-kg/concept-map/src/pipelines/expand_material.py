from services.embedding import EmbeddingService, cos_sim
from services.wikipedia import WikipediaService
from graph_db import GraphDB
from config import Config
from data import Graph, Node, Edge
from services.course_materials.prerequisite.prerequisite_wrapper import run_prerequisite_material
from services.course_materials.Relational_ConceptGCN.relational_conceptgcn_rrgcn import RRGCN
import time
import polars as pl
from typing import Callable
import math
import numpy as np
import scipy.sparse as sp
import tempfile

class ExpandMaterialPipeline:
    def __init__(self):
        self._embedding_service = EmbeddingService(Config.EMBEDDING_MODEL)
        self._wikipedia_service = WikipediaService()

    def run(self, push_log_message: Callable, material_id: str):
        graph_db = GraphDB(Config.NEO4J_URI, Config.NEO4J_USER, Config.NEO4J_PASSWORD)

        # Load graph from database
        graph = graph_db.load_graph(material_id)

        # Expand material graph
        self.expand_material_graph(graph, push_log_message)

        # Save subgraph
        if graph_db is not None:
            graph_db.save_graph(graph)

            self.prerequisite(material_id, push_log_message)

            #self.gcn(material_id, graph_db)
            push_log_message(f'GCN for material {material_id} is running')
            gcn = RRGCN()
            gcn.rrgcn_1_2()
            push_log_message(f'GCN for material {material_id} is done')


    def expand_material_graph(self, graph: Graph, push_log_message: Callable):
        # Start timer
        start_time = time.time()

        # Get material node and embedding
        material_node = None
        for node in graph.nodes:
            if node.type == 'material':
                material_node = node
                break

        if material_node is None:
            raise ValueError('Material node not found')

        material_id = material_node.id
        file_embedding = self._embedding_service.encode(material_node.text)

        # Connect nodes to categories
        expanded_category_titles = set()
        concept_count = 0
        for concept_node in graph.nodes:
            if concept_node.type != 'main_concept':
                continue

            concept_count += 1

            # Get concept categories
            concept = self._wikipedia_service.get_page(concept_node.name)
            if concept is None:
                continue
            concept_categories = concept.categories

            # Add categories to expand
            for category_title in concept_categories:
                expanded_category_titles.add(category_title)
                graph.add_edge(Edge(concept_node.id, f'{material_id}_category_{str(abs(hash(category_title)))}', 'HAS_CATEGORY', 1.0))

        push_log_message(f'Expanding material with {concept_count} concepts')

        ## Step: Category Expansion
        # Calculate category embeddings and weights
        category_embeddings = self._wikipedia_service.get_or_create_page_embeddings(self._embedding_service, list(expanded_category_titles))
        category_df = pl.DataFrame({
            'node_id': [f'{material_id}_category_{str(abs(hash(title)))}' for title, _ in category_embeddings],
            'title': [title for title, _ in category_embeddings],
            'embedding': [embedding for _, embedding in category_embeddings],
        })

        # Calculate similarity with material text
        category_weights = cos_sim([file_embedding], category_df['embedding'].to_list())
        category_weights = [(weight[0] + 1) / 2 for weight in category_weights]
        category_df = category_df.with_columns(pl.Series(name='embedding weight', values=category_weights))

        # Calculate number of connected concepts
        connected_concepts = [len([edge.source for edge in graph.edges if edge.target == node_id]) for node_id, _, _, _ in category_df.iter_rows()]
        connected_concepts_series = pl.Series(name='connected concepts', values=connected_concepts)
        connected_concepts_weight = (connected_concepts_series + math.e - 1).log()
        category_df = category_df.with_columns(pl.Series(name='connected concepts weight', values=connected_concepts_weight))

        # Calculate final weight
        category_df = category_df.with_columns(pl.Series(name='weight', values=(
            category_df['embedding weight'] * category_df['connected concepts weight']
        )))

        # Keep only top n category edges for each concept
        category_df = category_df.sort('weight', descending=True)
        categories_to_keep = set()
        for concept in graph.nodes:
            if concept.type == 'main_concept':
                concept_categories = [edge.target for edge in graph.edges if edge.source == concept.id and edge.type == 'HAS_CATEGORY']
                concept_categories_df = category_df.filter(pl.col('node_id').is_in(concept_categories))
                concept_categories_df = concept_categories_df.head(Config.TOP_N_RELATED_CATEGORIES)
                categories_to_keep.update(concept_categories_df['title'].to_list())

        category_df = category_df.filter(pl.col('title').is_in(categories_to_keep))

        # Add category nodes
        for category_node_id, category_title, category_embedding, category_weight in category_df[['node_id', 'title', 'embedding', 'weight']].iter_rows():
            category_node = Node(category_node_id, category_title.replace('Category:', ''), '', 'category', category_weight, f'https://en.wikipedia.org/wiki/{category_title.replace(" ", "_")}', '', False, category_embedding)
            graph.add_node(category_node)

        expanded_category_count = len([category for category in graph.nodes if category.type == 'category'])
        push_log_message(f'Identified {expanded_category_count} category(ies)')

        ## Step: Concept Expansion
        concepts = [node for node in graph.nodes if node.type == 'main_concept']
        push_log_message(f'Expanding {len(concepts)} concepts')
        for concept_node in concepts:
            # Get expanded concepts
            concept_page = self._wikipedia_service.get_page(concept_node.name)
            if concept_page is None:
                continue
            concept_embedding = self._wikipedia_service.get_page_embeddings(self._embedding_service, [concept_page.title], 'page')

            expanded_pages = [self._wikipedia_service.get_page(link) for link in concept_page.links]
            expanded_pages = expanded_pages
            expansion_df = pl.DataFrame([
                pl.Series(name='title', values=[page.title for page in expanded_pages if page is not None], dtype=pl.Utf8),
                pl.Series(name='summary', values=[page.summary for page in expanded_pages if page is not None], dtype=pl.Utf8),
            ])
            expansion_df = expansion_df.unique(subset=['title'])

            ## Step: Expanded Concept Weighting
            # Get expanded concept embeddings
            expanded_concept_embeddings = self._wikipedia_service.get_page_embeddings(self._embedding_service, expansion_df['title'].to_list(), 'page')
            expanded_concept_embeddings_df = pl.DataFrame([
                pl.Series(name='title', values=[title for title, _ in expanded_concept_embeddings], dtype=pl.Utf8),
                pl.Series(name='embedding', values=[embedding for _, embedding in expanded_concept_embeddings], dtype=pl.List(pl.Float64)),
            ])
            expansion_df = expansion_df.join(expanded_concept_embeddings_df, on='title', how='inner')

            # Get normalized expanded concept weights
            expanded_concept_weights = cos_sim([file_embedding, concept_embedding[0][1]], expansion_df['embedding'].to_list())
            expanded_concept_weights = [(float(weight[0]) + float(weight[1]) + 2) / 4 for weight in expanded_concept_weights]
            expansion_df = expansion_df.with_columns(pl.Series(name='weight', values=expanded_concept_weights))

            # Only keep the top n expanded concepts
            expansion_df = expansion_df.sort('weight', descending=True, nulls_last=True)
            expansion_df = expansion_df.head(Config.TOP_N_RELATED_CONCEPTS)

            # Add expanded concepts
            for expanded_concept_title, expanded_concept_summary, expanded_concept_embedding, expanded_concept_weight in expansion_df.iter_rows():
                expanded_concept_node = Node(f'{material_id}_concept_{str(abs(hash(str(expanded_concept_embedding))))}', expanded_concept_title, '', 'related_concept', expanded_concept_weight, f'https://en.wikipedia.org/wiki/{expanded_concept_title}', expanded_concept_summary, False, expanded_concept_embedding)
                graph.add_node(expanded_concept_node)
                graph.add_edge(Edge(concept_node.id, expanded_concept_node.id, 'RELATED_TO', 1.0))

        expanded_concept_count = len([concept for concept in graph.nodes if concept.type == 'related_concept'])
        push_log_message(f'Identified {expanded_concept_count} related concept(s)')

        # #add prerequisite step
        # push_log_message(f'preprocessing prerequisite material {material_id}')
        # start_time = time.time()
        # run_prerequisite_material(material_id)
        # end_time = time.time()
        # push_log_message(f'finish preprocessing prerequisite material {material_id}')

        # Remove orphaned nodes and dangling edges
        # graph.prune()

        # Set is_draft to false
        material_node.is_draft = False

        # End timer
        end_time = time.time()
        push_log_message(f'Finished expanding material {material_node.name} in {end_time - start_time} seconds')

        # TODO Normalize weights
        return graph
    def prerequisite(self, mid: str, push_log_message: Callable):
         #add prerequisite step
        push_log_message(f'preprocessing prerequisite material {mid}')
        start_time = time.time()
        run_prerequisite_material(mid)
        end_time = time.time()
        push_log_message(f'finish preprocessing prerequisite material {mid}')
        push_log_message(f'Finished prerequisite material {mid} in {end_time - start_time} seconds')



    def idfeature(self, mid: str, graph_db: GraphDB, fp: tempfile._TemporaryFileWrapper):
        # Get ids, initial embeddings and types of nodes (concept, related concept, category)
        with graph_db.driver.session() as session:
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
        for idx_feature in idx_features:
            con = list(idx_feature["embedding"].split(","))
            fp.write(str(idx_feature["newid"]) + " " + str(idx_feature["id"]) + " " + " ".join(con) + "\n")

    def relation(self, mid: str, graph_db: GraphDB, fp: tempfile._TemporaryFileWrapper):
        # Get relationships between nodes (concept-related concept, concept-category)
        with graph_db.driver.session() as session:
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
        for relationship in relationships:
            fp.write(str(relationship["source"]) + " " + str(relationship["weight"])
                    + " " + str(relationship["target"]) + "\n")

    def gcn(self, mid: str, graph_db: GraphDB):
        idfeature_fp = tempfile.NamedTemporaryFile(mode="w", delete=False)
        relation_fp = tempfile.NamedTemporaryFile(mode="w", delete=False)

        self.idfeature(mid, graph_db, idfeature_fp)
        self.relation(mid, graph_db, relation_fp)

        idfeature_fp.close()
        relation_fp.close()

        def normalize(mx):
            rowsum = np.array(mx.sum(1))
            d_inv = np.power(rowsum, -0.5).flatten()
            d_inv[np.isinf(d_inv)] = 0.0
            d_mat_inv = sp.diags(d_inv)
            norm_adj = d_mat_inv.dot(mx)
            norm_adj = norm_adj.dot(d_mat_inv)
            return norm_adj

        # Read ids and initial embeddings of nodes from idfeature.text
        # The structure of text: first column is new id of node(type:int), the second column is the original id (type:string), and the rest is the initial embedding
        idx_features = np.genfromtxt(idfeature_fp.name, dtype=np.dtype(str))
        # Construct initial embedding matrix
        # Extract initial embedding starts from the third column
        features = sp.csr_matrix(idx_features[:, 2:], dtype=np.float32)

        # Construct Adjacency matrix

        # Read relationships of nodes from relation.text
        edges1 = np.genfromtxt(relation_fp.name, dtype=np.float32)
        # Extract new id of node
        idx = np.array(idx_features[:, 0], dtype=np.float32)
        # Replace id with row number
        # row0: id1 initial_embedding1  -> 0 initial_embedding1
        # row1: id2 initial_embedding2  -> 1 initial_embedding2
        # row2: id3 initial_embedding3  -> 2 initial_embedding3
        idx_map = {j: i for i, j in enumerate(idx)}

        # Replace data in edge1 with row numer for id and weight for weight.
        # id1 0.8 id2 -> 0 0.8 1
        # id2 0.7 id3 -> 1 0.7 2
        # id4 0.6 id5 -> 3 0.6 4
        edges_row = np.array(list(map(idx_map.get, edges1[:, 0].flatten())))
        edges_column = np.array(list(map(idx_map.get, edges1[:, 2].flatten())))
        # edges_row means number of row, edges_column means number of column, edges1[:,1] means value.
        # 0 0.8 1 means the value in the first column of row zero is 0.8. i.e. the relationship weight of id1 and id2 is 0.8
        adj = sp.coo_matrix(
            (edges1[:, 1], (edges_row[:], edges_column[:])),
            shape=(features.shape[0], features.shape[0]),
            dtype=np.float32,
        )
        adj = np.around(adj, 2)
        # matrix plus its unit matrix and transpose matrix to obtain the complete adjacency matrix
        adj = adj + adj.T.multiply(adj.T > adj) - adj.multiply(adj.T > adj)

        adj = normalize(adj) + sp.eye(adj.shape[0])
        # GCN Multiply Adjacency matrix and initial embedding matrix
        # mutiply Adjacency matrix and initial embedding matrix, output is new embedding matrix
        # The new embedding of a node is obtained by aggregating the embeddings of its first hop neighbours
        output = np.dot(adj, features)
        # mutiply Adjacency matrix and new embedding matrix, output is final embedding matrix
        # The final embedding of a node is obtained by aggregating the embeddings of its first and second hop neighbours
        output = np.dot(adj, output)
        final_embeddings = output.A

        # Extract original ids of nodes
        idx = np.array(idx_features[:, 1], dtype=np.dtype(str))
        with graph_db.driver.session() as session:
            for i in range(final_embeddings.shape[0]):
                id = idx[i]
                f_embedding = final_embeddings[i]
                embedding = ",".join(str(i) for i in f_embedding)
                # Find a node in neo4j by its original id and save its final embedding into its "final_embedding" property
                result = session.run("""MATCH (n) WHERE n.cid= $id or n.sid= $id
                        set n.final_embedding = $embedding RETURN n""",
                    id=id,
                    embedding=embedding)
