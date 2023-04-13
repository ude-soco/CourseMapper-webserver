const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const socketio = require("../socketio");
const Annotation = db.annotation;
const Reply = db.reply;
const Tag = db.tag;
const User = db.user;
const Role = db.role

/**
 * @function getReplies
 * Add all replies to an annotation controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.annotationId The id of the annotation
 */
export const getReplies = async (req, res) => {
  const courseId = req.params.courseId;
  const annotationId = req.params.annotationId;
  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findById({
      _id: ObjectId(annotationId),
    });
    if (!foundAnnotation) {
      return res.status(404).send({
        error: `Annotation with id ${annotationId} doesn't exist!`,
      });
    }
    if (foundAnnotation.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Annotation doesn't belong to course with id ${courseId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  let foundReplies;
  try {
    foundReplies = await Reply.find({ annotationId: ObjectId(annotationId) });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send(foundReplies);
};

/**
 * @function newReply
 * Add a new reply to an annotation controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.annotationId The id of the annotation
 * @param {string} req.body.content The content of the reply
 * @param {string} req.userId The author of the reply. Anyone can create a reply
 */
export const newReply = async (req, res, next) => {
  const courseId = req.params.courseId;
  const annotationId = req.params.annotationId;
  const replyContent = req.body.content;
  const userId = req.userId;

  let user
  try {
    user = await User.findOne({_id: userId});

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

  } catch (error) {
    return res.status(500).send({ error: error });
  }

  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findOne({ _id: annotationId });
    if (!foundAnnotation) {
      return res.status(404).send({
        error: `Annotation with id ${annotationId} doesn't exist!`,
      });
    }
    if (foundAnnotation.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Annotation doesn't belong to course with id ${courseId}!`,
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
  let foundCourse = foundUser.courses.find((course) => course.courseId.toString() == courseId)
  let foundRole = await Role.findById({ _id: ObjectId(foundCourse.role) });

  let reply = new Reply({
    content: replyContent,
    author: {
      userId: req.userId,
      name: authorName,
      role: foundRole
    },
    courseId: foundAnnotation.courseId,
    topicId: foundAnnotation.topicId,
    channelId: foundAnnotation.channelId,
    materialId: foundAnnotation.materialId,
    annotationId: foundAnnotation._id,
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

  let foundTags = replyContent.split(" ").filter((v) => v.startsWith("#"));

  let foundTagsSchema = [];
  if (foundTags.length !== 0) {
    foundTags.forEach((tag) => {
      let newTag = new Tag({
        name: tag,
        courseId: foundAnnotation.courseId,
        topicId: foundAnnotation.topicId,
        channelId: foundAnnotation.channelId,
        materialId: foundAnnotation.materialId,
        annotationId: foundAnnotation._id,
        replyId: newReply._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      foundTagsSchema.push(newTag);
    });

    try {
      await Tag.insertMany(foundTagsSchema);
    } catch (err) {
      return res.status(500).send({error: err});
    }
  }

  req.locals = {
    response:{ id: newReply._id, success: `Reply added!` },
    user: user,
    annotation:foundAnnotation,
    reply:newReply
  }

  socketio.getIO().emit(annotationId, {
    eventType: 'replyCreated',
    annotation: foundAnnotation,
    reply: newReply
  });

  return next();
};

/**
 * @function deleteReply
 * Delete a reply from an annotation controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.replyId The id of the reply
 * @param {string} req.userId The id of the user. Only author/admin can delete
 */
export const deleteReply = async (req, res, next) => {
  const courseId = req.params.courseId;
  const replyId = req.params.replyId;
  const userId = req.userId;

  let user
  try {
    user = await User.findOne({_id: userId});

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

  } catch (error) {
    return res.status(500).send({ error: error });
  }

  let foundReply;
  try {
    foundReply = await Reply.findOne({ _id: ObjectId(replyId) });
    if (!foundReply) {
      return res.status(404).send({
        error: `Reply with id ${replyId} doesn't exist!`,
      });
    }
    if (foundReply.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Reply doesn't belong to course with id ${courseId}!`,
      });
    }
    if (
      req.userId !== foundReply.author.userId.valueOf() &&
      !req.isAdmin &&
      !req.isModerator
    ) {
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
  foundAnnotation.replies = foundAnnotation.replies.filter(
    (reply) => reply.valueOf() !== replyId
  );
  try {
    await foundAnnotation.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  req.locals = {
    response: { success: "Reply successfully deleted" },
    user: user,
    reply: foundReply
  }
  socketio.getIO().emit(foundAnnotation._id, {
    eventType: 'replyDeleted',
    annotation: foundAnnotation,
    reply: foundReply
  });
  return next();
};

/**
 * @function editReply
 * Update a reply controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.replyId The id of the reply
 * @param {string} req.body.content The content of the reply
 * @param {string} req.userId The id of the user. Only author of the reply can edit
 */
export const editReply = async (req, res, next) => {
  const courseId = req.params.courseId;
  const replyId = req.params.replyId;
  const replyContent = req.body.content;
  const userId = req.userId;

  let user
  try {
    user = await User.findOne({_id: userId});

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

  } catch (error) {
    return res.status(500).send({ error: error });
  }

  let foundReply;
  try {
    foundReply = await Reply.findOne({ _id: ObjectId(replyId) });
    if (!foundReply) {
      return res.status(404).send({
        error: `Reply with id ${req.params.replyId} doesn't exist!`,
      });
    }
    if (foundReply.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Reply doesn't belong to course with id ${courseId}!`,
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

  req.locals = {
    oldReply: JSON.parse(JSON.stringify(foundReply))
  }

  foundReply.content = replyContent;
  foundReply.updatedAt = Date.now();

  try {
    await foundReply.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  try {
    await Tag.deleteMany({ replyId: replyId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundTags = replyContent.split(" ").filter((v) => v.startsWith("#"));

  let foundTagsSchema = [];
  if (foundTags.length !== 0) {
    foundTags.forEach((tag) => {
      let newTag = new Tag({
        name: tag,
        courseId: foundReply.courseId,
        topicId: foundReply.topicId,
        channelId: foundReply.channelId,
        materialId: foundReply.materialId,
        annotationId: foundReply.annotationId,
        replyId: foundReply._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      foundTagsSchema.push(newTag);
    });

    try {
      await Tag.insertMany(foundTagsSchema);
    } catch (err) {
      return res.status(500).send({error: err});
    }
  }

  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findOne({
      _id: foundReply.annotationId,
    });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  req.locals.response = { success: "Reply successfully updated" }
  req.locals.newReply = foundReply;
  req.locals.user = user;

  socketio.getIO().emit(foundAnnotation._id, {
    eventType: 'replyEdited',
    annotation: foundAnnotation,
    reply: foundReply
  });
  return next();
};

/**
 * @function likeReply
 * Like and unlike an annotation controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.replyId The id of the reply
 * @param {string} req.userId The id of the user
 */
export const likeReply = async (req, res, next) => {
  const courseId = req.params.courseId;
  const replyId = req.params.replyId;
  const userId = req.userId;

  let user
  try {
    user = await User.findOne({_id: userId});

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

  } catch (error) {
    return res.status(500).send({ error: error });
  }

  let foundReply;
  try {
    foundReply = await Reply.findOne({ _id: ObjectId(replyId) });
    if (!foundReply) {
      res.status(404).send({
        error: `Reply with id ${replyId} doesn't exist!`,
      });
      return;
    }
    if (foundReply.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Reply doesn't belong to course with id ${courseId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  req.locals = {
    reply: foundReply,
    user: user
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
    let countDislikes = savedReply.dislikes.length;

    req.locals.response = {
      count: countLikes,
      success: "Reply successfully unliked!",
    }
    req.locals.like = false;
    socketio.getIO().emit(replyId, {
      eventType: 'replyUnliked',
      likes: countLikes,
      dislikes: countDislikes,
      reply: savedReply
    });
    return next();

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
    let countDislikes = savedReply.dislikes.length;

    req.locals.response = {
      count: countLikes,
      success: "Reply successfully liked!",
    }
    req.locals.like = true;

    socketio.getIO().emit(replyId, {
      eventType: 'replyLiked',
      likes: countLikes,
      dislikes: countDislikes,
      reply: savedReply
    });
    return next();
  }
};

/**
 * @function dislikeReply
 * Dislike and un-dislike a reply controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.replyId The id of the reply
 * @param {string} req.userId The id of the user. Only author of the annotation can edit
 */
export const dislikeReply = async (req, res, next) => {
  const courseId = req.params.courseId;
  const replyId = req.params.replyId;
  const userId = req.userId;

  let user
  try {
    user = await User.findOne({_id: userId});

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

  } catch (error) {
    return res.status(500).send({ error: error });
  }

  let foundReply;
  try {
    foundReply = await Reply.findOne({ _id: ObjectId(replyId) });
    if (!foundReply) {
      return res.status(404).send({
        error: `Reply with id ${replyId} doesn't exist!`,
      });
    }
    if (foundReply.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Reply doesn't belong to course with id ${courseId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  req.locals = {
    user: user,
    reply: foundReply
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
    let countLikes = savedReply.likes.length;

    req.locals.response = {
      count: countDislikes,
      success: "Reply successfully un-disliked!",
    }
    req.locals.dislike = false;
    socketio.getIO().emit(replyId, {
      eventType: 'replyUndisliked',
      likes: countLikes,
      dislikes: countDislikes,
      reply: savedReply
    });
    return next();

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
    let countLikes = savedReply.likes.length;

    req.locals.response = {
      count: countDislikes,
      success: "Reply successfully disliked!",
    }
    req.locals.dislike = true;
    socketio.getIO().emit(replyId, {
      eventType: 'replyDisliked',
      likes: countLikes,
      dislikes: countDislikes,
      reply: savedReply
    });
    return next();
  }
};
