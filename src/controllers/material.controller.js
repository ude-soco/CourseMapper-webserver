const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Channel = db.channel;
const Material = db.material;

/**
 * @function newMaterial
 * Add a new material to a channel controller
 *
 * @param {string} req.params.channelId The id of the channel
 * @param {string} req.body.type The type of the material, e.g., pdf, video
 * @param {string} req.body.name The name of the material, e.g., Angular lecture
 * @param {string} req.body.url The location/url of the material, e.g., https://www.youtube.com/watch?v=zJxJerQtUdk
 * @param {string} req.body.description The description of the material, e.g., Lecture material of Angular for course Advanced Web Technologies
 * @param {string} req.userId The owner of the material
 */
export const newMaterial = (req, res) => {
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
        topicId: foundChannel.topicId,
        channelId: foundChannel._id,
        userId: req.userId,
        updatedAt: Date.now(),
      });

      material.save((err, material) => {
        if (err) {
          res.status(500).send({ error: err });
          return;
        }

        foundChannel.materials.push(material._id);

        foundChannel.save((err) => {
          if (err) {
            res.status(500).send({ error: err });
            return;
          }
        });

        res.send({
          id: material._id,
          success: `New material '${material.name}' added!`,
        });
      });
    }
  );
};

/**
 * @function deleteMaterial
 * Delete a new material controller
 *
 * @param {string} req.params.materialId The id of the material
 */
export const deleteMaterial = (req, res) => {
  Material.findByIdAndRemove(
    { _id: req.params.materialId },
    (err, foundMaterial) => {
      if (err) {
        res.status(500).send({ error: err });
        return;
      }

      if (!foundMaterial) {
        res.status(404).send({
          error: `Material with id ${req.params.materialId} doesn't exist!`,
        });
        return;
      }

      Channel.findOne({ _id: foundMaterial.channelId }, (err, foundChannel) => {
        if (err) {
          res.status(500).send({ error: err });
          return;
        }

        let materialIndex = foundChannel["materials"].indexOf(
          ObjectId(req.params.materialId)
        );

        if (materialIndex >= 0) {
          foundChannel["materials"].splice(materialIndex, 1);
        }

        foundChannel.save((err) => {
          if (err) {
            res.status(500).send({ error: err });
            return;
          }
        });
      });

      // Course.findOne({ _id: foundChannel.courseId }, (err, foundCourse) => {
      //   if (err) {
      //     res.status(500).send({ error: err });
      //     return;
      //   }

      //   let channelIndex = foundCourse["channels"].indexOf(
      //     ObjectId(req.params.channelId)
      //   );

      //   if (channelIndex >= 0) {
      //     foundCourse["channels"].splice(channelIndex, 1);
      //   }

      //   foundCourse.save((err) => {
      //     if (err) {
      //       res.status(500).send({ error: err });
      //       return;
      //     }
      //   });
      // });

      res.send({
        success: `Material '${foundMaterial.name}' successfully deleted!`,
      });
    }
  );
};
