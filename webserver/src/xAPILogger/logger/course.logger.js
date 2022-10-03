const statementFactory = require('../statementFactory/course.StatementsFactory');
const lrs = require('../lrs/lrs');
const controller = require('../controller.xAPILogger');


export const logCourseCreation = (req, res) => {
    const statement = statementFactory
    .getCourseCreationStatement(
        req.locals.user
        , req.locals.response.courseSaved);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.send(req.locals.response);
}

export const logCourseDeletion = (req, res) => {
    const statement = statementFactory
    .getCourseDeletionStatement(
        req.locals.user
        , req.locals.course);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.send(req.locals.response);
}

export const logCourseAccess = (req, res) => {
    const statement = statementFactory
    .getCourseAccessStatement(
        req.locals.user
        , req.locals.course);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.status(200).send(req.locals.response);
}

export const logCourseEnroll = (req, res) => {
    const statement = statementFactory
    .getCourseEnrollmentStatement(
        req.locals.user
        , req.locals.course);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.status(200).send(req.locals.response);
}

export const logCourseWithdraw = (req, res) => {
    const statement = statementFactory
    .getCourseWithdrawStatement(
        req.locals.user
        , req.locals.course);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.status(200).send(req.locals.response);
}

export const logCourseEdit = (req, res) => {
    const statement = statementFactory
    .getCourseEditStatement(
        req.locals.user
        , req.locals.newCourse
        , req.locals.oldCourse);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.status(200).send(req.locals.response);
}