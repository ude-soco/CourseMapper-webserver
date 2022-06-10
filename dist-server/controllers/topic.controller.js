"use strict";

var ObjectId = require("mongoose").Types.ObjectId;

var db = require("../models");

var Channel = db.channel;
var Course = db.course;
var Topic = db.topic;
/**
 * @function newTopic
 * Create a new topic controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.body.name The name of the topic, e.g., React Crash Course
 * @param {string} req.body.description The description of the course, e.g., Teaching students about modern web technologies
 * @param {string} req.userId The owner of the topic
 */

exports.newTopic = function (req, res) {
  Course.findOne({
    _id: ObjectId(req.params.courseId)
  }, function (err, foundCourse) {
    if (err) {
      res.status(500).send({
        error: err
      });
      return;
    }

    if (!foundCourse) {
      res.status(404).send({
        error: "Course with id ".concat(req.params.courseId, " doesn't exist!")
      });
      return;
    }

    var topic = new Topic({
      name: req.body.name,
      courseId: req.params.courseId,
      userId: req.userId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    topic.save(function (err, topic) {
      if (err) {
        res.status(500).send({
          error: err
        });
        return;
      }

      res.send({
        id: topic._id,
        success: "New topic '".concat(topic.name, "' added!")
      });
      var topics = [];
      topics.push(topic._id);
      foundCourse.topics.push(topic._id);
      foundCourse.save(function (err) {
        if (err) {
          res.status(500).send({
            error: err
          });
          return;
        }
      });
    });
  });
};
/**
 * @function deleteTopic
 * Delete a topic controller
 *
 * @param {string} req.params.topicId The id of the topic
 */


exports.deleteTopic = function (req, res) {
  Topic.findByIdAndRemove({
    _id: req.params.topicId
  }, function (err, foundTopic) {
    if (err) {
      res.status(500).send({
        error: err
      });
      return;
    }

    if (!foundTopic) {
      res.status(404).send({
        error: "Topic with id ".concat(req.params.topicId, " doesn't exist!")
      });
      return;
    }

    Channel.deleteMany({
      _id: {
        $in: foundTopic.channels
      }
    }, function (err) {
      if (err) {
        res.status(500).send({
          error: err
        });
        return;
      }
    });
    Course.findOne({
      _id: foundTopic.courseId
    }, function (err, foundCourse) {
      if (err) {
        res.status(500).send({
          error: err
        });
        return;
      }

      var topicIndex = foundCourse["topics"].indexOf(ObjectId(req.params.topicId));

      if (topicIndex >= 0) {
        foundCourse["topics"].splice(topicIndex, 1);
      }

      foundCourse.save(function (err) {
        if (err) {
          res.status(500).send({
            error: err
          });
          return;
        }
      });
    });
    res.send({
      success: "Topic '".concat(foundTopic.name, "' successfully deleted!")
    });
  });
};