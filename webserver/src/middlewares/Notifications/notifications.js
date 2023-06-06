const socketio = require("../../socketio");

const db = require("../../models");
const UserNotification = db.userNotifications;
//TODO Ask why the users objects in the course contains an _id field aside from the userID field

//Removes the User who did the action itself from the users to be notified
const removeUserFromList = (userToBeNotified, userId) => {
  for (let i = 0; i < userToBeNotified.length; i++) {
    if (userToBeNotified[i].userId.equals(userId)) {
      userToBeNotified.splice(i, 1);
      break;
    }
  }
};

//TODO: Maybe move the following function to a separate file
export const generateNotificationInfo = (req) => {
  //userShortname (the first 2 initials of the user's name) being calculated here
  const firstInitial = req.locals.user.firstname.charAt(0).toUpperCase();
  const secondInitial = req.locals.user.lastname.charAt(0).toUpperCase();

  //adding the courseName, topicName, and channelName to the notificationInfo object if they exist
  let courseName;
  let topicName;
  let channelName;
  if (req.locals.topic) {
    topicName = req.locals.topic.name;
  }
  if (req.locals.course) {
    courseName = req.locals.course.name;
  }
  if (req.locals.channel) {
    channelName = req.locals.channel.name;
  }
  return {
    userName: req.locals.user?.firstname + " " + req.locals.user?.lastname,
    userShortname: firstInitial + secondInitial,
    username: req.locals.user.username,
    category: req.locals.category,
    ...(courseName && { courseName }),
    ...(topicName && { topicName }),
    ...(channelName && { channelName }),
  };
};

const emitNotificationsToSubscribedUsers = async (
  req,
  userToBeNotified,
  insertedUserNotifications
) => {
  for (let i = 0; i < userToBeNotified.length; i++) {
    const user = userToBeNotified[i];
    const socketId = user.userId;
    console.log("about to emit notification for socketId: ", socketId);
    console.log("the body is: ", req.locals.activity);
    socketio.getIO().emit(socketId, [req.locals.activity]);
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
  const userToBeNotified = course.users;
  const arrUserNotification = [];
  let insertedUserNotifications;
  //Removing the user who does the action from the list of users to be notified
  removeUserFromList(userToBeNotified, user._id);
  userToBeNotified.forEach((user) => {
    let userNotification = new UserNotification({
      userId: user.userId,
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

let notifications = {
  populateUserNotification,
  generateNotificationInfo,
};
module.exports = notifications;
