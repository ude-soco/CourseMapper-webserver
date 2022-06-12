const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Annotation = db.annotation;
const Reply = db.reply;
const User = db.user;

/**
 * @function newReply
 * Add a new reply to an annotation controller
 *
 * @param {string} req.params.annotationId The id of the annotation
 * @param {string} req.body.content The content of the reply
 * @param {string} req.userId The author of the reply. Anyone can create a reply
 */
export const newReply = (req, res) => {
  Annotation.findOne(
    { _id: req.params.annotationId },
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

      User.findOne({ _id: req.userId }, (err, foundUser) => {
        if (err) {
          res.status(500).send({ error: err });
          return;
        }

        const authorName = `${foundUser.firstname} ${foundUser.lastname}`;

        const reply = new Reply({
          content: req.body.content,
          author: {
            userId: req.userId,
            name: authorName,
          },
          courseId: foundAnnotation.courseId,
          topicId: foundAnnotation.topicId,
          channelId: foundAnnotation._id,
          materialId: foundAnnotation._id,
          annotationId: req.params.annotationId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        reply.save((err, newReply) => {
          if (err) {
            res.status(500).send({ error: err });
            return;
          }

          foundAnnotation.replies.push(newReply._id);

          foundAnnotation.save((err) => {
            if (err) {
              res.status(500).send({ error: err });
              return;
            }
          });

          res.status(200).send({ id: newReply._id, success: `Reply added!` });
        });
      });
    }
  );
};

/**
 * @function deleteReply
 * Delete a reply from an annotation controller
 *
 * @param {string} req.params.replyId The id of the reply
 * @param {string} req.userId The id of the user. Only author/admin can delete
 */
export const deleteReply = (req, res) => {
  const replyId = req.params.replyId;

  Reply.findOne({ _id: ObjectId(replyId) }, (err, foundReply) => {
    if (err) {
      res.status(500).send({ error: err });
      return;
    }

    if (!foundReply) {
      res.status(404).send({
        error: `Reply with id ${req.params.replyId} doesn't exist!`,
      });
      return;
    }

    if (req.userId !== foundReply.author.userId.valueOf() && !req.isAdmin) {
      res.status(404).send({
        error: `User is not the author of this reply!`,
      });
      return;
    }

    foundReply.deleteOne({ _id: replyId }, (err) => {
      if (err) {
        res.status(500).send({ error: err });
        return;
      }

      Annotation.findOne(
        { _id: foundReply.annotationId },
        (err, foundAnnotation) => {
          if (err) {
            res.status(500).send({ error: err });
            return;
          }

          const newReplies = foundAnnotation.replies.filter(
            (reply) => reply.valueOf() !== replyId
          );

          foundAnnotation.replies = newReplies;

          foundAnnotation.save((err) => {
            if (err) {
              res.status(500).send({ error: err });
              return;
            }
          });
        }
      );

      res.status(200).send({ success: "Reply successfully deleted" });
    });
  });
};

/**
 * @function editReply
 * Update a reply controller
 *
 * @param {string} req.params.replyId The id of the reply
 * @param {string} req.body.content The content of the reply
 * @param {string} req.userId The id of the user. Only author of the reply can edit
 */
export const editReply = (req, res) => {
  const replyId = req.params.replyId;

  Reply.findOne({ _id: ObjectId(replyId) }, (err, foundReply) => {
    if (err) {
      res.status(500).send({ error: err });
      return;
    }

    if (!foundReply) {
      res.status(404).send({
        error: `Reply with id ${req.params.replyId} doesn't exist!`,
      });
      return;
    }

    if (req.userId !== foundReply.author.userId.valueOf()) {
      res.status(404).send({
        error: `Cannot update! User is not the author of this reply!`,
      });
      return;
    }

    foundReply.content = req.body.content;
    foundReply.updatedAt = Date.now();

    foundReply.save((err) => {
      if (err) {
        res.status(500).send({ error: err });
        return;
      }
      res.status(200).send({ success: "Reply successfully updated" });
    });
  });
};

/**
 * @function likeReply
 * Like and unlike an annotation controller
 *
 * @param {string} req.params.replyId The id of the reply
 * @param {string} req.userId The id of the user
 */
export const likeReply = (req, res) => {
  const replyId = req.params.replyId;

  Reply.findOne({ _id: ObjectId(replyId) }, (err, foundReply) => {
    if (err) {
      res.status(500).send({ error: err });
      return;
    }

    if (!foundReply) {
      res.status(404).send({
        error: `Reply with id ${replyId} doesn't exist!`,
      });
      return;
    }

    if (foundReply.likes.includes(ObjectId(req.userId))) {
      const newLikes = foundReply.likes.filter(
        (user) => user.valueOf() !== req.userId
      );

      foundReply.likes = newLikes;

      foundReply.save((err, savedReply) => {
        if (err) {
          res.status(500).send({ error: err });
          return;
        }
        const countLikes = savedReply.likes.length;

        res.status(200).send({
          count: countLikes,
          success: "Reply successfully unliked!",
        });
      });
    } else if (foundReply.dislikes.includes(ObjectId(req.userId))) {
      res
        .status(404)
        .send({ error: "Cannot like! Reply already disliked by user!" });
    } else {
      foundReply.likes.push(ObjectId(req.userId));

      foundReply.save((err, savedReply) => {
        if (err) {
          res.status(500).send({ error: err });
          return;
        }

        const countLikes = savedReply.likes.length;

        res.status(200).send({
          count: countLikes,
          success: "Reply successfully liked!",
        });
      });
    }
  });
};

/**
 * @function dislikeReply
 * Dislike and un-dislike a reply controller
 *
 * @param {string} req.params.replyId The id of the annotation
 * @param {string} req.userId The id of the user. Only author of the annotation can edit
 */
export const dislikeReply = (req, res) => {
  const replyId = req.params.replyId;

  Reply.findOne({ _id: ObjectId(replyId) }, (err, foundReply) => {
    if (err) {
      res.status(500).send({ error: err });
      return;
    }

    if (!foundReply) {
      res.status(404).send({
        error: `Reply with id ${replyId} doesn't exist!`,
      });
      return;
    }

    if (foundReply.dislikes.includes(ObjectId(req.userId))) {
      const newDislikes = foundReply.dislikes.filter(
        (user) => user.valueOf() !== req.userId
      );

      foundReply.dislikes = newDislikes;

      foundReply.save((err, savedReply) => {
        if (err) {
          res.status(500).send({ error: err });
          return;
        }

        const countDislikes = savedReply.dislikes.length;

        res.status(200).send({
          count: countDislikes,
          success: "Reply successfully un-disliked!",
        });
      });
    } else if (foundReply.likes.includes(ObjectId(req.userId))) {
      res
        .status(404)
        .send({ error: "Cannot dislike! Reply already liked by user!" });
    } else {
      foundReply.dislikes.push(ObjectId(req.userId));

      foundReply.save((err, savedReply) => {
        if (err) {
          res.status(500).send({ error: err });
          return;
        }

        const countDislikes = savedReply.dislikes.length;

        res.status(200).send({
          count: countDislikes,
          success: "Reply successfully disliked!",
        });
      });
    }
  });
};
