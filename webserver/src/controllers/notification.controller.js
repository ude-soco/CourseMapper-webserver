const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");

const Notification = db.notification;

export const getAllNotifications = async (req, res) => {
  let notifications;
  try {
    notifications = await Notification.find({});
    console.log("notifications", notifications);
  } catch (err) {
    return res.send({ message: err });
  }

  let results = [];
  notifications.forEach((c) => {
    let notification = {
      _id: c.id,
      userName: c.userName,
      userShortname: c.userShortname,
      type: c.type,
      action: c.action,
      actionObject: c.actionObject,
      extraMessage: c.extraMessage,
      name: c.name,
    };
    results.push(notification);
  });
  console.log("notifications", results);

  return res.status(200).send(results);
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

export const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.send({
    success: `All Notifications are successfully deleted`,
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
  try {
    await Notification.updateMany({ read: false }, { $set: { read: true } });
  } catch (err) {
    return res.status(500).send({ error: err });
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
