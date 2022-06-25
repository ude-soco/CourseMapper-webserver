const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const User = new Schema({
  firstname: {type: String, required: true},
  lastname: {type: String, required: true},
  username: {type: String, required: true},
  email: {type: String, required: true},
  password: {type: String, required: true},
  roles: [{type: Schema.Types.ObjectId, ref: "role"}],
  createdAt: {type: Date, default: Date.now()},
});

module.exports = mongoose.model("user", User);
