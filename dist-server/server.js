"use strict";

var express = require("express");

var app = express();

var bcrypt = require("bcryptjs");

var cookieSession = require("cookie-session");

var cors = require("cors");

var debug = require("debug")("coursemapper:src/server");

var db = require("./models");

var http = require("http");

var Role = db.role;
var User = db.user;

require("dotenv").config();

var env = process.env.NODE_ENV || "production";
env !== "production" ? app.use(cors()) : ""; // Middlewares

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(cookieSession({
  name: "coursemapper-session",
  secret: process.env.COOKIE_SECRET,
  httpOnly: true
})); // Get port from environment and store in Express

var port = normalizePort(process.env.PORT || "8090");
app.set("port", port); // Create connection to MongoDB

db.mongoose.connect(process.env.MONGO_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  console.log("Successfully connect to MongoDB.");
  initializeDB();
})["catch"](function (err) {
  console.error("Error connecting to MongoDB.", err);
  process.exit();
}); // Routes

require("./routes/auth.routes")(app);

require("./routes/user.routes")(app);

require("./routes/course.routes")(app);

require("./routes/topic.routes")(app);

require("./routes/channel.routes")(app);

require("./routes/material.routes")(app); // Create HTTP server


var server = http.createServer(app); // Listen on provided port, on all network interfaces

server.listen(port);
server.on("error", onError);
server.on("listening", onListening); // Initialize database

function initializeDB() {
  Role.estimatedDocumentCount(function (err, count) {
    if (!err && count === 0) {
      new Role({
        name: "user"
      }).save(function (err) {
        if (err) {
          console.log("error", err);
        }

        console.log("Added 'user' to roles collection");
      });
      new Role({
        name: "moderator"
      }).save(function (err) {
        if (err) {
          console.log("error", err);
        }

        console.log("Added 'moderator' to roles collection");
      });
      new Role({
        name: "admin"
      }).save(function (err) {
        if (err) {
          console.log("error", err);
        }

        console.log("Added 'admin' to roles collection");
      });
    }
  });
  User.estimatedDocumentCount(function (err, count) {
    if (!err && count === 0) {
      var password = bcrypt.hashSync(process.env.PASS, 10);
      new User({
        username: "admin",
        email: "admin@soco.com",
        password: password
      }).save(function (err, user) {
        if (err) {
          console.log("error", err);
          return;
        }

        Role.findOne({
          name: "admin"
        }, function (err, role) {
          if (err) {
            console.log("error", err);
          }

          user.roles = [role._id];
          user.save(function (err) {
            if (err) {
              console.log("error", err);
            }

            console.log("Admin created successfully! Username: admin" + ", Password: " + process.env.PASS);
          });
        });
      });
    }
  });
} // Normalize a port into a number, string, or false


function normalizePort(val) {
  var port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
} // Event listener for HTTP server "error" event


function onError(error) {
  if (error.syscall !== "listen") throw error;
  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port; // handle specific listen errors with friendly messages

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
} // Event listener for HTTP server "listening" event


function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  console.log("Starting " + env.trim() + " server on port " + port);
  debug("Listening on " + bind);
}