# CourseMapper-KnowledgeGraph Recommendation

## 🔨 Development Setup Guide

#### Step 1: Pre-requisites

Download the following software and install them on your machine:

- Python (v3.7.2) from [the official website](https://www.python.org/downloads/release/python-372/)

- Neo4j Desktop from [the official website](https://neo4j.com/download-center/#desktop), install it, start the server, and login to the server.

- [IntelliJ Ultimate](https://www.jetbrains.com/de-de/idea/download/#section=windows) or [Visual Studio Code](https://code.visualstudio.com/download) and install one of the code editors.

- [Github Desktop](https://desktop.github.com/)


See the step-by-step guide with screenshots to install the necessary softwares and the file [here]()

#### Step 2: Installation Guide for CourseMapper-KnowledgeGraph

- Using your file explorer, go inside the project directory `coursemapper-kg/recommendation`. First, copy the `example.env` file and paste it in the same folder. Rename the copied environment file to `.env`. Change the values (`NEO4J_USER` and `NEO4J_PASSWORD`) of the environment variables in the `.env` file to your own values.

- Open a terminal in the project directory `coursemapper-kg/concept-map` (with **administration rights** for Windows)

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

- Copy the codes below and paste it in the terminal one at a time to download the necessary nltk and sentence transformer packages.

  ```
  python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-mpnet-base-v2'); from flair.embeddings import TransformerDocumentEmbeddings;  TransformerDocumentEmbeddings('sentence-transformers/msmarco-distilbert-base-tas-b');"
  ```

- Run the worker
  ```bash
  pipenv run python -m app.worker 
  ```
