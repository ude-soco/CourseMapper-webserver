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

  let notificationIds = [];
  foundUser.notificationLists.forEach((notificationId) => {
    notificationIds.push(notificationId);
  });

  for (let i = 0; i < notificationIds.length; i++) {
    try {
      await Notification.deleteMany({
        _id: notificationIds[i]._id,
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

  let notificationIds = [];
  foundUser.notificationLists.forEach((notificationId) => {
    notificationIds.push(notificationId);
  });

  for (let i = 0; i < notificationIds.length; i++) {
    try {
      await Notification.deleteMany({
        _id: notificationIds[i]._id,
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

  let notificationIds = [];
  foundUser.notificationLists.forEach((notificationId) => {
    notificationIds.push(notificationId);
  });

  for (let i = 0; i < notificationIds.length; i++) {
    try {
      await Notification.deleteMany({
        _id: notificationIds[i]._id,
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

  let notificationIds = [];
  foundUser.notificationLists.forEach((notificationId) => {
    notificationIds.push(notificationId);
  });
  for (let i = 0; i < notificationIds.length; i++) {
    try {
      await Notification.deleteMany({
        _id: notificationIds[i]._id,
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
  try {
    await foundUser.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send({
    "user isCourseTurnOff": foundUser.isCourseTurnOff,
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

  try {
    await foundUser.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send({
    "user isAnnotationTurnOff": foundUser.isAnnotationTurnOff,
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

  try {
    await foundUser.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send({
    "user isReplyTurnOff": foundUser.isReplyTurnOff,
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
