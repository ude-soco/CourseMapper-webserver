const statementFactory = require("../statementsFactory/reply.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");
const ORIGIN = process.env.ORIGIN;

export const newReply = async (req, res) => {
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
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.status(200).send(req.locals.response);
};

export const deleteReply = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getReplyDeletionStatement(
    req.locals.user,
    req.locals.reply,
    origin
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.status(200).send(req.locals.response);
};

export const likeReply = async (req, res) => {
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
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.status(200).send(req.locals.response);
};

export const dislikeReply = async (req, res) => {
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
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.status(200).send(req.locals.response);
};

export const editReply = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  let statement = statementFactory.getReplyEditStatement(
    req.locals.user,
    req.locals.oldReply,
    req.locals.newReply,
    origin
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.status(200).send(req.locals.response);
};
