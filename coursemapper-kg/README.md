# CourseMapper-KnowledgeGraph

## 🔨 Development Setup Guide

#### Step 1: Pre-requisites

Download the following software and install them on your machine:

- Python (v3.7.2) from [the official website](https://www.python.org/downloads/release/python-372/)

- Neo4j Desktop from [the official website](https://neo4j.com/download-center/#desktop), install it, start the server, and login to the server.

- Redis from [the Redis releases page](https://github.com/tporadowski/redis/releases) and install it

- [IntelliJ Ultimate](https://www.jetbrains.com/de-de/idea/download/#section=windows) or [Visual Studio Code](https://code.visualstudio.com/download) and install one of the code editors.

- [Github Desktop](https://desktop.github.com/)

- Download Elmo packages: [Link 1](https://s3-us-west-2.amazonaws.com/allennlp/models/elmo/2x4096_512_2048cnn_2xhighway/elmo_2x4096_512_2048cnn_2xhighway_weights.hdf5) and [Link 2](https://uni-duisburg-essen.sciebo.de/s/r4bNsDrkuAkPSfo/download), and copy it inside `coursemapper-kg/app/algorithms` folder

- Download [StanfordCoreNLP](https://uni-duisburg-essen.sciebo.de/s/nO06q2wY0t5h8SO) and extract the ZIP file inside `coursemapper-kg/app/algorithms` folder. Make sure the stanford-corenlp folder name is `stanford-corenlp-full-2018-02-27`. 

- Download and install [Java JDK](https://www.oracle.com/java/technologies/downloads/)


See the step-by-step guide with screenshots to install the necessary softwares and the file [here]()

#### Step 2: Installation Guide for CourseMapper-KnowledgeGraph

- Using your file explorer, go inside the project directory `coursemapper-kg`. First, copy the `example.env` file and paste it in the same folder. Rename the copied environment file to `.env`. Change the values (`NEO4J_USER` and `NEO4J_PW`) of the environment variables in the `.env` file to your own values.

- Open a terminal in the project directory `coursemapper-kg` (with **administration rights** for Windows)

- Install and activate python virtual environment for Windows

  - Type the following commands to install and activate the virtual environment:

    - Install python virtual environment (only first time)

      ```bash
      pip install pipenv
      ```

    - Install python package (only first time)

      ```bash
      pipenv install
      ```

    - Activate the virtual environment

      ```bash
      pipenv shell
      ```

      (**Optional**) To check the location of your Python virtual environment, type `pipenv --venv` the following command in your command prompt

- Download the spacy package

    ```
    python -m spacy download en
    ```

- Move to the directory `coursemapper-kg`, open a terminal, copy the codes below and paste it in the terminal one at a time to download the necessary nltk and sentence transformer packages.

  ```
  python -c "import nltk;nltk.download('stopwords'); nltk.download('punkt'); nltk.download('wordnet'); import spacy; spacy.cli.download('en_core_web_sm'); from sentence_transformers import SentenceTransformer; SentenceTransformer('all-mpnet-base-v2'); from flair.embeddings import TransformerDocumentEmbeddings;  TransformerDocumentEmbeddings('sentence-transformers/msmarco-distilbert-base-tas-b');"
  ```

  ```
  python -c "from app.services.course_materials.kwp_extraction.model import KeyphraseExtractor; KeyphraseExtractor(); KeyphraseExtractor('squeezebert/squeezebert-mnli');"
  ```

  ```
  python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-mpnet-base-v2'); from flair.embeddings import TransformerDocumentEmbeddings;  TransformerDocumentEmbeddings('sentence-transformers/msmarco-distilbert-base-tas-b');"
  ```

- Run the worker
  ```bash
  pipenv run python -m app.worker
  ```
