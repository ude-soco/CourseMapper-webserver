const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");

const UserNotification = db.userNotifications;
const User = db.user;

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
