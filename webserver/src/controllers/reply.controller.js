const db = require("../models");
const socketio = require("../socketio");
const Annotation = db.annotation;
const Reply = db.reply;
const Tag = db.tag;
const User = db.user;
const Role = db.role;
const Course = db.course;
const Material = db.material;

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
    foundAnnotation = await Annotation.findById(annotationId);
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
    return res.status(500).send({ error: "Error finding annotation" });
  }
  let foundReplies;
  try {
    foundReplies = await Reply.find({ annotationId: annotationId });
  } catch (err) {
    return res.status(500).send({ error: "Error finding reply" });
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
  const replyContent = req.body.reply.content;
  const mentionedUsers = req.body.mentionedUsers;
  const userId = req.userId;

  let course;
  try {
    course = await Course.findById(courseId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding course" });
  }

  let user;
  try {
    user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding user" });
  }

  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findById(annotationId);
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
    return res.status(500).send({ error: "Error finding annotation" });
  }

  let foundMaterial;
  try {
    foundMaterial = await Material.findById(foundAnnotation.materialId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding material" });
  }

  let foundUser;
  try {
    foundUser = await User.findById(req.userId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }

  let authorName = `${foundUser.firstname} ${foundUser.lastname}`;
  let foundCourse = foundUser.courses.find(
    (course) => course.courseId.toString() == courseId
  );
  let foundRole;
  try {
    foundRole = await Role.findById(foundCourse.role);
  } catch (err) {
    return res.status(500).send({ error: "Error finding role" });
  }
  let reply = new Reply({
    content: replyContent,
    author: {
      userId: req.userId,
      name: authorName,
      role: foundRole,
      username: foundUser.username,
    },
    mentionedUsers: mentionedUsers,
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
    return res.status(500).send({ error: "Error saving reply" });
  }
  foundAnnotation.replies.push(newReply._id);
  try {
    await foundAnnotation.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving annotation" });
  }
  let foundTags = replyContent
    .split(/\s+/) // Split on any whitespace (spaces, newlines, etc.)
    .filter((v) => /^#[A-Za-z0-9]+$/.test(v)); // Check if it matches the hashtag pattern

  let foundTagsSchema = [];
  if (foundTags.length !== 0) {
    // Ensure the tags are unique by converting to a Set and back to an array
    foundTags = [...new Set(foundTags)];

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
      return res.status(500).send({ error: "Error saving tags" });
    }
    req.locals = req.locals || {}; // Ensure req.locals is initialized
    req.locals.tags = foundTagsSchema; // Add tags to req.locals for logging
  }
  req.locals = {
    ...req.locals,
    response: { id: newReply._id, success: `Reply added!` },
    annotation: foundAnnotation,
    reply: newReply,
    user: user,
    category: "mentionedandreplied",
    course,
    materialType: foundMaterial.type,
    annotationId: foundAnnotation._id,
    isMentionedUsersPresent: mentionedUsers.length > 0,
    material: foundMaterial,
    isFollowingAnnotation: true,
    mentionedUsers: mentionedUsers,
  };
  socketio
    .getIO()
    .to("course:" + courseId)
    .emit(annotationId, {
      eventType: "replyCreated",
      annotation: foundAnnotation,
      reply: newReply,
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

  let course;
  try {
    course = await Course.findById(courseId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding course" });
  }

  let user;
  try {
    user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding user" });
  }

  let foundReply;
  try {
    foundReply = await Reply.findById(replyId);
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
    return res.status(500).send({ error: "Error finding reply" });
  }
  try {
    await foundReply.deleteOne({ _id: replyId });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting reply" });
  }
  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findById(foundReply.annotationId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding annotation" });
  }
  let foundMaterial;
  try {
    foundMaterial = await Material.findById(foundAnnotation.materialId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding material" });
  }
  foundAnnotation.replies = foundAnnotation.replies.filter(
    (reply) => reply.valueOf() !== replyId
  );
  try {
    await foundAnnotation.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving annotation" });
  }
  req.locals = {
    response: { success: "Reply successfully deleted" },
    user: user,
    category: "mentionedandreplied",
    course,
    reply: foundReply,
    materialType: foundMaterial.type,
    annotationId: foundAnnotation._id,
    annotation: foundAnnotation,
    isFollowingAnnotation: true,
    isDeletingReply: true,
  };
  socketio
    .getIO()
    .to("course:" + courseId)
    .emit(foundAnnotation._id, {
      eventType: "replyDeleted",
      annotation: foundAnnotation,
      reply: foundReply,
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

  let course;
  try {
    course = await Course.findById(courseId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding course" });
  }

  let user;
  try {
    user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding user" });
  }
  let foundReply;
  try {
    foundReply = await Reply.findById(replyId);
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
    return res.status(500).send({ error: "Error finding reply" });
  }
  req.locals = {
    oldReply: JSON.parse(JSON.stringify(foundReply)),
  };
  foundReply.content = replyContent;
  foundReply.updatedAt = Date.now();
  try {
    await foundReply.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving reply" });
  }
  try {
    await Tag.deleteMany({ replyId: replyId });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting tags" });
  }
  let foundTags = replyContent
    .split(/\s+/) // Split on any whitespace (spaces, newlines, etc.)
    .filter((v) => /^#[A-Za-z0-9]+$/.test(v)); // Check if it matches the hashtag pattern

  let foundTagsSchema = [];
  if (foundTags.length !== 0) {
    // Ensure the tags are unique by converting to a Set and back to an array
    foundTags = [...new Set(foundTags)];

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
      return res.status(500).send({ error: "Error saving tags" });
    }
  }
  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findById(foundReply.annotationId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding annotation" });
  }
  let foundMaterial;
  try {
    foundMaterial = await Material.findById(foundAnnotation.materialId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding material" });
  }
  req.locals.response = { success: "Reply successfully updated" };
  req.locals.newReply = foundReply;
  req.locals.reply = foundReply;
  req.locals.user = user;
  req.locals.category = "mentionedandreplied";
  req.locals.course = course;
  req.locals.annotationId = foundAnnotation._id;
  req.locals.materialType = foundMaterial.type;
  req.locals.annotation = foundAnnotation;
  req.locals.isFollowingAnnotation = true;
  socketio
    .getIO()
    .to("course:" + courseId)
    .emit(foundAnnotation._id, {
      eventType: "replyEdited",
      annotation: foundAnnotation,
      reply: foundReply,
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

  let course;
  try {
    course = await Course.findById(courseId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding course" });
  }
  let user;
  try {
    user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding user" });
  }

  let foundReply;
  try {
    foundReply = await Reply.findById(replyId);
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
    return res.status(500).send({ error: "Error finding reply" });
  }

  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findById(foundReply.annotationId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding annotation" });
  }
  let foundMaterial;
  try {
    foundMaterial = await Material.findById(foundAnnotation.materialId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding material" });
  }

  req.locals = {
    reply: foundReply,
    user: user,
    course: course,
    category: "mentionedandreplied",
    materialType: foundMaterial.type,
    annotationAuthorId: foundAnnotation.author.userId,
    replyAuthorId: foundReply.author.userId,
    annotation: foundAnnotation,
    materialId: foundMaterial._id,
  };

  if (foundReply.likes.includes(req.userId)) {
    foundReply.likes = foundReply.likes.filter(
      (user) => user.valueOf() !== req.userId
    );
    let savedReply;
    try {
      savedReply = await foundReply.save();
    } catch (err) {
      return res.status(500).send({ error: "Error saving reply" });
    }
    let countLikes = savedReply.likes.length;
    let countDislikes = savedReply.dislikes.length;

    req.locals.response = {
      count: countLikes,
      success: "Reply successfully unliked!",
    };
    req.locals.like = false;
    socketio
      .getIO()
      .to("course:" + courseId)
      .emit(replyId, {
        eventType: "replyUnliked",
        likes: countLikes,
        dislikes: countDislikes,
        reply: savedReply,
      });
    return next();
  } else if (foundReply.dislikes.includes(req.userId)) {
    return res
      .status(404)
      .send({ error: "Cannot like! Reply already disliked by user!" });
  } else {
    foundReply.likes.push(req.userId);
    let savedReply;
    try {
      savedReply = await foundReply.save();
    } catch (err) {
      return res.status(500).send({ error: "Error saving reply" });
    }

    let countLikes = savedReply.likes.length;
    let countDislikes = savedReply.dislikes.length;

    req.locals.response = {
      count: countLikes,
      success: "Reply successfully liked!",
    };
    req.locals.like = true;

    socketio
      .getIO()
      .to("course:" + courseId)
      .emit(replyId, {
        eventType: "replyLiked",
        likes: countLikes,
        dislikes: countDislikes,
        reply: savedReply,
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

  let course;
  try {
    course = await Course.findById(courseId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding course" });
  }

  let user;
  try {
    user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding user" });
  }

  let foundReply;
  try {
    foundReply = await Reply.findById(replyId);
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
    return res.status(500).send({ error: "Error finding reply" });
  }

  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findById(foundReply.annotationId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding annotation" });
  }
  let foundMaterial;
  try {
    foundMaterial = await Material.findById(foundAnnotation.materialId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding material" });
  }
  req.locals = {
    user: user,
    reply: foundReply,
    course: course,
    category: "mentionedandreplied",
    materialType: foundMaterial.type,
    annotationAuthorId: foundAnnotation.author.userId,
    replyAuthorId: foundReply.author.userId,
    annotation: foundAnnotation,
    materialId: foundMaterial._id,
  };
  if (foundReply.dislikes.includes(req.userId)) {
    foundReply.dislikes = foundReply.dislikes.filter(
      (user) => user.valueOf() !== req.userId
    );
    let savedReply;
    try {
      savedReply = await foundReply.save();
    } catch (err) {
      return res.status(500).send({ error: "Error saving reply" });
    }
    let countDislikes = savedReply.dislikes.length;
    let countLikes = savedReply.likes.length;

    req.locals.response = {
      count: countDislikes,
      success: "Reply successfully un-disliked!",
    };
    req.locals.dislike = false;
    socketio
      .getIO()
      .to("course:" + courseId)
      .emit(replyId, {
        eventType: "replyUndisliked",
        likes: countLikes,
        dislikes: countDislikes,
        reply: savedReply,
      });
    return next();
  } else if (foundReply.likes.includes(req.userId)) {
    return res
      .status(404)
      .send({ error: "Cannot dislike! Reply already liked by user!" });
  } else {
    foundReply.dislikes.push(req.userId);
    let savedReply;
    try {
      savedReply = await foundReply.save();
    } catch (err) {
      return res.status(500).send({ error: "Error saving reply" });
    }
    let countDislikes = savedReply.dislikes.length;
    let countLikes = savedReply.likes.length;

    req.locals.response = {
      count: countDislikes,
      success: "Reply successfully disliked!",
    };
    req.locals.dislike = true;
    socketio
      .getIO()
      .to("course:" + courseId)
      .emit(replyId, {
        eventType: "replyDisliked",
        likes: countLikes,
        dislikes: countDislikes,
        reply: savedReply,
      });
    return next();
  }
};
