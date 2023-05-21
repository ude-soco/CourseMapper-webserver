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

  //extraMessage being calculated here
  const extraMessage =
    req.locals.foundTopic.name +
    " in " +
    req.locals.savedCourse._doc.name +
    " course";
  return {
    userShortname: firstInitial + secondInitial,
    extraMessage,
  };
};

//TODO: When saving the several inserts use the option "lean" to skip Mongoose validitity checks
export const newChannelNotification = async (req, res) => {
  let user = req.locals.user;
  let course = req.locals.savedCourse;
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
    res.status(200).send({ success: "Channel created!" });
  } catch (err) {
    return res.status(500).send({ error: "Error saving notification" });
  }
};

let channelNotifications = { newChannelNotification, generateNotificationInfo };
module.exports = channelNotifications;
