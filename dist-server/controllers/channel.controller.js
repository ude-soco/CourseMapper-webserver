"use strict";

var ObjectId = require("mongoose").Types.ObjectId;

var db = require("../models");

var Channel = db.channel;
var Course = db.course;
var Material = db.material;
var Topic = db.topic;
/**
 * @function newChannel
 * Get a course detail in database controller
 *
 * @param {string} req.params.topicId The id of the topic
 * @param {string} req.body.name The name of the channel, e.g., React Crash Course
 * @param {string} req.userId The owner of the channel
 */

exports.newChannel = function (req, res) {
  Topic.findOne({
    _id: ObjectId(req.params.topicId)
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

    var channel = new Channel({
      name: req.body.name,
      courseId: foundTopic.courseId,
      topicId: req.params.topicId,
      userId: req.userId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    channel.save(function (err, channel) {
      if (err) {
        res.status(500).send({
          error: err
        });
        return;
      }

      res.send({
        id: channel._id,
        success: "New channel ".concat(channel.name, " added!")
      });
      var channels = [];
      channels.push(channel._id);
      foundTopic.channels.push(channel._id);
      foundTopic.save(function (err, topic) {
        if (err) {
          res.status(500).send({
            error: err
          });
          return;
        }

        Course.findOne({
          _id: topic.courseId
        }, function (err, updateCourse) {
          if (err) {
            res.status(500).send({
              error: err
            });
            return;
          }

          updateCourse.channels.push(channel._id);
          updateCourse.save(function (err) {
            if (err) {
              res.status(500).send({
                error: err
              });
              return;
            }
          });
        });
      });
    });
  });
};
/**
 * @function deleteChannel
 * Delete a topic controller
 *
 * @param {string} req.params.channelId The id of the channel
 */


exports.deleteChannel = function (req, res) {
  Channel.findByIdAndRemove({
    _id: req.params.channelId
  }, function (err, foundChannel) {
    if (err) {
      res.status(500).send({
        error: err
      });
      return;
    }

    if (!foundChannel) {
      res.status(404).send({
        error: "Channel with id ".concat(req.params.channelId, " doesn't exist!")
      });
      return;
    }

    Material.deleteMany({
      _id: {
        $in: foundChannel.materials
      }
    }, function (err) {
      if (err) {
        res.status(500).send({
          error: err
        });
        return;
      }
    });
    Topic.findOne({
      _id: foundChannel.topicId
    }, function (err, foundTopic) {
      if (err) {
        res.status(500).send({
          error: err
        });
        return;
      }

      var topicIndex = foundTopic["channels"].indexOf(ObjectId(req.params.channelId));

      if (topicIndex >= 0) {
        foundTopic["channels"].splice(topicIndex, 1);
      }

      foundTopic.save(function (err) {
        if (err) {
          res.status(500).send({
            error: err
          });
          return;
        }
      });
    });
    Course.findOne({
      _id: foundChannel.courseId
    }, function (err, foundCourse) {
      if (err) {
        res.status(500).send({
          error: err
        });
        return;
      }

      var channelIndex = foundCourse["channels"].indexOf(ObjectId(req.params.channelId));

      if (channelIndex >= 0) {
        foundCourse["channels"].splice(channelIndex, 1);
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
      success: "Channel '".concat(foundChannel.name, "' successfully deleted!")
    });
  });
};