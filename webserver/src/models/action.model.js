const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Action = new Schema({
  sent: Boolean,
  statement: mongoose.Mixed
});

module.exports = mongoose.model("action", Action);
