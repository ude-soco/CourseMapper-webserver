const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const User = new Schema({
  username: { type: String },
  email: { type: String },
  password: { type: String },
  roles: [
    {
      type: Schema.Types.ObjectId,
      ref: "role",
    },
  ],
});

module.exports = mongoose.model("user", User);
