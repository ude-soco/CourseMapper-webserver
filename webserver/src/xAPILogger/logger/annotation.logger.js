const statementFactory = require("../statementsFactory/annotation.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");
const ORIGIN = process.env.ORIGIN;
const notifications = require("../../middlewares/Notifications/notifications");

export const newAnnotation = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  let statement;
  if (!req.locals.annotation.tool) {
    statement = statementFactory.getCommentCreationStatement(
      req.locals.user,
      req.locals.annotation,
      req.locals.material,
      origin
    );
  } else {
    statement = statementFactory.getAnnotationCreationStatement(
      req.locals.user,
      req.locals.annotation,
      req.locals.material,
      origin
    );
  }
  const notificationInfo = notifications.generateNotificationInfo(req);
  const sent = await lrs.sendStatementToLrs(statement);
  try {
    const activity = await controller.saveStatementToMongo(
      statement,
      sent,
      notificationInfo
    );
    //Add activity to req.locals so it can be used in the notification
    req.locals.activity = activity;
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
  next();
};

export const deleteAnnotation = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  let statement;
  if (!req.locals.annotation.tool) {
    statement = statementFactory.getCommentDeletionStatement(
      req.locals.user,
      req.locals.annotation,
      origin
    );
  } else {
    statement = statementFactory.getAnnotaionDeletionStatement(
      req.locals.user,
      req.locals.annotation,
      origin
    );
  }
  const notificationInfo = notifications.generateNotificationInfo(req);
  const sent = await lrs.sendStatementToLrs(statement);
  try {
    const activity = await controller.saveStatementToMongo(
      statement,
      sent,
      notificationInfo
    );
    //Add activity to req.locals so it can be used in the notification
    req.locals.activity = activity;
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
  next();
};

export const likeAnnotation = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  let statement;
  if (req.locals.like) {
    if (!req.locals.annotation.tool) {
      statement = statementFactory.getCommentLikeStatement(
        req.locals.user,
        req.locals.annotation,
        origin
      );
    } else {
      statement = statementFactory.getAnnotationLikeStatement(
        req.locals.user,
        req.locals.annotation,
        origin
      );
    }
  } else {
    if (!req.locals.annotation.tool) {
      statement = statementFactory.getCommentUnlikeStatement(
        req.locals.user,
        req.locals.annotation,
        origin
      );
    } else {
      statement = statementFactory.getAnnotationUnlikeStatement(
        req.locals.user,
        req.locals.annotation,
        origin
      );
    }
  }
  const notificationInfo = notifications.generateNotificationInfo(req);
  const sent = await lrs.sendStatementToLrs(statement);
  try {
    const activity = await controller.saveStatementToMongo(
      statement,
      sent,
      notificationInfo
    );
    //Add activity to req.locals so it can be used in the notification
    req.locals.activity = activity;
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
  next();
};

export const dislikeAnnotation = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  let statement;
  if (req.locals.dislike) {
    if (!req.locals.annotation.tool) {
      statement = statementFactory.getCommentDislikeStatement(
        req.locals.user,
        req.locals.annotation,
        origin
      );
    } else {
      statement = statementFactory.getAnnotationDislikeStatement(
        req.locals.user,
        req.locals.annotation,
        origin
      );
    }
  } else {
    if (!req.locals.annotation.tool) {
      statement = statementFactory.getCommentUndislikeStatement(
        req.locals.user,
        req.locals.annotation,
        origin
      );
    } else {
      statement = statementFactory.getAnnotationUndislikeStatement(
        req.locals.user,
        req.locals.annotation,
        origin
      );
    }
  }
  const notificationInfo = notifications.generateNotificationInfo(req);
  const sent = await lrs.sendStatementToLrs(statement);
  try {
    const activity = await controller.saveStatementToMongo(
      statement,
      sent,
      notificationInfo
    );
    //Add activity to req.locals so it can be used in the notification
    req.locals.activity = activity;
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
  next();
};

export const editAnnotation = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  let statement;
  if (!req.locals.oldAnnotation.tool) {
    statement = statementFactory.getCommentEditStatement(
      req.locals.user,
      req.locals.newAnnotation,
      req.locals.oldAnnotation,
      origin
    );
  } else {
    statement = statementFactory.getAnnotationEditStatement(
      req.locals.user,
      req.locals.newAnnotation,
      req.locals.oldAnnotation,
      origin
    );
  }
  const notificationInfo = notifications.generateNotificationInfo(req);
  const sent = await lrs.sendStatementToLrs(statement);
  try {
    const activity = await controller.saveStatementToMongo(
      statement,
      sent,
      notificationInfo
    );
    //Add activity to req.locals so it can be used in the notification
    req.locals.activity = activity;
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
  next();
};

export const newMention = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  req.locals.category = "mentionedandreplied";
  const statement = statementFactory.getNewMentionCreationStatement(
    req.locals.user,
    req.locals.annotation,
    origin
  );
  const notificationInfo = notifications.generateNotificationInfo(req);
  const sent = await lrs.sendStatementToLrs(statement);
  try {
    const activity = await controller.saveStatementToMongo(
      statement,
      sent,
      notificationInfo
    );
    //Add activity to req.locals so it can be used in the notification
    req.locals.activity = activity;
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
  next();
};
