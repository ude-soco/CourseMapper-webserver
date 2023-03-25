<p align="center">
<a href="https://www.uni-due.de/soco/research/projects/elas.php" target="_blank" rel="noopener noreferrer">
<img width=50% src="webapp/src/assets/logo.svg" alt="re-frame logo">
</a>
</p>

<p>
CourseMapper is a collaborative course annotation and analytics platform that fosters collaboration and interaction around pdf/video learning materials, supported by visual learning analytics.
</p>

## Build and run all services

* `make up` (or `docker compose up`) to run the application
* `make tilt` to automatically rebuild/restart containers during development
* `make dev` to run processes in containers, but mount source code from host machine
* see the manual below to install dependencies and run processes w/o containers


## 🚀 Get Started

### Manual Installation Guide 🔨

#### Step 1: Pre-requisites

- Download NodeJS (v16.14.2) from [the official website](https://nodejs.org/en/blog/release/v16.14.2)

- Download [IntelliJ Ultimate](https://www.jetbrains.com/de-de/idea/download/#section=windows) or [Visual Studio Code](https://code.visualstudio.com/download) and install one of the code editors

- Download [MongoDB Community Server](https://www.mongodb.com/try/download/community) and [MongoDB Compass](https://www.mongodb.com/try/download/compass) and install them

- Download [Postman](https://www.postman.com/downloads/) and install it


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

#### Step 4: Postman configuration

- Open the Postman software and import the file `CourseMapper.postman_collection.json` found under `docs` folder

#### Step 5: MongoDB Compass configuration

- Open MongoDB Compass and type `mongodb://localhost:27017` in the URI textbox and press connect button
- Find the database `coursemapper_v2` in the left panel

### Installation using Using Docker 🐳 (Updates required)

- Download and install [Docker](https://www.docker.com/products/docker-desktop)
- Open a command prompt, move to the `webserver` directory, and then type the command `npm ci`
- Then move to the `webapp` directory, and type the command `npm ci`
- Move back to root directory and type the following command `docker-compose up --build`
