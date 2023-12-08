const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserNotification = new Schema({
  activityId: { type: Schema.Types.ObjectId, required: true, ref: "activity" },
  //below field being used to create a Time to live index to remove the document after 30 days
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 2592000,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
    index: true,
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "course",
    required: true,
    index: true,
  },
  topicId: {
    type: Schema.Types.ObjectId,
    ref: "topic",
    index: true,
  },
  channelId: {
    type: Schema.Types.ObjectId,
    ref: "channel",
    index: true,
  },
  materialId: {
    type: Schema.Types.ObjectId,
    ref: "material",
    index: true,
  },
  annotationId: {
    type: Schema.Types.ObjectId,
    ref: "annotation",
    index: true,
  },
  replyId: {
    type: Schema.Types.ObjectId,
    ref: "reply",
    index: true,
  },

  isStar: { type: Boolean, required: true, default: false },
  isRead: { type: Boolean, required: true, default: false },
});

module.exports = mongoose.model("userNotification", UserNotification);
