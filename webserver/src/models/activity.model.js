const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Activity = new Schema({
  statement: mongoose.Mixed
});

module.exports = mongoose.model("activity", Activity);
