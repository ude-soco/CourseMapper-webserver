const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Channel = db.channel;
const Material = db.material;

/**
 * @function newMaterial
 * Add a new material to channel controller
 *
 * @param {string} req.params.channelId The id of the channel
 * @param {string} req.body.type The type of the material, e.g., pdf, video
 * @param {string} req.body.name The name of the material, e.g., Angular lecture
 * @param {string} req.body.url The location/url of the material, e.g., https://www.youtube.com/watch?v=zJxJerQtUdk
 * @param {string} req.body.description The description of the material, e.g., Lecture material of Angular for course Advanced Web Technologies
 * @param {string} req.userId The owner of the material
 */
exports.newMaterial = (req, res) => {
  Channel.findOne(
    { _id: ObjectId(req.params.channelId) },
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

      const material = new Material({
        type: req.body.type,
        name: req.body.name,
        url: req.body.url,
        description: req.body.description,
        courseId: foundChannel.courseId,
        topicId: foundChannel._id,
        userId: req.userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      material.save((err, material) => {
        if (err) {
          res.status(500).send({ error: err });
          return;
        }

        res.send({
          id: material._id,
          success: `New material "${material.name}" added!`,
        });

        let materials = [];
        materials.push(material._id);

        Channel.findOne({ _id: foundChannel._id }, (err, updateChannel) => {
          if (err) {
            res.status(500).send({ error: err });
            return;
          }

          updateChannel.materials.push(material._id);

          updateChannel.save((err) => {
            if (err) {
              res.status(500).send({ error: err });
              return;
            }
          });
        });
      });
    }
  );
};
