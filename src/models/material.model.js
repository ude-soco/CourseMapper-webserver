const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Material = new Schema({
  type: { type: String },
  name: { type: String },
  desciption: { type: String, default: "" },
  url: { type: String },
  topicId: {
    type: Schema.Types.ObjectId,
    ref: "topic",
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "course",
  },
  channelId: {
    type: Schema.Types.ObjectId,
    ref: "channel",
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "channel",
  },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

module.exports = mongoose.model("material", Material);
