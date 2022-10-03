const statementFactory = require('../statementsFactory/topic.statementsFactory');
const lrs = require('../lrs/lrs');
const controller = require('../controller.xAPILogger');


export const newTopic = (req, res) => {
    const statement = statementFactory
    .getTopicCreationStatement(
        req.locals.user
        , req.locals.topic);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.send(req.locals.response);
}

export const deleteTopic = (req, res) => {
    const statement = statementFactory
    .getTopicDeletionStatement(
        req.locals.user
        , req.locals.topic);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.send(req.locals.response);
}

export const getTopic = (req, res) => {
    const statement = statementFactory
    .getTopicAccessStatement(
        req.locals.user
        , req.locals.topic);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.status(200).send(req.locals.response);
}

// export const editTopic = (req, res) => {
//     const statement = statementFactory
//     .getCourseEditStatement(
//         req.locals.user
//         , req.locals.newCourse
//         , req.locals.oldCourse);
//     lrs.sendStatementToLrs(statement);
//     controller.saveStatementToMongo(statement);
//     res.status(200).send(req.locals.response);
// }