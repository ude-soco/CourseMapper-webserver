const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Annotation = db.annotation;
const Reply = db.reply;
const Tag = db.tag;
const User = db.user;
const Notification = db.notification;
const Course = db.course;
const Topic = db.topic;

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
  return res.status(200).send({ replies: foundReplies });
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
export const newReply = async (req, res) => {
  const courseId = req.params.courseId;
  const annotationId = req.params.annotationId;
  const replyContent = req.body.content;
  const userId = req.userId;

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
    foundUser = await User.findOne({ _id: userId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let authorName = `${foundUser.firstname} ${foundUser.lastname}`;

  let reply = new Reply({
    content: replyContent,
    author: {
      userId: userId,
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
      return res.status(500).send({ error: err });
    }
  }

  let foundCourse;
  try {
    foundCourse = await Course.findOne({ _id: ObjectId(courseId) });
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundTopic;
  try {
    foundTopic = await Topic.findOne({
      _id: ObjectId(foundAnnotation.topicId),
    });
    if (!foundTopic) {
      return res.status(404).send({
        error: `Topic with id ${foundAnnotation.topicId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  // lists of userId that subscribed to this course
  let subscribedUserLists = [];
  foundCourse.users.forEach((user) => {
    subscribedUserLists.push(user.userId.toString());
  });
  let foundUserLists = [];
  let temp;

  for (let i = 0; i < subscribedUserLists.length; i++) {
    temp = await User.findById(subscribedUserLists[i]);
    foundUserLists.push(temp);
  }
  let userShortname = (
    foundUser.firstname.charAt(0) + foundUser.lastname.charAt(0)
  ).toUpperCase();
  let notification = new Notification({
    userName: foundUser.username,
    userShortname: userShortname,
    userId: userId,
    courseId: foundAnnotation.courseId,
    type: "mentionedandreplied",
    action: "has created new",
    actionObject: "comment",
    extraMessage: `in ${foundCourse.name} in ${foundTopic.name}`,
    name: "",
  });
  let notificationSaved;

  try {
    notificationSaved = await notification.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  for (let i = 0; i < foundUserLists.length; i++) {
    // do not push to the user who made trigger this action
    if (foundUserLists[i]._id == userId) {
    } else if (foundUserLists[i].deactivatedUserLists.includes(userId)) {
    } else if (foundUserLists[i].isReplyTurnOff) {
    } else {
      let subscribedUser;
      try {
        subscribedUser = await User.findById(foundUserLists[i]._id);
        if (!subscribedUser) {
          return res.status(404).send({
            error: `User not found!`,
          });
        }
      } catch (err) {
        return res.status(500).send({ error: err });
      }
      subscribedUser.notificationLists.push({
        notificationId: notificationSaved._id,
      });

      try {
        await subscribedUser.save();
      } catch (err) {
        return res.status(500).send({ error: err });
      }
    }
  }
  return res.status(200).send({
    id: newReply._id,
    success: `Reply added!`,
    notification: `new notification ${notification} has been added`,
  });
};

/**
 * @function deleteReply
 * Delete a reply from an annotation controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.replyId The id of the reply
 * @param {string} req.userId The id of the user. Only author/admin can delete
 */
export const deleteReply = async (req, res) => {
  const courseId = req.params.courseId;
  const replyId = req.params.replyId;
  const userId = req.userId;
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

  let foundCourse;
  try {
    foundCourse = await Course.findOne({ _id: courseId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  let foundUser;
  try {
    foundUser = await User.findOne({ _id: userId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  // lists of userId that subscribed to this course
  let subscribedUserLists = [];
  foundCourse.users.forEach((user) => {
    subscribedUserLists.push(user.userId.toString());
  });
  let foundUserLists = [];
  let temp;

  for (let i = 0; i < subscribedUserLists.length; i++) {
    temp = await User.findById(subscribedUserLists[i]);
    foundUserLists.push(temp);
  }
  let userShortname = (
    foundUser.firstname.charAt(0) + foundUser.lastname.charAt(0)
  ).toUpperCase();
  let notification = new Notification({
    userName: foundUser.username,
    userShortname: userShortname,
    userId: userId,
    courseId: courseId,
    type: "mentionedandreplied",
    action: "has deleted",
    actionObject: "comment",
    extraMessage: `in ${foundCourse.name} `,
    name: "",
  });
  let notificationSaved;

  try {
    notificationSaved = await notification.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  for (let i = 0; i < foundUserLists.length; i++) {
    // do not push to the user who made trigger this action
    if (foundUserLists[i]._id == userId) {
    } else if (foundUserLists[i].deactivatedUserLists.includes(userId)) {
    } else if (foundUserLists[i].isReplyTurnOff) {
    } else {
      let subscribedUser;
      try {
        subscribedUser = await User.findById(foundUserLists[i]._id);
        if (!subscribedUser) {
          return res.status(404).send({
            error: `User not found!`,
          });
        }
      } catch (err) {
        return res.status(500).send({ error: err });
      }
      subscribedUser.notificationLists.push({
        notificationId: notificationSaved._id,
      });

      try {
        await subscribedUser.save();
      } catch (err) {
        return res.status(500).send({ error: err });
      }
    }
  }

  return res.status(200).send({ success: "Reply successfully deleted" });
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
export const editReply = async (req, res) => {
  const courseId = req.params.courseId;
  const replyId = req.params.replyId;
  const replyContent = req.body.content;
  const userId = req.userId;

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
      return res.status(500).send({ error: err });
    }
  }

  let foundCourse;
  try {
    foundCourse = await Course.findOne({ _id: courseId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  // lists of userId that subscribed to this course
  let subscribedUserLists = [];
  foundCourse.users.forEach((user) => {
    subscribedUserLists.push(user.userId.toString());
  });
  let foundUserLists = [];
  let temp;

  for (let i = 0; i < subscribedUserLists.length; i++) {
    temp = await User.findById(subscribedUserLists[i]);
    foundUserLists.push(temp);
  }
  let foundUser;
  try {
    foundUser = await User.findOne({ _id: userId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  let userShortname = (
    foundUser.firstname.charAt(0) + foundUser.lastname.charAt(0)
  ).toUpperCase();
  let notification = new Notification({
    userName: foundUser.username,
    userShortname: userShortname,
    userId: userId,
    courseId: courseId,
    type: "mentionedandreplied",
    action: "has edited",
    actionObject: "comment",
    extraMessage: `in ${foundCourse.name}`,
    name: replyContent,
  });
  let notificationSaved;

  try {
    notificationSaved = await notification.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  for (let i = 0; i < foundUserLists.length; i++) {
    // do not push to the user who made trigger this action
    if (foundUserLists[i]._id == userId) {
    } else if (foundUserLists[i].deactivatedUserLists.includes(userId)) {
    } else if (foundUserLists[i].isReplyTurnOff) {
    } else {
      let subscribedUser;
      try {
        subscribedUser = await User.findById(foundUserLists[i]._id);
        if (!subscribedUser) {
          return res.status(404).send({
            error: `User not found!`,
          });
        }
      } catch (err) {
        return res.status(500).send({ error: err });
      }
      subscribedUser.notificationLists.push({
        notificationId: notificationSaved._id,
      });

      try {
        await subscribedUser.save();
      } catch (err) {
        return res.status(500).send({ error: err });
      }
    }
  }

  return res.status(200).send({ success: "Reply successfully updated" });
};

/**
 * @function likeReply
 * Like and unlike an annotation controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.replyId The id of the reply
 * @param {string} req.userId The id of the user
 */
export const likeReply = async (req, res) => {
  const courseId = req.params.courseId;
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
    if (foundReply.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Reply doesn't belong to course with id ${courseId}!`,
      });
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

    let foundUser;
    try {
      foundUser = await User.findOne({ _id: userId });
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    let foundCourse;
    try {
      foundCourse = await Course.findOne({
        _id: ObjectId(foundAnnotation.courseId),
      });
      if (!foundCourse) {
        return res.status(404).send({
          error: `Course with id ${courseId} doesn't exist!`,
        });
      }
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    // lists of userId that subscribed to this course
    let subscribedUserLists = [];
    foundCourse.users.forEach((user) => {
      subscribedUserLists.push(user.userId.toString());
    });
    let foundUserLists = [];
    let temp;

    for (let i = 0; i < subscribedUserLists.length; i++) {
      temp = await User.findById(subscribedUserLists[i]);
      foundUserLists.push(temp);
    }

    let userShortname = (
      foundUser.firstname.charAt(0) + foundUser.lastname.charAt(0)
    ).toUpperCase();
    let notification = new Notification({
      userName: foundUser.username,
      userShortname: userShortname,
      userId: userId,
      courseId: foundAnnotation.courseId,
      type: "mentionedandreplied",
      action: "has liked",
      actionObject: "comment",
      extraMessage: `in ${foundCourse.name} in ${foundTopic.name}`,
      name: "",
    });
    let notificationSaved;

    try {
      notificationSaved = await notification.save();
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    for (let i = 0; i < foundUserLists.length; i++) {
      // do not push to the user who made trigger this action
      if (foundUserLists[i]._id == userId) {
      } else if (foundUserLists[i].deactivatedUserLists.includes(userId)) {
      } else if (foundUserLists[i].isCourseTurnOff) {
      } else {
        let subscribedUser;
        try {
          subscribedUser = await User.findById(foundUserLists[i]._id);
          if (!subscribedUser) {
            return res.status(404).send({
              error: `User not found!`,
            });
          }
        } catch (err) {
          return res.status(500).send({ error: err });
        }
        subscribedUser.notificationLists.push({
          notificationId: notificationSaved._id,
        });

        try {
          await subscribedUser.save();
        } catch (err) {
          return res.status(500).send({ error: err });
        }
      }
    }
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
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.replyId The id of the reply
 * @param {string} req.userId The id of the user. Only author of the annotation can edit
 */
export const dislikeReply = async (req, res) => {
  const courseId = req.params.courseId;
  const replyId = req.params.replyId;
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

    let foundUser;
    try {
      foundUser = await User.findOne({ _id: userId });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
    let foundCourse;
    try {
      foundCourse = await Course.findOne({
        _id: ObjectId(foundAnnotation.courseId),
      });
      if (!foundCourse) {
        return res.status(404).send({
          error: `Course with id ${foundAnnotation.courseId} doesn't exist!`,
        });
      }
    } catch (err) {
      return res.status(500).send({ error: err });
    }
    // lists of userId that subscribed to this course
    let subscribedUserLists = [];
    foundCourse.users.forEach((user) => {
      subscribedUserLists.push(user.userId.toString());
    });
    let foundUserLists = [];
    let temp;

    for (let i = 0; i < subscribedUserLists.length; i++) {
      temp = await User.findById(subscribedUserLists[i]);
      foundUserLists.push(temp);
    }
    let userShortname = (
      foundUser.firstname.charAt(0) + foundUser.lastname.charAt(0)
    ).toUpperCase();
    let notification = new Notification({
      userName: foundUser.username,
      userShortname: userShortname,
      userId: userId,
      courseId: foundAnnotation.courseId,
      type: "mentionedandreplied",
      action: "has disliked",
      actionObject: "comment",
      extraMessage: `in ${foundCourse.name} in ${foundTopic.name}`,
      name: "",
    });
    let notificationSaved;

    try {
      notificationSaved = await notification.save();
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    for (let i = 0; i < foundUserLists.length; i++) {
      // do not push to the user who made trigger this action
      if (foundUserLists[i]._id == userId) {
      } else if (foundUserLists[i].deactivatedUserLists.includes(userId)) {
      } else if (foundUserLists[i].isCourseTurnOff) {
      } else {
        let subscribedUser;
        try {
          subscribedUser = await User.findById(foundUserLists[i]._id);
          if (!subscribedUser) {
            return res.status(404).send({
              error: `User not found!`,
            });
          }
        } catch (err) {
          return res.status(500).send({ error: err });
        }
        subscribedUser.notificationLists.push({
          notificationId: notificationSaved._id,
        });

        try {
          await subscribedUser.save();
        } catch (err) {
          return res.status(500).send({ error: err });
        }
      }
    }
    return res.status(200).send({
      count: countDislikes,
      success: "Reply successfully disliked!",
    });
  }
};
