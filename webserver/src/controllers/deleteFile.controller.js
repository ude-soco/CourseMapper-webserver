const fs = require("fs");
const helpers = require("../helpers/helpers");
const db = require("../models");
const Course = db.course;

const remove = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = "public/uploads/pdfs/";
  fs.unlink(directoryPath + fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not delete the file. " + err,
      });
    }
    res.status(200).send({
      message: "File is deleted.",
    });
  });
};

const removeImg = async (req, res) => {
  const fileName = req.params.name;
  const courseData = req.body;
 
  const directoryPath = "public/uploads/images/";

  fs.unlink(directoryPath + fileName, async (err) => {
    if (err) {
      return res.status(500).send({
        message: "Could not delete the file. " + err,
      });
    }

    try {
      const imageUrl = await helpers.getRandomImageUrl(req);

      // Explicitly find course and update
      const course = await Course.findById(courseData._id);

      if (!course) {
        return res.status(404).send({ message: "Course not found." });
      }

      course.url = imageUrl;
      course.updatedAt = Date.now();

      const savedCourse = await course.save(); // Explicit save!
      console.log(savedCourse);

      return res.status(200).send({
        message: "File deleted and course image updated successfully.",
        course: savedCourse,
      });

    } catch (updateErr) {
      return res.status(500).send({
        message: "File deleted, but error updating course image. " + updateErr,
      });
    }
  });
};

const removeSync = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = "public/uploads/pdfs/";
  try {
    fs.unlinkSync(directoryPath + fileName);
    res.status(200).send({
      message: "File is deleted.",
    });
  } catch (err) {
    res.status(500).send({
      message: "Could not delete the file. " + err,
    });
  }
};

const removeVideo = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = "public/uploads/videos/";
  fs.unlink(directoryPath + fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not delete the video. " + err,
      });
    }
    res.status(200).send({
      message: "Video is deleted.",
    });
  });
};

const removeSyncVideo = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = "public/uploads/videos/";
  try {
    fs.unlinkSync(directoryPath + fileName);
    res.status(200).send({
      message: "Video is deleted.",
    });
  } catch (err) {
    res.status(500).send({
      message: "Could not delete the Video. " + err,
    });
  }
};

module.exports = {
  remove,
  removeSync,
  removeVideo,
  removeSyncVideo,
  removeImg,
};
