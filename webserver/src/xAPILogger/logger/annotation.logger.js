const statementFactory = require("../statementsFactory/annotation.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");
const ORIGIN = process.env.ORIGIN;

export const newAnnotation = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  let statement;
  if (!req.locals.annotation.tool){
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
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const deleteAnnotation = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  let statement;
  if (!req.locals.annotation.tool){
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
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const likeAnnotation = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
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
    if (!req.locals.annotation.tool){
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
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const dislikeAnnotation = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
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
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const editAnnotation = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
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
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};