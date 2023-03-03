const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Channel = db.channel;
const Course = db.course;
const Material = db.material;
const Topic = db.topic;
const User = db.user;

/**
 * @function getChannel
 * Get details of a channel controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.channelId The id of the channel
 */
export const getChannel = async (req, res, next) => {
  const channelId = req.params.channelId;
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

  req.locals = {
    response: foundChannel,
    channel: foundChannel,
    user: user
  }
  return next();
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
export const newChannel = async (req, res, next) => {
  const topicId = req.params.topicId;
  const channelName = req.body.name;
  const channelDesc = req.body.description;
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

  req.locals = {
    response : {
      id: savedChannel._id,
      savedChannel: savedChannel,
      success: `New channel '${savedChannel.name}' added!`,
    },
    channel: savedChannel,
    user: user
  }

  return next();
};

/**
 * @function deleteChannel
 * Delete a channel controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.channelId The id of the channel
 */
export const deleteChannel = async (req, res, next) => {
  const channelId = req.params.channelId;
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

  req.locals = {
    response : {
      success: `Channel '${foundChannel.name}' successfully deleted!`,
    },
    user: user,
    channel: foundChannel
  }

  return next();
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
export const editChannel = async (req, res, next) => {
  const channelId = req.params.channelId;
  const courseId = req.params.courseId;
  const channelName = req.body.name;
  const channelDesc = req.body.description;
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

    req.locals = {}
    req.locals.oldChannel = JSON.parse(JSON.stringify(foundChannel));

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

  req.locals.response = {
    id: foundChannel._id,
    courseId: courseId,
    success: `Channel '${channelName}' has been updated successfully!`,
  }
  req.locals.newChannel = foundChannel;
  req.locals.user = user;
  
  return next();
};
