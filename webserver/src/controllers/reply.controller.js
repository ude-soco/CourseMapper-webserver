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
export const newReply = async (req, res) => {
  const annotationId = req.params.annotationId;
  const replyContent = req.body.content;

  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findOne({ _id: annotationId });
    if (!foundAnnotation) {
      return res.status(404).send({
        error: `Annotation with id ${annotationId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundUser;
  try {
    foundUser = await User.findOne({ _id: req.userId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let authorName = `${foundUser.firstname} ${foundUser.lastname}`;

  let reply = new Reply({
    content: replyContent,
    author: {
      userId: req.userId,
      name: authorName,
    },
    courseId: foundAnnotation.courseId,
    topicId: foundAnnotation.topicId,
    channelId: foundAnnotation._id,
    materialId: foundAnnotation._id,
    annotationId: annotationId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  let newReply;
  try {
    newReply = await reply.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundAnnotation.replies.push(newReply._id);

  try {
    await foundAnnotation.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send({ id: newReply._id, success: `Reply added!` });
};

/**
 * @function deleteReply
 * Delete a reply from an annotation controller
 *
 * @param {string} req.params.replyId The id of the reply
 * @param {string} req.userId The id of the user. Only author/admin can delete
 */
export const deleteReply = async (req, res) => {
  const replyId = req.params.replyId;

  let foundReply;
  try {
    foundReply = await Reply.findOne({ _id: ObjectId(replyId) });
    if (!foundReply) {
      return res.status(404).send({
        error: `Reply with id ${replyId} doesn't exist!`,
      });
    }
    if (req.userId !== foundReply.author.userId.valueOf() && !req.isAdmin) {
      return res.status(404).send({
        error: `User is not the author of this reply!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  try {
    await foundReply.deleteOne({ _id: replyId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findOne({
      _id: foundReply.annotationId,
    });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  const newReplies = foundAnnotation.replies.filter(
    (reply) => reply.valueOf() !== replyId
  );

  foundAnnotation.replies = newReplies;

  try {
    await foundAnnotation.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  return res.status(200).send({ success: "Reply successfully deleted" });
};

/**
 * @function editReply
 * Update a reply controller
 *
 * @param {string} req.params.replyId The id of the reply
 * @param {string} req.body.content The content of the reply
 * @param {string} req.userId The id of the user. Only author of the reply can edit
 */
export const editReply = async (req, res) => {
  const replyId = req.params.replyId;
  const replyContent = req.params.content;

  let foundReply;
  try {
    foundReply = Reply.findOne({ _id: ObjectId(replyId) });
    if (!foundReply) {
      return res.status(404).send({
        error: `Reply with id ${req.params.replyId} doesn't exist!`,
      });
    }
    if (req.userId !== foundReply.author.userId.valueOf()) {
      return res.status(404).send({
        error: `Cannot update! User is not the author of this reply!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundReply.content = replyContent;
  foundReply.updatedAt = Date.now();

  try {
    await foundReply.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send({ success: "Reply successfully updated" });
};

/**
 * @function likeReply
 * Like and unlike an annotation controller
 *
 * @param {string} req.params.replyId The id of the reply
 * @param {string} req.userId The id of the user
 */
export const likeReply = async (req, res) => {
  const replyId = req.params.replyId;

  let foundReply;
  try {
    foundReply = await Reply.findOne({ _id: ObjectId(replyId) });
    if (!foundReply) {
      res.status(404).send({
        error: `Reply with id ${replyId} doesn't exist!`,
      });
      return;
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  if (foundReply.likes.includes(ObjectId(req.userId))) {
    foundReply.likes = foundReply.likes.filter(
      (user) => user.valueOf() !== req.userId
    );
    let savedReply;
    try {
      savedReply = await foundReply.save();
    } catch (err) {
      return res.status(500).send({ error: err });
    }
    let countLikes = savedReply.likes.length;
    return res.status(200).send({
      count: countLikes,
      success: "Reply successfully unliked!",
    });
  } else if (foundReply.dislikes.includes(ObjectId(req.userId))) {
    return res
      .status(404)
      .send({ error: "Cannot like! Reply already disliked by user!" });
  } else {
    foundReply.likes.push(ObjectId(req.userId));

    let savedReply;
    try {
      savedReply = await foundReply.save();
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    let countLikes = savedReply.likes.length;

    return res.status(200).send({
      count: countLikes,
      success: "Reply successfully liked!",
    });
  }
};

/**
 * @function dislikeReply
 * Dislike and un-dislike a reply controller
 *
 * @param {string} req.params.replyId The id of the annotation
 * @param {string} req.userId The id of the user. Only author of the annotation can edit
 */
export const dislikeReply = async (req, res) => {
  const replyId = req.params.replyId;

  let foundReply;
  try {
    foundReply = await Reply.findOne({ _id: ObjectId(replyId) });
    if (!foundReply) {
      return res.status(404).send({
        error: `Reply with id ${replyId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  if (foundReply.dislikes.includes(ObjectId(req.userId))) {
    foundReply.dislikes = foundReply.dislikes.filter(
      (user) => user.valueOf() !== req.userId
    );
    let savedReply;
    try {
      savedReply = await foundReply.save();
    } catch (err) {
      return res.status(500).send({ error: err });
    }
    let countDislikes = savedReply.dislikes.length;
    return res.status(200).send({
      count: countDislikes,
      success: "Reply successfully un-disliked!",
    });
  } else if (foundReply.likes.includes(ObjectId(req.userId))) {
    return res
      .status(404)
      .send({ error: "Cannot dislike! Reply already liked by user!" });
  } else {
    foundReply.dislikes.push(ObjectId(req.userId));
    let savedReply;
    try {
      savedReply = await foundReply.save();
    } catch (err) {
      return res.status(500).send({ error: err });
    }
    let countDislikes = savedReply.dislikes.length;

    return res.status(200).send({
      count: countDislikes,
      success: "Reply successfully disliked!",
    });
  }
};
