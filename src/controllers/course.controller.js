const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Course = db.course;
const Topic = db.topic;
const Channel = db.channel;

/**
 * @function getAllCourses
 * Get all courses controller
 *
 */
export const getAllCourses = (req, res) => {
  Course.find({})
    .populate("topics", "-__v")
    .exec((err, courses) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }
      res.status(200).send(courses);
    });
};

/**
 * @function getCourse
 * Get details of a course controller
 *
 * @param {string} req.params.courseId The id of the course
 */
export const getCourse = (req, res) => {
  const courseId = req.params.courseId;
  Course.findOne({ _id: ObjectId(courseId) })
    .populate("topics channels", "-__v")
    .exec((err, foundCourse) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }
      res.status(200).send(foundCourse);
    });
};

/**
 * @function newCourse
 * Create a new course controller
 *
 * @param {string} req.body.name The name of the course, e.g., Advanced Web Technologies
 * @param {string} req.body.description The description of the course, e.g., Teaching students about modern web technologies
 * @param {string} req.userId The owner of the course
 */
export const newCourse = (req, res) => {
  const courseName = req.body.name;
  const description = req.body.description;

  Course.findOne({ name: courseName }, (err, foundCourseName) => {
    if (err) {
      res.status(500).send({ error: err });
      return;
    }

    if (foundCourseName) {
      res.status(404).send({ error: "Course name already taken!" });
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

    const course = new Course({
      name: courseName,
      shortName: shortName,
      userId: req.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      description: description,
    });

    course.save((err, course) => {
      if (err) {
        res.status(500).send({ error: err });
        return;
      }
      res.send({
        id: course._id,
        success: `New course '${course.name}' added!`,
      });
    });
  });
};

/**
 * @function deleteCourse
 * Delete a course controller
 *
 * @param {string} req.params.courseId The id of the course
 */
export const deleteCourse = (req, res) => {
  const courseId = req.params.courseId;

  Course.findByIdAndRemove({ _id: courseId }, (err, foundCourse) => {
    if (err) {
      res.status(500).send({ error: err });
      return;
    }

    if (!foundCourse) {
      res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
      return;
    }

    Topic.deleteMany({ _id: { $in: foundCourse.topics } }, (err) => {
      if (err) {
        res.status(500).send({ error: err });
        return;
      }
    });

    Channel.deleteMany({ _id: { $in: foundCourse.channels } }, (err) => {
      if (err) {
        res.status(500).send({ error: err });
        return;
      }
    });

    res.send({ success: `Course '${foundCourse.name}' successfully deleted!` });
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
export const editCourse = (req, res) => {
  const courseId = req.params.courseId;
  const courseName = req.body.name;
  const description = req.body.description;

  Course.findById(courseId, (err, foundCourse) => {
    if (err) {
      res.status(500).send({ error: err });
      return;
    }

    if (!foundCourse) {
      res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
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

    foundCourse.save((err) => {
      if (err) {
        res.status(500).send({ error: err });
        return;
      }

      res.status(200).send({ success: `Course has been updated!` });
    });
  });
};
