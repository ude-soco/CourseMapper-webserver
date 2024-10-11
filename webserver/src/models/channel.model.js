const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Channel = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
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
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  materials: [
    {
      type: Schema.Types.ObjectId,
      ref: "material",
      default: [],
    },
  ],
  indicators: [
    {
      _id: Schema.Types.ObjectId,
      src: String,
      width: String,
      height: String,
      frameborder: String,
    },
  ],
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

module.exports = mongoose.model("channel", Channel);
