const db = require("../../models");
const UserNotification = db.userNotifications;

//TODO: When saving the several inserts use the option "lean" to skip Mongoose validitity checks
export const newChannelNotification = async (req, res) => {
  let user = req.locals.user;
  let course = req.locals.savedCourse;
  let topic = req.locals.foundTopic;
  let channel = req.locals.channel;
  let activity = req.locals.activity;
  const userToBeNotified = course.users;
  const arrUserNotification = [];
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

let channelNotifications = { newChannelNotification, generateNotificationInfo };
module.exports = channelNotifications;
