const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");

const Notification = db.notification;
const User = db.user;
const Course = db.course;

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
  foundUser.notificationLists.forEach((notification) => {
    notificationIds.push(notification.notificationId);
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
  console.log("lists", userNotificationLists);

  return res.status(200).send({
    notificationLists: userNotificationLists.flat(),
  });
};

export const deleteNotification = async (req, res) => {
  const notificationId = req.params.notificationId;
  try {
    await Notification.deleteOne({ _id: ObjectId(notificationId) });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.send({
    success: `Notification with id ${notificationId} successfully deleted`,
  });
};

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
  for (let i = 0; i < foundUser.notificationLists.length; i++) {
    try {
      await Notification.deleteMany({
        _id: foundUser.notificationLists[i]._id,
      });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }
  foundUser.notificationLists = [];
  foundUser.save();

  return res.send({
    success: `All Notifications are successfully deleted`,
    "notification of user": `${foundUser.notificationLists}`,
  });
};

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
  for (let i = 0; i < foundUser.notificationLists.length; i++) {
    try {
      await Notification.deleteMany({
        _id: foundUser.notificationLists[i]._id,
        type: type,
      });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }

  return res.send(foundUser.notificationLists);
};

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

  for (let i = 0; i < foundUser.notificationLists.length; i++) {
    try {
      await Notification.deleteMany({
        _id: foundUser.notificationLists[i]._id,
        type: type,
      });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }
  return res.send({
    success: `All replies type Notifications are successfully deleted`,
    "notification of user": `${foundUser.notificationLists}`,
  });
};

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
  for (let i = 0; i < foundUser.notificationLists.length; i++) {
    try {
      await Notification.deleteMany({
        _id: foundUser.notificationLists[i]._id,
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

export const readAllNotifications = async (req, res) => {
  const userId = req.userId;
  console.log(req.userId);
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
  console.log("user lists", foundUser.notificationLists);
  for (let i = 0; i < foundUser.notificationLists.length; i++) {
    try {
      await Notification.updateMany(
        { _id: foundUser.notificationLists[i]._id, read: false },
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
  foundUser.courseTurnOffAt = Date.now();
  try {
    await foundUser.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send({
    "user isCourseTurnOff": foundUser.isCourseTurnOff,
    time: foundUser.courseTurnOffAt,
  });
};

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
  foundUser.annotationTurnOffAt = Date.now();

  try {
    await foundUser.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send({
    "user isAnnotationTurnOff": foundUser.isAnnotationTurnOff,
    time: foundUser.isAnnotationTurnOff,
  });
};

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
  foundUser.commentTurnOffAt = Date.now();

  try {
    await foundUser.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send({
    "user isReplyTurnOff": foundUser.isReplyTurnOff,
    time: foundUser.isReplyTurnOff,
  });
};

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
