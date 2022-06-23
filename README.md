# CourseMapper

## 🚀 Get Started

1. Using Docker 🐳

   - Download and install [Docker](https://www.docker.com/products/docker-desktop)

   - Download and install [MongoDB Compass](https://www.mongodb.com/try/download/compass)

   - Download and install [NodeJS](https://nodejs.org/en/)

   - Open a command prompt/terminal and move to the `webserver` directory. Then type the following command:

     ```
     npm ci
     ```

   - Move back to `CourseMapper-webserver` directory and type the following command in the command prompt/terminal:

     ```
     docker-compose up --build
     ```

<br/>

2.  Manual Installation Guide 🔨

    - Download and install [NodeJS](https://nodejs.org/en/)

    - Download and install [MongoDB](https://www.mongodb.com/try/download/community)

    - Rename the file `example.env` to `.env`

    - Open a command prompt/terminal and move to the `webserver` directory. Then type the following command:

      - Install node packages

        ```
        npm ci
        ```

      - Run the script and starts the application

        ```
        npm run watch:dev
        ```

    - Stop the server by pressing `cntl + c` inside the command prompt

    - Application will open automatically at localhost:8080
