#!/bin/bash
set -e

echo "${0}: Downloading dump ..."
curl -s "https://dumps.wikimedia.org/enwiki/latest/enwiki-latest-pages-articles.xml.bz2" -o /tmp/enwiki-latest-pages-articles.xml.bz2

echo "${0}: Extracting dump ..."
lbzip2 -d -n 4 /tmp/enwiki-latest-pages-articles.xml.bz2

echo "${0}: Processing dump ..."
pipenv run python -u src/main.py -i /tmp/enwiki-latest-pages-articles.xml "postgres://postgres:$POSTGRES_PASSWORD@postgres:5432/"
rm /tmp/enwiki-latest-pages-articles.xml

echo "${0}: Dumping database ..."
echo "postgres:5432:postgres:postgres:$POSTGRES_PASSWORD" > /root/.pgpass
pg_dump -h postgres -U postgres -d postgres -f /tmp/init.sql

echo "${0}: Compressing dump ..."
gzip /tmp/init.sql

echo "${0}: Calculating checksum ..."
sha256sum /tmp/init.sql.gz > /tmp/init.sql.gz.sha256

echo "${0}: Uploading dump ..."
rclone copy /tmp "coursemapper-write:coursemapper-data/"
