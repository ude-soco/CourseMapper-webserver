const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Material = new Schema({
  type: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  url: { type: String },
  topicId: {
    type: Schema.Types.ObjectId,
    ref: "topic",
    required: true,
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "course",
    required: true,
  },
  channelId: {
    type: Schema.Types.ObjectId,
    ref: "channel",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "channel",
    required: true,
  },
  indicators: [
    {
      _id: Schema.Types.ObjectId,
      src: String,
      width: String,
      height: String,
      frameborder: String,
    },
  ],
  annotations: [
    {
      type: Schema.Types.ObjectId,
      ref: "annotation",
      default: [],
    },
  ],
  createdAt: { type: Date },
  updatedAt: { type: Date },
  showDialog: { type: Boolean, default: true },

});

module.exports = mongoose.model("material", Material);
