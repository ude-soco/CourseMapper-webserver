const statementFactory = require('../statementsFactory/annotation.statementsFactory');
const lrs = require('../lrs/lrs');
const controller = require('../controller.xAPILogger');


export const newAnnotation = (req, res) => {
    const statement = statementFactory
    .getAnnotationCreationStatement(
        req.locals.user
        , req.locals.annotation
        , req.locals.material);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.status(200).send(req.locals.response);
}


export const deleteAnnotation = (req, res) => {
    const statement = statementFactory
    .getAnnotaionDeletionStatement(
        req.locals.user
        , req.locals.annotation);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.status(200).send(req.locals.response);
}

export const likeAnnotation = (req, res) => {
    let statement; 
    if (req.locals.like) {
        statement = statementFactory
        .getAnnotationLikeStatement(
            req.locals.user
            , req.locals.annotation);
    } else {
        statement = statementFactory
        .getAnnotationUnlikeStatement(
            req.locals.user
            , req.locals.annotation);
    }
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.status(200).send(req.locals.response);
}

export const dislikeAnnotation = (req, res) => {
    let statement; 
    if (req.locals.dislike) {
        statement = statementFactory
        .getAnnotationDislikeStatement(
            req.locals.user
            , req.locals.annotation);
    } else {
        statement = statementFactory
        .getAnnotationUndislikeStatement(
            req.locals.user
            , req.locals.annotation);
    }
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.status(200).send(req.locals.response);
}