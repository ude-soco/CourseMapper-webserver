const annotationActivityGenerator = require("../generator/annotation-comment/annotation-generator");
const commentActivityGenerator = require("../generator/annotation-comment/comment-generator");
const activityController = require("../controller/activity-controller");
const notifications = require("../../middlewares/Notifications/notifications");

export const createAnnotationLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      req.locals.annotation.tool
        ? annotationActivityGenerator.generateCreateAnnotationActivity(req)
        : commentActivityGenerator.generateCommentActivity(req),
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const deleteAnnotationLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      req.locals.annotation.tool
        ? annotationActivityGenerator.generateDeleteAnnotationActivity(req)
        : commentActivityGenerator.generateDeleteCommentActivity(req),
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const likeAnnotationLogger = async (req, res, next) => {
  const { like, annotation } = req.locals;
  const statement = like
    ? annotation.tool
      ? annotationActivityGenerator.generateLikeAnnotationActivity(req)
      : commentActivityGenerator.generateLikeCommentActivity(req)
    : annotation.tool
      ? annotationActivityGenerator.getAnnotationUnlikeStatement(req)
      : commentActivityGenerator.generateUnlikeCommentActivity(req);
  try {
    req.locals.activity = await activityController.createActivity(
      statement,
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const dislikeAnnotationLogger = async (req, res, next) => {
  const { dislike, annotation } = req.locals;
  const statement = dislike
    ? annotation.tool
      ? annotationActivityGenerator.generateDislikeAnnotationActivity(req)
      : commentActivityGenerator.generateDislikeCommentActivity(req)
    : annotation.tool
      ? annotationActivityGenerator.generateUndislikeAnnotationActivity(req)
      : commentActivityGenerator.generateUndislikeCommentActivity(req);
  try {
    req.locals.activity = await activityController.createActivity(
      statement,
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const editAnnotation = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      req.locals.oldAnnotation.tool
        ? annotationActivityGenerator.generateEditAnnotationActivity(req)
        : commentActivityGenerator.generateEditCommentActivity(req),
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

// TODO: Does it require to check whether someone mentioned in the annotation/comment?
export const addMentionLogger = async (req, res, next) => {
  req.locals.category = "mentionedandreplied";
  let mentioned = req.locals.isMentionedUsersPresent;
  if (mentioned > 0) {
    try {
      req.locals.activity = await activityController.createActivity(
        annotationActivityGenerator.generateAddMentionStatement(req),
        notifications.generateNotificationInfo(req),
      );
    } catch (err) {
      res.status(400).send({ error: "Error saving statement to mongo", err });
    }
  }
  next();
};
