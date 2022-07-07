const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Course = db.course;
const Topic = db.topic;
const Channel = db.channel;
const Annotation = db.annotation;
const Material = db.material;
const Reply = db.reply;
const Tag = db.tag;

/**
 * @function getAllCourses
 * Get all courses controller
 *
 */
export const getAllCourses = async (req, res) => {
  let courses;
  try {
    courses = await Course.find({}).populate("topics", "-__v");
  } catch (err) {
    return res.status(500).send({ message: err });
  }
  return res.status(200).send(courses);
};

/**
 * @function getCourse
 * Get details of a course controller
 *
 * @param {string} req.params.courseId The id of the course
 */
export const getCourse = async (req, res) => {
  const courseId = req.params.courseId;
  let foundCourse;
  try {
    foundCourse = await Course.findOne({
      _id: ObjectId(courseId),
    }).populate("topics channels", "-__v");
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ message: err });
  }
  return res.status(200).send(foundCourse);
};

/**
 * @function newCourse
 * Create a new course controller
 *
 * @param {string} req.body.name The name of the course, e.g., Advanced Web Technologies
 * @param {string} req.body.description The description of the course, e.g., Teaching students about modern web technologies
 * @param {string} req.userId The owner of the course
 */
export const newCourse = async (req, res) => {
  const courseName = req.body.name;
  const courseDesc = req.body.description;

  let foundCourseName;
  try {
    foundCourseName = await Course.findOne({ name: courseName });
    if (foundCourseName) {
      return res.status(404).send({ error: "Course name already taken!" });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let shortName = courseName
    .split(" ")
    .map((word, index) => {
      if (index < 3) {
        return word[0];
      }
    })
    .join("");

  let course = new Course({
    name: courseName,
    shortName: shortName,
    userId: req.userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    description: courseDesc,
  });

  let courseSaved;
  try {
    courseSaved = await course.save();
  } catch (err) {
    res.status(500).send({ error: err });
  }
  return res.send({
    id: course._id,
    success: `New course '${courseSaved.name}' added!`,
  });
};

/**
 * @function deleteCourse
 * Delete a course controller
 *
 * @param {string} req.params.courseId The id of the course
 */
export const deleteCourse = async (req, res) => {
  const courseId = req.params.courseId;

  let foundCourse;
  try {
    foundCourse = await Course.findByIdAndRemove({ _id: ObjectId(courseId) });
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }

    try {
      await Topic.deleteMany({ _id: { $in: foundCourse.topics } });
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    try {
      await Channel.deleteMany({ _id: { $in: foundCourse.channels } });
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    try {
      await Material.deleteMany({ courseId: courseId });
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    try {
      await Annotation.deleteMany({ courseId: courseId });
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    try {
      await Reply.deleteMany({ courseId: courseId });
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    try {
      await Tag.deleteMany({ courseId: courseId });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  return res.send({
    success: `Course '${foundCourse.name}' successfully deleted!`,
  });
};

/**
 * @function editCourse
 * Delete a course controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.body.name The edited name of the course
 * @param {string} req.body.description The edited description of the course
 */
export const editCourse = async (req, res) => {
  const courseId = req.params.courseId;
  const courseName = req.body.name;
  const courseDesc = req.body.description;

  let foundCourse;
  try {
    foundCourse = await Course.findById(courseId);
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let shortName = courseName
    .split(" ")
    .map((word, index) => {
      if (index < 3) {
        return word[0];
      }
    })
    .join("");

  foundCourse.name = courseName;
  foundCourse.shortName = shortName;
  foundCourse.description = courseDesc;
  foundCourse.updatedAt = Date.now();

  try {
    await foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send({ success: `Course has been updated!` });
};
