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
  console.log("endpoint: getAllNotifications");
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
      "statement.object.definition.extensions",
      "statement.object.id",
      "statement.object.definition.type",
      "statement.object.definition.name.en-US",
      "statement.actor.name",
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

  console.log("notifications: ", notifications);
  return res
    .status(200)
    .send({ notifications, blockingUsers: blockingUsers.blockingUsers });
};

export const deleteAllNotifications = async (req, res, next) => {
  console.log("endpoint: deleteAllNotifications");
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
  console.log("endpoint: markNotificationsAsRead");
  //request body contains an array of strings of the notification ids
  const notificationIds = req.body.notificationIds;
  console.log("notificationIds: ", notificationIds);
  console.log(req.body);

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
  console.log("endpoint: markNotificationsAsUnread");
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
  console.log("endpoint: starNotification");
  //request body contains an array of strings of the notification ids
  const notificationIds = req.body.notificationIds;

  try {
    //User notifications with the id's in the variable notificationIds are updated to have the isRead field set to true
    await UserNotification.updateMany(
      { _id: { $in: notificationIds } },
      { isStar: true }
    );
  } catch (error) {
    return res
      .status(500)
      .send({ error: "Error updating notifications", error });
  }

  return res.status(200).send({ message: "Notification/s starred!" });
};

export const unstarNotification = async (req, res, next) => {
  console.log("endpoint: unstarNotification");
  //request body contains an array of strings of the notification ids
  const notificationIds = req.body.notificationIds;

  try {
    //User notifications with the id's in the variable notificationIds are updated to have the isRead field set to true
    await UserNotification.updateMany(
      { _id: { $in: notificationIds } },
      { isStar: false }
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
        { email: { $regex: searchQuery, $options: "i" } },
        { firstname: { $regex: searchQuery, $options: "i" } },
        { lastname: { $regex: searchQuery, $options: "i" } },
      ],
    }).limit(10);

    if (users.length === 0) {
      return res.json([]);
    }
    const suggestions = users.map((user) => ({
      name: user.firstname + " " + user.lastname,
      email: user.email,
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
  });

  try {
    await followAnnotationToBeSaved.save();
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

  res.response = notificationSettings[0];
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

  //update the followingAnnotations array in the BlockingNotifications collection for the respective channel
  /*   try {
    const updatedDocument = await BlockingNotifications.findOneAndUpdate(
      {
        userId: userId,
        courseId: courseId,
        "channels.channelId": channelId,
      },
      {
        $pull: {
          "channels.$.followingAnnotations": { annotationId: annotationId },
        },
      },
      { new: true }
    );

    console.log(
      "Element removed successfully from followingAnnotations array."
    );
    // Handle the updated document as needed
  } catch (error) {
    console.error("Error occurred while updating the document:", error);
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
        _id: ObjectId(userToBlockId),
      },
      {
        $addToSet: {
          blockedByUser: ObjectId(userId),
        },
      }
    );

    user = await User.findOneAndUpdate(
      {
        _id: ObjectId(userId),
      },
      {
        $addToSet: {
          blockingUsers: ObjectId(userToBlockId),
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
  res.status(200).json(res.response);
};

/* export const subscribeChannel = async (req, res, next) => {
      console.log("endpoint: subscribeChannel");
      const userId = req.userId;
      const channelId = req.body.channelId;
      const courseId = req.body.courseId;
    
      // Check if user is already subscribed to channel
      let userChannelSubscriber;
      try {
        userChannelSubscriber = await UserChannelSubscriber.findOne({
          userId: new ObjectId(userId),
          channelId: new ObjectId(channelId),
        });
    
        if (userChannelSubscriber) {
          return res
            .status(400)
            .send({ error: "User is already subscribed to channel" });
        }
      } catch (error) {
        return res
          .status(500)
          .send({ error: "Error in checking if user is already subscribed!" });
      }
    
      // Create new user channel subscriber
      const newUserChannelSubscriber = new UserChannelSubscriber({
        userId: new ObjectId(userId),
        channelId: new ObjectId(channelId),
        courseId: new ObjectId(courseId),
      });
    
      try {
        await newUserChannelSubscriber.save();
      } catch (error) {
        return res
          .status(500)
          .send({ error: "Error saving new user channel subscriber", error });
      }
    
      return res.status(200).send({ message: "User subscribed to channel" });
    };
    
    export const unsubscribeChannel = async (req, res, next) => {
      console.log("endpoint: unsubscribeChannel");
      const userId = req.userId;
      const channelId = req.body.channelId;
    
      let userChannelSubscriber;
      try {
        userChannelSubscriber = await UserChannelSubscriber.findOne({
          userId: new ObjectId(userId),
          channelId: new ObjectId(channelId),
        });
    
        if (userChannelSubscriber) {
          // Delete user channel subscriber
          try {
            await UserChannelSubscriber.findOneAndDelete({
              userId: new ObjectId(userId),
              channelId: new ObjectId(channelId),
            });
            return res.status(200).send({ message: "User unsubscribed" });
          } catch (error) {
            return res
              .status(500)
              .send({ error: "Error deleting user channel subscriber", error });
          }
        } else {
          return res
            .status(400)
            .send({ error: "User is already not subscribed to channel" });
        }
      } catch (error) {
        return res
          .status(500)
          .send({ error: "Error in checking if user is already subscribed!" });
      }
    };
    
    export const subscribeTopic = async (req, res, next) => {
      console.log("endpoint: subscribeTopic");
      const userId = req.userId;
      const topicId = req.body.topicId;
      const courseId = req.body.courseId;
    
      // Check if user is already subscribed to topic
      let userTopicSubscriber;
      try {
        userTopicSubscriber = await UserTopicSubscriber.findOne({
          userId: new ObjectId(userId),
          topicId: new ObjectId(topicId),
        });
    
        if (userTopicSubscriber) {
          return res
            .status(400)
            .send({ error: "User is already subscribed to topic" });
        }
      } catch (error) {
        return res
          .status(500)
          .send({ error: "Error in checking if user is already subscribed!" });
      }
    
      //create new user topic subscriber
      const newUserTopicSubscriber = new UserTopicSubscriber({
        userId: new ObjectId(userId),
        topicId: new ObjectId(topicId),
        courseId: new ObjectId(courseId),
      });
    
      try {
        await newUserTopicSubscriber.save();
      } catch (error) {
        return res
          .status(500)
          .send({ error: "Error saving new user Topic subscriber", error });
      }
    
      return res.status(200).send({ message: "User subscribed to Topic" });
    };
    
    //unsubscribe from a topic
    export const unsubscribeTopic = async (req, res, next) => {
      console.log("endpoint: unsubscribeTopic");
      const userId = req.userId;
      const topicId = req.body.topicId;
    
      let userTopicSubscriber;
      try {
        userTopicSubscriber = await UserTopicSubscriber.findOne({
          userId: new ObjectId(userId),
          topicId: new ObjectId(topicId),
        });
    
        if (userTopicSubscriber) {
          // Delete user topic subscriber
          try {
            await UserTopicSubscriber.findOneAndDelete({
              userId: new ObjectId(userId),
              topicId: new ObjectId(topicId),
            });
            return res.status(200).send({ message: "User unsubscribed" });
          } catch (error) {
            return res
              .status(500)
              .send({ error: "Error deleting user topic subscriber", error });
          }
        } else {
          return res
            .status(400)
            .send({ error: "User is already not subscribed to topic" });
        }
      } catch (error) {
        return res
          .status(500)
          .send({ error: "Error in checking if user is already subscribed!" });
      }
    };
    
    export const subscribeCourse = async (req, res, next) => {
      console.log("endpoint: subscribeCourse");
      const userId = req.userId;
      const courseId = req.body.courseId;
    
      let foundCourse;
      try {
        foundCourse = await Course.findById(courseId);
        if (!foundCourse) {
          return res.status(404).send({
            error: `Course with id ${courseId} doesn't exist!`,
          });
        }
      } catch (err) {
        return res.status(500).send({ error: err });
      }
    
      let foundUser;
      try {
        foundUser = await User.findById(userId);
        if (!foundUser) {
          return res.status(404).send({
            error: `User not found!`,
          });
        }
      } catch (err) {
        return res.status(500).send({ error: "Error finding user" });
      }
    
      // Check if user is already subscribed to course
    
      try {
        let userCourseSubscriber;
        userCourseSubscriber = await UserCourseSubscriber.findOne({
          userId: new ObjectId(userId),
          courseId: new ObjectId(courseId),
        });
    
        if (userCourseSubscriber) {
          return res
            .status(400)
            .send({ error: "User is already subscribed to course" });
        }
      } catch (error) {
        return res
          .status(500)
          .send({ error: "Error in checking if user is already subscribed!" });
      }
    
      //populate the UserCourseSubscriber table. it will contain the userId and courseId
      let userCourseSubscriber = new UserCourseSubscriber({
        userId: foundUser._id,
        courseId: foundCourse._id,
      });
      try {
        await userCourseSubscriber.save();
      } catch (err) {
        return res.status(500).send({ error: "Error saving userCourseSubscriber" });
      }
      //populate the UserTopicSubscriber table. For every topic that the foundCourse contains, add a document to the table. each document contains the userId and the topicId and the courseId
      const userTopicSubscribers = foundCourse.topics.map((topic) => {
        return new UserTopicSubscriber({
          userId: foundUser._id,
          topicId: topic._id,
          courseId: foundCourse._id,
        });
      });
    
      try {
        await UserTopicSubscriber.insertMany(userTopicSubscribers);
      } catch (err) {
        return res.status(500).send({ error: "Error saving userTopicSubscribers" });
      }
    
      //populate the UserChannelSubscriber table. For every channel that the foundCourse contains, add a document to the table. each document contains the userId and the courseId and the channelId
      const userChannelSubscribers = foundCourse.channels.map((channel) => {
        return new UserChannelSubscriber({
          userId: foundUser._id,
          channelId: channel._id,
          courseId: foundCourse._id,
        });
      });
    
      try {
        await UserChannelSubscriber.insertMany(userChannelSubscribers);
      } catch (err) {
        return res
          .status(500)
          .send({ error: "Error saving userChannelSubscribers" });
      }
    
      res.status(200).send({ message: "User subscribed to course" });
    };
    
    export const unsubscribeCourse = async (req, res, next) => {
      console.log("endpoint: unsubscribeCourse");
      const userId = req.userId;
      const courseId = req.body.courseId;
    
      let foundCourse;
      try {
        foundCourse = await Course.findById(courseId);
        if (!foundCourse) {
          return res.status(404).send({
            error: `Course with id ${courseId} doesn't exist!`,
          });
        }
      } catch (err) {
        return res.status(500).send({ error: "Error finding course" });
      }
      let foundUser;
      try {
        foundUser = await User.findById(userId);
        if (!foundUser) {
          return res.status(404).send({
            error: `User not found!`,
          });
        }
      } catch (err) {
        return res.status(500).send({ error: "Error finding user" });
      }
    
      //delete the UserCourseSubscriber document
      try {
        await UserCourseSubscriber.deleteOne({
          userId: foundUser._id,
          courseId: foundCourse._id,
        });
      } catch (err) {
        return res
          .status(500)
          .send({ error: "Error deleting userCourseSubscriber" });
      }
    
      //delete the UserTopicSubscriber documents
      try {
        await UserTopicSubscriber.deleteMany({
          userId: foundUser._id,
          courseId: foundCourse._id,
        });
      } catch (err) {
        return res
          .status(500)
          .send({ error: "Error deleting userTopicSubscribers" });
      }
    
      //delete the UserChannelSubscriber documents
      try {
        await UserChannelSubscriber.deleteMany({
          userId: foundUser._id,
          courseId: foundCourse._id,
        });
      } catch (err) {
        return res
          .status(500)
          .send({ error: "Error deleting userChannelSubscribers" });
      }
    
      res.status(200).send({ message: "User unsubscribed from course" });
    }; */