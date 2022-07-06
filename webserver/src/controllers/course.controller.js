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
  try {
    let courses = await Course.find({})
      .populate("topics", "-__v")
      .then((res) => res);
    res.status(200).send(courses);
  } catch (err) {
    res.status(500).send({ message: err });
  }
};

/**
 * @function getCourse
 * Get details of a course controller
 *
 * @param {string} req.params.courseId The id of the course
 */
export const getCourse = async (req, res) => {
  const courseId = req.params.courseId;

  try {
    let foundCourse = await Course.findOne({
      _id: ObjectId(courseId),
    }).populate("topics channels", "-__v");
    res.status(200).send(foundCourse);
  } catch (err) {
    res.status(500).send({ message: err });
  }
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
  const description = req.body.description;

  let foundCourseName;
  try {
    foundCourseName = await Course.findOne({ name: courseName });
    if (foundCourseName) {
      res.status(404).send({ error: "Course name already taken!" });
      return;
    }
  } catch (err) {
    res.status(500).send({ error: err });
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
    description: description,
  });

  let courseSaved;
  try {
    courseSaved = await course.save();
    res.send({
      id: course._id,
      success: `New course '${courseSaved.name}' added!`,
    });
  } catch (err) {
    res.status(500).send({ error: err });
  }
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
    foundCourse = await Course.findByIdAndRemove({ _id: courseId });
    if (!foundCourse) {
      res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
      return;
    }

    try {
      await Topic.deleteMany({ _id: { $in: foundCourse.topics } });
    } catch (err) {
      res.status(500).send({ error: err });
      return;
    }

    try {
      await Channel.deleteMany({ _id: { $in: foundCourse.channels } });
    } catch (err) {
      res.status(500).send({ error: err });
      return;
    }

    try {
      await Material.deleteMany({ courseId: courseId });
    } catch (err) {
      res.status(500).send({ error: err });
      return;
    }

    try {
      await Annotation.deleteMany({ courseId: courseId });
    } catch (err) {
      res.status(500).send({ error: err });
      return;
    }

    try {
      await Reply.deleteMany({ courseId: courseId });
    } catch (err) {
      res.status(500).send({ error: err });
      return;
    }

    try {
      await Tag.deleteMany({ courseId: courseId });
    } catch (err) {
      res.status(500).send({ error: err });
      return;
    }

    res.send({
      success: `Course '${foundCourse.name}' successfully deleted!`,
    });
  } catch (err) {
    res.status(500).send({ error: err });
  }
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
  const description = req.body.description;

  let foundCourse;
  try {
    foundCourse = await Course.findById(courseId);
    if (!foundCourse) {
      res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
      return;
    }
  } catch (err) {
    res.status(500).send({ error: err });
    return;
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
  foundCourse.description = description;
  foundCourse.updatedAt = Date.now();

  try {
    await foundCourse.save();
    res.status(200).send({ success: `Course has been updated!` });
  } catch (err) {
    res.status(500).send({ error: err });
  }
};
