# Wikipedia Dump to SQL
This program downloads a dump of all Wikipedia articles and converts it into a PostgreSQL database.

Here are the steps to this process in more detail:
- Download the latest dump from https://dumps.wikimedia.org/ or use existing file
- Decompress the archive to get the XML file
- For every article in the file
    - Extract the first section (abstract)
    - Remove Wiki and HTML formatting
    - Extract all links
    - Extract all categories
    - Extract disambiguations (if it is a disambiguation page)
    - Extract redirect (if it is a redirect page)
    - Calculate embedding for title + abstract (if available)
    - Save into a PostgreSQL database

Pages are batched together in groups of 512 (configurable) to achieve lower overhead.

Embeddings are computed using the all-mpnet-base-v2 transformer model.

One process is run for reading the file, multiple processes for parsing the pages (configurable), and one process for calculating the embeddings and storing everything in the database.

## System Requirements
- Disk: **170 GB** minimum. An **SSD** is highly recommended
- Memory: **8 GB** minimum. **16 GB** recommended
- CPU: A CPU with at least **4 cores** is recommended
- GPU: Not required, but highly recommended. At least **6 GB** of VRAM

Note that the disk space requirement will change gradually as the dump grows over time.

## Usage

### Docker
The easiest way to use the program is through Docker.

First build the container:
```sh
docker build -t wp-to-sql .
```

And then run it:
```sh
docker run --rm -it wp-to-sql postgres://<user>:<password>@<host>:<port>/
```

With Nvidia GPU acceleration (see [https://stackoverflow.com/a/58432877](https://stackoverflow.com/a/58432877) for more information):
```sh
docker run --rm -it --gpus all wp-to-sql postgres://<user>:<password>@<host>:<port>/
```

Or with a dump that you already downloaded (find a mirror on [https://dumps.wikimedia.org/mirrors.html](https://dumps.wikimedia.org/mirrors.html)):
```sh
docker run --rm -it -v /path/to/dump/enwiki-latest-pages-articles.xml.bz2:enwiki-latest-pages-articles.xml.bz2:ro wp-to-sql postgres://<user>:<password>@<host>:<port>/
```

For more advanced usage, check the help:
```sh
docker run --rm -it wp-to-sql --help
```

### Manual
If you prefer to run the program manually, you can do so by following these steps:

1. Install the required dependencies:
```sh
pip install pipenv
pipenv install
```

2. Download the latest Wikipedia dump from [https://dumps.wikimedia.org/](https://dumps.wikimedia.org/)

3. Extract the dump using a tool like [PeaZip](https://peazip.github.io/) or [7-Zip](https://www.7-zip.org/)

4. Run the program:
```sh
pipenv run python src/main.py -i /path/to/dump/enwiki-latest-pages-articles.xml postgres://<user>:<password>@<host>:<port>/
```
