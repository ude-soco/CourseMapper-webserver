import { remove } from "../../models/user.model";

const socketio = require("../../socketio");

const db = require("../../models");
const UserNotification = db.userNotifications;
const User = db.user;
const BlockingNotifications = db.blockingNotifications;
const FollowAnnotation = db.followAnnotation;
const ObjectId = require("mongoose").Types.ObjectId;
//TODO Ask why the users objects in the course contains an _id field aside from the userID field

//Removes the User who did the action itself from the users to be notified
/* const removeUserFromList = (userToBeNotified, userId) => {
  for (let i = 0; i < userToBeNotified.length; i++) {
    if (userToBeNotified[i].userId.equals(userId)) {
      userToBeNotified.splice(i, 1);
      break;
    }
  }
}; */

//TODO: Maybe move the following function to a separate file
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
  };
};

const emitNotificationsToSubscribedUsers = async (
  req,
  userToBeNotified,
  insertedUserNotifications
) => {
  for (let i = 0; i < insertedUserNotifications.length; i++) {
    const userNotification = insertedUserNotifications[i];
    const socketId = userNotification.userId;
    userNotification.activityId = req.locals.activity;
    console.log("about to emit notification for socketId: ", socketId);
    console.log("the body is: ", userNotification);
    socketio.getIO().emit(socketId, [userNotification]);
  }

  /*   for (let i = 0; i < insertedUserNotifications.length; i++) {
    const userNotification = insertedUserNotifications[i];
    const socketId = userNotification.userId;
    console.log("about to emit notification for socketId: ", socketId);
    console.log("the body is: ", userNotification);
    socketio.getIO().emit(socketId, userNotification);
  } */
};
//TODO: When saving the several inserts use the option "lean" to skip Mongoose validitity checks
//TODO: rename this method to "populateUserNotification"
export const populateUserNotification = async (req, res) => {
  let user = req.locals.user;
  let course = req.locals.course;
  let activity = req.locals.activity;
  /* const userToBeNotified = course.users; */
  const userToBeNotified = req.locals.usersToBeNotified;
  const arrUserNotification = [];
  let insertedUserNotifications;
  //Removing the user who does the action from the list of users to be notified
  /*  removeUserFromList(userToBeNotified, user._id); */

  userToBeNotified.forEach((userId) => {
    let userNotification = new UserNotification({
      userId: userId,
      activityId: activity._id,
      isStar: false,
      isRead: false,
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

  let objectToSend = {
    message: "Users notified and Your operation completed without errors!",
    ...(req.locals.response && { response: req.locals.response }),
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
  //for the above userId get the array of users who have blocked him

  let foundUser = await User.findById(userId);
  let blockedByUsers = foundUser.blockedByUser.map((userId) =>
    userId.toString()
  );

  let usersAllowingAnnotationNotifications = await BlockingNotifications.find()
    .elemMatch("materials", {
      materialId: material._id,
      isAnnotationNotificationsEnabled: true,
    })
    .select("userId");

  console.log(
    "usersAllowingAnnotationNotifications: ",
    usersAllowingAnnotationNotifications
  );

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
    ObjectId(userId)
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
    ObjectId(userId)
  );
  req.locals.usersToBeNotified = finalListOfUsersToNotify;
  next();
};

let notifications = {
  populateUserNotification,
  generateNotificationInfo,
  newAnnotationNotificationUsersCalculate,
  calculateUsersFollowingAnnotation,
};
module.exports = notifications;
