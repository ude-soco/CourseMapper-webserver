const mongoose = require("mongoose");

const Schema = mongoose.Schema;

//TODO, add stricter types on notificationInfo for MongooseValidation
const Activity = new Schema({
  statement: mongoose.Mixed,
  sent: Boolean,
  notificationInfo: mongoose.Mixed,
});

module.exports = mongoose.model("activity", Activity);
