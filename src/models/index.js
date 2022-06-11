const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;

db.user = require("./user.model");
db.role = require("./role.model");
db.course = require("./course.model");
db.topic = require("./topic.model");
db.channel = require("./channel.model");
db.material = require("./material.model");
db.annotation = require("./annotation.model");
db.reply = require("./reply.model");
db.ROLES = ["user", "admin", "moderator"];

module.exports = db;
