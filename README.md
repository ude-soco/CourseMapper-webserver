[![CI](https://github.com/ude-soco/CourseMapper-webserver/actions/workflows/ci.yml/badge.svg)](https://github.com/ude-soco/CourseMapper-webserver/actions/workflows/ci.yml)

<p align="center"><a href="https://www.uni-due.de/soco/research/projects/elas.php" target="_blank" rel="noopener noreferrer"><img width=50% src="webapp/src/assets/logo.svg" alt="re-frame logo"></a></p>

CourseMapper is a collaborative course annotation and analytics platform that fosters collaboration and interaction around pdf/video learning materials, supported by visual learning analytics.

## 🚀 Get Started

#### Live instances

- Production:
  [coursemapper.de](https://coursemapper.de/)
  ([branch `main`](https://github.com/ude-soco/CourseMapper-webserver/tree/main))
  ![status](https://argocd.cluster.soco.inko.cloud/api/badge?name=cmw-prod)
- Preview:
  [br-dev.coursemapper.de](https://br-dev.coursemapper.de/)
  ([branch `dev`](https://github.com/ude-soco/CourseMapper-webserver/tree/dev))
  ![status](https://argocd.cluster.soco.inko.cloud/api/badge?name=cmw-br-dev)

*Note:* Stable [releases](https://github.com/ude-soco/CourseMapper-webserver/releases) are currently not running in production.

#### Build and run

- `make up` to run the application using _Docker Compose_
- `make tilt` to automatically rebuild during development using _Tilt_
- `make mounted` to run processes using _Docker Compose_, but mount source code from host machine
- see the manual below to install dependencies and run processes _locally, without containers_

Visit the [proxy service on port 8000](http://localhost:8000/) to use the application.

## 🖥️ Application stack

The services making up the coursemapper-webserver application are released as [container images, hosted on GitHub Packages](https://github.com/orgs/ude-soco/packages?repo_name=CourseMapper-webserver). Additional third-party images used:
- MongoDB: [mongo (official image)](https://hub.docker.com/_/mongo)
- Neo4J: [neo4j (official image)](https://hub.docker.com/_/neo4j)
- Redis: [redis (official image)](https://hub.docker.com/_/redis)


## 🔨 Development Setup Guide

<details>
<summary>Step by step manual for setting up a development machine running a desktop environment</summary>

#### Step 1: Pre-requisites

- Download NodeJS (v16.14.2) from [the official website](https://nodejs.org/en/blog/release/v16.14.2)
- Download [MongoDB Community Server](https://www.mongodb.com/try/download/community) and [MongoDB Compass](https://www.mongodb.com/try/download/compass) and install them
- Neo4j Desktop from [the official website](https://neo4j.com/download-center/#desktop), install it, start the server, and login to the server.
- Redis from [the Redis releases page](https://github.com/tporadowski/redis/releases) and install it
- Download [Postman](https://www.postman.com/downloads/) and install it
- Download and install Github Desktop [official website](https://desktop.github.com/)

#### Step 2: Installation Guide for CourseMapper webserver

- Using your file explorer, go inside the directory `webserver`, copy the `example.env` file and paste it in the same folder. Rename the copied environment file to `.env`

- open ubuntu command prompt and type `sudo service redis-server start`

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

See [README.md](coursemapper-kg/concept-map/README.md) in the `coursemapper-kg/concept-map` directory and [README.md](coursemapper-kg/recommendation/README.md) in the `coursemapper-kg/recommendation` directory for installation instructions.

#### Step 5: Postman configuration

- Open the Postman software and import the file `CourseMapper.postman_collection.json` found under `docs` folder

#### Step 6: MongoDB Compass configuration

- Open MongoDB Compass and type `mongodb://localhost:27017` in the URI textbox and press connect button
- Find the database `coursemapper_v2` in the left panel
</details>
