const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Channel = new Schema({
  name: { type: String },
  description: { type: String },
  topicId: {
    type: Schema.Types.ObjectId,
    ref: "topic",
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "course",
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  materials: [
    {
      type: Schema.Types.ObjectId,
      ref: "material",
      default: [],
    },
  ],
});

module.exports = mongoose.model("channel", Channel);
