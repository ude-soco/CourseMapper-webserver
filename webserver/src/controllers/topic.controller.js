const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Channel = db.channel;
const Course = db.course;
const Topic = db.topic;

/**
 * @function getTopic
 * Get details of a topic controller
 *
 * @param {string} req.params.topicId The id of the topic
 */
export const getTopic = async (req, res) => {
  const topicId = req.params.topicId;
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
    userId: req.userId,
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
  return res.send({
    id: topic._id,
    success: `New topic '${topicName}' added!`,
  });
};

/**
 * @function deleteTopic
 * Delete a topic controller
 *
 * @param {string} req.params.topicId The id of the topic
 */
export const deleteTopic = async (req, res) => {
  let topicId = req.params.topicId;

  let foundTopic;
  try {
    foundTopic = await Topic.findByIdAndRemove({ _id: topicId });
    if (!foundTopic) {
      return res
        .status(404)
        .send({ error: `Topic with id ${topicId} doesn't exist!` });
    }
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

  try {
    await foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.send({
    success: `Topic '${foundTopic.name}' successfully deleted!`,
  });
};
