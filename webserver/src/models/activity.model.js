const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Activity = new Schema({
  statement: mongoose.Mixed,
  sent: Boolean
});

module.exports = mongoose.model("activity", Activity);
