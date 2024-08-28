const statementFactory = require("../generator/course-generator");
const lrs = require("../lrs/lrs");
const controller = require("../controller/activity-controller");
const ORIGIN = process.env.ORIGIN;

export const newCourse = async (req, res) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const statement = statementFactory.getCourseCreationStatement(
    req.locals.user,
    req.locals.course,
    origin,
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.send(req.locals.response);
};

export const deleteCourse = async (req, res) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const statement = statementFactory.getCourseDeletionStatement(
    req.locals.user,
    req.locals.course,
    origin,
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.send(req.locals.response);
};

export const getCourse = async (req, res) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const statement = statementFactory.getCourseAccessStatement(
    req.locals.user,
    req.locals.course,
    origin,
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.status(200).send(req.locals.response);
};

export const enrolCourse = async (req, res) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const statement = statementFactory.getCourseEnrollmentStatement(
    req.locals.user,
    req.locals.course,
    origin,
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.status(200).send(req.locals.response);
};

export const withdrawCourse = async (req, res) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const statement = statementFactory.getCourseWithdrawStatement(
    req.locals.user,
    req.locals.course,
    origin,
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.status(200).send(req.locals.response);
};

export const editCourse = async (req, res) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const statement = statementFactory.getCourseEditStatement(
    req.locals.user,
    req.locals.newCourse,
    req.locals.oldCourse,
    origin,
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.status(200).send(req.locals.response);
};
