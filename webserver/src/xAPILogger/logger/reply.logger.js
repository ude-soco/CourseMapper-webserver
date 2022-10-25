const statementFactory = require("../statementsFactory/reply.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");

export const newReply = (req, res) => {
  const statement = statementFactory.getReplyCreationStatement(
    req.locals.user,
    req.locals.annotation,
    req.locals.reply
  );
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const deleteReply = (req, res) => {
  const statement = statementFactory.getReplyDeletionStatement(
    req.locals.user,
    req.locals.reply
  );
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const likeReply = (req, res) => {
  let statement;
  if (req.locals.like) {
    statement = statementFactory.getReplyLikeStatement(
      req.locals.user,
      req.locals.reply
    );
  } else {
    statement = statementFactory.getReplyUnlikeStatement(
      req.locals.user,
      req.locals.reply
    );
  }
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const dislikeReply = (req, res) => {
  let statement;
  if (req.locals.dislike) {
    statement = statementFactory.getReplyDislikeStatement(
      req.locals.user,
      req.locals.reply
    );
  } else {
    statement = statementFactory.getReplyUndislikeStatement(
      req.locals.user,
      req.locals.reply
    );
  }
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const editReply = (req, res) => {
  let statement = statementFactory.getReplyEditStatement(
    req.locals.user,
    req.locals.oldReply,
    req.locals.newReply
  );
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};
