const statementFactory = require("../statementsFactory/reply.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");
const ORIGIN = process.env.ORIGIN;
const SEND_STATEMENT_IN_REALTIME = (process.env.SEND_STATEMENT_IN_REALTIME === 'true');

export const newReply = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
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
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.status(200).send(req.locals.response);
};

export const deleteReply = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getReplyDeletionStatement(
    req.locals.user,
    req.locals.reply,
    origin
  );
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.status(200).send(req.locals.response);
};

export const likeReply = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
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
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.status(200).send(req.locals.response);
};

export const dislikeReply = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
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
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.status(200).send(req.locals.response);
};

export const editReply = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  let statement = statementFactory.getReplyEditStatement(
    req.locals.user,
    req.locals.oldReply,
    req.locals.newReply,
    origin
  );
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.status(200).send(req.locals.response);
};
