const statementFactory = require('../statementsFactory/material.statementsFactory');
const lrs = require('../lrs/lrs');
const controller = require('../controller.xAPILogger');


export const newMaterial = (req, res) => {
    const statement = statementFactory
    .getMaterialUploadStatement(
        req.locals.user
        , req.locals.material);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.send(req.locals.response);
}

export const deleteMaterial = (req, res) => {
    const statement = statementFactory
    .getMaterialDeletionStatement(
        req.locals.user
        , req.locals.material);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.send(req.locals.response);
}

export const getMaterial = (req, res) => {
    const statement = statementFactory
    .getMaterialAccessStatement(
        req.locals.user
        , req.locals.material);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.status(200).send(req.locals.response);
}

// export const editMaterial = (req, res) => {
//     const statement = statementFactory
//     .getTopicEditStatement(
//         req.locals.user
//         , req.locals.newMaterial
//         , req.locals.oldMaterial);
//     lrs.sendStatementToLrs(statement);
//     controller.saveStatementToMongo(statement);
//     res.send(req.locals.response);
// }