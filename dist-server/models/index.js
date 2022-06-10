"use strict";

var mongoose = require("mongoose");

mongoose.Promise = global.Promise;
var db = {};
db.mongoose = mongoose;
db.user = require("./user.model");
db.role = require("./role.model");
db.course = require("./course.model");
db.topic = require("./topic.model");
db.channel = require("./channel.model");
db.material = require("./material.model");
db.ROLES = ["user", "admin", "moderator"];
module.exports = db;