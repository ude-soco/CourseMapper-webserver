const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Role = new Schema({
  name: String,
});

module.exports = mongoose.model("role", Role);
