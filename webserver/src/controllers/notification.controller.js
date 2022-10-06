const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");

const Notification = db.notification;
const User = db.user;
const Course = db.course;

export const getAllNotifications = async (req, res, next) => {
  let notifications;
  const userId = req.params.userId;

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
  console.log("user subscribed course", foundUser.subscribedCourses);
  // only publish notification those courses that user has subscribed
  let subscribedCourseLists = [];
  for (let i = 0; i < foundUser.subscribedCourses.length; i++) {
    subscribedCourseLists.push(
      foundUser.subscribedCourses[i].courseId.toString()
    );
  }

  try {
    notifications = await Notification.find({});
  } catch (err) {
    return res.send({ message: err });
  }
  // this is all the document from collection notificaitons
  let results = [];
  //if (!foundUser.isCourseTurnOff) {
  notifications.forEach((c) => {
    let notification = {
      _id: c.id,
      userName: c.userName,
      userShortname: c.userShortname,
      userId: c.userId,
      courseId: c.courseId,
      type: c.type,
      action: c.action,
      read: c.read,
      isStar: c.isStar,
      actionObject: c.actionObject,
      extraMessage: c.extraMessage,
      name: c.name,
      createdAt: c.createdAt,
    };
    results.push(notification);
  });
  // }
  console.log("notifications", notifications);
  // getting all the courseIds
  let temp = [];
  for (let i = 0; i < results.length; i++) {
    temp.push(results[i].courseId);
  }
  // getting all the index
  let index = [];
  for (let i = 0; i < subscribedCourseLists.length; i++) {
    for (let j = 0; j < temp.length; j++) {
      if (subscribedCourseLists[i] == temp[j]) {
        index.push(j);
      }
    }
  }

  //list of notification for this specific user
  let listsOfNotifications = [];
  index.forEach((i) => {
    listsOfNotifications.push(results[i]);
  });

  let notCourseUpdateLists = [];
  console.log("found user isCourseTurnOff", foundUser.isCourseTurnOff);

  let newLists = [];
  if (foundUser.isCourseTurnOff) {
    for (let i = 0; i < listsOfNotifications.length; i++) {
      if (
        Date.parse(listsOfNotifications[i].createdAt) <
        new Date(Date.parse(foundUser.courseTurnOffAt.getTime()))
      ) {
        console.log(
          "smaller",
          listsOfNotifications[i].createdAt,
          new Date(foundUser.courseTurnOffAt.getTime())
        );
        newLists.push(listsOfNotifications[i]);
        foundUser.notificationLists = [...newLists];
      } else {
        newLists = [];
      }
    }
  } else {
    console.log("whole list");

    foundUser.notificationLists = [...listsOfNotifications];
  }
  console.log("new lists", newLists);

  foundUser.save();
  console.log("foundUser.notificationLists", foundUser.notificationLists);
  console.log("listsOfNotifications", listsOfNotifications);

  // req.lists = listsOfNotifications;
  // next();
  return res.status(200).send({
    "user notification lists": foundUser.notificationLists,
    isCourseTurnOff: foundUser.isCourseTurnOff,
  });
};

export const deleteNotification = async (req, res) => {
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

  try {
    await Notification.deleteOne({ _id: ObjectId(notificationId) });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  foundNotification.save();
  return res.send({
    success: `Notification with id ${notificationId} successfully deleted`,
  });
};

export const deleteAllNotifications = async (req, res, next) => {
  // console.log("what is return", req.lists);
  const userId = req.params.userId;
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
  console.log("found", foundUser.notificationLists);
  for (let i = 0; i < foundUser.notificationLists.length; i++) {
    try {
      await Notification.deleteMany({
        _id: foundUser.notificationLists[i]._id,
      });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }

  return res.send({
    success: `All Notifications are successfully deleted`,
  });
};

export const deleteNotificationsByCourseUpdates = async (req, res) => {
  let type = "courseupdates";
  const userId = req.params.userId;
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
    success: `All course update type Notifications are successfully deleted`,
  });
};

export const deleteNotificationsByReplies = async (req, res) => {
  let type = "mentionedandreplied";
  const userId = req.params.userId;
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
  });
};

export const deleteNotificationsByAnnotations = async (req, res) => {
  let type = "annotations";
  const userId = req.params.userId;
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
    success: `Notification '${notificationId}' has been updated successfully!`,
  });
};

export const readAllNotifications = async (req, res) => {
  const userId = req.params.userId;

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
      await Notification.updateMany(
        { _id: foundUser.notificationLists[i]._id, read: false },
        { $set: { read: true } }
      );
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }

  return res.status(200).send({
    success: `Notifications  has been updated successfully!`,
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

  foundNotification.isStar = true;
  try {
    await foundNotification.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  return res.status(200).send({
    success: `Notification '${notificationId}' has been updated successfully!`,
  });
};

export const toggleActiveCourse = async (req, res) => {
  const userId = req.params.userId;
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
  const userId = req.params.userId;
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
    success: `Annotaion update has been deactivate successfully!`,
  });
};

export const toggleReply = async (req, res) => {
  const userId = req.params.userId;
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
    success: `Annotaion update has been deactivate successfully!`,
  });
};
