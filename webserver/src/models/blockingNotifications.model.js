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
  isAnnotationNotificationsEnabled: { type: Boolean },
  isReplyAndMentionedNotificationsEnabled: { type: Boolean },
  isCourseUpdateNotificationsEnabled: { type: Boolean },
  isCourseLevelOverride: { type: Boolean, default: false },
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
      isTopicLevelOverride: { type: Boolean, default: false },
      isCourseLevelOverride: { type: Boolean, default: false },
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
      /*       followingAnnotations: [
        {
          annotationId: {
            type: Schema.Types.ObjectId,
            ref: "annotation",
          },
          materialId: {
            type: Schema.Types.ObjectId,
            ref: "material",
          },
          materialType: { type: String },
          annotationContent: { type: String },
        },
      ], */
      isAnnotationNotificationsEnabled: { type: Boolean },
      isReplyAndMentionedNotificationsEnabled: { type: Boolean },
      isCourseUpdateNotificationsEnabled: { type: Boolean },
      isChannelLevelOverride: { type: Boolean, default: false },
      isTopicLevelOverride: { type: Boolean, default: false },
      isCourseLevelOverride: { type: Boolean, default: false },
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
      isMaterialLevelOverride: { type: Boolean, default: false },
      isChannelLevelOverride: { type: Boolean, default: false },
      isTopicLevelOverride: { type: Boolean, default: false },
      isCourseLevelOverride: { type: Boolean, default: false },
    },
  ],

  //TODO Implement the field for the following of annotations
});

module.exports = mongoose.model("blockingNotifications", BlockingNotifications);
