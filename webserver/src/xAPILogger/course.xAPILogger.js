const statementFactory = require('./statementsFactory');
const lrs = require('./lrs')



export const logCourseCreation = (req, res) => {
    const statement = statementFactory
    .getCourseCreationStatement(
        req.locals.user
        , req.locals.response.courseSaved);
    lrs.saveStatement(statement);
    res.send(req.locals.response);
}

export const logCourseDeletion = (req, res) => {
    const statement = statementFactory
    .getCourseDeletionStatement(
        req.locals.user
        , req.locals.course);
    lrs.saveStatement(statement);
    res.send(req.locals.response);
}

export const logCourseAccess = (req, res) => {
    const statement = statementFactory
    .getCourseAccessStatement(
        req.locals.user
        , req.locals.course);
    lrs.saveStatement(statement);
    res.status(200).send(req.locals.response);
}