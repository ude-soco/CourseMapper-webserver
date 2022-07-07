const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Annotation = new Schema({
  type: { type: String, required: true },
  content: { type: String, required: true },
  author: {
    userId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
  },
  location: { type: Schema.Types.Mixed },
  tool: { type: Schema.Types.Mixed },
  courseId: { type: Schema.Types.ObjectId, ref: "course", required: true },
  topicId: { type: Schema.Types.ObjectId, ref: "topic", required: true },
  channelId: { type: Schema.Types.ObjectId, ref: "channel", required: true },
  materialId: { type: Schema.Types.ObjectId, ref: "material", required: true },
  likes: [{ type: Schema.Types.ObjectId, default: [] }],
  dislikes: [{ type: Schema.Types.ObjectId, default: [] }],
  replies: [{ type: Schema.Types.ObjectId, ref: "reply", default: [] }],
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

module.exports = mongoose.model("annotation", Annotation);
