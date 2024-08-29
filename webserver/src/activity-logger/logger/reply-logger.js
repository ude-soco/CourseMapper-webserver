const replyActivityGenerator = require("../generator/reply-generator");
const activityController = require("../controller/activity-controller");
const notifications = require("../../middlewares/Notifications/notifications");

export const createReplyLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      req.locals.annotation.tool
        ? replyActivityGenerator.generateReplyToAnnotationActivity(req)
        : replyActivityGenerator.generateReplyToCommentActivity(req),
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const deleteReplyLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      replyActivityGenerator.generateDeleteReplyActivity(req),
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const likeReplyLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      req.locals.like
        ? replyActivityGenerator.generateLikeReplyActivity(req)
        : replyActivityGenerator.generateUnlikeReplyActivity(req),
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const dislikeReplyLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      req.locals.dislike
        ? replyActivityGenerator.generateDislikeReplyActivity(req)
        : replyActivityGenerator.generateUndislikeReplyActivity(req),
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const editReplyLogger = async (req, res, next) => {
  req.locals.category = "mentionedandreplied";
  try {
    req.locals.activity = await activityController.createActivity(
      replyActivityGenerator.generateEditReplyActivity(req),
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const newMentionLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      replyActivityGenerator.getNewMentionCreationStatement(req),
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
