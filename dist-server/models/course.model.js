"use strict";

var mongoose = require("mongoose");

var Schema = mongoose.Schema;
var Course = new Schema({
  name: {
    type: String
  },
  shortName: {
    type: String
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user"
  },
  updatedAt: {
    type: Date
  },
  createdAt: {
    type: Date
  },
  description: {
    type: String
  },
  topics: [{
    type: Schema.Types.ObjectId,
    ref: "topic",
    "default": []
  }],
  channels: [{
    type: Schema.Types.ObjectId,
    ref: "channel",
    "default": []
  }]
});
module.exports = mongoose.model("course", Course);