const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Channel = db.channel;
const Course = db.course;
const Topic = db.topic;
const User = db.user;
const Annotation = db.annotation;
const Reply = db.reply;
const Tag = db.tag;
const Material = db.material;

/**
 * @function getTopic
 * Get details of a topic controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.topicId The id of the topic
 */
export const getTopic = async (req, res, next) => {
  const topicId = req.params.topicId;
  const courseId = req.params.courseId;
  const userId = req.userId;

  let user
  try {
    user = await User.findOne({_id: userId});

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

  } catch (error) {
    return res.status(500).send({ error: error });
  }

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

  req.locals = {
    response: foundTopic,
    topic: foundTopic,
    user: user
  }

  return next();
};

/**
 * @function newTopic
 * Create a new topic controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.body.name The name of the topic, e.g., React Crash Course
 * @param {string} req.userId The owner of the topic
 */
export const newTopic = async (req, res, next) => {
  let courseId = req.params.courseId;
  let topicName = req.body.name;
  let userId = req.userId;

  let user
  try {
    user = await User.findOne({_id: userId});

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

  } catch (error) {
    return res.status(500).send({ error: error });
  }

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

  req.locals = {
    response: {
      id: topic._id,
      savedTopic: savedTopic,
      courseId: courseId,
      success: `New topic '${topicName}' added!`,
    },
    topic: savedTopic,
    user: user
  }
  return next();
};

/**
 * @function deleteTopic
 * Delete a topic controller
 *
 * @param {string} req.params.topicId The id of the topic
 * @param {string} req.params.courseId The id of the course
 */
export const deleteTopic = async (req, res, next) => {
  const topicId = req.params.topicId;
  const courseId = req.params.courseId;
  const userId = req.userId;

  let user
  try {
    user = await User.findOne({_id: userId});

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

  } catch (error) {
    return res.status(500).send({ error: error });
  }

  let foundTopic;
  try {
    foundTopic = await Topic.findById({ _id: topicId });
    if (!foundTopic) {
      return res
        .status(404)
        .send({ error: `Topic with id ${topicId} doesn't exist!` });
    }
    if (foundTopic.courseId.valueOf()  !== courseId) {
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

  try {
    await Material.deleteMany({ topicId: topicId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  try {
    await Annotation.deleteMany({ topicId: topicId});
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  try {
    await Reply.deleteMany({ topicId: topicId});
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  try {
    await Tag.deleteMany({ topicId: topicId });
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

  try {
    await foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  req.locals = {
    response: {
      success: `Topic '${foundTopic.name}' successfully deleted!`,
    },
    topic: foundTopic,
    user: user
  }
  return next();
};

/**
 * @function editTopic
 * Edit a topic controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.topicId The id of the topic
 * @param {string} req.body.name The name of the topic, e.g., React Crash Course
 */
export const editTopic = async (req, res, next) => {
  const topicId = req.params.topicId;
  const courseId = req.params.courseId;
  const topicName = req.body.name;
  const userId = req.userId;

  let user
  try {
    user = await User.findOne({_id: userId});

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

  } catch (error) {
    return res.status(500).send({ error: error });
  }

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
    if (foundTopic.courseId.valueOf()  !== courseId) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  req.locals = {}
  req.locals.oldTopic = JSON.parse(JSON.stringify(foundTopic));

  foundTopic.name = topicName;
  foundTopic.updatedAt = Date.now();

  try {
    await foundTopic.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  req.locals.response = {
    id: foundTopic._id,
    courseId: courseId,
    success: `Topic '${topicName}' has been updated successfully!`,
  }
  req.locals.user = user;
  req.locals.newTopic = foundTopic;
  return next();
};
