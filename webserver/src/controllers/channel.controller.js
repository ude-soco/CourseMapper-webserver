const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Channel = db.channel;
const Course = db.course;
const Material = db.material;
const Topic = db.topic;

/**
 * @function getChannel
 * Get details of a channel controller
 *
 * @param {string} req.params.channelId The id of the channel
 */
export const getChannel = async (req, res) => {
  const channelId = req.params.channelId;
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
    userId: req.userId,
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
  return res.send({
    id: savedChannel._id,
    success: `New channel '${savedChannel.name}' added!`,
  });
};

/**
 * @function deleteChannel
 * Delete a channel controller
 *
 * @param {string} req.params.channelId The id of the channel
 */
export const deleteChannel = async (req, res) => {
  const channelId = req.params.channelId;

  let foundChannel;
  try {
    foundChannel = await Channel.findByIdAndRemove({ _id: channelId });
    if (!foundChannel) {
      return res.status(404).send({
        error: `Channel with id ${channelId} doesn't exist!`,
      });
    }
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
  return res.send({
    success: `Channel '${foundChannel.name}' successfully deleted!`,
  });
};
