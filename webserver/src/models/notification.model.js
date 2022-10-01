const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Notification = new Schema({
  userName: { type: String },
  userShortname: { type: String },
  type: { type: String },
  action: { type: String },
  actionObject: { type: String },
  name: { type: String },
  extraMessage: { type: String },
  createdAt: { type: Date, default: Date.now() },
  read: { type: Boolean, default: false },
  isStar: { type: Boolean, default: false },
});

module.exports = mongoose.model("notification", Notification);
