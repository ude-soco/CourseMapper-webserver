from multiprocessing import Process, Queue
from queue import Empty
import sys
import datetime
import multiprocessing
import ctypes
from typing import List
import argparse
import os
import subprocess
import json
from urllib.parse import urlparse
from urllib.request import urlretrieve
from sentence_transformers import SentenceTransformer
from wiki import parse_document, WikiPage, WikiRedirect, WikiDisambiguation, WikiCategory
from database import Database


class Batch:
    def __init__(self, batch_limit: int, documents: "Queue[List[WikiRedirect | WikiDisambiguation | WikiCategory | WikiPage]]", progress: "Queue[tuple[str, int]]"):
        self.batch: List[WikiRedirect | WikiDisambiguation |
                         WikiCategory | WikiPage] = []
        self.batch_size = 0
        self.batch_limit = batch_limit
        self.documents = documents
        self.progress = progress

    def flush_batch(self):
        if len(self.batch) == 0:
            return
        self.documents.put(self.batch)
        self.progress.put(('processed', self.batch_size))
        self.batch = []
        self.batch_size = 0

    def process_chunk(self, document):
        doc = parse_document(document)
        if doc is not None:
            self.batch.append(doc)
            self.batch_size += 1
            if len(self.batch) >= self.batch_limit:
                self.flush_batch()


def parse_worker(dump_filename: str, articles: "Queue[str]", progress: "Queue[tuple[str, int]]"):
    article = ''
    pages_parsed = 0
    with open(dump_filename, 'rt', encoding='utf-8') as infile:
        for line in infile:
            if '<page>' in line:
                article = ''
            elif '</page>' in line:
                articles.put(article)
                pages_parsed += 1
                if pages_parsed % 10 == 0:
                    progress.put(('parsed', 10))
            else:
                article += line


def process_worker(quit_process, batch_limit: int, articles: "Queue[str]", documents: "Queue[List[WikiRedirect | WikiDisambiguation | WikiCategory | WikiPage]]", progress: "Queue[tuple[str, int]]"):
    batch = Batch(batch_limit, documents, progress)
    while True:
        try:
            article = articles.get(timeout=2)
            batch.process_chunk(article)
        except Empty:
            batch.flush_batch()
            if quit_process.get_obj().value:
                break
        except Exception as e:
            print('Exception process_worker', e)


def import_worker(quit_process, database_connection_string: str, create_tables: bool, documents: "Queue[List[WikiRedirect | WikiDisambiguation | WikiCategory | WikiPage]]", progress: "Queue[tuple[str, int]]"):
    embedding_model = SentenceTransformer('all-mpnet-base-v2')

    database = Database(database_connection_string)

    if create_tables:
        database.make_tables()

    while True:
        try:
            document_batch = documents.get(timeout=10)
            if len(document_batch) == 0:
                continue

            page_batch = [(page.id, page.title, page.abstract, json.dumps(page.links), 'page')
                          for page in document_batch if isinstance(page, WikiPage)]

            page_batch += [(category.id, category.title, '', '[]', 'category')
                              for category in document_batch if isinstance(category, WikiCategory)]

            redirects_batch = [(redirect.id, redirect.title, redirect.redirect_to)
                               for redirect in document_batch if isinstance(redirect, WikiRedirect)]

            disambiguations_batch = [(disambiguation.id, disambiguation.title, link) for disambiguation in document_batch if isinstance(
                disambiguation, WikiDisambiguation) for link in disambiguation.links]

            categories_batch = [(page.title, category) for page in document_batch
                                if (isinstance(page, WikiPage) or isinstance(page, WikiCategory))
                                and page.categories is not None for category in page.categories]

            categories_batch += [(category_.id, category) for category_ in document_batch if isinstance(
                category_, WikiCategory) and category_.categories is not None for category in category_.categories]

            embedding_vectors = embedding_model.encode([title.replace('Category:', '') + ' . ' + abstract for (_, title, abstract, _, _) in page_batch])
            embeddings = [(type, title, embedding.tobytes()) for (_, title, _, _, type), embedding in zip(page_batch, embedding_vectors)]

            database.insert_pages(
                page_batch, redirects_batch, disambiguations_batch, categories_batch, embeddings)

            progress.put(('imported', len(document_batch)))
        except Empty:
            if quit_process.get_obj().value:
                break
        except Exception as e:
            print('Exception import_worker', e)

    if create_tables:
        print('\nCreating indexes. This might take a while...')
        database.make_indexes()


def progress_worker(quit_process, progress: "Queue[tuple[str, int]]"):
    pages_parsed = 0
    pages_processed = 0
    pages_imported = 0
    pages_processed_time = datetime.datetime.now()
    pages_processed_last_mark = 0
    pages_processed_per_second = 0
    pages_imported_time = datetime.datetime.now()
    pages_imported_last_mark = 0
    pages_imported_per_second = 0
    while True:
        try:
            event, count = progress.get(timeout=1)
            if event == 'parsed':
                pages_parsed += count
            elif event == 'processed':
                pages_processed += count
                if pages_processed - pages_processed_last_mark >= 5000:
                    pages_processed_time_now = datetime.datetime.now()
                    pages_processed_time_delta = pages_processed_time_now - pages_processed_time
                    pages_processed_time = pages_processed_time_now
                    pages_processed_per_second = int(
                        (pages_processed - pages_processed_last_mark) / pages_processed_time_delta.total_seconds())
                    pages_processed_last_mark = pages_processed
            elif event == 'imported':
                pages_imported += count
                if pages_imported - pages_imported_last_mark >= 5000:
                    pages_imported_time_now = datetime.datetime.now()
                    pages_imported_time_delta = pages_imported_time_now - pages_imported_time
                    pages_imported_time = pages_imported_time_now
                    pages_imported_per_second = int(
                        (pages_imported - pages_imported_last_mark) / pages_imported_time_delta.total_seconds())
                    pages_imported_last_mark = pages_imported
            sys.stdout.write(
                f'\rparsed: {pages_parsed:14,} | processed: {pages_processed:14,} ({pages_processed_per_second:5} /s) | imported: {pages_imported:14,} ({pages_imported_per_second:5} /s)')
            sys.stdout.flush()
        except Empty:
            if quit_process.get_obj().value:
                break
        except Exception as e:
            print('Exception progress_worker', e)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
                    prog='WikipediaDumpToPostgreSQL',
                    description='This program extracts Wikipedia articles from a dump file and saves them to a PostgreSQL database.')
    parser.add_argument('database_connection_string', help='PostgreSQL database connection string')
    parser.add_argument('-i', '--input', default='', help='Wikipedia dump file path, XML format. Example: "enwiki-20240101-pages-articles.xml". Default: Download latest dump from the default mirror')
    parser.add_argument('-u', '--url', default='', help='Wikipedia dump URL. Find a mirror on "https://dumps.wikimedia.org/mirrors.html". Default: Download latest dump from the default mirror')
    parser.add_argument('-w', '--workers', type=int, default=-1, help='Number of worker processes. Default: Number of cores - 1')
    parser.add_argument('-b', '--batch', type=int, default=512, help='Batch size limit. Default: 512')
    parser.add_argument('-p', '--download-path', type=str, default='.', help='Directory to download dump file to. Default: .')
    parser.add_argument('-c', '--no-create-tables', action=argparse.BooleanOptionalAction, help='Create tables in the database')
    parser.add_argument('-x', '--create-indexes', action=argparse.BooleanOptionalAction, help='Only create indexes in the database')

    args = parser.parse_args()

    if args.create_indexes:
        database = Database(args.database_connection_string)
        database.make_indexes()
        sys.exit()

    workers = args.workers
    if workers == -1:
        workers = os.cpu_count()
        if workers is None:
            workers = 3
        else:
            workers -= 1

    filename = args.input

    if filename == '':
        url = args.url
        if url == '':
            url = 'https://dumps.wikimedia.org/enwiki/latest/enwiki-latest-pages-articles.xml.bz2'

        filename = os.path.basename(urlparse(url).path)
        filepath = os.path.join(args.download_path, filename)

        if not os.path.exists(filepath):
            print(f'Downloading {url}')
            urlretrieve(url, filepath)

        print(f'Extracting dump...')
        subprocess.run(['lbzip2', '-dk', '-n', str(workers), filepath])

        filename = filepath.replace('.bz2', '')

    articles = Queue(maxsize=10000)
    documents = Queue(maxsize=1000)
    progress = Queue(maxsize=1000)

    print('Processing dump...')

    quit_process = multiprocessing.Value(ctypes.c_bool, False)

    parse_process = Process(target=parse_worker, daemon=True, args=(filename, articles, progress))
    parse_process.start()

    for i in range(workers - 1):
        Process(target=process_worker, daemon=True, args=(
            quit_process, args.batch, articles, documents, progress)).start()

    import_process = Process(target=import_worker, daemon=True, args=(
        quit_process, args.database_connection_string, not args.no_create_tables, documents, progress))
    import_process.start()

    Process(target=progress_worker, daemon=True, args=(quit_process, progress)).start()

    parse_process.join()
    quit_process.value = True
