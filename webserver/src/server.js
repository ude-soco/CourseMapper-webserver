import express from "express";
import { hashSync } from "bcryptjs";
import cookieSession from "cookie-session";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import debugLib from "debug";
import bodyParser from "body-parser";
import path from "path";

dotenv.config();
const env = process.env.NODE_ENV || "production";
const app = express();
const debug = debugLib("coursemapper-webserver:src/server");
const db = require("./models");
const Role = db.role;
const User = db.user;

global.__basedir = __dirname;

env !== "production" ? app.use(cors({
  credentials: true,
  origin: ["http://localhost:4200"],
})) : "";

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/", express.static(path.join(__dirname, "public")));
app.use(
  cookieSession({
    name: "coursemapper-session",
    secret: process.env.COOKIE_SECRET,
    httpOnly: true,
  })
);
app.use('*/public/uploads',express.static('public/uploads'));
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

// Routes
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

// Create HTTP server
const server = http.createServer(app);

// Listen on provided port, on all network interfaces
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

// Initialize database
function initializeDB() {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({
        name: "user",
      }).save((err) => {
        if (err) {
          console.log("error", err);
        }
        console.log("Added 'user' to roles collection");
      });
      new Role({
        name: "moderator",
      }).save((err) => {
        if (err) {
          console.log("error", err);
        }
        console.log("Added 'moderator' to roles collection");
      });
      new Role({
        name: "admin",
      }).save((err) => {
        if (err) {
          console.log("error", err);
        }
        console.log("Added 'admin' to roles collection");
      });
    }
  });

  User.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      let password = hashSync(process.env.PASS, 10);
      new User({
        firstname: "Admin",
        lastname: "User",
        username: "admin",
        email: "admin@soco.com",
        password: password,
      }).save((err, user) => {
        if (err) {
          console.log("error", err);
          return;
        }
        Role.findOne({ name: "admin" }, (err, role) => {
          if (err) {
            console.log("error", err);
          }
          user.role = role._id;
          user.save((err) => {
            if (err) {
              console.log("error", err);
            }
            console.log(
              "Admin created successfully! Username: admin" +
                ", Password: " +
                process.env.PASS
            );
          });
        });
      });
    }
  });
}

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
