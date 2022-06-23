const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Channel = db.channel;
const Course = db.course;
const Material = db.material;
const Topic = db.topic;

/**
 * @function getChannel
 * Get details of a channel controller
 *
 * @param {string} req.params.channelId The id of the channel
 */
export const getChannel = (req, res) => {
  const channelId = req.params.channelId;
  Channel.findOne({ _id: ObjectId(channelId) })
    .populate("materials", "-__v")
    .exec((err, foundChannel) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }
      res.status(200).send(foundChannel);
    });
};

/**
 * @function newChannel
 * Get a course detail in database controller
 *
 * @param {string} req.params.topicId The id of the topic
 * @param {string} req.body.name The name of the channel, e.g., React Crash Course
 * @param {string} req.body.description The description of the channel, e.g., Teaching about React
 * @param {string} req.userId The owner of the channel
 */
export const newChannel = (req, res) => {
  Topic.findOne({ _id: ObjectId(req.params.topicId) }, (err, foundTopic) => {
    if (err) {
      res.status(500).send({ error: err });
      return;
    }

    if (!foundTopic) {
      res.status(404).send({
        error: `Topic with id ${req.params.topicId} doesn't exist!`,
      });
      return;
    }

    const channel = new Channel({
      name: req.body.name,
      description: req.body.description,
      courseId: foundTopic.courseId,
      topicId: req.params.topicId,
      userId: req.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    channel.save((err, channel) => {
      if (err) {
        res.status(500).send({ error: err });
        return;
      }

      res.send({
        id: channel._id,
        success: `New channel '${channel.name}' added!`,
      });

      let channels = [];
      channels.push(channel._id);

      foundTopic.channels.push(channel._id);

      foundTopic.save((err, topic) => {
        if (err) {
          res.status(500).send({ error: err });
          return;
        }

        Course.findOne({ _id: topic.courseId }, (err, updateCourse) => {
          if (err) {
            res.status(500).send({ error: err });
            return;
          }

          updateCourse.channels.push(channel._id);

          updateCourse.save((err) => {
            if (err) {
              res.status(500).send({ error: err });
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
export const deleteChannel = (req, res) => {
  Channel.findByIdAndRemove(
    { _id: req.params.channelId },
    (err, foundChannel) => {
      if (err) {
        res.status(500).send({ error: err });
        return;
      }

      if (!foundChannel) {
        res.status(404).send({
          error: `Channel with id ${req.params.channelId} doesn't exist!`,
        });
        return;
      }

      Material.deleteMany({ _id: { $in: foundChannel.materials } }, (err) => {
        if (err) {
          res.status(500).send({ error: err });
          return;
        }
      });

      Topic.findOne({ _id: foundChannel.topicId }, (err, foundTopic) => {
        if (err) {
          res.status(500).send({ error: err });
          return;
        }

        let topicIndex = foundTopic["channels"].indexOf(
          ObjectId(req.params.channelId)
        );

        if (topicIndex >= 0) {
          foundTopic["channels"].splice(topicIndex, 1);
        }

        foundTopic.save((err) => {
          if (err) {
            res.status(500).send({ error: err });
            return;
          }
        });
      });

      Course.findOne({ _id: foundChannel.courseId }, (err, foundCourse) => {
        if (err) {
          res.status(500).send({ error: err });
          return;
        }

        let channelIndex = foundCourse["channels"].indexOf(
          ObjectId(req.params.channelId)
        );

        if (channelIndex >= 0) {
          foundCourse["channels"].splice(channelIndex, 1);
        }

        foundCourse.save((err) => {
          if (err) {
            res.status(500).send({ error: err });
            return;
          }
        });
      });

      res.send({
        success: `Channel '${foundChannel.name}' successfully deleted!`,
      });
    }
  );
};
