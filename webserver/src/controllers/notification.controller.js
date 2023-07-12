const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");

const UserNotification = db.userNotifications;
const User = db.user;
const Course = db.course;
const FollowAnnotation = db.followAnnotation;
const Annotation = db.annotation;
const BlockingNotifications = db.blockingNotifications;
const Material = db.material;

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
      "statement.object.definition.extensions",
      "statement.object.id",
      "statement.object.definition.type",
      "statement.verb.display.en-US",
      "statement.object.definition.name.en-US",
      "statement.timestamp",
    ]);
  } catch (error) {
    return res
      .status(500)
      .send({ error: "Error finding notifications", error });
  }

  console.log("notifications: ", notifications);
  return res.status(200).send(notifications);
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

  //update the followingAnnotations array in the BlockingNotifications collection for the respective channel
  //fetch the BlockingNotification for the respective User and CourseId

  /*   try {
    blockingNotification = await BlockingNotifications.findOne({
      userId: userId,
      courseId: courseId,
    });
    //blocking Notification should exist 100% as it is created when the user joins the course
  } catch (error) {
    return res.status(500).json({
      error: "Error in finding the Blocking Notification for the User!",
    });
  } */

  //fetch the material to which this annotation belongs to to get the material Type.
  let material;
  try {
    material = await Material.findById(materialId);
  } catch (error) {
    return res.status(500).json({ error: "Material not found" });
  }

  const newFollowingAnnotation = {
    annotationId: annotationId,
    channelId: channelId,
    materialId: materialId,
    annotationContent: annotation.content,
    materialType: material.type,
  };

  try {
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
    } else {
      res.status(500).json({ error: "Already following the annotation!" });
    }
  } catch (error) {
    res.status(500).json({ error: "Could not Follow the Annotation!" });
  }
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
  try {
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
  }

  return res.status(200).json({ message: "Annotation unfollowed!" });
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

  //update the material in the Blocking Notification collection
  try {
    const updatedDocument = await BlockingNotifications.findOneAndUpdate(
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

  return res
    .status(200)
    .json({ message: "Material notification settings updated!" });
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

  //update the material in the Blocking Notification collection
  try {
    blockingNotification = await BlockingNotifications.findOneAndUpdate(
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
        },
      }
    );
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Could not update the material notification settings!" });
  }

  return res
    .status(200)
    .json({ message: "Material notification settings updated!" });
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

  //update the channel in the Blocking Notification collection
  try {
    await BlockingNotifications.findOneAndUpdate(
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
          "materials.$[materialElem].isAnnotationNotificationsEnabled":
            isAnnotationNotificationsEnabled,
          "materials.$[materialElem].isReplyAndMentionedNotificationsEnabled":
            isReplyAndMentionedNotificationsEnabled,
          "materials.$[materialElem].isCourseUpdateNotificationsEnabled":
            isCourseUpdateNotificationsEnabled,
          "materials.$[materialElem].isMaterialLevelOverride": false,
          "materials.$[materialElem].isChannelLevelOverride": true,
          "materials.$[materialElem].isTopicLevelOverride": false,
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
      }
    );
  } catch (error) {
    return res.status(500).json({ error });
  }

  return res
    .status(200)
    .json({ message: "Channel notification settings updated!" });
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

  //update the channel in the Blocking Notification collection
  try {
    blockingNotification = await BlockingNotifications.findOneAndUpdate(
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
      }
    );
  } catch (error) {
    return res.status(500).json({ error });
  }

  return res
    .status(200)
    .json({ message: "Channel notification settings unset!" });
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
  try {
    await BlockingNotifications.findOneAndUpdate(
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
          "channels.$[channelElem].isAnnotationNotificationsEnabled":
            isAnnotationNotificationsEnabled,
          "channels.$[channelElem].isReplyAndMentionedNotificationsEnabled":
            isReplyAndMentionedNotificationsEnabled,
          "channels.$[channelElem].isCourseUpdateNotificationsEnabled":
            isCourseUpdateNotificationsEnabled,
          "channels.$[channelElem].isChannelLevelOverride": false,
          "channels.$[channelElem].isTopicLevelOverride": true,
          "materials.$[materialElem].isAnnotationNotificationsEnabled":
            isAnnotationNotificationsEnabled,
          "materials.$[materialElem].isReplyAndMentionedNotificationsEnabled":
            isReplyAndMentionedNotificationsEnabled,
          "materials.$[materialElem].isCourseUpdateNotificationsEnabled":
            isCourseUpdateNotificationsEnabled,
          "materials.$[materialElem].isMaterialLevelOverride": false,
          "materials.$[materialElem].isChannelLevelOverride": false,
          "materials.$[materialElem].isTopicLevelOverride": true,
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
      }
    );
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not set topic notification settings!" });
  }

  return res.status(200).json({ message: "Topic notification settings set!" });
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

  //update the channel in the Blocking Notification collection
  try {
    blockingNotification = await BlockingNotifications.findOneAndUpdate(
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
          "channels.$[channelElem].isAnnotationNotificationsEnabled":
            blockingNotification.isAnnotationNotificationsEnabled,
          "channels.$[channelElem].isReplyAndMentionedNotificationsEnabled":
            blockingNotification.isReplyAndMentionedNotificationsEnabled,
          "channels.$[channelElem].isCourseUpdateNotificationsEnabled":
            blockingNotification.isCourseUpdateNotificationsEnabled,
          "channels.$[channelElem].isChannelLevelOverride": false,
          "channels.$[channelElem].isTopicLevelOverride": false,
          "materials.$[materialElem].isAnnotationNotificationsEnabled":
            blockingNotification.isAnnotationNotificationsEnabled,
          "materials.$[materialElem].isReplyAndMentionedNotificationsEnabled":
            blockingNotification.isReplyAndMentionedNotificationsEnabled,
          "materials.$[materialElem].isCourseUpdateNotificationsEnabled":
            blockingNotification.isCourseUpdateNotificationsEnabled,
          "materials.$[materialElem].isMaterialLevelOverride": false,
          "materials.$[materialElem].isChannelLevelOverride": false,
          "materials.$[materialElem].isTopicLevelOverride": false,
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
      }
    );
  } catch (error) {
    return res.status(500).json({ error });
  }

  return res
    .status(200)
    .json({ message: "Topic notification settings unset!" });
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

  try {
    await BlockingNotifications.findOneAndUpdate(
      {
        courseId: courseId,
        userId: userId,
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
          { "topicElem.isTopicLevelOverride": false },
          {
            "channelElem.isChannelLevelOverride": false,
            "channelElem.isTopicLevelOverride": false,
          },
          {
            "materialElem.isMaterialLevelOverride": false,
            "materialElem.isChannellLevelOverride": false,
            "materialElem.isTopicLevelOverride": false,
          },
        ],
      }
    );
  } catch (error) {
    return res.status(500).json({ error });
  }

  return res
    .status(200)
    .json({ message: "Channel notification settings updated!" });
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
