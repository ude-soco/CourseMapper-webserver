const annotationActivityGenerator = require("../generator/annotation-comment/annotation-generator");
const commentActivityGenerator = require("../generator/annotation-comment/comment-generator");
const lrs = require("../lrs/lrs");
const activityController = require("../controller/activity-controller");
const ORIGIN = process.env.ORIGIN;
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
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  let statement;
  if (req.locals.like) {
    if (req.locals.annotation.tool) {
      statement = annotationActivityGenerator.generateLikeAnnotationActivity(
        req.locals.user,
        req.locals.annotation,
        origin,
      );
    } else {
      statement = commentActivityGenerator.generateLikeCommentActivity(
        req.locals.user,
        req.locals.annotation,
        origin,
      );
    }
  } else {
    if (req.locals.annotation.tool) {
      statement = annotationActivityGenerator.getAnnotationUnlikeStatement(
        req.locals.user,
        req.locals.annotation,
        origin,
      );
    } else {
      statement = commentActivityGenerator.generateUnlikeCommentActivity(
        req.locals.user,
        req.locals.annotation,
        origin,
      );
    }
  }
  const sent = await lrs.sendStatementToLrs(statement);
  try {
    req.locals.activity = await activityController.createActivityOld(
      statement,
      sent,
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const dislikeAnnotationLogger = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  let statement;
  if (req.locals.dislike) {
    if (req.locals.annotation.tool) {
      statement = annotationActivityGenerator.generateDislikeAnnotationActivity(
        req.locals.user,
        req.locals.annotation,
        origin,
      );
    } else {
      statement = commentActivityGenerator.generateDislikeCommentActivity(
        req.locals.user,
        req.locals.annotation,
        origin,
      );
    }
  } else {
    if (req.locals.annotation.tool) {
      statement =
        annotationActivityGenerator.generateUndislikeAnnotationActivity(
          req.locals.user,
          req.locals.annotation,
          origin,
        );
    } else {
      statement = commentActivityGenerator.generateUndislikeCommentActivity(
        req.locals.user,
        req.locals.annotation,
        origin,
      );
    }
  }
  const sent = await lrs.sendStatementToLrs(statement);
  try {
    req.locals.activity = await activityController.createActivityOld(
      statement,
      sent,
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};

export const editAnnotation = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  let statement;
  if (!req.locals.oldAnnotation.tool) {
    statement = commentActivityGenerator.generateEditCommentActivity(
      req.locals.user,
      req.locals.newAnnotation,
      req.locals.oldAnnotation,
      origin,
    );
  } else {
    statement = annotationActivityGenerator.generateEditAnnotationActivity(
      req.locals.user,
      req.locals.newAnnotation,
      req.locals.oldAnnotation,
      origin,
    );
  }
  const sent = await lrs.sendStatementToLrs(statement);
  try {
    //Add activity to req.locals so it can be used in the notification
    req.locals.activity = await activityController.createActivityOld(
      statement,
      sent,
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};

export const addMentionLogger = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  req.locals.category = "mentionedandreplied";
  const statement = annotationActivityGenerator.generateAddMentionStatement(
    req.locals.user,
    req.locals.annotation,
    origin,
  );
  const sent = await lrs.sendStatementToLrs(statement);
  try {
    //Add activity to req.locals so it can be used in the notification
    req.locals.activity = await activityController.createActivityOld(
      statement,
      sent,
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};
