
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
const fs = require('fs/promises');
const path = require('path');

const crypto = require("crypto");

//write a method to make a new document in the blockingNotification collection. The argumetns for the method will be the courseID and the userID. and according to the default notifications variables in the course document set the notifications variables for the materials, channels, topics.

export const initialiseNotificationSettings = async (course, user) => {
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
};

export const generateMboxAndMboxSha1Sum = (email) => {
  let mailbox = `mailto:${email}`;
  let hash = crypto.createHash("sha1");
  hash.update(mailbox);
  return {
    mbox: mailbox,
    mbox_sha1sum: hash.digest("hex"),
  };
};
export const getRandomImageUrl = async (req) => {
  const imagesDir = path.join(__dirname, '..', '..','public/uploads/randomImgs');
  
  // Read the directory asynchronously
  const files = await fs.readdir(imagesDir);
  // Filter only for image files (assuming they are all images)
  const imageFiles = files.filter(file => /\.(jpe?g|png|gif)$/i.test(file));
  
  if (imageFiles.length === 0) {
    throw new Error('No images found in the randomImgs folder.');
  }
  
  // Pick a random image from the array
  const randomIndex = Math.floor(Math.random() * imageFiles.length);
  const randomImage = imageFiles[randomIndex];
  
  // Construct the URL for the image using the request object.
  // Assuming you are serving static files from: 
  // app.use("/api/public/uploads", express.static("public/uploads"));
  return `${req.protocol}://${req.get('host')}/api/public/uploads/randomImgs/${randomImage}`;
};

module.exports = {
  initialiseNotificationSettings,
  generateMboxAndMboxSha1Sum,
  getRandomImageUrl
};
