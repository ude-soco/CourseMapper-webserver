const mongoose = require("mongoose");

const Schema = mongoose.Schema;
//Any user that has subscribed to a course, will have a row here with his userId and subscribed courseId
//TODO add indexes to the arrays
//TODO use explain() to see if the indexes are being used

const BlockingNotifications = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "course",
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
    index: true,
  },
  topics: [
    {
      topicId: {
        type: Schema.Types.ObjectId,
        ref: "topic",
      },
      isAnnotationNotificationsEnabled: { type: Boolean },
      isReplyAndMentionedNotificationsEnabled: { type: Boolean },
      isCourseUpdateNotificationsEnabled: { type: Boolean },
    },
  ],
  channels: [
    {
      topicId: {
        type: Schema.Types.ObjectId,
        ref: "topic",
      },
      channelId: {
        type: Schema.Types.ObjectId,
        ref: "channel",
      },
      isAnnotationNotificationsEnabled: { type: Boolean },
      isReplyAndMentionedNotificationsEnabled: { type: Boolean },
      isCourseUpdateNotificationsEnabled: { type: Boolean },
    },
  ],
  materials: [
    {
      materialId: {
        type: Schema.Types.ObjectId,
        ref: "material",
      },
      topicId: {
        type: Schema.Types.ObjectId,
        ref: "topic",
      },
      channelId: {
        type: Schema.Types.ObjectId,
        ref: "channel",
      },
      isAnnotationNotificationsEnabled: { type: Boolean },
      isReplyAndMentionedNotificationsEnabled: { type: Boolean },
      isCourseUpdateNotificationsEnabled: { type: Boolean },
    },
  ],

  //TODO Implement the field for the following of annotations
});

module.exports = mongoose.model("blockingNotifications", BlockingNotifications);
