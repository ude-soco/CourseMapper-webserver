const db = require("../models");
const Tag = db.tag;
const User = db.user;
const Material = db.material;
const Course = db.course;
const Topic = db.topic;
const Channel = db.channel;

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
 * @function courseTags
 * Get all tags of a course controller.
 *
 * @param {string} req.params.courseId The id of the course
 */
export const courseTags = async (req, res) => {
  const courseId = req.params.courseId;
  let foundTags;
  try {
    foundTags = await Tag.find({ courseId: courseId });
    if (!foundTags) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error fidning tags" });
  }
  let newFoundTags = [];
  foundTags.forEach((tag) => {
    if (!newFoundTags.some((item) => item.name === tag.name)) {
      let newTag = {
        _id: tag._id,
        name: tag.name,
        count: foundTags.filter((item) => item.name === tag.name).length,
      };
      newFoundTags.push(newTag);
    }
  });
  newFoundTags.sort((a, b) =>
    a.count < b.count ? 1 : b.count < a.count ? -1 : 0
  );
  return res.status(200).send(newFoundTags);
};

/**
 * @function topicTags
 * Get all tags of a topic controller.
 *
 * @param {string} req.params.topicId The id of the topic
 */
export const topicTags = async (req, res) => {
  const topicId = req.params.topicId;
  let foundTags;
  try {
    foundTags = await Tag.find({ topicId: topicId });
    if (!foundTags) {
      return res.status(404).send({
        error: `Topic with id ${topicId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding tag" });
  }
  let newFoundTags = [];
  foundTags.forEach((tag) => {
    if (!newFoundTags.some((item) => item.name === tag.name)) {
      let newTag = {
        _id: tag._id,
        name: tag.name,
        count: foundTags.filter((item) => item.name === tag.name).length,
      };
      newFoundTags.push(newTag);
    }
  });
  newFoundTags.sort((a, b) =>
    a.count < b.count ? 1 : b.count < a.count ? -1 : 0
  );
  return res.status(200).send(newFoundTags);
};

/**
 * @function channelTags
 * Get all tags of a channel controller.
 *
 * @param {string} req.params.channelId The id of the channel
 */
export const channelTags = async (req, res) => {
  const channelId = req.params.channelId;
  let foundTags;
  try {
    foundTags = await Tag.find({ channelId: channelId });
    if (!foundTags) {
      return res.status(404).send({
        error: `Channel with id ${channelId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  let newFoundTags = [];
  foundTags.forEach((tag) => {
    if (!newFoundTags.some((item) => item.name === tag.name)) {
      let newTag = {
        _id: tag._id,
        name: tag.name,
        count: foundTags.filter((item) => item.name === tag.name).length,
      };
      newFoundTags.push(newTag);
    }
  });
  newFoundTags.sort((a, b) =>
    a.count < b.count ? 1 : b.count < a.count ? -1 : 0
  );
  return res.status(200).send(newFoundTags);
};

/**
 * @function materialTags
 * Get all tags of a material controller.
 *
 * @param {string} req.params.materialId The id of the material
 */
export const materialTags = async (req, res) => {
  const materialId = req.params.materialId;
  let foundTags;
  try {
    foundTags = await Tag.find({ materialId: materialId });
    if (!foundTags) {
      return res.status(404).send({
        error: `Material with id ${materialId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  let newFoundTags = [];
  foundTags.forEach((tag) => {
    if (!newFoundTags.some((item) => item.name === tag.name)) {
      let newTag = {
        _id: tag._id,
        name: tag.name,
        count: foundTags.filter((item) => item.name === tag.name).length,
      };
      newFoundTags.push(newTag);
    }
  });
  newFoundTags.sort((a, b) =>
    a.count < b.count ? 1 : b.count < a.count ? -1 : 0
  );
  return res.status(200).send(newFoundTags);
};
export const selectCourseTag = async (req, res, next) => {
  //console.log(req);
  const tagId = req.params.tagId;
  const courseId = req.params.courseId;
  const userId = req.userId;

  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }
  let foundCourse;
  try {
    foundCourse = await Course.findById(courseId);
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding course" });
  }
  let foundTag;
  try {
    foundTag = await Tag.findById(tagId);
    if (!tagId) {
      return res.status(404).send({ error: "Tag not found" });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding the tag" });
  }
  req.locals = {
    tag: foundTag,
    course: foundCourse,
    user: foundUser,
  };
  next();
};
export const selectTopicTag = async (req, res, next) => {
  //console.log(req);
  const tagId = req.params.tagId;
  const topicId = req.params.topicId;
  const userId = req.userId;

  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
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
  let foundTag;
  try {
    foundTag = await Tag.findById(tagId);
    if (!tagId) {
      return res.status(404).send({ error: "Tag not found" });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding the tag" });
  }
  req.locals = {
    tag: foundTag,
    topic: foundTopic,
    user: foundUser,
  };
  next();
};
export const selectChannelTag = async (req, res, next) => {
  //console.log(req);
  const tagId = req.params.tagId;
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
  let foundTag;
  try {
    foundTag = await Tag.findById(tagId);
    if (!tagId) {
      return res.status(404).send({ error: "Tag not found" });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding the tag" });
  }
  req.locals = {
    tag: foundTag,
    channel: foundChannel,
    user: foundUser,
  };
  next();
};
export const selectMaterialTag = async (req, res, next) => {
  //console.log(req);
  const tagId = req.params.tagId;
  const materialId = req.params.materialId;
  const userId = req.userId;

  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }
  let foundMaterial;
  try {
    foundMaterial = await Material.findById(materialId);
    if (!foundMaterial) {
      return res.status(404).send({
        error: `Material with id ${materialId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding material" });
  }
  let foundTag;
  try {
    foundTag = await Tag.findById(tagId);
    if (!tagId) {
      return res.status(404).send({ error: "Tag not found" });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding the tag" });
  }
  req.locals = {
    tag: foundTag,
    material: foundMaterial,
    user: foundUser,
  };
  next();
};
