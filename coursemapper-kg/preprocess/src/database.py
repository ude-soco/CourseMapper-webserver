import psycopg


class Database:
    def __init__(self, connection_string: str):
        self.conn = psycopg.connect(connection_string)

    def __del__(self):
        self.conn.close()

    def make_tables(self):
        with self.conn.cursor() as cur:
            cur.execute('CREATE EXTENSION citext')
            cur.execute(
                'CREATE TABLE pages (id serial PRIMARY KEY, page_id integer NOT NULL, title citext NOT NULL, abstract text, links jsonb, type varchar(100) NOT NULL)')
            cur.execute(
                'ALTER TABLE pages ADD CONSTRAINT unique_pages UNIQUE (title)')
            cur.execute(
                'CREATE TABLE redirects (id serial PRIMARY KEY, page_id integer NOT NULL, title citext NOT NULL, redirect_to citext NOT NULL)')
            cur.execute(
                'ALTER TABLE redirects ADD CONSTRAINT unique_redirects UNIQUE (title, redirect_to)')
            cur.execute(
                'CREATE TABLE disambiguations (id serial PRIMARY KEY, page_id integer NOT NULL, title citext NOT NULL, refers_to citext NOT NULL)')
            cur.execute(
                'ALTER TABLE disambiguations ADD CONSTRAINT unique_disambiguations UNIQUE (title, refers_to)')
            cur.execute(
                'CREATE TABLE page_categories (id serial PRIMARY KEY, page_title citext NOT NULL, category_name citext NOT NULL)')
            cur.execute(
                'ALTER TABLE page_categories ADD CONSTRAINT unique_page_categories UNIQUE (page_title, category_name)')
            cur.execute(
                f'CREATE TABLE embeddings (id serial PRIMARY KEY, type varchar(100) NOT NULL, title citext NOT NULL, embedding bytea)')
            cur.execute(
                'ALTER TABLE embeddings ADD CONSTRAINT unique_embeddings UNIQUE (type, title)')
            self.conn.commit()


    def make_indexes(self):
        with self.conn.cursor() as cur:
            cur.execute('CREATE INDEX pages_title ON pages (title)')
            cur.execute('CREATE INDEX pages_links ON pages USING GIN (links)')
            cur.execute('CREATE INDEX redirects_title ON redirects (title)')
            cur.execute(
                'CREATE INDEX disambiguations_title ON disambiguations (title)')
            cur.execute(
                'CREATE INDEX page_categories_page_title ON page_categories (page_title)')
            cur.execute(
                'CREATE INDEX page_categories_category_name ON page_categories (category_name)')
            cur.execute('CREATE INDEX embeddings_title ON embeddings (title)')
            self.conn.commit()

    def insert_pages(self, pages, redirects, disambiguations, page_categories, embeddings):
        with self.conn.cursor() as cur:
            cur.executemany('''
                INSERT INTO pages (page_id, title, abstract, links, type) VALUES(%s, %s, %s, %s, %s)
                ON CONFLICT (title) DO UPDATE SET abstract = EXCLUDED.abstract, links = EXCLUDED.links
                ''', pages)
            cur.executemany('''
                INSERT INTO redirects (page_id, title, redirect_to) VALUES(%s, %s, %s)
                ON CONFLICT (title, redirect_to) DO UPDATE SET redirect_to = EXCLUDED.redirect_to
                ''', redirects)
            cur.executemany('''
                INSERT INTO disambiguations (page_id, title, refers_to) VALUES(%s, %s, %s)
                ON CONFLICT (title, refers_to) DO UPDATE SET refers_to = EXCLUDED.refers_to
                ''', disambiguations)
            cur.executemany('''
                INSERT INTO page_categories (page_title, category_name) VALUES(%s, %s)
                ON CONFLICT (page_title, category_name) DO NOTHING
                ''', page_categories)
            cur.executemany('''
                INSERT INTO embeddings (type, title, embedding) VALUES (%s, %s, %s)
                ON CONFLICT (type, title) DO UPDATE SET embedding = EXCLUDED.embedding
                ''', embeddings)
            self.conn.commit()

    def vacuum(self):
        self.conn.execute('VACUUM')
