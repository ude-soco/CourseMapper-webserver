const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Channel = db.channel;
const Course = db.course;
const Topic = db.topic;
const Notification = db.notification;
const User = db.user;

/**
 * @function getTopic
 * Get details of a topic controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.topicId The id of the topic
 */
export const getTopic = async (req, res) => {
  const topicId = req.params.topicId;
  const courseId = req.params.courseId;

  let foundTopic;
  try {
    foundTopic = await Topic.findOne({ _id: ObjectId(topicId) }).populate(
      "channels",
      "-__v"
    );
    if (!foundTopic) {
      return res.status(404).send({
        error: `Topic with id ${topicId} doesn't exist!`,
      });
    }
    if (foundTopic.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Topic doesn't belong to course with id ${courseId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ message: err });
  }
  return res.status(200).send(foundTopic);
};

/**
 * @function newTopic
 * Create a new topic controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.body.name The name of the topic, e.g., React Crash Course
 * @param {string} req.userId The owner of the topic
 */
export const newTopic = async (req, res) => {
  let courseId = req.params.courseId;
  let topicName = req.body.name;
  const userId = req.userId;

  let foundCourse;
  try {
    foundCourse = await Course.findOne({ _id: ObjectId(courseId) });
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let topic = new Topic({
    name: topicName,
    courseId: courseId,
    userId: userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  let savedTopic;
  try {
    savedTopic = await topic.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundCourse.topics.push(savedTopic._id);

  try {
    await foundCourse.save();
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

  let notification = new Notification({
    userName: foundUser.username,
    userShortname: userShortname,
    userId: userId,
    courseId: courseId,
    type: "courseupdates",
    action: "has created new",
    createdAt: Date.now(),
    actionObject: "topic",
    extraMessage: `in ${foundCourse.name}`,
    name: topicName,
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
    savedTopic: savedTopic,
    success: `New topic '${topicName}' added!`,
    notification: `new notification is added `,
  });
};

/**
 * @function deleteTopic
 * Delete a topic controller
 *
 * @param {string} req.params.topicId The id of the topic
 * @param {string} req.params.courseId The id of the course
 */
export const deleteTopic = async (req, res) => {
  const topicId = req.params.topicId;
  const courseId = req.params.courseId;
  const userId = req.userId;

  let foundTopic;
  try {
    foundTopic = await Topic.findById({ _id: topicId });
    if (!foundTopic) {
      return res
        .status(404)
        .send({ error: `Topic with id ${topicId} doesn't exist!` });
    }
    if (foundTopic.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Topic doesn't belong to course with id ${courseId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  try {
    await Topic.findByIdAndRemove({ _id: topicId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  try {
    await Channel.deleteMany({ topicId: { $in: topicId } });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundCourse;
  try {
    foundCourse = await Course.findOne({ _id: foundTopic.courseId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundCourse.topics = foundCourse.topics.filter(
    (topic) => topic.valueOf() !== topicId
  );

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
    courseId: courseId,
    type: "courseupdates",
    action: "has deleted",
    actionObject: "topic",
    createdAt: Date.now(),
    extraMessage: `in ${foundCourse.name}`,
    name: foundTopic.name,
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

  try {
    await foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.send({
    success: `Topic '${foundTopic.name}' successfully deleted!`,
    notification: `new notification is added ${notification}`,
  });
};

/**
 * @function editTopic
 * Edit a topic controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.topicId The id of the topic
 * @param {string} req.body.name The name of the topic, e.g., React Crash Course
 */
export const editTopic = async (req, res) => {
  const topicId = req.params.topicId;
  const courseId = req.params.courseId;
  const topicName = req.body.name;
  const userId = req.userId;

  if (!Boolean(topicName)) {
    return res.status(404).send({
      error: `Topic requires a name!`,
    });
  }

  let foundTopic;
  try {
    foundTopic = await Topic.findOne({ _id: ObjectId(topicId) });
    if (!foundTopic) {
      return res
        .status(404)
        .send({ error: `Topic with id ${topicId} doesn't exist!` });
    }
    if (foundTopic.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundTopic.name = topicName;
  foundTopic.updatedAt = Date.now();

  let foundCourse;
  try {
    foundCourse = await Course.findOne({ _id: ObjectId(courseId) });
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
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
  console.log("foundUser", foundUser);

  let notification = new Notification({
    userName: foundUser.username,
    userShortname: userShortname,
    userId: userId,
    courseId: courseId,
    type: "courseupdates",
    action: "has edited",
    actionObject: "topic",
    createdAt: Date.now(),
    extraMessage: `in ${foundCourse.name}`,
    name: topicName,
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

  try {
    await foundTopic.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  return res.send({
    id: foundTopic._id,
    courseId: courseId,
    success: `Topic '${topicName}' has been updated successfully!`,
    notification: `new notification is added ${notification}`,
  });
};
