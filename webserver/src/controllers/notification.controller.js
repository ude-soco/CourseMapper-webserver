const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");

const UserNotification = db.userNotifications;
const User = db.user;
const Course = db.course;
const FollowAnnotation = db.followAnnotation;
const Annotation = db.annotation;
const BlockingNotifications = db.blockingNotifications;
const Material = db.material;
const {
  getNotificationSettingsWithFollowingAnnotations,
} = require("../middlewares/Notifications/notifications");

export const getAllNotifications = async (req, res, next) => {
  const userId = req.userId;

  // Get all notifications for user by populating the activityId
  let notifications;
  try {
    notifications = await UserNotification.find({
      userId: new ObjectId(userId),
    }).populate("activityId", [
      "notificationInfo.userName",
      "notificationInfo.userShortname",
      "notificationInfo.courseName",
      "notificationInfo.topicName",
      "notificationInfo.channelName",
      "notificationInfo.category",
      "notificationInfo.materialType",
      "notificationInfo.authorEmail",
      "notificationInfo.annotationAuthorId",
      "notificationInfo.replyAuthorId",
      "notificationInfo.isFollowingAnnotation",
      "notificationInfo.isDeletingAnnotation",
      "notificationInfo.isDeletingMaterial",
      "notificationInfo.isDeletingReply",
      "notificationInfo.isDeletingChannel",
      "notificationInfo.isDeletingTopic",
      "statement.object.definition.extensions",
      "statement.object.id",
      "statement.object.definition.type",
      "statement.object.definition.name.en-US",
      "statement.actor.name",
      "statement.actor.account.name",

      "statement.verb.display.en-US",
      "statement.result.extensions",
      "statement.timestamp",
    ]);
  } catch (error) {
    return res
      .status(500)
      .send({ error: "Error finding notifications", error });
  }

  //get blocked users:
  let blockingUsers;
  try {
    blockingUsers = await User.findById(userId).populate("blockingUsers", [
      "_id",
      "firstname",
      "lastname",
      "email",
    ]);
  } catch (error) {
    return res
      .status(500)
      .send({ error: "Error finding blocking users", error });
  }

  return res
    .status(200)
    .send({ notifications, blockingUsers: blockingUsers.blockingUsers });
};

export const deleteAllNotifications = async (req, res, next) => {
  const userId = req.userId;

  // Delete all notifications for user
  try {
    await UserNotification.deleteMany({});
  } catch (error) {
    return res
      .status(500)
      .send({ error: "Error deleting notifications", error });
  }

  return res.status(200).send({ message: "Notifications deleted" });
};

export const markNotificationsAsRead = async (req, res, next) => {
  //request body contains an array of strings of the notification ids
  const notificationIds = req.body.notificationIds;

  try {
    //User notifications with the id's in the variable notificationIds are updated to have the isRead field set to true
    await UserNotification.updateMany(
      { _id: { $in: notificationIds } },
      { isRead: true }
    );
  } catch (error) {
    return res
      .status(500)
      .send({ error: "Error updating notifications", error });
  }

  return res.status(200).send({ message: "Notifications marked as read!" });
};

export const markNotificationsAsUnread = async (req, res, next) => {
  //request body contains an array of strings of the notification ids
  const notificationIds = req.body.notificationIds;

  try {
    //User notifications with the id's in the variable notificationIds are updated to have the isRead field set to true
    await UserNotification.updateMany(
      { _id: { $in: notificationIds } },
      { isRead: false }
    );
  } catch (error) {
    return res
      .status(500)
      .send({ error: "Error updating notifications", error });
  }

  return res.status(200).send({ message: "Notification/s marked as unread!" });
};

export const starNotification = async (req, res, next) => {
  //request body contains an array of strings of the notification ids
  const notificationIds = req.body.notificationIds;

  try {
    //User notifications with the id's in the variable notificationIds are updated to have the isRead field set to true
    await UserNotification.updateMany(
      { _id: { $in: notificationIds } },
      { $set: { isStar: true }, $unset: { createdAt: 1 } }
    );
  } catch (error) {
    return res
      .status(500)
      .send({ error: "Error updating notifications", error });
  }

  return res.status(200).send({ message: "Notification/s starred!" });
};

export const unstarNotification = async (req, res, next) => {
  //request body contains an array of strings of the notification ids
  const notificationIds = req.body.notificationIds;

  try {
    //User notifications with the id's in the variable notificationIds are updated to have the isRead field set to true
    await UserNotification.updateMany(
      { _id: { $in: notificationIds } },
      { $set: { isStar: false, createdAt: new Date() } }
    );
  } catch (error) {
    return res

      .status(500)
      .send({ error: "Error updating notifications", error });
  }

  return res.status(200).send({ message: "Notification/s unstarred!" });
};

//the below function deletes the rows from the userNotifications table
export const removeNotification = async (req, res, next) => {
  const notificationIds = req.body.notificationIds;

  try {
    await UserNotification.deleteMany({ _id: { $in: notificationIds } });
  } catch (error) {
    return res
      .status(500)
      .send({ error: "Error deleting notifications", error });
  }
};

export const searchUsers = async (req, res, next) => {
  const { courseId, partialString } = req.query;
  const searchQuery = partialString ? partialString : "";
  try {
    const users = await User.find({
      "courses.courseId": courseId,
      $or: [
        { username: { $regex: searchQuery, $options: "i" } },
        { firstname: { $regex: searchQuery, $options: "i" } },
        { lastname: { $regex: searchQuery, $options: "i" } },
      ],
    }).limit(10);

    if (users.length === 0) {
      return res.json([]);
    }
    const suggestions = users.map((user) => ({
      name: user.firstname + " " + user.lastname,
      username: user.username,
      userId: user._id,
    }));

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const followAnnotation = async (req, res, next) => {
  const annotationId = req.params.annotationId;
  const userId = req.userId;

  //find the annotation with the ID first
  let annotation;
  try {
    annotation = await Annotation.findById(annotationId);
  } catch (error) {
    return res.status(500).json({ error: "Annotation not found" });
  }

  const courseId = annotation.courseId;
  const channelId = annotation.channelId;
  const materialId = annotation.materialId;
  const topicId = annotation.topicId;

  //check if the user is already following the annotation
  let followAnnotation;
  try {
    followAnnotation = await FollowAnnotation.findOne({
      userId: userId,
      annotationId: annotationId,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error in confirming if User already following Annotation!",
    });
  }
  if (followAnnotation) {
    return res
      .status(500)
      .json({ error: "User already following Annotation!" });
  }

  let followAnnotationToBeSaved = new FollowAnnotation({
    userId: userId,
    annotationId: annotationId,
    courseId: courseId,
    channelId: channelId,
    materialId: materialId,
    topicId: topicId,
    isFollowing: true,
    ...(annotation.location.from && { from: annotation.location.from }),
    ...(annotation.location.startPage && {
      startPage: annotation.location.startPage,
    }),
  });

  try {
    followAnnotationToBeSaved = await followAnnotationToBeSaved.save();
    /* res.status(200).json({ message: "Followed the Annotation!" }); */
  } catch (error) {
    res.status(500).json({ error: "Could not Follow the Annotation!" });
  }

  let notificationSettings;
  try {
    notificationSettings =
      await getNotificationSettingsWithFollowingAnnotations(courseId, userId);
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error finding updated notification settings" });
  }
  if (req.locals) {
    req.locals.response = notificationSettings[0];
  } else {
    req.locals = {
      response: notificationSettings[0],
    };
  }
  next();

  //update the followingAnnotations array in the BlockingNotifications collection for the respective channel
  //fetch the BlockingNotification for the respective User and CourseId

  //fetch the material to which this annotation belongs to to get the material Type.
  /*   let material;
  try {
    material = await Material.findById(materialId);
  } catch (error) {
    return res.status(500).json({ error: "Material not found" });
  } */

  /*   const newFollowingAnnotation = {
    annotationId: annotationId,
    channelId: channelId,
    materialId: materialId,
    annotationContent: annotation.content,
    materialType: material.type,
  };
 */
  /*   try {
    const updatedDocument = await BlockingNotifications.findOneAndUpdate(
      {
        userId: userId,
        courseId: courseId,
        "channels.channelId": channelId,
        "channels.followingAnnotations.annotationId": { $ne: annotationId },
      },
      { $push: { "channels.$.followingAnnotations": newFollowingAnnotation } },
      { new: true }
    );

    if (updatedDocument) {
      res.status(200).json({ message: "Followed the Annotation!" });
      next();
    } else {
      res.status(500).json({ error: "Already following the annotation!" });
    }
  } catch (error) {
    res.status(500).json({ error: "Could not Follow the Annotation!" });
  } */
};

export const unfollowAnnotation = async (req, res, next) => {
  const annotationId = req.params.annotationId;
  const userId = req.userId;

  let annotation;
  try {
    annotation = await Annotation.findById(annotationId);
  } catch (error) {
    return res.status(500).json({ error: "Annotation not found" });
  }
  const channelId = annotation.channelId;
  const courseId = annotation.courseId;
  //check if the user is already not following the annotation
  let followAnnotation;
  try {
    followAnnotation = await FollowAnnotation.findOne({
      userId: userId,
      annotationId: annotationId,
    });
    if (!followAnnotation) {
      return res
        .status(500)
        .json({ error: "User already not following the Annotation!" });
    }
  } catch (error) {
    return res.status(500).json({
      error: "Error in confirming if User already following Annotation!",
    });
  }

  try {
    await FollowAnnotation.deleteOne({
      userId: userId,
      annotationId: annotationId,
    });
  } catch (error) {
    res.status(500).json({ error: "Could not unfollow the Annotation!" });
  }

  let notificationSettings;
  try {
    notificationSettings =
      await getNotificationSettingsWithFollowingAnnotations(courseId, userId);
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error finding updated notification settings" });
  }

  res.status(200).send(notificationSettings[0]);
};

export const setMaterialNotificationSettings = async (req, res, next) => {
  const userId = req.userId;
  const courseId = req.body.courseId;
  const materialId = req.body.materialId;
  const isAnnotationNotificationsEnabled =
    req.body.isAnnotationNotificationsEnabled;
  const isReplyAndMentionedNotificationsEnabled =
    req.body.isReplyAndMentionedNotificationsEnabled;
  const isCourseUpdateNotificationsEnabled =
    req.body.isCourseUpdateNotificationsEnabled;
  let updatedDocument;

  //update the material in the Blocking Notification collection
  try {
    updatedDocument = await BlockingNotifications.findOneAndUpdate(
      {
        "materials.materialId": materialId,
        userId: userId,
        courseId: courseId,
      },
      {
        $set: {
          "materials.$.isAnnotationNotificationsEnabled":
            isAnnotationNotificationsEnabled,
          "materials.$.isReplyAndMentionedNotificationsEnabled":
            isReplyAndMentionedNotificationsEnabled,
          "materials.$.isCourseUpdateNotificationsEnabled":
            isCourseUpdateNotificationsEnabled,
          "materials.$.isMaterialLevelOverride": true,
          "materials.$.isChannelLevelOverride": false,
          "materials.$.isTopicLevelOverride": false,
          "materials.$.isCourseLevelOverride": false,
        },
      },
      {
        new: true,
      }
    );
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Could not update the material notification settings!" });
  }

  let notificationSettings;
  try {
    notificationSettings =
      await getNotificationSettingsWithFollowingAnnotations(courseId, userId);
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error finding updated notification settings" });
  }

  return res.status(200).json(notificationSettings[0]);
};

export const unsetMaterialNotificationSettings = async (req, res, next) => {
  const userId = req.userId;
  const courseId = req.body.courseId;
  const materialId = req.body.materialId;

  let blockingNotification;
  try {
    blockingNotification = await BlockingNotifications.findOne({
      userId: userId,
      courseId: courseId,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Could not find blocking notification!" });
  }

  let materialObj = blockingNotification.materials.find((material) =>
    material.materialId.equals(materialId)
  );

  let channelObj = blockingNotification.channels.find((channel) =>
    channel.channelId.equals(materialObj.channelId)
  );

  let updatedDoc;

  //update the material in the Blocking Notification collection
  try {
    updatedDoc = await BlockingNotifications.findOneAndUpdate(
      {
        "materials.materialId": materialId,
        userId: userId,
        courseId: courseId,
      },
      {
        $set: {
          "materials.$.isAnnotationNotificationsEnabled":
            channelObj.isAnnotationNotificationsEnabled,
          "materials.$.isReplyAndMentionedNotificationsEnabled":
            channelObj.isReplyAndMentionedNotificationsEnabled,
          "materials.$.isCourseUpdateNotificationsEnabled":
            channelObj.isCourseUpdateNotificationsEnabled,
          "materials.$.isMaterialLevelOverride": false,
          "materials.$.isChannelLevelOverride":
            channelObj.isChannelLevelOverride,
          "materials.$.isTopicLevelOverride": channelObj.isTopicLevelOverride,
          "materials.$.isCourseLevelOverride": channelObj.isCourseLevelOverride,
        },
      },
      {
        new: true,
      }
    );
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Could not update the material notification settings!" });
  }

  let notificationSettings;
  try {
    notificationSettings =
      await getNotificationSettingsWithFollowingAnnotations(courseId, userId);
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error finding updated notification settings" });
  }

  return res.status(200).json(notificationSettings[0]);
};

export const setChannelNotificationSettings = async (req, res, next) => {
  const userId = req.userId;
  const courseId = req.body.courseId;
  const channelId = req.body.channelId;
  const isAnnotationNotificationsEnabled =
    req.body.isAnnotationNotificationsEnabled;
  const isReplyAndMentionedNotificationsEnabled =
    req.body.isReplyAndMentionedNotificationsEnabled;
  const isCourseUpdateNotificationsEnabled =
    req.body.isCourseUpdateNotificationsEnabled;

  let updatedDoc;
  //update the channel in the Blocking Notification collection
  try {
    updatedDoc = await BlockingNotifications.findOneAndUpdate(
      {
        courseId: courseId,
        userId: userId,
      },
      {
        $set: {
          "channels.$[channelElem].isAnnotationNotificationsEnabled":
            isAnnotationNotificationsEnabled,
          "channels.$[channelElem].isReplyAndMentionedNotificationsEnabled":
            isReplyAndMentionedNotificationsEnabled,
          "channels.$[channelElem].isCourseUpdateNotificationsEnabled":
            isCourseUpdateNotificationsEnabled,
          "channels.$[channelElem].isChannelLevelOverride": true,
          "channels.$[channelElem].isTopicLevelOverride": false,
          "channels.$[channelElem].isCourseLevelOverride": false,
          "materials.$[materialElem].isAnnotationNotificationsEnabled":
            isAnnotationNotificationsEnabled,
          "materials.$[materialElem].isReplyAndMentionedNotificationsEnabled":
            isReplyAndMentionedNotificationsEnabled,
          "materials.$[materialElem].isCourseUpdateNotificationsEnabled":
            isCourseUpdateNotificationsEnabled,
          "materials.$[materialElem].isMaterialLevelOverride": false,
          "materials.$[materialElem].isChannelLevelOverride": true,
          "materials.$[materialElem].isTopicLevelOverride": false,
          "materials.$[materialElem].isCourseLevelOverride": false,
        },
      },
      {
        arrayFilters: [
          { "channelElem.channelId": channelId },
          {
            "materialElem.channelId": channelId,
            "materialElem.isMaterialLevelOverride": false,
          },
        ],
        new: true,
      }
    );
  } catch (error) {
    return res.status(500).json({ error });
  }

  let notificationSettings;
  try {
    notificationSettings =
      await getNotificationSettingsWithFollowingAnnotations(courseId, userId);
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error finding updated notification settings" });
  }

  return res.status(200).json(notificationSettings[0]);
};

export const unsetChannelNotificationSettings = async (req, res, next) => {
  const userId = req.userId;
  const courseId = req.body.courseId;
  const channelId = req.body.channelId;

  let blockingNotification;
  try {
    blockingNotification = await BlockingNotifications.findOne({
      userId: userId,
      courseId: courseId,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Could not find blocking notification!" });
  }

  let channelObj = blockingNotification.channels.find((channel) =>
    channel.channelId.equals(channelId)
  );

  let topicObj = blockingNotification.topics.find((topic) =>
    topic.topicId.equals(channelObj.topicId)
  );

  let updatedDoc;
  //update the channel in the Blocking Notification collection
  try {
    updatedDoc = await BlockingNotifications.findOneAndUpdate(
      {
        "channels.channelId": channelId,
        userId: userId,
        courseId: courseId,
      },
      {
        $set: {
          "channels.$[channelElem].isAnnotationNotificationsEnabled":
            topicObj.isAnnotationNotificationsEnabled,
          "channels.$[channelElem].isReplyAndMentionedNotificationsEnabled":
            topicObj.isReplyAndMentionedNotificationsEnabled,
          "channels.$[channelElem].isCourseUpdateNotificationsEnabled":
            topicObj.isCourseUpdateNotificationsEnabled,
          "channels.$[channelElem].isChannelLevelOverride": false,
          "channels.$[channelElem].isTopicLevelOverride":
            topicObj.isTopicLevelOverride,
          "channels.$[channelElem].isCourseLevelOverride":
            topicObj.isCourseLevelOverride,
          "materials.$[materialElem].isAnnotationNotificationsEnabled":
            topicObj.isAnnotationNotificationsEnabled,
          "materials.$[materialElem].isReplyAndMentionedNotificationsEnabled":
            topicObj.isReplyAndMentionedNotificationsEnabled,
          "materials.$[materialElem].isCourseUpdateNotificationsEnabled":
            topicObj.isCourseUpdateNotificationsEnabled,
          "materials.$[materialElem].isMaterialLevelOverride": false,
          "materials.$[materialElem].isChannelLevelOverride": false,
          "materials.$[materialElem].isTopicLevelOverride":
            topicObj.isTopicLevelOverride,
          "materials.$[materialElem].isCourseLevelOverride":
            topicObj.isCourseLevelOverride,
        },
      },
      {
        arrayFilters: [
          { "channelElem.channelId": channelId },
          {
            "materialElem.channelId": channelId,
            "materialElem.isMaterialLevelOverride": false,
            "materialElem.isChannelLevelOverride": true,
          },
        ],
        new: true,
      }
    );
  } catch (error) {
    return res.status(500).json({ error });
  }

  let notificationSettings;
  try {
    notificationSettings =
      await getNotificationSettingsWithFollowingAnnotations(courseId, userId);
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error finding updated notification settings" });
  }

  return res.status(200).json(notificationSettings[0]);
};

export const setTopicNotificationSettings = async (req, res, next) => {
  const userId = req.userId;
  const courseId = req.body.courseId;
  const topicId = req.body.topicId;
  const isAnnotationNotificationsEnabled =
    req.body.isAnnotationNotificationsEnabled;
  const isReplyAndMentionedNotificationsEnabled =
    req.body.isReplyAndMentionedNotificationsEnabled;
  const isCourseUpdateNotificationsEnabled =
    req.body.isCourseUpdateNotificationsEnabled;
  let updatedDoc;
  try {
    updatedDoc = await BlockingNotifications.findOneAndUpdate(
      {
        courseId: courseId,
        userId: userId,
      },
      {
        $set: {
          "topics.$[topicElem].isAnnotationNotificationsEnabled":
            isAnnotationNotificationsEnabled,
          "topics.$[topicElem].isReplyAndMentionedNotificationsEnabled":
            isReplyAndMentionedNotificationsEnabled,
          "topics.$[topicElem].isCourseUpdateNotificationsEnabled":
            isCourseUpdateNotificationsEnabled,
          "topics.$[topicElem].isTopicLevelOverride": true,
          "topics.$[topicElem].isCourseLevelOverride": false,
          "channels.$[channelElem].isAnnotationNotificationsEnabled":
            isAnnotationNotificationsEnabled,
          "channels.$[channelElem].isReplyAndMentionedNotificationsEnabled":
            isReplyAndMentionedNotificationsEnabled,
          "channels.$[channelElem].isCourseUpdateNotificationsEnabled":
            isCourseUpdateNotificationsEnabled,
          "channels.$[channelElem].isChannelLevelOverride": false,
          "channels.$[channelElem].isTopicLevelOverride": true,
          "channels.$[channelElem].isCourseLevelOverride": false,
          "materials.$[materialElem].isAnnotationNotificationsEnabled":
            isAnnotationNotificationsEnabled,
          "materials.$[materialElem].isReplyAndMentionedNotificationsEnabled":
            isReplyAndMentionedNotificationsEnabled,
          "materials.$[materialElem].isCourseUpdateNotificationsEnabled":
            isCourseUpdateNotificationsEnabled,
          "materials.$[materialElem].isMaterialLevelOverride": false,
          "materials.$[materialElem].isChannelLevelOverride": false,
          "materials.$[materialElem].isTopicLevelOverride": true,
          "materials.$[materialElem].isCourseLevelOverride": false,
        },
      },
      {
        arrayFilters: [
          {
            "topicElem.topicId": topicId,
          },
          {
            "channelElem.topicId": topicId,
            "channelElem.isChannelLevelOverride": false,
          },
          {
            "materialElem.topicId": topicId,
            "materialElem.isMaterialLevelOverride": false,
            "materialElem.isChannelLevelOverride": false,
          },
        ],
        new: true,
      }
    );
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not set topic notification settings!" });
  }

  let notificationSettings;
  try {
    notificationSettings =
      await getNotificationSettingsWithFollowingAnnotations(courseId, userId);
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error finding updated notification settings" });
  }

  return res.status(200).json(notificationSettings[0]);
};

export const unsetTopicNotificationSettings = async (req, res, next) => {
  const userId = req.userId;
  const courseId = req.body.courseId;
  const topicId = req.body.topicId;

  let blockingNotification;
  try {
    blockingNotification = await BlockingNotifications.findOne({
      userId: userId,
      courseId: courseId,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Could not find blocking notification!" });
  }

  let updatedDoc;
  //update the channel in the Blocking Notification collection
  try {
    updatedDoc = await BlockingNotifications.findOneAndUpdate(
      {
        userId: userId,
        courseId: courseId,
      },
      {
        $set: {
          "topics.$[topicElem].isAnnotationNotificationsEnabled":
            blockingNotification.isAnnotationNotificationsEnabled,
          "topics.$[topicElem].isReplyAndMentionedNotificationsEnabled":
            blockingNotification.isReplyAndMentionedNotificationsEnabled,
          "topics.$[topicElem].isCourseUpdateNotificationsEnabled":
            blockingNotification.isCourseUpdateNotificationsEnabled,
          "topics.$[topicElem].isTopicLevelOverride": false,
          "topics.$[topicElem].isCourseLevelOverride":
            blockingNotification.isCourseLevelOverride,
          "channels.$[channelElem].isAnnotationNotificationsEnabled":
            blockingNotification.isAnnotationNotificationsEnabled,
          "channels.$[channelElem].isReplyAndMentionedNotificationsEnabled":
            blockingNotification.isReplyAndMentionedNotificationsEnabled,
          "channels.$[channelElem].isCourseUpdateNotificationsEnabled":
            blockingNotification.isCourseUpdateNotificationsEnabled,
          "channels.$[channelElem].isChannelLevelOverride": false,
          "channels.$[channelElem].isTopicLevelOverride": false,
          "channels.$[channelElem].isCourseLevelOverride":
            blockingNotification.isCourseLevelOverride,
          "materials.$[materialElem].isAnnotationNotificationsEnabled":
            blockingNotification.isAnnotationNotificationsEnabled,
          "materials.$[materialElem].isReplyAndMentionedNotificationsEnabled":
            blockingNotification.isReplyAndMentionedNotificationsEnabled,
          "materials.$[materialElem].isCourseUpdateNotificationsEnabled":
            blockingNotification.isCourseUpdateNotificationsEnabled,
          "materials.$[materialElem].isMaterialLevelOverride": false,
          "materials.$[materialElem].isChannelLevelOverride": false,
          "materials.$[materialElem].isTopicLevelOverride": false,
          "materials.$[materialElem].isCourseLevelOverride":
            blockingNotification.isCourseLevelOverride,
        },
      },
      {
        arrayFilters: [
          {
            "topicElem.topicId": topicId,
            "topicElem.isTopicLevelOverride": true,
          },
          {
            "channelElem.topicId": topicId,
            "channelElem.isChannelLevelOverride": false,
            "channelElem.isTopicLevelOverride": true,
          },
          {
            "materialElem.topicId": topicId,
            "materialElem.isMaterialLevelOverride": false,
            "materialElem.isChannelLevelOverride": false,
            "materialElem.isTopicLevelOverride": true,
          },
        ],
        new: true,
      }
    );
  } catch (error) {
    return res.status(500).json({ error });
  }

  let notificationSettings;
  try {
    notificationSettings =
      await getNotificationSettingsWithFollowingAnnotations(courseId, userId);
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error finding updated notification settings" });
  }

  return res.status(200).json(notificationSettings[0]);
};

export const setCourseNotificationSettings = async (req, res, next) => {
  const userId = req.userId;
  const courseId = req.body.courseId;
  const isAnnotationNotificationsEnabled =
    req.body.isAnnotationNotificationsEnabled;
  const isReplyAndMentionedNotificationsEnabled =
    req.body.isReplyAndMentionedNotificationsEnabled;
  const isCourseUpdateNotificationsEnabled =
    req.body.isCourseUpdateNotificationsEnabled;

  let updatedDoc;
  /*   try { */
  updatedDoc = await BlockingNotifications.findOneAndUpdate(
    {
      courseId: courseId,
      userId: userId,
    },
    {
      $set: {
        isAnnotationNotificationsEnabled: isAnnotationNotificationsEnabled,
        isReplyAndMentionedNotificationsEnabled:
          isReplyAndMentionedNotificationsEnabled,
        isCourseUpdateNotificationsEnabled: isCourseUpdateNotificationsEnabled,
        isCourseLevelOverride: true,
        "topics.$[topicElem].isAnnotationNotificationsEnabled":
          isAnnotationNotificationsEnabled,
        "topics.$[topicElem].isReplyAndMentionedNotificationsEnabled":
          isReplyAndMentionedNotificationsEnabled,
        "topics.$[topicElem].isCourseUpdateNotificationsEnabled":
          isCourseUpdateNotificationsEnabled,
        "topics.$[topicElem].isCourseLevelOverride": true,
        "channels.$[channelElem].isAnnotationNotificationsEnabled":
          isAnnotationNotificationsEnabled,
        "channels.$[channelElem].isReplyAndMentionedNotificationsEnabled":
          isReplyAndMentionedNotificationsEnabled,
        "channels.$[channelElem].isCourseUpdateNotificationsEnabled":
          isCourseUpdateNotificationsEnabled,
        "channels.$[channelElem].isCourseLevelOverride": true,
        "materials.$[materialElem].isAnnotationNotificationsEnabled":
          isAnnotationNotificationsEnabled,
        "materials.$[materialElem].isReplyAndMentionedNotificationsEnabled":
          isReplyAndMentionedNotificationsEnabled,
        "materials.$[materialElem].isCourseUpdateNotificationsEnabled":
          isCourseUpdateNotificationsEnabled,
        "materials.$[materialElem].isCourseLevelOverride": true,
      },
    },
    {
      arrayFilters: [
        { "topicElem.isTopicLevelOverride": false },
        {
          "channelElem.isChannelLevelOverride": false,
          "channelElem.isTopicLevelOverride": false,
        },
        {
          "materialElem.isMaterialLevelOverride": false,
          "materialElem.isChannelLevelOverride": false,
          "materialElem.isTopicLevelOverride": false,
        },
      ],
      new: true,
    }
  );
  /*   } catch (error) {
    return res.status(500).json({ error });
  } */

  let notificationSettings;
  try {
    notificationSettings =
      await getNotificationSettingsWithFollowingAnnotations(courseId, userId);
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error finding updated notification settings" });
  }

  return res.status(200).json(notificationSettings[0]);
};

export const unsetCourseNotificationSettings = async (req, res, next) => {
  const userId = req.userId;
  const courseId = req.body.courseId;

  //fetch the User
  let user;
  try {
    user = await User.findOne({
      _id: userId,
    });
  } catch (err) {
    return res.status(500).json({ error: "Error finding user" });
  }

  let updatedDoc;
  //update the channel in the Blocking Notification collection
  try {
    updatedDoc = await BlockingNotifications.findOneAndUpdate(
      {
        userId: userId,
        courseId: courseId,
      },
      {
        $set: {
          isCourseLevelOverride: false,
          isAnnotationNotificationsEnabled:
            user.isAnnotationNotificationsEnabled,
          isReplyAndMentionedNotificationsEnabled:
            user.isReplyAndMentionedNotificationsEnabled,
          isCourseUpdateNotificationsEnabled:
            user.isCourseUpdateNotificationsEnabled,
          "topics.$[topicElem].isAnnotationNotificationsEnabled":
            user.isAnnotationNotificationsEnabled,
          "topics.$[topicElem].isReplyAndMentionedNotificationsEnabled":
            user.isReplyAndMentionedNotificationsEnabled,
          "topics.$[topicElem].isCourseUpdateNotificationsEnabled":
            user.isCourseUpdateNotificationsEnabled,
          "topics.$[topicElem].isTopicLevelOverride": false,
          "topics.$[topicElem].isCourseLevelOverride": false,
          "channels.$[channelElem].isAnnotationNotificationsEnabled":
            user.isAnnotationNotificationsEnabled,
          "channels.$[channelElem].isReplyAndMentionedNotificationsEnabled":
            user.isReplyAndMentionedNotificationsEnabled,
          "channels.$[channelElem].isCourseUpdateNotificationsEnabled":
            user.isCourseUpdateNotificationsEnabled,
          "channels.$[channelElem].isChannelLevelOverride": false,
          "channels.$[channelElem].isTopicLevelOverride": false,
          "channels.$[channelElem].isCourseLevelOverride": false,
          "materials.$[materialElem].isAnnotationNotificationsEnabled":
            user.isAnnotationNotificationsEnabled,
          "materials.$[materialElem].isReplyAndMentionedNotificationsEnabled":
            user.isReplyAndMentionedNotificationsEnabled,
          "materials.$[materialElem].isCourseUpdateNotificationsEnabled":
            user.isCourseUpdateNotificationsEnabled,
          "materials.$[materialElem].isMaterialLevelOverride": false,
          "materials.$[materialElem].isChannelLevelOverride": false,
          "materials.$[materialElem].isTopicLevelOverride": false,
          "materials.$[materialElem].isCourseLevelOverride": false,
        },
      },
      {
        arrayFilters: [
          {
            "topicElem.isTopicLevelOverride": false,
            "topicElem.isCourseLevelOverride": true,
          },
          {
            "channelElem.isChannelLevelOverride": false,
            "channelElem.isTopicLevelOverride": false,
            "channelElem.isCourseLevelOverride": true,
          },
          {
            "materialElem.isMaterialLevelOverride": false,
            "materialElem.isChannelLevelOverride": false,
            "materialElem.isTopicLevelOverride": false,
            "materialElem.isCourseLevelOverride": true,
          },
        ],
        new: true,
      }
    );
  } catch (error) {
    return res.status(500).json({ error });
  }

  let notificationSettings;
  try {
    notificationSettings =
      await getNotificationSettingsWithFollowingAnnotations(courseId, userId);
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error finding updated notification settings" });
  }

  return res.status(200).json(notificationSettings[0]);
};

export const setGlobalNotificationSettings = async (req, res, next) => {
  const userId = req.userId;
  const isAnnotationNotificationsEnabled =
    req.body.isAnnotationNotificationsEnabled;
  const isReplyAndMentionedNotificationsEnabled =
    req.body.isReplyAndMentionedNotificationsEnabled;
  const isCourseUpdateNotificationsEnabled =
    req.body.isCourseUpdateNotificationsEnabled;

  //First the user document will get updated, after that, all the Blocking Notification documents that have the userId = userId will get updated with the new values for the user's notification settings, and all the channels, topics, and materials that have not been overridden will also get the new values

  //update the user document
  let updatedUser;
  try {
    updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        $set: {
          isAnnotationNotificationsEnabled: isAnnotationNotificationsEnabled,
          isReplyAndMentionedNotificationsEnabled:
            isReplyAndMentionedNotificationsEnabled,
          isCourseUpdateNotificationsEnabled:
            isCourseUpdateNotificationsEnabled,
        },
      },
      {
        new: true,
      }
    );
  } catch (error) {
    return res.status(500).json({ error });
  }

  //update the Blocking Notification documents
  let updatedBlockingNotifications;
  try {
    updatedBlockingNotifications = await BlockingNotifications.updateMany(
      {
        userId: userId,
        isCourseLevelOverride: false,
      },
      {
        $set: {
          isAnnotationNotificationsEnabled: isAnnotationNotificationsEnabled,
          isReplyAndMentionedNotificationsEnabled:
            isReplyAndMentionedNotificationsEnabled,
          isCourseUpdateNotificationsEnabled:
            isCourseUpdateNotificationsEnabled,
          "topics.$[topicElem].isAnnotationNotificationsEnabled":
            isAnnotationNotificationsEnabled,
          "topics.$[topicElem].isReplyAndMentionedNotificationsEnabled":
            isReplyAndMentionedNotificationsEnabled,
          "topics.$[topicElem].isCourseUpdateNotificationsEnabled":
            isCourseUpdateNotificationsEnabled,
          "channels.$[channelElem].isAnnotationNotificationsEnabled":
            isAnnotationNotificationsEnabled,
          "channels.$[channelElem].isReplyAndMentionedNotificationsEnabled":
            isReplyAndMentionedNotificationsEnabled,
          "channels.$[channelElem].isCourseUpdateNotificationsEnabled":
            isCourseUpdateNotificationsEnabled,
          "materials.$[materialElem].isAnnotationNotificationsEnabled":
            isAnnotationNotificationsEnabled,
          "materials.$[materialElem].isReplyAndMentionedNotificationsEnabled":
            isReplyAndMentionedNotificationsEnabled,
          "materials.$[materialElem].isCourseUpdateNotificationsEnabled":
            isCourseUpdateNotificationsEnabled,
        },
      },
      {
        arrayFilters: [
          {
            "topicElem.isTopicLevelOverride": false,
            "topicElem.isCourseLevelOverride": false,
          },
          {
            "channelElem.isChannelLevelOverride": false,
            "channelElem.isTopicLevelOverride": false,
            "channelElem.isCourseLevelOverride": false,
          },
          {
            "materialElem.isMaterialLevelOverride": false,
            "materialElem.isChannelLevelOverride": false,
            "materialElem.isTopicLevelOverride": false,
            "materialElem.isCourseLevelOverride": false,
          },
        ],
        new: true,
      }
    );
  } catch (error) {
    return res.status(500).json({ error });
  }

  return res.status(200).json(updatedUser);
};

export const getAllCourseNotificationSettings = async (req, res, next) => {
  const userId = req.userId;

  //fetch the User
  let user;
  try {
    user = await User.findOne({
      _id: userId,
    });
  } catch (err) {
    return res.status(500).json({ error: "Error finding user" });
  }

  let notificationSettings;
  try {
    notificationSettings = await BlockingNotifications.aggregate([
      {
        $match: {
          userId: new ObjectId(userId),
        },
      },
      {
        $project: {
          courseId: 1,
          isAnnotationNotificationsEnabled: 1,
          isReplyAndMentionedNotificationsEnabled: 1,
          isCourseUpdateNotificationsEnabled: 1,
          isCourseLevelOverride: 1,
          /*   showCourseActivityIndicator: 1, */
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      {
        $unwind: {
          path: "$courseInfo",
        },
      },
      {
        $set: {
          courseName: "$courseInfo.name",
        },
      },
      {
        $unset: "courseInfo",
      },
    ]);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Error fetching notification settings" });
  }

  return res.status(200).json({
    coursesSettings: notificationSettings,
    isAnnotationNotificationsEnabled: user.isAnnotationNotificationsEnabled,
    isReplyAndMentionedNotificationsEnabled:
      user.isReplyAndMentionedNotificationsEnabled,
    isCourseUpdateNotificationsEnabled: user.isCourseUpdateNotificationsEnabled,
  });
};

export const blockUser = async (req, res, next) => {
  const userId = req.userId;
  const userToBlockId = req.body.userToBlockId;
  let user;
  //Add the user to be blocked to the blocking list
  try {
    await User.findOneAndUpdate(
      {
        _id: new ObjectId(userToBlockId),
      },
      {
        $addToSet: {
          blockedByUser: new ObjectId(userId),
        },
      }
    );

    user = await User.findOneAndUpdate(
      {
        _id: new ObjectId(userId),
      },
      {
        $addToSet: {
          blockingUsers: new ObjectId(userToBlockId),
        },
      },
      {
        new: true,
      }
    );
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not add user to blocking list!" });
  }

  let blockingUsers;
  try {
    blockingUsers = await User.findById(userId).populate("blockingUsers", [
      "_id",
      "firstname",
      "lastname",
      "email",
    ]);
  } catch (error) {
    return res
      .status(500)
      .send({ error: "Error finding blocking users", error });
  }

  return res.status(200).json(blockingUsers.blockingUsers);
};

export const unblockUser = async (req, res, next) => {
  const userId = req.userId;
  const userToUnblockId = req.body.userToUnblockId;
  let user;
  //Remove the user to be unblocked from the blocking list
  try {
    await User.findOneAndUpdate(
      {
        _id: userToUnblockId,
      },
      {
        $pull: {
          blockedByUser: userId,
        },
      }
    );

    user = await User.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        $pull: {
          blockingUsers: userToUnblockId,
        },
      },
      {
        new: true,
      }
    );
  } catch (err) {
    return res
      .status(500)
      .json("Could not remove user from blocking list! " + err.message);
  }

  let blockingUsers;
  try {
    blockingUsers = await User.findById(userId).populate("blockingUsers", [
      "_id",
      "firstname",
      "lastname",
      "email",
    ]);
  } catch (error) {
    return res
      .status(500)
      .send({ error: "Error finding blocking users", error });
  }

  return res.status(200).json(blockingUsers.blockingUsers);
};

export const followAnnotationSuccess = async (req, res, next) => {
  res.status(200).json(req.locals.response);
};
