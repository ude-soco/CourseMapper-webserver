import { remove } from "../../models/user.model";

const socketio = require("../../socketio");

const db = require("../../models");
const UserNotification = db.userNotifications;
const User = db.user;
const BlockingNotifications = db.blockingNotifications;
const FollowAnnotation = db.followAnnotation;
const ObjectId = require("mongoose").Types.ObjectId;
//TODO Ask why the users objects in the course contains an _id field aside from the userID field

export const generateNotificationInfo = (req) => {
  //userShortname (the first 2 initials of the user's name) being calculated here
  const firstInitial = req.locals.user.firstname.charAt(0).toUpperCase();
  const secondInitial = req.locals.user.lastname.charAt(0).toUpperCase();

  //adding the courseName, topicName, and channelName to the notificationInfo object if they exist
  let courseName;
  let topicName;
  let channelName;
  let materialName;
  if (req.locals.topic) {
    topicName = req.locals.topic.name;
  }
  if (req.locals.course) {
    courseName = req.locals.course.name;
  }
  if (req.locals.channel) {
    channelName = req.locals.channel.name;
  }
  if (req.locals.material) {
    materialName = req.locals.material.name;
  }
  return {
    userName: req.locals.user?.firstname + " " + req.locals.user?.lastname,
    userShortname: firstInitial + secondInitial,
    username: req.locals.user.username,
    category: req.locals.category,
    ...(courseName && { courseName }),
    ...(topicName && { topicName }),
    ...(channelName && { channelName }),
    ...(materialName && { materialName }),
    ...(req.locals.materialType && { materialType: req.locals.materialType }),
    ...(req.locals.annotation && { annotation_id: req.locals.annotation._id }),
    ...(req.locals.annotation && {
      annotationAuthorId: req.locals.annotation.author.userId,
    }),
    ...(req.locals.reply && { replyAuthorId: req.locals.reply.author.userId }),
    ...(req.locals.isFollowingAnnotation && {
      isFollowingAnnotation: req.locals.isFollowingAnnotation,
    }),
    authorEmail: req.locals.user?.email,
    ...(req.locals.isDeletingAnnotation && { isDeletingAnnotation: true }),
    ...(req.locals.isDeletingMaterial && { isDeletingMaterial: true }),
    ...(req.locals.isDeletingChannel && { isDeletingChannel: true }),
    ...(req.locals.isDeletingTopic && { isDeletingTopic: true }),
    ...(req.locals.isDeletingReply && { isDeletingReply: true }),
  };
};

const emitNotificationsToSubscribedUsers = async (
  req,
  userToBeNotified,
  insertedUserNotifications
) => {
  /* let activityIndicators = req.locals.activityIndicators; */
  for (let i = 0; i < insertedUserNotifications.length; i++) {
    const userNotification = insertedUserNotifications[i];
    const socketId = userNotification.userId;

    userNotification.activityId = req.locals.activity;
    socketio
      .getIO()
      .to("user:" + socketId)
      .emit(socketId, [userNotification]);
  }
};

export const populateUserNotification = async (req, res, next) => {
  let user = req.locals.user;
  let course = req.locals.course;
  let activity = req.locals.activity;
  /* const userToBeNotified = course.users; */
  const userToBeNotified = req.locals.usersToBeNotified;
  const arrUserNotification = [];
  let insertedUserNotifications;

  userToBeNotified.forEach((userId) => {
    let userNotification = new UserNotification({
      userId: userId,
      activityId: activity._id,
      isStar: false,
      isRead: false,
      ...(req.locals.reply && { replyId: req.locals.reply._id }),
      ...(req.locals.reply && { annotationId: req.locals.reply.annotationId }),
      ...(req.locals.reply && { materialId: req.locals.reply.materialId }),
      ...(req.locals.reply && { channelId: req.locals.reply.channelId }),
      ...(req.locals.reply && { topicId: req.locals.reply.topicId }),
      ...(req.locals.reply && { courseId: req.locals.reply.courseId }),
      ...(req.locals.annotation && { annotationId: req.locals.annotation._id }),
      ...(req.locals.annotation && {
        materialId: req.locals.annotation.materialId,
      }),
      ...(req.locals.annotation && {
        channelId: req.locals.annotation.channelId,
      }),
      ...(req.locals.annotation && { topicId: req.locals.annotation.topicId }),
      ...(req.locals.annotation && {
        courseId: req.locals.annotation.courseId,
      }),
      ...(req.locals.material && { materialId: req.locals.material._id }),
      ...(req.locals.material && { channelId: req.locals.material.channelId }),
      ...(req.locals.material && { topicId: req.locals.material.topicId }),
      ...(req.locals.material && { courseId: req.locals.material.courseId }),
      ...(req.locals.channel && { channelId: req.locals.channel._id }),
      ...(req.locals.channel && { topicId: req.locals.channel.topicId }),
      ...(req.locals.channel && { courseId: req.locals.channel.courseId }),
      ...(req.locals.topic && { topicId: req.locals.topic._id }),
      ...(req.locals.topic && { courseId: req.locals.topic.courseId }),
    });
    arrUserNotification.push(userNotification);
  });

  try {
    insertedUserNotifications = await UserNotification.insertMany(
      arrUserNotification
    );
  } catch (err) {
    return res.status(500).send({
      error: "Operation successful but Error populating UserNotification",
      err,
    });
  }

  try {
    await emitNotificationsToSubscribedUsers(
      req,
      userToBeNotified,
      insertedUserNotifications
    );
  } catch (err) {
    return res.status(500).send({
      error: "Error emitting notifications",
      err,
    });
  }

  if (req.locals.isMentionedUsersPresent) {
    return next();
  }

  let objectToSend = {
    message: "Users notified and Your operation completed without errors!",
    ...(req.locals.response && req.locals.response),
  };

  return res.status(200).send(objectToSend);
};

const removeUserFromList = (userToBeNotified, userId) => {
  return userToBeNotified.filter((id) => !id.equals(userId));
};

export const newAnnotationNotificationUsersCalculate = async (
  req,
  res,
  next
) => {
  //get the users blocked by the user doing the action
  const userId = req.userId;
  const material = req.locals.material;
  const course = req.locals.course;
  //for the above userId get the array of users who have blocked him

  let foundUser = await User.findById(userId);
  let blockedByUsers = foundUser.blockedByUser.map((userId) =>
    userId.toString()
  );

  const usersAllowingAnnotationNotifications =
    await BlockingNotifications.aggregate([
      {
        $match: {
          courseId: new ObjectId(course._id),
          materials: {
            $elemMatch: {
              materialId: material._id,
              isAnnotationNotificationsEnabled: true,
            },
          },
        },
      },
    ]);

  let resultingUsers;

  const userIdsOfUsersAllowingAnnotationNotifications =
    usersAllowingAnnotationNotifications.map((user) => user.userId);

  if (blockedByUsers.length > 0) {
    const blockedByUserSet = new Set(blockedByUsers);
    resultingUsers = userIdsOfUsersAllowingAnnotationNotifications.filter(
      (userId) => !blockedByUserSet.has(userId.toString())
    );
  } else {
    resultingUsers = userIdsOfUsersAllowingAnnotationNotifications;
  }

  let finalListOfUsersToNotify = removeUserFromList(
    resultingUsers,
    new ObjectId(userId)
  );
  req.locals.usersToBeNotified = finalListOfUsersToNotify;
  next();
};

//the below method calculates which users are following an annotation. so that we can generate notifications for them.
export const calculateUsersFollowingAnnotation = async (req, res, next) => {
  const annotationId = req.locals.annotationId;
  const userId = req.userId;
  let foundUser = await User.findById(userId);
  let blockedByUsers = foundUser.blockedByUser.map((userId) =>
    userId.toString()
  );
  const followingAnnotations = await FollowAnnotation.find({
    annotationId: annotationId,
  });
  const userIdsOfUsersFollowingAnnotation = followingAnnotations.map(
    (user) => user.userId
  );

  let resultingUsers;
  if (blockedByUsers.length > 0) {
    const blockedByUserSet = new Set(blockedByUsers);
    resultingUsers = userIdsOfUsersFollowingAnnotation.filter(
      (userId) => !blockedByUserSet.has(userId.toString())
    );
  } else {
    resultingUsers = userIdsOfUsersFollowingAnnotation;
  }

  let finalListOfUsersToNotify = removeUserFromList(
    resultingUsers,
    new ObjectId(userId)
  );
  req.locals.usersToBeNotified = finalListOfUsersToNotify;
  if (req.locals.isDeletingAnnotation) {
    await removeFollowingAnnotationDocuments(req);
    await emitAnnotationDeleted(annotationId);
    await deleteAnnotationNotifications(annotationId);
  }
  if (req.locals.isDeletingReply) {
    await emitReplyDeleted(req.locals.reply._id);
    await deleteReplyNotifications(req.locals.reply._id);
  }

  next();
};

export const emitAnnotationDeleted = async (annotationId) => {
  const userNotifications = await UserNotification.find({
    annotationId: annotationId,
  });
  const userIds = userNotifications.map(
    (userNotification) => userNotification.userId
  );

  userIds.forEach((userId) => {
    socketio
      .getIO()
      .to("user:" + userId)
      .emit(userId, [
        {
          annotationId: annotationId,
          isDeletingAnnotation: true,
        },
      ]);
  });
};

export const emitReplyDeleted = async (replyId) => {
  const userNotifications = await UserNotification.find({
    replyId: replyId,
  });
  const userIds = userNotifications.map(
    (userNotification) => userNotification.userId
  );

  userIds.forEach((userId) => {
    socketio
      .getIO()
      .to("user:" + userId)
      .emit(userId, [
        {
          replyId: replyId,
          isDeletingReply: true,
        },
      ]);
  });
};

export const emitMaterialDeleted = async (materialId) => {
  const userNotifications = await UserNotification.find({
    materialId: materialId,
  });

  const userIds = userNotifications.map(
    (userNotification) => userNotification.userId
  );

  userIds.forEach((userId) => {
    socketio
      .getIO()
      .to("user:" + userId)
      .emit(userId, [
        {
          materialId: materialId,
          isDeletingMaterial: true,
        },
      ]);
  });
};

export const emitChannelDeleted = async (channelId) => {
  const userNotifications = await UserNotification.find({
    channelId: channelId,
  });

  const userIds = userNotifications.map(
    (userNotification) => userNotification.userId
  );

  userIds.forEach((userId) => {
    socketio
      .getIO()
      .to("user:" + userId)
      .emit(userId, [
        {
          channelId: channelId,
          isDeletingChannel: true,
        },
      ]);
  });
};

export const emitTopicDeleted = async (topicId) => {
  const userNotifications = await UserNotification.find({
    topicId: topicId,
  });

  const userIds = userNotifications.map(
    (userNotification) => userNotification.userId
  );

  userIds.forEach((userId) => {
    socketio
      .getIO()
      .to("user:" + userId)
      .emit(userId, [
        {
          topicId: topicId,
          isDeletingTopic: true,
        },
      ]);
  });
};

export const LikesDislikesMentionedNotificationUsers = async (
  req,
  res,
  next
) => {
  const userId = req.userId;
  let foundUser = await User.findById(userId);
  let blockedByUsers = foundUser.blockedByUser.map((userId) =>
    userId.toString()
  );
  const courseId = req.locals.course._id;

  const authorDocument = await BlockingNotifications.aggregate([
    {
      $match: {
        courseId: new ObjectId(courseId),
        userId: new ObjectId(req.locals.replyAuthorId),
        materials: {
          $elemMatch: {
            materialId: new ObjectId(req.locals.materialId),
            isReplyAndMentionedNotificationsEnabled: true,
          },
        },
      },
    },
  ]);

  const annotationAuthorId = authorDocument.map((user) => user.userId);

  let resultingUsers;
  if (blockedByUsers.length > 0) {
    const blockedByUserSet = new Set(blockedByUsers);
    resultingUsers = annotationAuthorId.filter(
      (userId) => !blockedByUserSet.has(userId.toString())
    );
  } else {
    resultingUsers = annotationAuthorId;
  }

  let finalListOfUsersToNotify = removeUserFromList(
    resultingUsers,
    new ObjectId(userId)
  );
  req.locals.usersToBeNotified = finalListOfUsersToNotify;
  next();
};
export const LikesDislikesAnnotationNotificationUsers = async (
  req,
  res,
  next
) => {
  const userId = req.userId;
  let foundUser = await User.findById(userId);
  let blockedByUsers = foundUser.blockedByUser.map((userId) =>
    userId.toString()
  );
  const courseId = req.locals.course._id;

  const authorDocument = await BlockingNotifications.aggregate([
    {
      $match: {
        courseId: new ObjectId(courseId),
        userId: new ObjectId(req.locals.annotationAuthorId),
        materials: {
          $elemMatch: {
            materialId: new ObjectId(req.locals.materialId),
            isAnnotationNotificationsEnabled: true,
          },
        },
      },
    },
  ]);

  const annotationAuthorId = authorDocument.map((user) => user.userId);

  let resultingUsers;
  if (blockedByUsers.length > 0) {
    const blockedByUserSet = new Set(blockedByUsers);
    resultingUsers = annotationAuthorId.filter(
      (userId) => !blockedByUserSet.has(userId.toString())
    );
  } else {
    resultingUsers = annotationAuthorId;
  }

  let finalListOfUsersToNotify = removeUserFromList(
    resultingUsers,
    new ObjectId(userId)
  );
  req.locals.usersToBeNotified = finalListOfUsersToNotify;
  next();
};

export const newMentionNotificationUsersCalculate = async (req, res, next) => {
  let mentionedUsers = req.body.mentionedUsers;
  let userId = req.userId;
  let courseId = req.locals.course._id;

  let mentionedUsersIds = mentionedUsers.map((user) => user.userId);
  const objectIdArray = mentionedUsersIds.map((id) => new ObjectId(id));

  let foundUser = await User.findById(userId);
  //fetch the users who have blocked the user doing the action
  let blockedByUsers = foundUser.blockedByUser.map((userId) =>
    userId.toString()
  );

  const usersAllowingMentionNotifications =
    await BlockingNotifications.aggregate([
      {
        $match: {
          courseId: new ObjectId(courseId),
          userId: {
            $in: objectIdArray,
          },
          materials: {
            $elemMatch: {
              materialId: req.locals.material._id,
              isReplyAndMentionedNotificationsEnabled: true,
            },
          },
        },
      },
    ]);

  const userIdsOfUsersAllowingMentionNotifications =
    usersAllowingMentionNotifications.map((user) => user.userId.toString());

  let resultingUsers;
  if (blockedByUsers.length > 0) {
    const blockedByUserSet = new Set(blockedByUsers);
    resultingUsers = userIdsOfUsersAllowingMentionNotifications.filter(
      (userId) => !blockedByUserSet.has(userId.toString())
    );
  } else {
    resultingUsers = userIdsOfUsersAllowingMentionNotifications;
  }

  //make sure the array resultingUsers does not have any strings that appear more than once
  resultingUsers = [...new Set(resultingUsers)];

  req.locals.usersToBeNotified = resultingUsers;
  req.locals.isMentionedUsersPresent = false;
  next();
};

export const materialCourseUpdateNotificationsUsers = async (
  req,
  res,
  next
) => {
  const userId = req.userId;
  const course = req.locals.course;
  const material = req.locals.material;
  let foundUser = await User.findById(userId);
  let blockedByUsers = foundUser.blockedByUser.map((userId) =>
    userId.toString()
  );
  const usersAllowingCourseUpdatesMaterialLevel =
    await BlockingNotifications.aggregate([
      {
        $match: {
          courseId: new ObjectId(course._id),
          materials: {
            $elemMatch: {
              materialId: new ObjectId(material._id),
              isCourseUpdateNotificationsEnabled: true,
            },
          },
        },
      },
    ]);

  let resultingUsers;
  const userIdsOfUsersAllowingCourseUpdatesMaterialLevel =
    usersAllowingCourseUpdatesMaterialLevel.map((user) => user.userId);

  if (blockedByUsers.length > 0) {
    const blockedByUserSet = new Set(blockedByUsers);
    resultingUsers = userIdsOfUsersAllowingCourseUpdatesMaterialLevel.filter(
      (userId) => !blockedByUserSet.has(userId.toString())
    );
  } else {
    resultingUsers = userIdsOfUsersAllowingCourseUpdatesMaterialLevel;
  }

  let finalListOfUsersToNotify = removeUserFromList(
    resultingUsers,
    new ObjectId(userId)
  );
  req.locals.usersToBeNotified = finalListOfUsersToNotify;

  if (req.locals.isDeletingMaterial) {
    await emitMaterialDeleted(req.locals.material._id);
    await deleteMaterialNotifications(req.locals.material._id);
    await BlockingNotifications.updateMany(
      { "materials.materialId": req.locals.material._id },
      { $pull: { materials: { materialId: req.locals.material._id } } }
    );
    await removeFollowingAnnotationDocuments(req);
  }
  next();
};

export const channelCourseUpdateNotificationUsers = async (req, res, next) => {
  const userId = req.userId;
  const course = req.locals.course;
  const channel = req.locals.channel;
  let foundUser = await User.findById(userId);
  let blockedByUsers = foundUser.blockedByUser.map((userId) =>
    userId.toString()
  );

  const usersAllowingCourseUpdatesChannelLevel =
    await BlockingNotifications.aggregate([
      {
        $match:
          /**
           * query: The query in MQL.
           */
          {
            courseId: new ObjectId(course._id),
            channels: {
              $elemMatch: {
                channelId: new ObjectId(channel._id),
                isCourseUpdateNotificationsEnabled: true,
              },
            },
          },
      },
    ]);

  let resultingUsers;

  const userIdsOfUsersAllowingCourseUpdatesChannelLevel =
    usersAllowingCourseUpdatesChannelLevel.map((user) => user.userId);

  if (blockedByUsers.length > 0) {
    const blockedByUserSet = new Set(blockedByUsers);
    resultingUsers = userIdsOfUsersAllowingCourseUpdatesChannelLevel.filter(
      (userId) => !blockedByUserSet.has(userId.toString())
    );
  } else {
    resultingUsers = userIdsOfUsersAllowingCourseUpdatesChannelLevel;
  }

  let finalListOfUsersToNotify = removeUserFromList(
    resultingUsers,
    new ObjectId(userId)
  );
  req.locals.usersToBeNotified = finalListOfUsersToNotify;

  if (req.locals.isDeletingChannel) {
    await emitChannelDeleted(req.locals.channel._id);
    await deleteChannelNotifications(req.locals.channel._id);
    await removeFollowingAnnotationDocuments(req);
    await BlockingNotifications.updateMany(
      {
        $or: [
          { "materials.channelId": req.locals.channel._id },
          { "channels.channelId": req.locals.channel._id },
        ],
      },
      {
        $pull: {
          channels: { channelId: req.locals.channel._id },
          materials: { channelId: req.locals.channel._id },
        },
      }
    );
  }
  next();
};

export const topicCourseUpdateNotificationUsers = async (req, res, next) => {
  const userId = req.userId;
  const course = req.locals.course;
  const topic = req.locals.topic;

  let foundUser = await User.findById(userId);
  let blockedByUsers = foundUser.blockedByUser.map((userId) =>
    userId.toString()
  );
  const usersAllowingCourseUpdatesTopicLevel =
    await BlockingNotifications.aggregate([
      {
        $match: {
          courseId: new ObjectId(course._id),
          topics: {
            $elemMatch: {
              topicId: new ObjectId(topic._id),
              isCourseUpdateNotificationsEnabled: true,
            },
          },
        },
      },
    ]);

  let resultingUsers;
  const userIdsOfUsersAllowingCourseUpdatesTopicLevel =
    usersAllowingCourseUpdatesTopicLevel.map((user) => user.userId);

  if (blockedByUsers.length > 0) {
    const blockedByUserSet = new Set(blockedByUsers);
    resultingUsers = userIdsOfUsersAllowingCourseUpdatesTopicLevel.filter(
      (userId) => !blockedByUserSet.has(userId.toString())
    );
  } else {
    resultingUsers = userIdsOfUsersAllowingCourseUpdatesTopicLevel;
  }

  let finalListOfUsersToNotify = removeUserFromList(
    resultingUsers,
    new ObjectId(userId)
  );
  req.locals.usersToBeNotified = finalListOfUsersToNotify;

  if (req.locals.isDeletingTopic) {
    await emitTopicDeleted(req.locals.topic._id);
    await deleteTopicNotifications(req.locals.topic._id);
    await removeFollowingAnnotationDocuments(req);
    await BlockingNotifications.updateMany(
      {
        $or: [
          { "materials.topicId": req.locals.topic._id },
          { "channels.topicId": req.locals.topic._id },
          { "topics.topicId": req.locals.topic._id },
        ],
      },
      {
        $pull: {
          channels: { topicId: req.locals.topic._id },
          materials: { topicId: req.locals.topic._id },
          topics: { topicId: req.locals.topic._id },
        },
      }
    );
  }

  /*   req.locals.activityIndicators = await updateTopicLevelActivityIndicators(
    finalListOfUsersToNotify,
    req
  ); */

  next();
};

export const updateBlockingNotificationsNewMaterial = async (
  req,
  res,
  next
) => {
  const userId = req.userId;
  const course = req.locals.course;
  const material = req.locals.material;
  const materialId = material._id;
  const channelId = material.channelId;
  const courseId = course._id;

  let channelDocuments = await BlockingNotifications.aggregate([
    {
      $match: {
        channels: {
          $elemMatch: {
            channelId: new ObjectId(channelId),
          },
        },
      },
    },
    {
      $project: {
        userId: 1,
        channels: {
          $filter: {
            input: "$channels",
            as: "channel",
            cond: {
              $eq: ["$$channel.channelId", new ObjectId(channelId)],
            },
          },
        },
      },
    },
    {
      $unwind:
        /**
         * path: Path to the array field.
         * includeArrayIndex: Optional name for index.
         * preserveNullAndEmptyArrays: Optional
         *   toggle to unwind null and empty values.
         */
        {
          path: "$channels",
        },
    },
    {
      $set:
        /**
         * field: The field name
         * expression: The expression.
         */
        {
          channel: "$channels",
        },
    },
    {
      $unset: "channels",
    },
  ]);

  const updatePromises = channelDocuments.map((channelDocument) => {
    let newObj = {
      materialId: materialId,
      topicId: material.topicId,
      channelId: channelId,
      isAnnotationNotificationsEnabled:
        channelDocument.channel.isAnnotationNotificationsEnabled,
      isCourseUpdateNotificationsEnabled:
        channelDocument.channel.isCourseUpdateNotificationsEnabled,
      isReplyAndMentionedNotificationsEnabled:
        channelDocument.channel.isReplyAndMentionedNotificationsEnabled,
      isMaterialLevelOverride: false,
      isChannelLevelOverride: channelDocument.channel.isChannelLevelOverride,
      isTopicLevelOverride: channelDocument.channel.isTopicLevelOverride,
    };
    return BlockingNotifications.findOneAndUpdate(
      {
        userId: channelDocument.userId,
        courseId: courseId,
      },
      {
        $push: {
          materials: newObj,
        },
      }
    );
  });

  await Promise.all(updatePromises);

  let notificationSettings;
  try {
    notificationSettings =
      await getNotificationSettingsWithFollowingAnnotations(courseId, userId);
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error finding updated notification settings" });
  }

  req.locals.response.updatedNotificationSettings = notificationSettings[0];

  next();
};

export const updateBlockingNotificationsNewTopic = async (req, res, next) => {
  const course = req.locals.course;
  const topic = req.locals.topic;
  const courseId = course._id;
  const userId = req.userId;

  let courseDocuments = await BlockingNotifications.aggregate([
    {
      $match: {
        courseId: new ObjectId(courseId),
      },
    },
    {
      $project: {
        userId: 1,
        isAnnotationNotificationsEnabled: 1,
        isCourseUpdateNotificationsEnabled: 1,
        isReplyAndMentionedNotificationsEnabled: 1,
      },
    },
  ]);

  const updatePromises = courseDocuments.map((courseDocument) => {
    let newObj = {
      topicId: topic._id,
      isAnnotationNotificationsEnabled:
        courseDocument.isAnnotationNotificationsEnabled,
      isCourseUpdateNotificationsEnabled:
        courseDocument.isCourseUpdateNotificationsEnabled,
      isReplyAndMentionedNotificationsEnabled:
        courseDocument.isReplyAndMentionedNotificationsEnabled,
      isTopicLevelOverride: false,
    };
    return BlockingNotifications.findOneAndUpdate(
      {
        userId: courseDocument.userId,
        courseId: courseId,
      },
      {
        $push: {
          topics: newObj,
        },
      }
    );
  });

  await Promise.all(updatePromises);

  let notificationSettings;
  try {
    notificationSettings =
      await getNotificationSettingsWithFollowingAnnotations(courseId, userId);
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error finding updated notification settings" });
  }

  req.locals.response.updatedNotificationSettings = notificationSettings[0];

  next();
};

export const updateBlockingNotificationsNewChannel = async (req, res, next) => {
  const course = req.locals.course;
  const channel = req.locals.channel;
  const courseId = course._id;
  const userId = req.userId;

  let topicDocuments = await BlockingNotifications.aggregate([
    {
      $match: {
        topics: {
          $elemMatch: {
            topicId: new ObjectId(channel.topicId),
          },
        },
      },
    },
    {
      $project: {
        userId: 1,
        topics: {
          $filter: {
            input: "$topics",
            as: "topic",
            cond: {
              $eq: ["$$topic.topicId", new ObjectId(channel.topicId)],
            },
          },
        },
      },
    },
    {
      $unwind:
        /**
         * path: Path to the array field.
         * includeArrayIndex: Optional name for index.
         * preserveNullAndEmptyArrays: Optional
         *   toggle to unwind null and empty values.
         */
        {
          path: "$topics",
        },
    },
    {
      $set:
        /**
         * field: The field name
         * expression: The expression.
         */
        {
          topic: "$topics",
        },
    },
    {
      $unset: "topics",
    },
  ]);

  const updatePromises = topicDocuments.map((topicDocument) => {
    let newObj = {
      topicId: channel.topicId,
      channelId: channel._id,
      isAnnotationNotificationsEnabled:
        topicDocument.topic.isAnnotationNotificationsEnabled,
      isCourseUpdateNotificationsEnabled:
        topicDocument.topic.isCourseUpdateNotificationsEnabled,
      isReplyAndMentionedNotificationsEnabled:
        topicDocument.topic.isReplyAndMentionedNotificationsEnabled,

      isChannelLevelOverride: false,
      isTopicLevelOverride: topicDocument.topic.isTopicLevelOverride,
      followingAnnotations: [],
    };
    return BlockingNotifications.findOneAndUpdate(
      {
        userId: topicDocument.userId,
        courseId: courseId,
      },
      {
        $push: {
          channels: newObj,
        },
      }
    );
  });

  await Promise.all(updatePromises);

  let notificationSettings;
  try {
    notificationSettings =
      await getNotificationSettingsWithFollowingAnnotations(courseId, userId);
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error finding updated notification settings" });
  }

  req.locals.response.updatedNotificationSettings = notificationSettings[0];

  return next();
};

export const getNotificationSettingsWithFollowingAnnotations = async (
  courseId,
  userId
) => {
  const notificationSettings = await BlockingNotifications.aggregate([
    {
      $match: {
        courseId: new ObjectId(courseId),
        userId: new ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "topics",
        localField: "topics.topicId",
        foreignField: "_id",
        as: "fetchedTopics",
      },
    },
    {
      $addFields: {
        fetchedTopics: {
          $map: {
            input: "$fetchedTopics",
            as: "currentElement",
            in: {
              name: "$$currentElement.name",
              _id: "$$currentElement._id",
            },
          },
        },
      },
    },
    {
      $addFields: {
        topics: {
          $map: {
            input: "$topics",
            as: "currentElement",
            in: {
              $mergeObjects: [
                "$$currentElement",
                {
                  $arrayElemAt: [
                    "$fetchedTopics",
                    {
                      $indexOfArray: [
                        "$fetchedTopics._id",
                        "$$currentElement.topicId",
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
    {
      $unset: "fetchedTopics",
    },
    {
      $lookup: {
        from: "channels",
        localField: "channels.channelId",
        foreignField: "_id",
        as: "fetchedChannels",
      },
    },
    {
      $addFields: {
        fetchedChannels: {
          $map: {
            input: "$fetchedChannels",
            // Replace with the actual field you're working with
            as: "currentElement",
            in: {
              name: "$$currentElement.name",
              _id: "$$currentElement._id",
            },
          },
        },
      },
    },
    {
      $addFields: {
        channels: {
          $map: {
            input: "$channels",
            as: "currentElement",
            in: {
              $mergeObjects: [
                "$$currentElement",
                {
                  $arrayElemAt: [
                    "$fetchedChannels",
                    {
                      $indexOfArray: [
                        "$fetchedChannels._id",
                        "$$currentElement.channelId",
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
    {
      $unset: "fetchedChannels",
    },
    {
      $lookup: {
        from: "materials",
        localField: "materials.materialId",
        foreignField: "_id",
        as: "fetchedMaterials",
      },
    },
    {
      $addFields: {
        fetchedMaterials: {
          $map: {
            input: "$fetchedMaterials",
            // Replace with the actual field you're working with
            as: "currentElement",
            in: {
              name: "$$currentElement.name",
              _id: "$$currentElement._id",
            },
          },
        },
      },
    },
    {
      $addFields: {
        materials: {
          $map: {
            input: "$materials",
            as: "currentElement",
            in: {
              $mergeObjects: [
                "$$currentElement",
                {
                  $arrayElemAt: [
                    "$fetchedMaterials",
                    {
                      $indexOfArray: [
                        "$fetchedMaterials._id",
                        "$$currentElement.materialId",
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
    {
      $unset: "fetchedMaterials",
    },
    {
      $lookup: {
        from: "followannotations",
        let: {
          uId: "$userId",
          cId: "$courseId",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$$cId", "$courseId"],
                  },
                  {
                    $eq: ["$$uId", "$userId"],
                  },
                ],
              },
            },
          },
        ],
        as: "result",
      },
    },
    {
      $lookup: {
        from: "annotations",
        localField: "result.annotationId",
        foreignField: "_id",
        as: "annotations",
      },
    },
    {
      $addFields: {
        mergedObjects: {
          $map: {
            input: "$annotations",
            in: {
              $mergeObjects: [
                {
                  materialType: "$$this.materialType",
                  content: "$$this.content",
                },
                {
                  $arrayElemAt: [
                    "$result",
                    {
                      $indexOfArray: ["$result.annotationId", "$$this._id"],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
    {
      $unset: "annotations",
    },
    {
      $unset: "result",
    },
    {
      $addFields: {
        channels: {
          $map: {
            input: "$channels",
            as: "channel",
            in: {
              $mergeObjects: [
                "$$channel",
                {
                  followingAnnotations: {
                    $filter: {
                      input: "$mergedObjects",
                      as: "mergedObj",
                      cond: {
                        $eq: ["$$mergedObj.channelId", "$$channel.channelId"],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
    {
      $unset: "mergedObjects",
    },
  ]);

  return notificationSettings;
};

export const removeFollowingAnnotationDocuments = async (req) => {
  if (req.locals.isDeletingAnnotation) {
    await FollowAnnotation.deleteMany({
      annotationId: req.locals.annotation._id,
    });
  }
  if (req.locals.isDeletingMaterial) {
    await FollowAnnotation.deleteMany({
      materialId: req.locals.material._id,
    });
  }
  if (req.locals.isDeletingChannel) {
    await FollowAnnotation.deleteMany({
      channelId: req.locals.channel._id,
    });
  }
  if (req.locals.isDeletingTopic) {
    await FollowAnnotation.deleteMany({
      topicId: req.locals.topic._id,
    });
  }
};

export const deleteAnnotationNotifications = async (annotationId) => {
  await UserNotification.deleteMany({
    annotationId: annotationId,
  });
};

export const deleteMaterialNotifications = async (materialId) => {
  await UserNotification.deleteMany({
    materialId: materialId,
  });
};

export const deleteChannelNotifications = async (channelId) => {
  await UserNotification.deleteMany({
    channelId: channelId,
  });
};

export const deleteTopicNotifications = async (topicId) => {
  await UserNotification.deleteMany({
    topicId: topicId,
  });
};

export const deleteReplyNotifications = async (replyId) => {
  await UserNotification.deleteMany({
    replyId: replyId,
  });
};

let notifications = {
  populateUserNotification,
  generateNotificationInfo,
  newAnnotationNotificationUsersCalculate,
  calculateUsersFollowingAnnotation,
  LikesDislikesMentionedNotificationUsers,
  channelCourseUpdateNotificationUsers,
  materialCourseUpdateNotificationsUsers,
  topicCourseUpdateNotificationUsers,
  updateBlockingNotificationsNewMaterial,
  updateBlockingNotificationsNewChannel,
  updateBlockingNotificationsNewTopic,
  getNotificationSettingsWithFollowingAnnotations,
  newMentionNotificationUsersCalculate,
  LikesDislikesAnnotationNotificationUsers,
  removeFollowingAnnotationDocuments,
};
module.exports = notifications;
