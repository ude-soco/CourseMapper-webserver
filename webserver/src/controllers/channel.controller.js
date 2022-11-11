const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Channel = db.channel;
const Course = db.course;
const Material = db.material;
const Topic = db.topic;
const Notification = db.notification;
const User = db.user;

/**
 * @function getChannel
 * Get details of a channel controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.channelId The id of the channel
 */
export const getChannel = async (req, res) => {
  const channelId = req.params.channelId;
  const courseId = req.params.courseId;

  let foundChannel;
  try {
    foundChannel = await Channel.findOne({
      _id: ObjectId(channelId),
    }).populate("materials", "-__v");
    if (!foundChannel) {
      return res.status(404).send({
        error: `Channel with id ${channelId} doesn't exist!`,
      });
    }
    if (foundChannel.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Channel doesn't belong to course with id ${courseId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ message: err });
  }
  return res.status(200).send(foundChannel);
};

/**
 * @function newChannel
 * Create a new channel controller
 *
 * @param {string} req.params.topicId The id of the topic
 * @param {string} req.body.name The name of the channel, e.g., React Crash Course
 * @param {string} req.body.description The description of the channel, e.g., Teaching about React
 * @param {string} req.userId The owner of the channel
 */
export const newChannel = async (req, res) => {
  const topicId = req.params.topicId;
  const channelName = req.body.name;
  const channelDesc = req.body.description;
  const userId = req.userId;

  let foundTopic;
  try {
    foundTopic = await Topic.findOne({ _id: ObjectId(topicId) });
    if (!foundTopic) {
      return res.status(404).send({
        error: `Topic with id ${topicId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let channel = new Channel({
    name: channelName,
    description: channelDesc,
    courseId: foundTopic.courseId,
    topicId: topicId,
    userId: userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  let savedChannel;
  try {
    savedChannel = await channel.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundTopic.channels.push(savedChannel._id);

  let savedTopic;
  try {
    savedTopic = await foundTopic.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let updateCourse;
  try {
    updateCourse = await Course.findOne({ _id: savedTopic.courseId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  updateCourse.channels.push(savedChannel._id);
  try {
    await updateCourse.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundUser;
  try {
    foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).send({
        error: `User not found!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundCourse;
  try {
    foundCourse = await Course.findOne({ _id: ObjectId(foundTopic.courseId) });
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${foundTopic.courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  // lists of userId that subscribed to this course
  let subscribedUserLists = [];
  foundCourse.users.forEach((user) => {
    subscribedUserLists.push(user.userId.toString());
  });
  let foundUserLists = [];
  let temp;

  for (let i = 0; i < subscribedUserLists.length; i++) {
    temp = await User.findById(subscribedUserLists[i]);
    foundUserLists.push(temp);
  }

  let userShortname = (
    foundUser.firstname.charAt(0) + foundUser.lastname.charAt(0)
  ).toUpperCase();
  let notificationSaved;

  let notification = new Notification({
    userName: foundUser.username,
    userShortname: userShortname,
    userId: userId,
    courseId: foundTopic.courseId,
    channelId: savedChannel._id,
    type: "courseupdates",
    action: "has created new",
    actionObject: "channel",
    createdAt: Date.now(),
    extraMessage: `${foundTopic.name} topic in ${updateCourse.name} course`,
    name: channelName,
  });

  try {
    notificationSaved = await notification.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  for (let i = 0; i < foundUserLists.length; i++) {
    // do not push to the user who made trigger this action
    if (foundUserLists[i]._id == userId) {
    } else if (foundUserLists[i].deactivatedUserLists.includes(userId)) {
    } else if (foundUserLists[i].isCourseTurnOff) {
    } else {
      let subscribedUser;
      try {
        subscribedUser = await User.findById(foundUserLists[i]._id);
        if (!subscribedUser) {
          return res.status(404).send({
            error: `User not found!`,
          });
        }
      } catch (err) {
        return res.status(500).send({ error: err });
      }
      subscribedUser.notificationLists.push(notificationSaved._id);

      try {
        await subscribedUser.save();
      } catch (err) {
        return res.status(500).send({ error: err });
      }
    }
  }

  return res.send({
    savedChannel: savedChannel,
    success: `New channel '${savedChannel.name}' added!`,
    notification: `new notification ${notification} has been added`,
  });
};

/**
 * @function deleteChannel
 * Delete a channel controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.channelId The id of the channel
 */
export const deleteChannel = async (req, res) => {
  const channelId = req.params.channelId;
  const courseId = req.params.courseId;
  const userId = req.userId;
  let foundChannel;
  try {
    foundChannel = await Channel.findById({ _id: ObjectId(channelId) });
    if (!foundChannel) {
      return res.status(404).send({
        error: `Channel with id ${channelId} doesn't exist!`,
      });
    }
    if (foundChannel.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Channel doesn't belong to course with id ${courseId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  try {
    await Channel.findByIdAndRemove({ _id: channelId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  try {
    await Material.deleteMany({ _id: { $in: foundChannel.materials } });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundTopic;
  try {
    foundTopic = await Topic.findOne({ _id: foundChannel.topicId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let topicIndex = foundTopic["channels"].indexOf(ObjectId(channelId));
  if (topicIndex >= 0) {
    foundTopic["channels"].splice(topicIndex, 1);
  }

  try {
    await foundTopic.save();
  } catch (err) {
    res.status(500).send({ error: err });
  }

  let foundUser;
  try {
    foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).send({
        error: `User not found!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let updateCourse;
  try {
    updateCourse = await Course.findOne({ _id: courseId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  // lists of userId that subscribed to this course
  let subscribedUserLists = [];
  updateCourse.users.forEach((user) => {
    subscribedUserLists.push(user.userId.toString());
  });
  let foundUserLists = [];
  let temp;

  for (let i = 0; i < subscribedUserLists.length; i++) {
    temp = await User.findById(subscribedUserLists[i]);
    foundUserLists.push(temp);
  }
  let userShortname = (
    foundUser.firstname.charAt(0) + foundUser.lastname.charAt(0)
  ).toUpperCase();
  let notification = new Notification({
    userName: foundUser.username,
    userShortname: userShortname,
    userId: userId,
    courseId: foundTopic.courseId,
    channelId: channelId,
    type: "courseupdates",
    action: "has deleted",
    actionObject: "channel",
    createdAt: Date.now(),
    extraMessage: `${foundTopic.name}topic in ${updateCourse.name} course`,
    name: foundChannel.name,
  });
  let notificationSaved;

  try {
    notificationSaved = await notification.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  for (let i = 0; i < foundUserLists.length; i++) {
    // do not push to the user who made trigger this action
    if (foundUserLists[i]._id == userId) {
    } else if (foundUserLists[i].deactivatedUserLists.includes(userId)) {
    } else if (foundUserLists[i].isCourseTurnOff) {
    } else {
      let subscribedUser;
      try {
        subscribedUser = await User.findById(foundUserLists[i]._id);
        if (!subscribedUser) {
          return res.status(404).send({
            error: `User not found!`,
          });
        }
      } catch (err) {
        return res.status(500).send({ error: err });
      }
      subscribedUser.notificationLists.push(notificationSaved._id);

      try {
        await subscribedUser.save();
      } catch (err) {
        return res.status(500).send({ error: err });
      }
    }
  }

  return res.send({
    success: `Channel '${foundChannel.name}' successfully deleted!`,
    notification: `new notification ${notification} has been added`,
  });
};

/**
 * @function editChannel
 * Edit a channel controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.channelId The id of the channel
 * @param {string} req.body.name The new name of the channel
 * @param {string} req.body.description The new description of the channel
 */
export const editChannel = async (req, res) => {
  const channelId = req.params.channelId;
  const courseId = req.params.courseId;
  const channelName = req.body.name;
  const channelDesc = req.body.description;
  const userId = req.userId;

  if (!Boolean(channelName)) {
    return res.status(404).send({
      error: `Channel requires a name!`,
    });
  }

  let foundChannel;
  try {
    foundChannel = await Channel.findOne({
      _id: ObjectId(channelId),
    }).populate("materials", "-__v");
    if (!foundChannel) {
      return res.status(404).send({
        error: `Channel with id ${channelId} doesn't exist!`,
      });
    }
    if (foundChannel.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Channel doesn't belong to course with id ${courseId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ message: err });
  }

  foundChannel.name = channelName;
  foundChannel.updatedAt = Date.now();
  foundChannel.description = channelDesc;

  try {
    await foundChannel.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  let foundUser;
  try {
    foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).send({
        error: `User not found!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  let foundTopic;
  try {
    foundTopic = await Topic.findOne({ _id: foundChannel.topicId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let updateCourse;
  try {
    updateCourse = await Course.findOne({ _id: courseId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  // lists of userId that subscribed to this course
  let subscribedUserLists = [];
  updateCourse.users.forEach((user) => {
    subscribedUserLists.push(user.userId.toString());
  });
  let foundUserLists = [];
  let temp;

  for (let i = 0; i < subscribedUserLists.length; i++) {
    temp = await User.findById(subscribedUserLists[i]);
    foundUserLists.push(temp);
  }
  let userShortname = (
    foundUser.firstname.charAt(0) + foundUser.lastname.charAt(0)
  ).toUpperCase();
  let notification = new Notification({
    userName: foundUser.username,
    userShortname: userShortname,
    userId: userId,
    courseId: courseId,
    channelId: channelId,
    createdAt: Date.now(),
    type: "courseupdates",
    action: "has edited",
    actionObject: "channel",
    extraMessage: `${foundTopic.name} topic in ${updateCourse.name} course`,
    name: channelName,
  });
  let notificationSaved;

  try {
    notificationSaved = await notification.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  for (let i = 0; i < foundUserLists.length; i++) {
    // do not push to the user who made trigger this action
    if (foundUserLists[i]._id == userId) {
    } else if (foundUserLists[i].deactivatedUserLists.includes(userId)) {
    } else if (foundUserLists[i].isCourseTurnOff) {
    } else {
      let subscribedUser;
      try {
        subscribedUser = await User.findById(foundUserLists[i]._id);
        if (!subscribedUser) {
          return res.status(404).send({
            error: `User not found!`,
          });
        }
      } catch (err) {
        return res.status(500).send({ error: err });
      }
      subscribedUser.notificationLists.push(notificationSaved._id);

      try {
        await subscribedUser.save();
      } catch (err) {
        return res.status(500).send({ error: err });
      }
    }
  }
  return res.status(200).send({
    id: foundChannel._id,
    courseId: courseId,
    success: `Channel '${channelName}' has been updated successfully!`,
    notification: `new notification ${notification} has been added`,
  });
};
