import express from "express";
import { hashSync } from "bcryptjs";
import cookieSession from "cookie-session";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import debugLib from "debug";
import bodyParser from "body-parser";
import path from "path";
import socketio from "./socketio";
import addErrorHandling from "./middlewares/exceptionHandling";
import mongoose from "mongoose";

dotenv.config();
const env = process.env.NODE_ENV || "production";
const app = express();
const debug = debugLib("coursemapper-webserver:src/server");
const db = require("./models");
const helpers = require("./helpers/helpers");
const Role = db.role;
const User = db.user;

global.__basedir = __dirname;

env !== "production"
  ? app.use(
    cors({
      credentials: true,
      origin: [
        "http://localhost:4200",
        "https://www.youtube.com/watch?v=",
        "http://127.0.0.1:8081 ",
        process.env.WEBAPP_URL,
      ],
    }),
  )
  : "";

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/", express.static(path.join(__dirname, "public")));

// Error-handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).send({
    message: err.message || 'Internal Server Error',
  });
};
app.use(errorHandler);

app.use(
  cookieSession({
    name: "coursemapper-session",
    secret: process.env.COOKIE_SECRET,
    keys: [process.env.COOKIE_SECRET],
    httpOnly: true,
     maxAge: 24 * 60 * 60 * 1000,
    //24 * 60 * 60 * 1000

  })
);
app.use("/api/public/uploads", express.static("public/uploads"));
addErrorHandling(app);

// Get port from environment and store in Express
const port = normalizePort(process.env.PORT || "8090");
app.set("port", port);

// Create connection to MongoDB
db.mongoose
  .connect(process.env.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to MongoDB.");
    initializeDB();
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB.", err);
    process.exit();
  });

// Create connection to Neo4j
const neo4j = require("./graph/neo4j");
neo4j.connect(
  process.env.NEO4J_URI,
  process.env.NEO4J_USER,
  process.env.NEO4J_PASSWORD,
);

// Create connection to Redis
const redis = require("./graph/redis");
redis.connect(
  process.env.REDIS_HOST,
  process.env.REDIS_PORT,
  process.env.REDIS_DATABASE,
  process.env.REDIS_PASSWORD,
);

// xAPI scheduler
const xapiScheduler = require("./activity-logger/scheduler/scheduler");
xapiScheduler.ActivityScheduler();

// Create HTTP server
const server = http.createServer(app);

// Create Socket.io server; see ./socket.io
socketio.init(server);
socketio.getIO().on("connection", () => {
  console.log("Socket.IO connection established");
});

// Routes
let apiURL = "/api";
app.use(apiURL, require("./routes/activity.routes"));
require("./routes/auth.routes")(app);
require("./routes/user.routes")(app);
require("./routes/course.routes")(app);
require("./routes/topic.routes")(app);
require("./routes/channel.routes")(app);
require("./routes/material.routes")(app);
require("./routes/annotation.routes")(app);
require("./routes/reply.routes")(app);
require("./routes/tag.routes")(app);
require("./routes/fileupload.routes")(app);
require("./routes/filedelete.routes")(app);
require("./routes/videodelete.routes")(app);
require("./routes/test.routes")(app);
require("./routes/debug.routes")(app);
require("./routes/notifications.routes")(app);
require("./routes/knowledgeGraph.routes")(app);

// Listen on provided port, on all network interfaces
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

const initializeDB = async () => {
  let newRole;
  let foundAdmin;
  let roles;
  let countUser;
  try {
    roles = await Role.find({});
    if (roles?.length > 0) {
      console.log(roles.length + " Roles present, checking Co-Teacher and Non-Editing Teacher exist or not...");

      // Check if 'co_teacher' and 'non_editing_teacher' roles already exist
      const isCoTeacher = roles.some((role) => role.name === "co_teacher");
      const isNonEditingTeacher = roles.some((role) => role.name === "non_editing_teacher");

      // Find if the 'moderator' role exists
      const replacedModerator = roles.find((role) => role.name === "moderator");

      // If 'moderator' exists, update its name to 'teacher'
      if (replacedModerator) {
        await Role.updateOne(
          { _id: replacedModerator._id },
          { $set: { name: "teacher" } }
        );
        console.log("'moderator' role updated to 'teacher'.");
      }

      // If either 'co_teacher' or 'non_editing_teacher' doesn't exist, create both
      if (!isCoTeacher || !isNonEditingTeacher) {
        const newRoles = [];
        if (!isCoTeacher) newRoles.push({ name: "co_teacher" });
        if (!isNonEditingTeacher) newRoles.push({ name: "non_editing_teacher" });

        await Role.insertMany(newRoles);
        console.log("Roles added: " + newRoles.map((role) => role.name).join(", "));
      }

    } else {
      [...db.ROLES].forEach(async (userName) => {
        console.log("Adding Role: { name: " + userName + " }");
        newRole = new Role({ name: userName });
        if (userName === "admin") {
          foundAdmin = newRole;
        }
        try {
          await newRole.save();
        } catch (err) {
          console.log(err, "Error in creating role");
          return;
        }
      });
    }

    try {
      countUser = await User.countDocuments({});
      if (countUser > 0) {
        console.log(countUser + " Users present, skipping initialization");
      } else {
        let password = hashSync(process.env.PASS, 10);
        console.log(
          "Adding User: { name: admin, password: " + process.env.PASS + " }"
        );
        let email = process.env.EMAIL;
        let generateMboxAndMboxSha1Sum =
          helpers.generateMboxAndMboxSha1Sum(email);

        try {
          await new User({
            firstname: "Admin",
            lastname: "User",
            username: "admin",
            email: email,
            mbox: generateMboxAndMboxSha1Sum.mbox,
            mbox_sha1sum: generateMboxAndMboxSha1Sum.mbox_sha1sum,
            role: foundAdmin._id instanceof mongoose.Types.ObjectId ? foundAdmin._id : mongoose.Types.ObjectId(foundAdmin._id),
            password: password,
          }).save();
          console.log("Admin user created successfully.");
        } catch (err) {
          console.log(err, "Error in creating admin user");
          return;
        }
      }
    } catch (err) {
      console.log(err.message || err, "Error in counting users");
    }
  } catch (err) {
    console.log(err.message || err, "Error in counting roles or users");
  }
};

// Normalize a port into a number, string, or false
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}

// Event listener for HTTP server "error" event
function onError(error) {
  if (error.syscall !== "listen") throw error;
  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

// Event listener for HTTP server "listening" event
function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  console.log("Starting " + env.trim() + " server on port " + port);
  debug("Listening on " + bind);
}

module.exports = server;
