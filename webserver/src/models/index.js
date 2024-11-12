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
db.tag = require("./tag.model");
db.reply = require("./reply.model");
db.activity = require("./activity.model");
db.userNotifications = require("./userNotifications.model");

db.blockingNotifications = require("./blockingNotifications.model");
db.ROLES = ["admin", "teacher", "co_teacher", "non_editing_teacher", "user"];
db.followAnnotation = require("./followAnnotation.model");

module.exports = db;
