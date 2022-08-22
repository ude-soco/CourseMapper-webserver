# CourseMapper

## 🚀 Get Started

Download and install the following softwares

- [MongoDB](https://www.mongodb.com/try/download/community)
- [MongoDB Compass](https://www.mongodb.com/try/download/compass)
- [NodeJS](https://nodejs.org/en/)
- [Postman](https://www.postman.com/downloads/)

Use either step 1 or 2 to install the project. After successfully installation of the project, jump to step 3.

1. Using Docker 🐳

    - Download and install [Docker](https://www.docker.com/products/docker-desktop)
    - Open a command prompt, move to the `webserver` directory, and then type the command `npm ci`
    - Then move to the `webapp` directory, and type the command `npm ci`
    - Move back to root directory and type the following command `docker-compose up --build`

2. Manual Installation Guide 🔨

    - Webserver installation
        - Move to the `webserver` directory and rename the file `example.env` to `.env`
        - Open a command prompt/terminal in the `webserver` directory, and type the command `npm ci` to install node
          packages
        - After the packages are installed, type `npm run watch:dev` to run the server
        - Application will open automatically at http://localhost:8080
        - Stop the server by pressing `cntl + c` inside the command prompt

    - Webapp installation
        - Move to the `webapp` directory, open a command prompt/terminal in the `webapp` directory, and type the
          command `npm ci` to install node
          packages
        - Install the Angular CLI by typing the command `npm i -g @angular/cli` in the command prompt
        - After the packages are installed, type `ng serve` to run the server
        - Application will open automatically at http://localhost:4200
        - Stop the server by pressing `cntl + c` inside the command prompt

3. Postman configuration

    - Open the Postman software and import the file `CourseMapper.postman_collection.json` found under `docs` folder

4. MongoDB Compass configuration

    - Open MongoDB Compass and type `mongodb://localhost:27017` in the URI textbox and press connect button
    - Find the database `coursemapper_v2` in the left panel


