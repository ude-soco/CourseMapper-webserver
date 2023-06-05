const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");

//TODO Delete this controller later

const Notification = db.notification;
const User = db.user;
const Course = db.course;

/**
 * @function getAllNotifications
 * Get all notifications controller
 *
 */
export const getAllNotifications = async (req, res, next) => {
  const userId = req.userId;

  let foundUser;

  try {
    foundUser = await User.findById({
      _id: ObjectId(userId),
    });
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let notificationIds = [];
  foundUser.notificationLists.forEach((notificationId) => {
    notificationIds.push(notificationId);
  });

  let temp;
  let userNotificationLists = [];

  for (let i = 0; i < notificationIds.length; i++) {
    try {
      temp = await Notification.find({ _id: notificationIds[i] });
      userNotificationLists.push(temp);
    } catch (err) {
      return res.send({ message: err });
    }
  }

  return res.status(200).send({
    notificationLists: userNotificationLists.flat(),
  });
};

/**
 * @function deleteNotification
 * Delete a notification
 *
 * @param {string} req.params.notificationId The id of a notification
 */
export const deleteNotification = async (req, res) => {
  const notificationId = req.params.notificationId;
  const userId = req.userId;
  let foundUser;

  try {
    foundUser = await User.findById({
      _id: ObjectId(userId),
    });
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  try {
    await Notification.deleteOne({ _id: ObjectId(notificationId) });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let index = foundUser.notificationLists.indexOf(ObjectId(notificationId));
  if (index != -1) {
    foundUser.notificationLists.splice(index, 1);
  }
  foundUser.save();

  return res.send({
    success: `Notification with id ${notificationId} successfully deleted`,
  });
};

/**
 * @function deleteAllNotifications
 * Delete delete all Notifications
 *
 */
export const deleteAllNotifications = async (req, res) => {
  const userId = req.userId;
  let foundUser;
  try {
    foundUser = await User.findById({
      _id: ObjectId(userId),
    });
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let notificationIds = [];
  foundUser.notificationLists.forEach((notificationId) => {
    notificationIds.push(notificationId);
  });

  let notificationToBeDelete = [];

  for (let i = 0; i < notificationIds.length; i++) {
    foundNotification = await Notification.findById({
      _id: ObjectId(notificationIds[i]),
    });
    if (!foundNotification?.isStar) {
      notificationToBeDelete.push(foundNotification?._id);
    }
  }

  let foundNotification;
  for (let i = 0; i < notificationToBeDelete.length; i++) {
    try {
      await Notification.deleteMany({
        _id: notificationToBeDelete[i],
      });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }

  return res.send({
    success: `All Notifications are successfully deleted`,
    "notification of user": `${foundUser.notificationLists}`,
  });
};

/**
 * @function deleteNotificationsByCourseUpdates
 * Delete delete all course update Notifications
 *
 */
export const deleteNotificationsByCourseUpdates = async (req, res) => {
  let type = "courseupdates";
  const userId = req.userId;
  let foundUser;
  try {
    foundUser = await User.findById({
      _id: ObjectId(userId),
    });
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let notificationIds = [];

  foundUser.notificationLists.forEach((notificationId) => {
    notificationIds.push(notificationId);
  });

  let notificationToBeDelete = [];

  for (let i = 0; i < notificationIds.length; i++) {
    foundNotification = await Notification.findById({
      _id: ObjectId(notificationIds[i]),
    });

    if (!foundNotification?.isStar) {
      notificationToBeDelete.push(foundNotification?._id);
    }
  }

  let foundNotification;
  for (let i = 0; i < notificationToBeDelete.length; i++) {
    try {
      await Notification.deleteMany({
        _id: notificationToBeDelete[i],
        type: type,
      });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }

  return res.send(foundUser.notificationLists);
};

/**
 * @function deleteNotificationsByReplies
 * Delete delete all mentionedandreplied Notifications
 *
 */
export const deleteNotificationsByReplies = async (req, res) => {
  let type = "mentionedandreplied";
  const userId = req.userId;
  let foundUser;
  try {
    foundUser = await User.findById({
      _id: ObjectId(userId),
    });
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let notificationIds = [];

  foundUser.notificationLists.forEach((notificationId) => {
    notificationIds.push(notificationId);
  });

  let notificationToBeDelete = [];

  for (let i = 0; i < notificationIds.length; i++) {
    foundNotification = await Notification.findById({
      _id: ObjectId(notificationIds[i]),
    });
    if (!foundNotification?.isStar) {
      notificationToBeDelete.push(foundNotification?._id);
    }
  }

  let foundNotification;
  for (let i = 0; i < notificationToBeDelete.length; i++) {
    try {
      await Notification.deleteMany({
        _id: notificationToBeDelete[i],
        type: type,
      });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }

  return res.send(foundUser.notificationLists);
};

/**
 * @function deleteNotificationsByAnnotations
 * Delete delete all annotations Notifications
 *
 */
export const deleteNotificationsByAnnotations = async (req, res) => {
  let type = "annotations";
  const userId = req.userId;
  let foundUser;
  try {
    foundUser = await User.findById({
      _id: ObjectId(userId),
    });
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let notificationIds = [];
  foundUser.notificationLists.forEach((notificationId) => {
    notificationIds.push(notificationId);
  });

  let notificationToBeDelete = [];

  for (let i = 0; i < notificationIds.length; i++) {
    foundNotification = await Notification.findById({
      _id: ObjectId(notificationIds[i]),
    });
    console.log("found notificaiton", foundNotification);
    if (!foundNotification?.isStar) {
      notificationToBeDelete.push(foundNotification?._id);
    }
  }

  let foundNotification;
  for (let i = 0; i < notificationToBeDelete.length; i++) {
    try {
      await Notification.deleteMany({
        _id: notificationToBeDelete[i],
        type: type,
      });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }
  return res.send({
    success: `All annotation type Notifications are successfully deleted`,
    "notification of user": `${foundUser.notificationLists}`,
  });
};

/**
 * @function readNotification
 * Mark a notification as read
 *
 * @param {string} req.params.notificationId The id of a notification
 */
export const readNotification = async (req, res) => {
  const notificationId = req.params.notificationId;
  let foundNotification;
  try {
    foundNotification = await Notification.findById({
      _id: ObjectId(notificationId),
    });
    if (!foundNotification) {
      return res.status(404).send({
        error: `notification with id ${notificationId} doesn't exist`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundNotification.read = true;
  try {
    await foundNotification.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  return res.status(200).send({
    success: `Notification '${notificationId}' has been read successfully!`,
    notification: `${foundNotification}`,
  });
};

/**
 * @function readAllNotifications
 * Mark all notification as read
 *
 */
export const readAllNotifications = async (req, res) => {
  const userId = req.userId;
  let foundUser;
  try {
    foundUser = await User.findById({
      _id: ObjectId(userId),
    });
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let notificationIds = [];
  foundUser.notificationLists.forEach((notificationId) => {
    notificationIds.push(notificationId.toString());
  });
  for (let i = 0; i < notificationIds.length; i++) {
    try {
      await Notification.updateMany(
        { _id: notificationIds[i], read: false },
        { $set: { read: true } }
      );
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }

  return res.status(200).send({
    success: `Notifications  has been read successfully!`,
    notification: `${foundUser.notificationLists}`,
  });
};

/**
 * @function starNotification
 * Mark a notification as star
 * @param {string} req.params.notificationId The id of a notification
 */
export const starNotification = async (req, res) => {
  const notificationId = req.params.notificationId;
  let foundNotification;
  try {
    foundNotification = await Notification.findById({
      _id: ObjectId(notificationId),
    });
    if (!foundNotification) {
      return res.status(404).send({
        error: `notification with id ${notificationId} doesn't exist`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundNotification.isStar = !foundNotification.isStar;
  try {
    await foundNotification.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  return res.status(200).send({
    success: `Notification '${notificationId}' has been stared successfully!`,
    notification: `${foundNotification}`,
  });
};

/**
 * @function toggleActiveCourse
 * Turn on/off the course update notifications
 *
 */
export const toggleActiveCourse = async (req, res) => {
  const userId = req.userId;
  let foundUser;

  try {
    foundUser = await User.findById({
      _id: ObjectId(userId),
    });
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundUser.isCourseTurnOff = !foundUser.isCourseTurnOff;
  try {
    await foundUser.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send({
    "user isCourseTurnOff": foundUser.isCourseTurnOff,
  });
};

/**
 * @function toggleAnnotation
 * Turn on/off the annotations notifications
 *
 */
export const toggleAnnotation = async (req, res) => {
  const userId = req.userId;
  let foundUser;

  try {
    foundUser = await User.findById({
      _id: ObjectId(userId),
    });
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundUser.isAnnotationTurnOff = !foundUser.isAnnotationTurnOff;

  try {
    await foundUser.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send({
    "user isAnnotationTurnOff": foundUser.isAnnotationTurnOff,
  });
};

/**
 * @function toggleReply
 * Turn on/off the comment and mentioned notifications
 *
 */
export const toggleReply = async (req, res) => {
  const userId = req.userId;
  let foundUser;

  try {
    foundUser = await User.findById({
      _id: ObjectId(userId),
    });
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundUser.isReplyTurnOff = !foundUser.isReplyTurnOff;

  try {
    await foundUser.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send({
    "user isReplyTurnOff": foundUser.isReplyTurnOff,
  });
};

/**
 * @function deactivateUser
 * Turn off notifications from specific user
 *
 * @param {string} req.params.userId The id of the user
 */
export const deactivateUser = async (req, res) => {
  const targetUserId = req.params.userId;
  const userId = req.userId;

  let foundUser;

  try {
    foundUser = await User.findById({
      _id: ObjectId(userId),
    });
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  if (foundUser.deactivatedUserLists.includes(targetUserId)) {
  } else {
    foundUser.deactivatedUserLists.push(targetUserId);
    try {
      await foundUser.save();
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }

  return res.status(200).send({
    deactivatedUserLists: foundUser.deactivatedUserLists,
  });
};

/**
 * @function getUserIsCourseTurnOff
 * Return if course update notification is on or off
 *
 */
export const getUserIsCourseTurnOff = async (req, res) => {
  const userId = req.userId;

  let foundUser;

  try {
    foundUser = await User.findById({
      _id: ObjectId(userId),
    });
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  return res.status(200).send(foundUser.isCourseTurnOff);
};

/**
 * @function getUserIsRepliesTurnOff
 * Return if comment and mentioned notification is on or off
 *
 */
export const getUserIsRepliesTurnOff = async (req, res) => {
  const userId = req.userId;

  let foundUser;

  try {
    foundUser = await User.findById({
      _id: ObjectId(userId),
    });
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  return res.status(200).send(foundUser.isReplyTurnOff);
};

/**
 * @function getUserIsAnnotationTurnOff
 * Return if annotation notification is on or off
 *
 */
export const getUserIsAnnotationTurnOff = async (req, res) => {
  const userId = req.userId;

  let foundUser;

  try {
    foundUser = await User.findById({
      _id: ObjectId(userId),
    });
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send(foundUser.isAnnotationTurnOff);
};

/**
 * @function getChannelNotifications
 * Return all the notifications from specific channel
 *
 * @param {string} req.params.channelId The id of a channel
 */
export const getChannelNotifications = async (req, res) => {
  const userId = req.userId;
  const channelId = req.params.channelId;

  let channelNotifications = [];
  let temp;
  try {
    temp = await Notification.find({ channelId: channelId });
    channelNotifications.push(temp);
  } catch (err) {
    return res.send({ message: err });
  }
  return res
    .status(200)
    .send({ "channelNotifications ": channelNotifications });
};

/**
 * @function getCourseNotifications
 * Return all the notifications from specific courses
 *
 * @param {string} req.params.courseId The id of a course
 */
export const getCourseNotifications = async (req, res) => {
  const userId = req.userId;
  const courseId = req.params.courseId;

  let courseNotifications = [];
  let temp;
  try {
    temp = await Notification.find({ courseId: courseId });
    courseNotifications.push(temp);
  } catch (err) {
    return res.send({ message: err });
  }
  return res.status(200).send({ courseNotifications: courseNotifications });
};
