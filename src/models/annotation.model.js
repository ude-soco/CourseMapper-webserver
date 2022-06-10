const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Annotation = new Schema({
  type: { type: String },
  content: { type: String },
  username: { type: String },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
  topicId: {
    type: Schema.Types.ObjectId,
    ref: "topic",
  },
  materialId: {
    type: Schema.Types.ObjectId,
    ref: "material",
  },
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: "user",
      default: [],
    },
  ],
  dislikes: [
    {
      type: Schema.Types.ObjectId,
      ref: "user",
      default: [],
    },
  ],
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

module.exports = mongoose.model("annotation", Annotation);
