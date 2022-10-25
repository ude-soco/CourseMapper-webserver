const statementFactory = require("../statementsFactory/annotation.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");

export const newAnnotation = (req, res) => {
  let statement;
  if (!req.locals.annotation.tool){
    statement = statementFactory.getCommentCreationStatement(
      req.locals.user,
      req.locals.annotation,
      req.locals.material
    );
  } else {
    statement = statementFactory.getAnnotationCreationStatement(
      req.locals.user,
      req.locals.annotation,
      req.locals.material
    );
  }
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const deleteAnnotation = (req, res) => {
  let statement;
  if (!req.locals.annotation.tool){
    statement = statementFactory.getCommentDeletionStatement(
      req.locals.user,
      req.locals.annotation
    );
  } else {
    statement = statementFactory.getAnnotaionDeletionStatement(
      req.locals.user,
      req.locals.annotation
    );
  }
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const likeAnnotation = (req, res) => {
  let statement;
  if (req.locals.like) {
    if (!req.locals.annotation.tool) {
      statement = statementFactory.getCommentLikeStatement(
        req.locals.user,
        req.locals.annotation
      );
    } else {
      statement = statementFactory.getAnnotationLikeStatement(
        req.locals.user,
        req.locals.annotation
      );
    }
  } else {
    if (!req.locals.annotation.tool){
      statement = statementFactory.getCommentUnlikeStatement(
        req.locals.user,
        req.locals.annotation
      );
    } else {
      statement = statementFactory.getAnnotationUnlikeStatement(
        req.locals.user,
        req.locals.annotation
      );
    }
  }
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const dislikeAnnotation = (req, res) => {
  let statement;
  if (req.locals.dislike) {
    if (!req.locals.annotation.tool) {
      statement = statementFactory.getCommentDislikeStatement(
        req.locals.user,
        req.locals.annotation
      );
    } else {
      statement = statementFactory.getAnnotationDislikeStatement(
        req.locals.user,
        req.locals.annotation
      );
    }
  } else {
    if (!req.locals.annotation.tool) {
      statement = statementFactory.getCommentUndislikeStatement(
        req.locals.user,
        req.locals.annotation
      );
    } else {
      statement = statementFactory.getAnnotationUndislikeStatement(
        req.locals.user,
        req.locals.annotation
      );
    }
  }
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const editAnnotation = (req, res) => {
  const statement = statementFactory.getAnnotationEditStatement(
    req.locals.user,
    req.locals.newAnnotation,
    req.locals.oldAnnotation
  );
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};