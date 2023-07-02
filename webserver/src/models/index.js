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
db.notification = require("./notificationBaoui.model");
db.userTopicSubscriber = require("./userTopicSubscriber.model");
db.userChannelSubscriber = require("./userChannelSubscriber.model");
db.userCourseSubscriber = require("./userCourseSubscriber.model");
db.blockingNotification = require("./blockingNotifications.model");
db.ROLES = ["user", "admin", "moderator"];

module.exports = db;
