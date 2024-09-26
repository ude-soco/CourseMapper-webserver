from services.embedding import EmbeddingService, cos_sim
from services.wikipedia import WikipediaService
from graph_db import GraphDB
from config import Config
from data import Graph, Node, Edge

class ModifyGraphPipeline:
    def __init__(self):
        self._graph_db = GraphDB(Config.NEO4J_URI, Config.NEO4J_USER, Config.NEO4J_PASSWORD)
        self._embedding_service = EmbeddingService(Config.EMBEDDING_MODEL)
        self._wikipedia_service = WikipediaService()

    def remove_concept(self, material_id: str, concept_id: str):
        self._graph_db.remove_node(material_id, concept_id)

    def remove_concept_by_name(self, material_id: str, concept_name: str):
        self._graph_db.remove_concept_by_name(material_id, concept_name)

    def add_concept(self, material_id: str, concept_name: str, slides: list[int] | None):
        # Check if the concept already exists
        existing_concept = self._graph_db.get_concept_by_name(material_id, concept_name)
        print(existing_concept)
        if existing_concept is not None:
            raise ValueError(f'Concept "{concept_name}" already exists in the graph')

        # Get concept information from Wikipedia
        wikipedia_page = self._wikipedia_service.get_page(concept_name)
        if wikipedia_page is None:
            raise ValueError(f'Concept "{concept_name}" not found on Wikipedia')

        wikipedia_page_embeddings = self._wikipedia_service.get_or_create_page_embeddings(self._embedding_service, [concept_name])
        wikipedia_page_embedding = wikipedia_page_embeddings[0][1]

        # Get material node
        material_node = self._graph_db.get_node(material_id, material_id)
        if material_node is None:
            raise ValueError(f'Material "{material_id}" not found in the graph')

        material_embedding = self._embedding_service.encode(material_node.text)
        concept_material_weight = cos_sim(material_embedding, wikipedia_page_embedding)

        # Get slide nodes
        slide_nodes: list[Node] = []
        if slides is not None:
            for slide_number in slides:
                slide_node = self._graph_db.get_node(material_id, f'{material_id}_slide_{slide_number}')
                if slide_node is None:
                    continue
                slide_nodes.append(slide_node)

        # Calculate concept weight for each slide
        if len(slide_nodes) > 0:
            slide_embeddings = self._embedding_service.encode([slide_node.text for slide_node in slide_nodes])
            slide_weights = cos_sim(slide_embeddings, wikipedia_page_embedding)
            concept_slide_weights = [(concept_material_weight + slide_weight) * 0.5 for slide_weight in slide_weights]
        else:
            concept_slide_weights = []

        # Construct the supgraph
        graph = Graph()

        # Add material node
        graph.nodes.append(material_node)

        # Add concept node
        concept_node = Node(f'{material_id}_concept_{str(abs(hash(str(wikipedia_page_embedding))))}', concept_name, '', 'main_concept', (concept_material_weight + 1) / 2, f'https://en.wikipedia.org/wiki/{concept_name}', wikipedia_page.summary, False, wikipedia_page_embedding, [])
        graph.nodes.append(concept_node)

        # Add material-concept edge
        material_concept_edge = Edge(material_id, concept_node.id, 'LM_CONSISTS_OF', (concept_material_weight + 1) / 2)
        graph.edges.append(material_concept_edge)

        # Add slide-concept edges
        if len(slide_nodes) > 0:
            for slide_node, slide_weight in zip(slide_nodes, concept_slide_weights):
                slide_concept_edge = Edge(slide_node.id, concept_node.id, 'CONSISTS_OF', slide_weight)
                graph.edges.append(slide_concept_edge)

        # Save the subgraph
        self._graph_db.save_graph(graph)
