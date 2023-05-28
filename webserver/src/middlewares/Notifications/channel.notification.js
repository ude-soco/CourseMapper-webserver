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
    userShortname: firstInitial + secondInitial,
    ...(courseName && { courseName }),
    ...(topicName && { topicName }),
    ...(channelName && { channelName }),
    username: req.locals.user.username,
    category: req.locals.category,
  };
};

//TODO: When saving the several inserts use the option "lean" to skip Mongoose validitity checks
export const notifyUsers = async (req, res) => {
  let user = req.locals.user;
  let course = req.locals.course;
  let activity = req.locals.activity;
  const userToBeNotified = course.users;
  const arrUserNotification = [];
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
    await UserNotification.insertMany(arrUserNotification);
    res.status(200).send({ success: req.locals.response.success });
  } catch (err) {
    return res.status(500).send({ error: "Error saving notification" });
  }
};

let channelNotifications = {
  notifyUsers: notifyUsers,
  generateNotificationInfo,
};
module.exports = channelNotifications;
