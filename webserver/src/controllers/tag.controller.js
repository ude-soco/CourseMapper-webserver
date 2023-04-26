const db = require("../models");
const Tag = db.tag;

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
        name: tag.name,
        count: foundTags.filter((item) => item.name === tag.name).length,
      };
      newFoundTags.push(newTag);
    }
  });
  newFoundTags.sort((a, b) =>
    a.count < b.count ? 1 : b.count < a.count ? -1 : 0
  );
  return res.status(200).send(
    newFoundTags,
  );
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
        name: tag.name,
        count: foundTags.filter((item) => item.name === tag.name).length,
      };
      newFoundTags.push(newTag);
    }
  });
  newFoundTags.sort((a, b) =>
    a.count < b.count ? 1 : b.count < a.count ? -1 : 0
  );
  return res.status(200).send(
    newFoundTags,
  );
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
        name: tag.name,
        count: foundTags.filter((item) => item.name === tag.name).length,
      };
      newFoundTags.push(newTag);
    }
  });
  newFoundTags.sort((a, b) =>
    a.count < b.count ? 1 : b.count < a.count ? -1 : 0
  );
  return res.status(200).send(
    newFoundTags,
  );
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
        name: tag.name,
        count: foundTags.filter((item) => item.name === tag.name).length,
      };
      newFoundTags.push(newTag);
    }
  });
  newFoundTags.sort((a, b) =>
    a.count < b.count ? 1 : b.count < a.count ? -1 : 0
  );
  return res.status(200).send(
    newFoundTags,
  );
};
