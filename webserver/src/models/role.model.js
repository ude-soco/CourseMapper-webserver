const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Role = new Schema({
  name: {
    type: String,
    enum: ["admin", "user", "teacher", "co_teacher", "non_editing_teacher"],
    default: "user",
    required: true
  },
});

module.exports = mongoose.model("role", Role);
