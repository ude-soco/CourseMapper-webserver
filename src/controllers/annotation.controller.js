const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Annotation = db.annotation;
const Material = db.material;
const User = db.user;

/**
 * @function newAnnotation
 * Add a new annotation to a material controller
 *
 * @param {string} req.params.materialId The id of the material
 * @param {string} req.body.type The type of the annotation
 * @param {string} req.body.content The content of the annotation
 * @param {string} req.body.location The location of the annotation
 * @param {string} req.body.tool The annotation tool used
 * @param {string} req.userId The author of the annotation
 */
export const newAnnotation = (req, res) => {
  Material.findOne({ _id: req.params.materialId }, (err, foundMaterial) => {
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

    User.findOne({ _id: req.userId }, (err, foundUser) => {
      if (err) {
        res.status(500).send({ error: err });
        return;
      }

      const authorName = `${foundUser.firstname} ${foundUser.lastname}`;

      const annotation = new Annotation({
        type: req.body.type,
        content: req.body.content,
        author: {
          userId: req.userId,
          name: authorName,
        },
        location: req.body.location,
        tool: req.body.tool,
        courseId: foundMaterial.courseId,
        topicId: foundMaterial.topicId,
        channelId: foundMaterial._id,
        materialId: foundMaterial._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      annotation.save((err, newAnnotation) => {
        if (err) {
          res.status(500).send({ error: err });
          return;
        }

        foundMaterial.annotations.push(newAnnotation._id);

        foundMaterial.save((err) => {
          if (err) {
            res.status(500).send({ error: err });
            return;
          }
        });

        res
          .status(200)
          .send({ id: newAnnotation._id, success: "Annotation added!" });
      });
    });
  });
};

/**
 * @function deleteAnnotation
 * Delete an annotation from a material controller
 *
 * @param {string} req.params.annotationId The id of the annotation
 * @param {string} req.userId The id of the user
 */
export const deleteAnnotation = (req, res) => {
  const annotationId = req.params.annotationId;
  Annotation.findOne(
    { _id: ObjectId(annotationId) },
    (err, foundAnnotation) => {
      if (err) {
        res.status(500).send({ error: err });
        return;
      }

      if (!foundAnnotation) {
        res.status(404).send({
          error: `Annotation with id ${req.params.annotationId} doesn't exist!`,
        });
        return;
      }

      if (req.userId !== foundAnnotation.author.userId.valueOf()) {
        res.status(404).send({
          error: `User is not the author of this annotation!`,
        });
        return;
      }

      foundAnnotation.deleteOne({ _id: annotationId }, (err) => {
        if (err) {
          res.status(500).send({ error: err });
          return;
        }

        Material.findOne(
          { _id: foundAnnotation.materialId },
          (err, foundMaterial) => {
            if (err) {
              res.status(500).send({ error: err });
              return;
            }

            const newAnnotations = foundMaterial.annotations.filter(
              (annotation) => annotation.valueOf() !== annotationId
            );

            foundMaterial.annotations = newAnnotations;

            foundMaterial.save((err) => {
              if (err) {
                res.status(500).send({ error: err });
                return;
              }
            });
          }
        );

        res.status(200).send({ success: "Annotation successfully deleted" });
      });
    }
  );
};
