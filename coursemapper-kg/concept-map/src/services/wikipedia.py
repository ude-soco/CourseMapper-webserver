import numpy as np
import wikipediaapi
from html2text import html2text as htt
from typing import List, Tuple
import psycopg
from psycopg.rows import dict_row
from services.embedding import EmbeddingService
from config import Config


class WikipediaPage:
    title: str
    summary: str
    categories: List[str]
    links: List[str]

    def __init__(self, title: str, summary: str = '', categories: List[str] = [], links: List[str] = []):
        self.title = title
        self.summary = summary
        self.categories = categories
        self.links = links

class WikipediaService:
    def __init__(self):
        self._wiki = wikipediaapi.Wikipedia(Config.WIKIPEDIA_USER_AGENT, 'en')
        self._use_stored_embeddings = Config.WIKIPEDIA_USE_STORED_EMBEDDINGS
        self._conn = None
        self.wikipedia_fallback = Config.WIKIPEDIA_FALLBACK

    def __del__(self):
        if self._conn is not None and not self._conn.closed:
            self._conn.close()

    def get_conn(self):
        if Config.WIKIPEDIA_DATABASE_CONNECTION_STRING != '' and (self._conn is None or self._conn.closed):
            self._conn = psycopg.connect(Config.WIKIPEDIA_DATABASE_CONNECTION_STRING, row_factory=dict_row)
        return self._conn

    def get_page(self, title: str) -> WikipediaPage | None:
        # Normalize title
        title = htt(title)
        title = title.replace('_', ' ')
        title = title.strip()

        # Check if page exists in cache
        conn = self.get_conn()
        if conn is not None:
            with conn.cursor() as cur:
                rows = cur.execute('SELECT title, abstract, links FROM pages WHERE title = %s', (title,)).fetchall()
                if len(rows) == 0:
                    rows = cur.execute('SELECT pages.title, pages.abstract, pages.links FROM pages JOIN redirects ON pages.title = redirects.redirect_to WHERE redirects.title = %s', (title,)).fetchall()

                if len(rows) > 0:
                    category_rows = cur.execute('SELECT * FROM page_categories WHERE page_title = %s', (rows[0]['title'],)).fetchall()
                    return WikipediaPage(rows[0]['title'], rows[0]['abstract'], [row['category_name'] for row in category_rows], rows[0]['links'])

        if not self.wikipedia_fallback:
            return None

        # Check if page exists in Wikipedia
        try:
            page = self._wiki.page(title)
            if not page.exists():
                return None
        except Exception as e:
            return None

        page_categories = [(page.title, category.split(':', 1)[1]) for category in page.categories]
        page_links = [link.title for link in page.links.values() if link.namespace == wikipediaapi.Namespace.MAIN]
        return WikipediaPage(page.title, page.summary, [category_name for _, category_name in page_categories], page_links)

    def get_alternative_pages(self, title: str) -> List[WikipediaPage | None]:
        title = htt(title)
        title = title.replace('_', ' ')
        title = title.strip()

        res = []

        conn = self.get_conn()
        if conn is not None:
            with conn.cursor() as cur:
                pages = cur.execute('SELECT refers_to FROM disambiguations WHERE title = %s', (title,)).fetchall()
                if len(pages) > 0:
                    res += [self.get_page(row['refers_to']) for row in pages]

                disambiguations = cur.execute('SELECT title FROM disambiguations WHERE refers_to = %s', (title,)).fetchall()
                if len(disambiguations) == 0:
                    return res

                pages = cur.execute('SELECT refers_to FROM disambiguations WHERE title = ANY(%s)',
                                           ([disambiguation['title'] for disambiguation in disambiguations],)).fetchall()
                res += [self.get_page(row['refers_to']) for row in pages]

        return res

    def get_or_create_page_embeddings(self, embedding_service: EmbeddingService, page_titles: List[str]) -> List[Tuple[str, np.ndarray]]:
        conn = self.get_conn()
        if conn is not None and self._use_stored_embeddings:
            with conn.cursor() as cur:
                embeddings = cur.execute("SELECT title, embedding FROM embeddings WHERE title = ANY(%s)", (page_titles,)).fetchall()
        else:
            embeddings = []

        found_titles = [row['title'].lower() for row in embeddings]

        res = []

        for title in page_titles:
            if title.lower() in found_titles:
                res.append([title, np.frombuffer(embeddings[found_titles.index(title.lower())]['embedding'], dtype=np.float32)])
            else:
                missing_page = self.get_page(title)
                if missing_page is None:
                    continue
                missing_page_embedding = embedding_service.encode(missing_page.title + ' ' + missing_page.summary)
                res.append([title, missing_page_embedding])

        return res

    def get_page_embeddings(self, embedding_service: EmbeddingService, page_titles: List[str], type: str) -> List[Tuple[str, np.ndarray]]:
        conn = self.get_conn()
        if conn is not None:
            with conn.cursor() as cur:
                embeddings = cur.execute("SELECT title, embedding FROM embeddings WHERE type = %s AND title = ANY(%s)", (type, page_titles)).fetchall()

            found_titles = [row['title'].lower() for row in embeddings]
        else:
            embeddings = []
            found_titles = []

        res = []

        if self._use_stored_embeddings:
            for title in page_titles:
                if title.lower() in found_titles:
                    res.append([title, np.frombuffer(embeddings[found_titles.index(title.lower())]['embedding'], dtype=np.int32)])

        for title in page_titles:
            if title.lower() in found_titles:
                continue
            missing_page = self.get_page(title)
            if missing_page is None:
                continue
            missing_page_embedding = embedding_service.encode(missing_page.title + ' ' + missing_page.summary)
            res.append([title, missing_page_embedding])

        return res
