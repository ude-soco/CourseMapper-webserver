const db = require("../models");
const Channel = db.channel;
const Course = db.course;
const Material = db.material;
const Topic = db.topic;
const User = db.user;
const Annotation = db.annotation;
const Reply = db.reply;
const Tag = db.tag;

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

  let user;
  try {
    user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding user" });
  }
  let foundChannel;
  try {
    foundChannel = await Channel.findById(channelId).populate(
      "materials",
      "-__v"
    );
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
    return res.status(500).send({ message: "Error finding channel" });
  }
  req.locals = {
    response: foundChannel,
    channel: foundChannel,
    user: user,
  };
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

  let user;
  try {
    user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding user" });
  }

  let foundTopic;
  try {
    foundTopic = await Topic.findById(topicId);
    if (!foundTopic) {
      return res.status(404).send({
        error: `Topic with id ${topicId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding topic" });
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
    return res.status(500).send({ error: "Error saving channel" });
  }
  foundTopic.channels.push(savedChannel._id);
  let savedTopic;
  try {
    savedTopic = await foundTopic.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving topic" });
  }
  let updateCourse;
  try {
    updateCourse = await Course.findById(savedTopic.courseId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding course" });
  }
  updateCourse.channels.push(savedChannel._id);
  try {
    updateCourse = await updateCourse.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving course" });
  }
  req.locals = {
    response: {
      id: savedChannel._id,
      savedChannel: savedChannel,
      success: `New channel '${savedChannel.name}' added!`,
    },
    channel: savedChannel,
    course: updateCourse,
    topic: savedTopic,
    user: user,
    category: "courseupdates",
  };
  return next();
};

//TODO - update the course after the channel has been deleted
//in the below method
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

  let user;
  try {
    user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding user" });
  }
  let foundChannel;
  try {
    foundChannel = await Channel.findById(channelId);
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
    return res.status(500).send({ error: "Error finding channel" });
  }
  try {
    await Channel.findByIdAndRemove(channelId);
  } catch (err) {
    return res
      .status(500)
      .send({ error: "Error finding and removing channel" });
  }
  try {
    await Material.deleteMany({ _id: { $in: foundChannel.materials } });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting material" });
  }
  try {
    await Annotation.deleteMany({ channelId: channelId });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting annotation" });
  }
  try {
    await Reply.deleteMany({ channelId: channelId });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting reply" });
  }
  try {
    await Tag.deleteMany({ channelId: channelId });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting tag" });
  }
  let foundTopic;
  try {
    foundTopic = await Topic.findById(foundChannel.topicId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding topic" });
  }

  let topicIndex = foundTopic["channels"].indexOf(channelId);
  if (topicIndex >= 0) {
    foundTopic["channels"].splice(topicIndex, 1);
  }
  try {
    foundTopic = await foundTopic.save();
  } catch (err) {
    res.status(500).send({ error: "Error saving topic" });
  }

  let course;
  try {
    course = await Course.findById(courseId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding course" });
  }
  req.locals = {
    response: {
      success: `Channel '${foundChannel.name}' successfully deleted!`,
    },
    user: user,
    channel: foundChannel,
    topic: foundTopic,
    course: course,
    category: "courseupdates",
  };
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

  let user;
  try {
    user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding user" });
  }
  if (!Boolean(channelName)) {
    return res.status(404).send({
      error: `Channel requires a name!`,
    });
  }
  let foundChannel;
  try {
    foundChannel = await Channel.findById(channelId).populate(
      "materials",
      "-__v"
    );
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
    req.locals = {};
    req.locals.oldChannel = JSON.parse(JSON.stringify(foundChannel));
  } catch (err) {
    return res.status(500).send({ message: "Error finding channel" });
  }
  foundChannel.name = channelName;
  foundChannel.updatedAt = Date.now();
  foundChannel.description = channelDesc;
  try {
    foundChannel = await foundChannel.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving channel" });
  }

  let course;
  try {
    course = await Course.findById(courseId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding course" });
  }

  req.locals.response = {
    id: foundChannel._id,
    courseId: courseId,
    success: `Channel '${channelName}' has been updated successfully!`,
  };
  req.locals.newChannel = foundChannel;
  req.locals.user = user;
  req.locals.category = "courseupdates";
  req.locals.course = course;
  return next();
};
