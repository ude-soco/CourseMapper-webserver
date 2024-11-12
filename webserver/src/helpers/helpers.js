const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const User = db.user;
const Role = db.role;
const Course = db.course;
const Topic = db.topic;
const Channel = db.channel;
const Annotation = db.annotation;
const Material = db.material;
const Reply = db.reply;
const Tag = db.tag;
const Activity = db.activity;
const BlockingNotifications = db.blockingNotifications;
import catchAsync from "./catchAsync";


const crypto = require("crypto");

//write a method to make a new document in the blockingNotification collection. The argumetns for the method will be the courseID and the userID. and according to the default notifications variables in the course document set the notifications variables for the materials, channels, topics.

export const initialiseNotificationSettings = catchAsync(async (course, user) => {
  let userCourses = user.courses;
  let courseUserEnrolledTo = userCourses.find((userCourse) => {
    return userCourse.courseId.equals(course._id);
  });
  let userCourseUpdateNotificationSetting =
    user.isCourseUpdateNotificationsEnabled;
  let userAnnotationNotificationSetting = user.isAnnotationNotificationsEnabled;
  let userReplyAndMentionedNotificationSetting =
    user.isReplyAndMentionedNotificationsEnabled;

  //fetch the topics of the course to get the channels
  let topicIds = course.topics;
  let topics = await Topic.find({ _id: { $in: topicIds } });

  let channelIds = [];
  topics.forEach((topic) => {
    channelIds = channelIds.concat(topic.channels);
  });

  //make a second loop storing the topicIds, channelIds
  let channelIdsAndTopicIds = [];
  topics.forEach((topic) => {
    channelIdsAndTopicIds = channelIdsAndTopicIds.concat(
      topic.channels.map((channelId) => {
        return {
          channelId: channelId,
          topicId: topic._id,
        };
      })
    );
  });

  let channels = await Channel.find({ _id: { $in: channelIds } });
  let materialIdsAndChannelIdsAndTopicIds = [];
  channels.forEach((channel) => {
    materialIdsAndChannelIdsAndTopicIds =
      materialIdsAndChannelIdsAndTopicIds.concat(
        channel.materials.map((materialId) => {
          return {
            materialId: materialId,
            channelId: channel._id,
            topicId: channel.topicId,
          };
        })
      );
  });

  //loop over all the topicIds, channelIds, and materialIds and set the 3 notification settings for each of them
  let blockingNotificationTopics = topicIds.map((topicId) => {
    return {
      topicId: topicId,
      isCourseUpdateNotificationsEnabled: userCourseUpdateNotificationSetting,
      isAnnotationNotificationsEnabled: userAnnotationNotificationSetting,
      isReplyAndMentionedNotificationsEnabled:
        userReplyAndMentionedNotificationSetting,
    };
  });
  let blockingNotificationChannels = channelIdsAndTopicIds.map(
    (channelIdAndTopicId) => {
      return {
        channelId: channelIdAndTopicId.channelId,
        topicId: channelIdAndTopicId.topicId,
        isCourseUpdateNotificationsEnabled: userCourseUpdateNotificationSetting,
        isAnnotationNotificationsEnabled: userAnnotationNotificationSetting,
        isReplyAndMentionedNotificationsEnabled:
          userReplyAndMentionedNotificationSetting,
      };
    }
  );

  let blockingNotificationMaterials = materialIdsAndChannelIdsAndTopicIds.map(
    (materialIdAndChannelIds) => {
      return {
        materialId: materialIdAndChannelIds.materialId,
        channelId: materialIdAndChannelIds.channelId,
        topicId: materialIdAndChannelIds.topicId,
        isCourseUpdateNotificationsEnabled: userCourseUpdateNotificationSetting,
        isAnnotationNotificationsEnabled: userAnnotationNotificationSetting,
        isReplyAndMentionedNotificationsEnabled:
          userReplyAndMentionedNotificationSetting,
      };
    }
  );

  let blockingNotification = new BlockingNotifications({
    userId: user._id,
    courseId: course._id,
    isAnnotationNotificationsEnabled: userAnnotationNotificationSetting,
    isReplyAndMentionedNotificationsEnabled:
      userReplyAndMentionedNotificationSetting,
    isCourseUpdateNotificationsEnabled: userCourseUpdateNotificationSetting,
    topics: blockingNotificationTopics,
    channels: blockingNotificationChannels,
    materials: blockingNotificationMaterials,
  });

  blockingNotification = await blockingNotification.save();
  return blockingNotification;
});

export const generateMboxAndMboxSha1Sum = (email) => {
  let mailbox = `mailto:${email}`;
  let hash = crypto.createHash("sha1");
  hash.update(mailbox);
  return {
    mbox: mailbox,
    mbox_sha1sum: hash.digest("hex"),
  };
};

module.exports = {
  initialiseNotificationSettings,
  generateMboxAndMboxSha1Sum,
};
