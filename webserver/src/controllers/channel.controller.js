const db = require("../models");
const Channel = db.channel;
const Course = db.course;
const Material = db.material;
const Topic = db.topic;
const User = db.user;
const Annotation = db.annotation;
const Reply = db.reply;
const Tag = db.tag;

const BlockingNotifications = db.blockingNotifications;
const ObjectId = require("mongoose").Types.ObjectId;

// User identification for the logging system
const findUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found!");
  return user;
};
const handleError = (res, error, message) => {
  console.error(error);
  return res.status(500).send({ error: message });
};
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
    return res.status(500).send({ message: "Error finding channel", err });
  }

  let notificationSettings;
  try {
    notificationSettings = await BlockingNotifications.findOne({
      userId: userId,
      courseId: courseId,
    });
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error finding notification settings" });
  }
  return res.status(200).send({ channel: foundChannel, notificationSettings });
};

export const getChannelLog = async (req, res, next) => {
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
    return res.status(500).send({ message: "Error finding channel", err });
  }

  req.locals = {
    response: { channel: foundChannel },
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
  let courseDoc;
  try {
    courseDoc = await Course.findById(courseId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding course" });
  }

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
    await Channel.findByIdAndDelete(channelId);
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
    isDeletingChannel: true,
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
  req.locals.channel = foundChannel;
  return next();
};

/**
 * @function accessChannelDashboard
 * access channel Dashboard
 *
 * @param {string} req.params.channelId The id of the channel
 *
 */
export const accessChannelDashboard = async (req, res, next) => {
  const channelId = req.params.channelId;
  const userId = req.userId;

  let foundChannel;
  try {
    foundChannel = await Channel.findById(channelId);
    if (!foundChannel) {
      return res
        .status(404)
        .send({ error: `Channel with id ${channelId} not found` });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding channel" });
  }

  let foundUser;
  try {
    foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).send({ error: `User not found` });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }

  req.locals = {
    user: foundUser,
    channel: foundChannel,
  };

  next();
};

/**
 * @function newIndicator
 * add new indicator controller
 *
 * @param {string} req.params.channelId The id of the channel
 * @param {string} req.body.src The sourse of the iframe
 * @param {string} req.body.width The width of the iframe
 * @param {string} req.body.height The height of the iframe
 * @param {string} req.body.frameborder The frameborder of the iframe
 */
export const newIndicator = async (req, res, next) => {
  const channelId = req.params.channelId;
  const userId = req.userId;
  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }
  let foundChannel;
  try {
    foundChannel = await Channel.findById(channelId);
    if (!foundChannel) {
      return res.status(404).send({
        error: `Channel with id ${channelId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding channel" });
  }

  const indicator = {
    _id: new ObjectId(),
    src: req.body.src,
    width: req.body.width,
    height: req.body.height,
    frameborder: req.body.frameborder,
  };

  foundChannel.indicators.push(indicator);
  try {
    foundChannel.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving channel" });
  }

  req.locals = {
    user: foundUser,
    channel: foundChannel,
    indicator: indicator,
    success: `Indicator added successfully!`,
  };
  next();
  // return res.status(200).send({
  //   success: `Indicator added successfully!`,
  //   indicator: indicator,
  // });
};

/**
 * @function deleteIndicator
 * delete indicator controller
 *
 * @param {string} req.params.channelId The id of the channel
 * @param {string} req.params.indicatorId The id of the indicator
 */
export const deleteIndicator = async (req, res, next) => {
  const channelId = req.params.channelId;
  const indicatorId = req.params.indicatorId;
  const userId = req.userId;
  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }

  let foundChannel;
  try {
    foundChannel = await Channel.findOne({ "indicators._id": indicatorId });
    if (!foundChannel) {
      return res.status(404).send({
        error: `channel with id ${channelId} doesn't exist!`,
      });
    }

    if (foundChannel._id.toString() !== channelId) {
      return res.status(404).send({
        error: `indicator with id ${indicatorId} doesn't belong to channel with id ${channelId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding channel" });
  }

  // Find the indicator to delete
  let deletedIndicator;
  deletedIndicator = foundChannel.indicators.find(
    (indicator) => indicator._id.toString() === indicatorId
  );
  if (!deletedIndicator) {
    return res.status(404).send({
      error: `Indicator with id ${indicatorId} not found in the Channel!`,
    });
  }

  foundChannel.indicators = foundChannel.indicators.filter(
    (indicator) => indicator._id.toString() !== indicatorId
  );

  try {
    foundChannel.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving channel" });
  }

  req.locals = {
    user: foundUser,
    channel: foundChannel,
    indicator: deletedIndicator,
    success: `Indicator deleted successfully!`,
  };
  next();
  // return res.status(200).send({
  //   success: `Indicator deleted successfully!`,
  // });
};

/**
 * @function getIndicators
 * get indicators controller
 *
 * @param {string} req.params.channelId The id of the channel
 */
export const getIndicators = async (req, res, next) => {
  const channelId = req.params.channelId;
  const userId = req.userId;
  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }

  let foundChannel;
  try {
    foundChannel = await Channel.findById(channelId);
    if (!foundChannel) {
      return res.status(404).send({
        error: `Channel with id ${channelId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  const response = foundChannel.indicators ? foundChannel.indicators : [];

  return res.status(200).send(response);
};

/**
 * @function resizeIndicator
 * resize indicator controller
 *
 * @param {string} req.params.channelId The id of the channel
 * @param {string} req.params.indicatorId The id of the indicator
 * @param {string} req.params.width The width of the indicator
 * @param {string} req.params.height The height of the indicator
 */
export const resizeIndicator = async (req, res, next) => {
  const channelId = req.params.channelId;
  const indicatorId = req.params.indicatorId;
  const newWidth = req.params.width;
  const newHeight = req.params.height;
  const userId = req.userId;
  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }

  let foundChannel;
  try {
    foundChannel = await Channel.findOne({ "indicators._id": indicatorId });
    if (!foundChannel) {
      return res.status(404).send({
        error: `indicator with id ${indicatorId} doesn't exist!`,
      });
    }

    if (foundChannel._id.toString() !== channelId) {
      return res.status(404).send({
        error: `indicator with id ${indicatorId} doesn't belong to channel with id ${channelId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding channel" });
  }

  let resizedIndicator;
  let oldDimensions = {};
  foundChannel.indicators.forEach((indicator) => {
    if (indicator._id.toString() === indicatorId.toString()) {
      oldDimensions = {
        width: indicator.width,
        height: indicator.height,
      };
      indicator.width = newWidth;
      indicator.height = newHeight;
      resizedIndicator = indicator;
    }
  });

  try {
    foundChannel.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving channek" });
  }

  req.locals = {
    channel: foundChannel,
    indicator: resizedIndicator,
    user: foundUser,
    oldDimensions: oldDimensions,
    newDimentions: { width: newWidth, height: newHeight },
    success: `Indicator resized successfully!`,
  };
  next();
  //return res.status(200).send();
};

/**
 * @function reorderIndicators
 * reorder indicators controller
 *
 * @param {string} req.params.channelId The id of the channel
 * @param {string} req.params.newIndex The newIndex of the reordered indicator
 * @param {string} req.params.oldIndex The oldIndex of the reordered indicator
 */
export const reorderIndicators = async (req, res, next) => {
  const channelId = req.params.channelId;
  const newIndex = parseInt(req.params.newIndex);
  const oldIndex = parseInt(req.params.oldIndex);
  const userId = req.userId;
  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }

  let foundChannel;
  try {
    foundChannel = await Channel.findById(channelId);
    if (!foundChannel) {
      return res.status(404).send({
        error: `Channel with id ${channelId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding channel" });
  }
  let indicator = foundChannel.indicators[oldIndex];
  if (oldIndex < newIndex) {
    for (let i = oldIndex; i < newIndex; i++) {
      foundChannel.indicators[i] = foundChannel.indicators[i + 1];
    }
  } else {
    for (let i = oldIndex; i > newIndex; i--) {
      foundChannel.indicators[i] = foundChannel.indicators[i - 1];
    }
  }
  foundChannel.indicators[newIndex] = indicator;
  try {
    foundChannel.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving channel" });
  }

  req.locals = {
    user: foundUser,
    channel: foundChannel,
    indicator: indicator,
    oldIndex: oldIndex,
    newIndex: newIndex,
    indicators: foundChannel.indicators,
    success: `Indicators updated successfully!`,
  };
  next();
  // return res.status(200).send({
  //   success: `Indicators updated successfully!`,
  //   indicators: foundChannel.indicators,
  // });
};
