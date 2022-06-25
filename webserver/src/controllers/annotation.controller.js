const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Annotation = db.annotation;
const Material = db.material;
const Tag = db.tag;
const User = db.user;

/**
 * @function newAnnotation
 * Add a new annotation to a material controller.
 * If hashtag(s) exists in the content, it adds to Tag collection
 *
 * @param {string} req.params.materialId The id of the material
 * @param {string} req.body.type The type of the annotation
 * @param {string} req.body.content The content of the annotation
 * @param {string} req.body.location The location of the annotation
 * @param {string} req.body.tool The annotation tool used
 * @param {string} req.userId The author of the annotation. Anyone can create an annotation
 */
export const newAnnotation = (req, res) => {
  const content = req.body.content;
  Material.findOne({_id: req.params.materialId}, (err, foundMaterial) => {
    if (err) {
      res.status(500).send({error: err});
      return;
    }

    if (!foundMaterial) {
      res.status(404).send({
        error: `Material with id ${req.params.materialId} doesn't exist!`,
      });
      return;
    }

    User.findOne({_id: req.userId}, (err, foundUser) => {
      if (err) {
        res.status(500).send({error: err});
        return;
      }

      const authorName = `${foundUser.firstname} ${foundUser.lastname}`;

      const annotation = new Annotation({
        type: req.body.type,
        content: content,
        author: {
          userId: req.userId, name: authorName,
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
          res.status(500).send({error: err});
          return;
        }

        foundMaterial.annotations.push(newAnnotation._id);

        foundMaterial.save((err) => {
          if (err) {
            res.status(500).send({error: err});
            return;
          }

          // Checks for hashtags in content
          let foundTags = content.split(" ").filter((v) => v.startsWith("#"));

          if (foundTags.length !== 0) {
            let foundTagsSchema = [];
            foundTags.forEach((tag) => {
              let newTag = new Tag({
                name: tag,
                courseId: foundMaterial.courseId,
                topicId: foundMaterial.topicId,
                channelId: foundMaterial._id,
                materialId: foundMaterial._id,
                annotationId: newAnnotation._id,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
              foundTagsSchema.push(newTag);
            });

            Tag.insertMany(foundTagsSchema, (err) => {
              if (err) {
                res.status(500).send({error: err});
                return;
              }
            });
          }
        });

        res
          .status(200)
          .send({id: newAnnotation._id, success: "Annotation added!"});
      });
    });
  });
};

/**
 * @function deleteAnnotation
 * Delete an annotation from a material controller
 *
 * @param {string} req.params.annotationId The id of the annotation
 * @param {string} req.userId The id of the user. Only author of the annotation can delete
 */
export const deleteAnnotation = (req, res) => {
  const annotationId = req.params.annotationId;
  Annotation.findOne({_id: ObjectId(annotationId)}, (err, foundAnnotation) => {
    if (err) {
      res.status(500).send({error: err});
      return;
    }

    if (!foundAnnotation) {
      res.status(404).send({
        error: `Annotation with id ${req.params.annotationId} doesn't exist!`,
      });
      return;
    }

    if (req.userId !== foundAnnotation.author.userId.valueOf() && !req.isAdmin) {
      res.status(404).send({
        error: `User is not the author of this annotation!`,
      });
      return;
    }

    // TODO: Should not delete if there are replies
    foundAnnotation.deleteOne({_id: annotationId}, (err) => {
      if (err) {
        res.status(500).send({error: err});
        return;
      }

      // TODO: Delete associated replies based on annotationId
      // TODO: Delete associated tags based on annotationId

      Material.findOne({_id: foundAnnotation.materialId}, (err, foundMaterial) => {
        if (err) {
          res.status(500).send({error: err});
          return;
        }

        const newAnnotations = foundMaterial.annotations.filter((annotation) => annotation.valueOf() !== annotationId);

        foundMaterial.annotations = newAnnotations;

        foundMaterial.save((err) => {
          if (err) {
            res.status(500).send({error: err});
            return;
          }
        });
      });

      res.status(200).send({success: "Annotation successfully deleted"});
    });
  });
};

/**
 * @function editAnnotation
 * Update an annotation controller
 *
 * @param {string} req.params.annotationId The id of the annotation
 * @param {string} req.body.type The type of the annotation
 * @param {string} req.body.content The content of the annotation
 * @param {string} req.body.location The location of the annotation
 * @param {string} req.body.tool The annotation tool used
 * @param {string} req.userId The id of the user. Only author of the annotation can edit
 */
export const editAnnotation = (req, res) => {
  const annotationId = req.params.annotationId;

  Annotation.findOne({_id: ObjectId(annotationId)}, (err, foundAnnotation) => {
    if (err) {
      res.status(500).send({error: err});
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
        error: `Cannot update! User is not the author of this annotation!`,
      });
      return;
    }

    foundAnnotation.type = req.body.type;
    foundAnnotation.content = req.body.content;
    foundAnnotation.location = req.body.location;
    foundAnnotation.tool = req.body.tool;
    foundAnnotation.updatedAt = Date.now();

    // TODO: Check if the tag has changed and/or new tag(s) is added
    foundAnnotation.save((err) => {
      if (err) {
        res.status(500).send({error: err});
        return;
      }
      res.status(200).send({success: "Annotation successfully updated"});
    });
  });
};

/**
 * @function likeAnnotation
 * Like and unlike an annotation controller
 *
 * @param {string} req.params.annotationId The id of the annotation
 * @param {string} req.userId The id of the user
 */
export const likeAnnotation = (req, res) => {
  const annotationId = req.params.annotationId;

  Annotation.findOne({_id: ObjectId(annotationId)}, (err, foundAnnotation) => {
    if (err) {
      res.status(500).send({error: err});
      return;
    }

    if (!foundAnnotation) {
      res.status(404).send({
        error: `Annotation with id ${req.params.annotationId} doesn't exist!`,
      });
      return;
    }

    if (foundAnnotation.likes.includes(ObjectId(req.userId))) {
      const newLikes = foundAnnotation.likes.filter((user) => user.valueOf() !== req.userId);

      foundAnnotation.likes = newLikes;

      foundAnnotation.save((err, savedAnnotation) => {
        if (err) {
          res.status(500).send({error: err});
          return;
        }
        const countLikes = savedAnnotation.likes.length;

        res.status(200).send({
          count: countLikes, success: "Annotation successfully unliked!",
        });
      });
    } else if (foundAnnotation.dislikes.includes(ObjectId(req.userId))) {
      res
        .status(404)
        .send({error: "Cannot like! Annotation already disliked by user!"});
    } else {
      foundAnnotation.likes.push(ObjectId(req.userId));

      foundAnnotation.save((err, savedAnnotation) => {
        if (err) {
          res.status(500).send({error: err});
          return;
        }

        const countLikes = savedAnnotation.likes.length;

        res.status(200).send({
          count: countLikes, success: "Annotation successfully liked!",
        });
      });
    }
  });
};

/**
 * @function dislikeAnnotation
 * Dislike and un-dislike an annotation controller
 *
 * @param {string} req.params.annotationId The id of the annotation
 * @param {string} req.userId The id of the user
 */
export const dislikeAnnotation = (req, res) => {
  const annotationId = req.params.annotationId;

  Annotation.findOne({_id: ObjectId(annotationId)}, (err, foundAnnotation) => {
    if (err) {
      res.status(500).send({error: err});
      return;
    }

    if (!foundAnnotation) {
      res.status(404).send({
        error: `Annotation with id ${req.params.annotationId} doesn't exist!`,
      });
      return;
    }

    if (foundAnnotation.dislikes.includes(ObjectId(req.userId))) {
      const newDislikes = foundAnnotation.dislikes.filter((user) => user.valueOf() !== req.userId);

      foundAnnotation.dislikes = newDislikes;

      foundAnnotation.save((err, savedAnnotation) => {
        if (err) {
          res.status(500).send({error: err});
          return;
        }

        const countDislikes = savedAnnotation.dislikes.length;

        res.status(200).send({
          count: countDislikes, success: "Annotation successfully un-disliked!",
        });
      });
    } else if (foundAnnotation.likes.includes(ObjectId(req.userId))) {
      res
        .status(404)
        .send({error: "Cannot dislike! Annotation already liked by user!"});
    } else {
      foundAnnotation.dislikes.push(ObjectId(req.userId));

      foundAnnotation.save((err, savedAnnotation) => {
        if (err) {
          res.status(500).send({error: err});
          return;
        }

        const countDislikes = savedAnnotation.dislikes.length;

        res.status(200).send({
          count: countDislikes, success: "Annotation successfully disliked!",
        });
      });
    }
  });
};
