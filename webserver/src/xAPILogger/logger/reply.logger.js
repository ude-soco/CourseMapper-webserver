const statementFactory = require("../statementsFactory/reply.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");
const ORIGIN = process.env.ORIGIN;
const notifications = require("../../middlewares/Notifications/notifications");

export const newReply = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  let statement;
  if (!req.locals.annotation.tool) {
    statement = statementFactory.getReplyToCommentCreationStatement(
      req.locals.user,
      req.locals.annotation,
      req.locals.reply,
      origin
    );
  } else {
    statement = statementFactory.getReplyToAnnotationCreationStatement(
      req.locals.user,
      req.locals.annotation,
      req.locals.reply,
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

export const deleteReply = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const statement = statementFactory.getReplyDeletionStatement(
    req.locals.user,
    req.locals.reply,
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

export const likeReply = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  let statement;
  if (req.locals.like) {
    statement = statementFactory.getReplyLikeStatement(
      req.locals.user,
      req.locals.reply,
      origin
    );
  } else {
    statement = statementFactory.getReplyUnlikeStatement(
      req.locals.user,
      req.locals.reply,
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

export const dislikeReply = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  let statement;
  if (req.locals.dislike) {
    statement = statementFactory.getReplyDislikeStatement(
      req.locals.user,
      req.locals.reply,
      origin
    );
  } else {
    statement = statementFactory.getReplyUndislikeStatement(
      req.locals.user,
      req.locals.reply,
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

export const editReply = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  let statement = statementFactory.getReplyEditStatement(
    req.locals.user,
    req.locals.oldReply,
    req.locals.newReply,
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
