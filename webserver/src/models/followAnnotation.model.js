const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const FollowAnnotation = new Schema({
  topicId: {
    type: Schema.Types.ObjectId,
    ref: "topic",
    required: true,
  },
  channelId: {
    type: Schema.Types.ObjectId,
    ref: "channel",
    required: true,
  },
  materialId: {
    type: Schema.Types.ObjectId,
    ref: "material",
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
  annotationId: {
    type: Schema.Types.ObjectId,
    ref: "annotation",
    required: true,
  },
  isFollowing: { type: Boolean, default: true },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

module.exports = mongoose.model("followAnnotation", FollowAnnotation);
