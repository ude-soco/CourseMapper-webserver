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

  let user;
  try {
    user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ error: "Error finding user" });
    }
  } catch (error) {
    return res.status(500).send({ error: error });
  }
  let foundTopic;
  try {
    foundTopic = await Topic.findById(topicId).populate("channels", "-__v");
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
    user: user,
  };

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

  let user;
  try {
    user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding user" });
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
    return res.status(500).send({ error: "Error saving topic" });
  }

  foundCourse.topics.push(savedTopic._id);

  try {
    await foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving course" });
  }

  req.locals = {
    response: {
      id: topic._id,
      savedTopic: savedTopic,
      courseId: courseId,
      success: `New topic '${topicName}' added!`,
    },
    topic: savedTopic,
    user: user,
    course: foundCourse,
    category: "courseupdates",
  };
  return next();
};

//TODO: Perhaps delete topic notifications when topic is deleted even though the activities related to the topic are not being deleted

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

  let user;
  try {
    user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: error });
  }
  let foundTopic;
  try {
    foundTopic = await Topic.findById(topicId);
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
    return res.status(500).send({ error: "Error finding topic" });
  }
  try {
    await Topic.findByIdAndRemove(topicId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding and removing topic" });
  }
  try {
    await Channel.deleteMany({ topicId: { $in: topicId } });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting channel" });
  }
  try {
    await Material.deleteMany({ topicId: topicId });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting material" });
  }
  try {
    await Annotation.deleteMany({ topicId: topicId });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting annotation" });
  }
  try {
    await Reply.deleteMany({ topicId: topicId });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting reply" });
  }
  try {
    await Tag.deleteMany({ topicId: topicId });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting tag" });
  }
  let foundCourse;
  try {
    foundCourse = await Course.findById(foundTopic.courseId);
  } catch (err) {
    return res.status(500).send({ error: "Error fidning course" });
  }
  foundCourse.topics = foundCourse.topics.filter(
    (topic) => topic.valueOf() !== topicId
  );
  try {
    await foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving course" });
  }
  req.locals = {
    response: {
      success: `Topic '${foundTopic.name}' successfully deleted!`,
    },
    topic: foundTopic,
    user: user,
    category: "courseupdates",
    course: foundCourse,
  };
  return next();
};

//TODO: Maybe the extraMessage can be changed for topic being edited. from "<newTopicName> was edited" to <"old topic name> was renamed to <newTopicName>"
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

  let user;
  try {
    user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding user" });
  }

  if (!Boolean(topicName)) {
    return res.status(404).send({
      error: `Topic requires a name!`,
    });
  }
  let foundTopic;
  try {
    foundTopic = await Topic.findById(topicId);
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
    return res.status(500).send({ error: "Error finding topic" });
  }
  req.locals = {};
  req.locals.oldTopic = JSON.parse(JSON.stringify(foundTopic));
  foundTopic.name = topicName;
  foundTopic.updatedAt = Date.now();
  try {
    await foundTopic.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving topic" });
  }
  req.locals.response = {
    id: foundTopic._id,
    courseId: courseId,
    success: `Topic '${topicName}' has been updated successfully!`,
  };
  req.locals.user = user;
  req.locals.newTopic = foundTopic;
  req.locals.category = "courseupdates";
  req.locals.user = user;
  req.locals.course = foundCourse;
  req.locals.topic = newTopic;

  return next();
};
