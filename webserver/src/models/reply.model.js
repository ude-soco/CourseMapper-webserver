const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Reply = new Schema({
  content: { type: String, required: true },
  author: {
    userId: { type: Schema.Types.ObjectId, required: true },
    username: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      _id: { type: Schema.Types.ObjectId, ref: "role" },
      name: { type: String, required: true },
    },
  },
  courseId: { type: Schema.Types.ObjectId, ref: "course", required: true },
  topicId: { type: Schema.Types.ObjectId, ref: "topic", required: true },
  channelId: { type: Schema.Types.ObjectId, ref: "channel", required: true },
  materialId: { type: Schema.Types.ObjectId, ref: "material", required: true },
  annotationId: {
    type: Schema.Types.ObjectId,
    ref: "annotation",
    required: true,
  },
  likes: [{ type: Schema.Types.ObjectId, default: [] }],
  dislikes: [{ type: Schema.Types.ObjectId, default: [] }],
  mentionedUsers: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
      name: { type: String, required: true },
      username: { type: String, required: true },
    },
  ],
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

module.exports = mongoose.model("reply", Reply);
