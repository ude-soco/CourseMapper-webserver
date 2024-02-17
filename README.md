[![CI](https://github.com/ude-soco/CourseMapper-webserver/actions/workflows/ci.yml/badge.svg)](https://github.com/ude-soco/CourseMapper-webserver/actions/workflows/ci.yml)

<p align="center"><a href="https://www.uni-due.de/soco/research/projects/elas.php" target="_blank" rel="noopener noreferrer"><img width=50% src="webapp/src/assets/logo.svg" alt="re-frame logo"></a></p>

CourseMapper is a collaborative course annotation and analytics platform that fosters collaboration and interaction around pdf/video learning materials, supported by visual learning analytics.

## 🚀 Get Started

#### Live instances

- Production: [coursemapper.soco.inko.cloud](https://coursemapper.soco.inko.cloud/) (latest [release](https://github.com/ude-soco/CourseMapper-webserver/releases))
- Preview: [edge.coursemapper.soco.inko.cloud](https://edge.coursemapper.soco.inko.cloud/) ([branch `main`](https://github.com/ude-soco/CourseMapper-webserver/tree/main))
- Preview: [development.coursemapper.soco.inko.cloud](https://development.coursemapper.soco.inko.cloud/) ([branch `development`](https://github.com/ude-soco/CourseMapper-webserver/tree/development))

#### Build and run

- `make up` to run the application using _Docker Compose_
- `make tilt` to automatically rebuild during development using _Tilt_
- `make mounted` to run processes using _Docker Compose_, but mount source code from host machine
- see the manual below to install dependencies and run processes _locally, without containers_

Visit the [proxy service on port 8000](http://localhost:8000/) to use the application.

## 🖥️ Application stack

The services making up the coursemapper-webserver project use the following images, hosted on Docker Hub:

- proxy: not published, only required for environments without built-in HTTP routing
- webapp: [socialcomputing/coursemapper-webserver-webapp](https://hub.docker.com/repository/docker/socialcomputing/coursemapper-webserver-webapp/general)
- webserver: [socialcomputing/coursemapper-webserver-webserver](https://hub.docker.com/repository/docker/socialcomputing/coursemapper-webserver-webserver/general)
- coursemapper-kg: [socialcomputing/coursemapper-webserver-coursemapper-kg](https://hub.docker.com/repository/docker/socialcomputing/coursemapper-webserver-coursemapper-kg/general)
- MongoDB: [mongo (official image)](https://hub.docker.com/_/mongo)

## 🔨 Development Setup Guide

#### Step 1: Pre-requisites

- Download NodeJS (v16.14.2) from [the official website](https://nodejs.org/en/blog/release/v16.14.2)

- Python (v3.7.2) from [the official website](https://www.python.org/downloads/release/python-372/)

- Download [Java JDK 17](https://www.oracle.com/java/technologies/downloads/) and install it

- Download [IntelliJ Ultimate](https://www.jetbrains.com/de-de/idea/download/#section=windows) or [Visual Studio Code](https://code.visualstudio.com/download) and install one of the code editors

- Download [MongoDB Community Server](https://www.mongodb.com/try/download/community) and [MongoDB Compass](https://www.mongodb.com/try/download/compass) and install them

- Neo4j Desktop from [the official website](https://neo4j.com/download-center/#desktop), install it, start the server, and login to the server.

- Redis from [the Redis releases page](https://github.com/tporadowski/redis/releases) and install it

- Downlod Elmo packages: [Link 1](https://s3-us-west-2.amazonaws.com/allennlp/models/elmo/2x4096_512_2048cnn_2xhighway/elmo_2x4096_512_2048cnn_2xhighway_weights.hdf5) and [Link 2](https://uni-duisburg-essen.sciebo.de/s/r4bNsDrkuAkPSfo/download), and copy it inside `coursemapper-kg/app/algorithms` folder

- Download [StanfordCoreNLP](https://uni-duisburg-essen.sciebo.de/s/nO06q2wY0t5h8SO) and extract the ZIP file inside `coursemapper-kg/app/algorithms` folder. Make sure the stanford-corenlp folder name is `stanford-corenlp-full-2018-02-27`.

- Download [Postman](https://www.postman.com/downloads/) and install it

- Download and install Github Desktop [official website](https://desktop.github.com/)

#### Step 2: Installation Guide for CourseMapper webserver

- Using your file explorer, go inside the directory `webserver`, copy the `example.env` file and paste it in the same folder. Rename the copied environment file to `.env`

- Open a command prompt/terminal in the `webserver` directory

- Type the command in the command prompt/terminal to install node packages

  ```bash
  npm ci
  ```

  If you face issue with `npm ci` command, try `npm install` or `npm install --force` command. Caution: `npm install` and `npm install --force` will delete all the existing node packages, install the new ones and update the `package-lock.json` file. Please make sure you do not push your changes to the `package-lock.json` file.

- After the packages are installed, type the following command to run the server

  ```bash
  npm run watch:dev
  ```

  The server will run at [http://localhost:8080](http://localhost:8080)

- Stop the server by pressing `Cntl + c` inside the command prompt

#### Step 3: Installation Guide for CourseMapper webapp

- Open a command prompt/terminal in the `webapp` directory

- Type the command in the command prompt/terminal to install the Angular CLI

  ```bash
  npm i -g @angular/cli
  ```

- Type the command in the command prompt/terminal to install node packages

  ```bash
  npm ci
  ```

- After the packages are installed, type the following command to run the server

  ```bash
  ng serve
  ```

  The server will run at [http://localhost:4200](http://localhost:4200)

- Stop the server by pressing `Cntl + c` inside the command prompt

#### Step 4: Installation Guide for CourseMapper coursemapper-kg

- Using your file explorer, go inside the directory `coursemapper-kg`

	- Copy the `example.env` file and paste it in the same folder. Rename the copied environment file to `.env`. Change the values (`NEO4J_USER`, `NEO4J_PW`, `REDIS_PASSWORD`) of the environment variables in the `.env` file to your own values.

- Open a command prompt/terminal in the `coursemapper-kg` directory (with **administration rights** for Windows)

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

    - Activate the virtual environment (every time when you want to start the server)

      ```bash
      pipenv shell
      ```

      (**Optional**) To check the location of your Python virtual environment, type `pipenv --venv` the following command in your command prompt

- Download the spacy package

  ```
  python -m spacy download en
  ```

- Move to the directory `coursemapper-kg`, open a terminal, copy the codes below and paste it in the terminal one at a time to download the necessary nltk and sentence transformer packages.

  Make sure that you have downloaded the models from number 7 and 8 from step 1 above.

  ```
  python -c "import nltk;nltk.download('stopwords'); nltk.download('punkt'); nltk.download('wordnet'); import spacy; spacy.cli.download('en_core_web_sm'); from sentence_transformers import SentenceTransformer; SentenceTransformer('all-mpnet-base-v2'); from flair.embeddings import TransformerDocumentEmbeddings;  TransformerDocumentEmbeddings('sentence-transformers/msmarco-distilbert-base-tas-b'); from app.services.course_materials.kwp_extraction.model import KeyphraseExtractor; KeyphraseExtractor(); KeyphraseExtractor('squeezebert/squeezebert-mnli');"
  ```

- Run the worker

  ```bash
  pipenv run python -m app.worker
  ```

#### Step 5: Postman configuration

- Open the Postman software and import the file `CourseMapper.postman_collection.json` found under `docs` folder

#### Step 6: MongoDB Compass configuration

- Open MongoDB Compass and type `mongodb://localhost:27017` in the URI textbox and press connect button
- Find the database `coursemapper_v2` in the left panel
