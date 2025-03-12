from services.annotation import AnnotationService
from services.keyphrase import KeyphraseService
from services.embedding import EmbeddingService, cos_sim
from services.wikipedia import WikipediaService
from services.pdf import extract_text_from_pdf
from data import Graph, Node, Edge
import time
from io import BytesIO
import polars as pl
from services.local_cache import LocalCache
from services.redis_cache import RedisCache
from typing import Callable, List
from graph_db import GraphDB
from config import Config

class ConceptMapPipeline:
    def __init__(self):
        if Config.REDIS_USE_CACHE:
            self.cache_service = RedisCache()
        else:
            self.cache_service = LocalCache()

        self.wikipedia_service = WikipediaService()
        self.annotation_service = AnnotationService(self.cache_service, self.wikipedia_service)
        self.keyphrase_service = KeyphraseService()
        self.embedding_service = EmbeddingService(Config.EMBEDDING_MODEL)

        if Config.NEO4J_SAVE_TO_DB:
            self.graph_db = GraphDB(Config.NEO4J_URI, Config.NEO4J_USER, Config.NEO4J_PASSWORD)

    def run(self, push_log_message: Callable, material_id: str, material_name: str, infile: List[str] | BytesIO) -> Graph:
        # Create new graph
        graph = Graph()

        # Create concept map
        self.create_concept_map(graph, push_log_message, material_id, material_name, infile)

        # Save concept map
        if Config.NEO4J_SAVE_TO_DB:
            self.graph_db.save_graph(graph)

        return graph

    def create_concept_map(self, graph: Graph, push_log_message: Callable, material_id: str, material_name: str, infile: List[str] | BytesIO):
        # Start timer
        start_time = time.time()

        ## Step: Text Extraction
        push_log_message('Extracting text')
        if isinstance(infile, list):
            pdf_text = infile
        else:
            pdf_text = extract_text_from_pdf(infile)
        pages_df = pl.DataFrame({
            'page': [' '.join(page.replace('\n', ' . ').split()) for page in pdf_text],
            'keyphrases': [page.split('\n') for page in pdf_text],
        })

        # Get embeddings for each page and the whole file
        page_embeddings = self.embedding_service.encode(pages_df['page'].to_list())
        pages_df = pages_df.with_columns(pl.Series(name='embeddings', values=page_embeddings, dtype=pl.List(pl.Float64)))

        file_embedding = self.embedding_service.encode(' . '.join(pages_df['page']))

        material_node = Node(material_id, material_name, '', 'material', 1, '', '\n\n'.join(pdf_text), True, False, False, file_embedding, [], Config.EMBEDDING_MODEL)
        graph.add_node(material_node)

        for i, (page, page_parts, page_embedding) in enumerate(pages_df.iter_rows()):
            push_log_message(f'Processing page {i+1}/{pages_df.height}')

            page_node = Node(f'{material_id}_slide_{i+1}', f'slide_{i+1}', '', 'Slide', 1, '', page, False, False, False, page_embedding , page_parts, Config.EMBEDDING_MODEL )
            graph.add_node(page_node)
            graph.add_edge(Edge(material_node.id, page_node.id, 'CONTAINS'))

            ## Step: Keyphrase Extraction
            keyphrases = list(set(self.keyphrase_service.extract_keyphrases(page)))
            main_df = pl.DataFrame(pl.Series(name='keyphrase', values=keyphrases or None, dtype=pl.Utf8))

            # Remove keyphrases below keyphrase threshold
            main_df = main_df.filter(pl.col('keyphrase').str.len_chars() >= Config.KEYPHRASE_MIN_LENGTH)

            ## Step: Annotation
            annotations = self.annotation_service.annotate_keyphrases(main_df['keyphrase'].to_list())
            annotations_df = pl.DataFrame([
                pl.Series(name='keyphrase', values=[keyphrase for (keyphrase, _) in annotations] or None, dtype=pl.Utf8),
                pl.Series(name='annotation', values=[annotation for (_, annotation) in annotations] or None, dtype=pl.Utf8),
            ])
            main_df = main_df.join(annotations_df, on='keyphrase', how='inner')

            ## Step: Weighting
            # Get Wikipedia pages for annotations
            wikipedia_pages = [(annotation, self.wikipedia_service.get_page(annotation)) for annotation in main_df['annotation']]
            wikipedia_pages_df = pl.DataFrame([
                pl.Series(name='annotation', values=[annotation for annotation, page in wikipedia_pages if page is not None] or None, dtype=pl.Utf8),
                pl.Series(name='page title', values=[page.title for _, page in wikipedia_pages if page is not None] or None, dtype=pl.Utf8),
                pl.Series(name='page categories', values=[page.categories for _, page in wikipedia_pages if page is not None] or None, dtype=pl.List(pl.Utf8)),
                pl.Series(name='page summary', values=[page.summary for _, page in wikipedia_pages if page is not None] or None, dtype=pl.Utf8)
            ])
            main_df = main_df.join(wikipedia_pages_df, on='annotation', how='inner')

            # Get embeddings for abstracts of Wikipedia pages of annotations
            abstract_embeddings = self.wikipedia_service.get_or_create_page_embeddings(self.embedding_service, main_df['page title'].to_list())
            abstract_embeddings_df = pl.DataFrame([
                pl.Series(name='page title', values=[title for title, _ in abstract_embeddings] or None, dtype=pl.Utf8),
                pl.Series(name='abstract embedding', values=[embedding for _, embedding in abstract_embeddings] or None, dtype=pl.List(pl.Float32)),
            ])
            main_df = main_df.join(abstract_embeddings_df, on='page title', how='inner')

            # Weigh annotations based on their similarity to the file embedding and their similarity to the page embedding
            abstract_weights = cos_sim([file_embedding, page_embedding], main_df['abstract embedding'].to_list())

            # Average (file and page) weights for each annotation
            average_weights = [sum(weights)/len(weights) for weights in abstract_weights]
            material_weights = [weights[0] for weights in abstract_weights]
            main_df = main_df.with_columns(pl.Series(name='abstract weight', values=average_weights, dtype=pl.Float64),
                                           pl.Series(name='material weight', values=material_weights, dtype=pl.Float64))

            # Keep only top annotation for each keyphrase
            main_df = main_df.sort('abstract weight', descending=True).unique(subset=['keyphrase'])

            ## Step: Concept Disambiguation
            # For each annotation below threshold, get alternative pages, calculate their weights, and keep the top one if it's above the threshold
            disambiguated_df = pl.DataFrame(data=[], schema=main_df.schema)
            for keyphrase, annotation, page_title, _, _, _, abstract_weight, _ in main_df.iter_rows():
                # Get alternative pages
                alternative_pages = self.wikipedia_service.get_alternative_pages(page_title)
                alternative_pages.append(self.wikipedia_service.get_page(page_title))

                alternative_pages_df = pl.DataFrame([
                    pl.Series(name='keyphrase', values=[keyphrase for page in alternative_pages if page is not None] or None, dtype=pl.Utf8),
                    pl.Series(name='annotation', values=[annotation for page in alternative_pages if page is not None] or None, dtype=pl.Utf8),
                    pl.Series(name='page title', values=[page.title for page in alternative_pages if page is not None] or None, dtype=pl.Utf8),
                    pl.Series(name='page categories', values=[page.categories for page in alternative_pages if page is not None] or None, dtype=pl.List(pl.Utf8)),
                    pl.Series(name='page summary', values=[page.summary for page in alternative_pages if page is not None] or None, dtype=pl.Utf8)
                ])

                # Get embeddings for alternative pages
                alternative_embeddings = self.wikipedia_service.get_or_create_page_embeddings(self.embedding_service, alternative_pages_df['page title'].to_list())
                alternative_embeddings_df = pl.DataFrame([
                    pl.Series(name='page title', values=[title for title, _ in alternative_embeddings] or None, dtype=pl.Utf8),
                    pl.Series(name='abstract embedding', values=[embedding for _, embedding in alternative_embeddings] or None, dtype=pl.List(pl.Float32)),
                ])
                alternative_pages_df = alternative_pages_df.join(alternative_embeddings_df, on='page title', how='inner')

                # Weigh alternative pages based on their similarity to the file embedding and their similarity to the page embedding
                keyphrase_embedding = self.embedding_service.encode(keyphrase)
                alternative_weights = cos_sim([file_embedding, page_embedding, keyphrase_embedding], alternative_pages_df['abstract embedding'].to_list())
                alternative_abstract_weights = [(weights[0]+weights[1])/2 for weights in alternative_weights]
                alternative_material_weights = [weights[0] for weights in alternative_weights]
                alternative_keyphrase_weights = [(weights[0]+weights[1]+weights[2])/3 for weights in alternative_weights]
                alternative_pages_df = alternative_pages_df.with_columns(pl.Series(name='keyphrase weight', values=alternative_keyphrase_weights, dtype=pl.Float64),
                                                                         pl.Series(name='abstract weight', values=alternative_abstract_weights, dtype=pl.Float64),
                                                                         pl.Series(name='material weight', values=alternative_material_weights, dtype=pl.Float64))

                # Keep only top-5 pages where the keyphrase is similar to the abstract
                alternative_pages_df = alternative_pages_df.sort('keyphrase weight', descending=True).head(1)
                alternative_pages_df = alternative_pages_df.drop('keyphrase weight')

                # Keep only top alternative page
                alternative_pages_df = alternative_pages_df.sort('abstract weight', descending=True).head(1)

                disambiguated_df = pl.concat([disambiguated_df, alternative_pages_df])

            # Remove annotations below weight threshold
            disambiguated_df = disambiguated_df.filter(pl.col('abstract weight') >= Config.WEIGHT_THRESHOLD)

            for keyphrase, annotation, page_title, page_categories, page_summary, page_embedding, weight, material_weight in disambiguated_df.iter_rows():
                # Add concept node to graph
                concept_node = Node(f'{material_id}_concept_{str(abs(hash(str(page_embedding))))}', page_title, '', 'main_concept', (material_weight + 1) / 2, f'https://en.wikipedia.org/wiki/{page_title}', page_summary, False,False,False, page_embedding)
                graph.add_node(concept_node)
                graph.add_edge(Edge(page_node.id, concept_node.id, 'CONSISTS_OF', (float(weight) + 1) / 2))
                graph.add_edge(Edge(material_node.id, concept_node.id, 'LM_CONSISTS_OF', (float(material_weight) + 1) / 2))

                # Add keyphrases to concept node
                graph.update_node(concept_node, lambda existing_node: Node(existing_node.id, existing_node.name, existing_node.uri, existing_node.type, existing_node.weight, existing_node.wikipedia, existing_node.text, False, False,False, existing_node.embedding, existing_node.keyphrases + [keyphrase]))

            push_log_message(f'Finished processing page {i+1}/{pages_df.height}. Identified {main_df.height} concepts')

        # End timer
        end_time = time.time()
        push_log_message(f'Finished processing material {material_name} in {end_time - start_time} seconds')
