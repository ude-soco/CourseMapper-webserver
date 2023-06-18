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
