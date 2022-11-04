const statementFactory = require("../statementsFactory/course.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");
const ORIGIN = process.env.ORIGIN;
const SEND_STATEMENT_IN_REALTIME = (process.env.SEND_STATEMENT_IN_REALTIME === 'true');

export const newCourse = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getCourseCreationStatement(
    req.locals.user,
    req.locals.course,
    origin
  );
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.send(req.locals.response);
};

export const deleteCourse = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getCourseDeletionStatement(
    req.locals.user,
    req.locals.course,
    origin
  );
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.send(req.locals.response);
};

export const getCourse = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getCourseAccessStatement(
    req.locals.user,
    req.locals.course,
    origin
  );
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.status(200).send(req.locals.response);
};

export const enrolCourse = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getCourseEnrollmentStatement(
    req.locals.user,
    req.locals.course,
    origin
  );
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.status(200).send(req.locals.response);
};

export const withdrawCourse = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getCourseWithdrawStatement(
    req.locals.user,
    req.locals.course,
    origin
  );
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.status(200).send(req.locals.response);
};

export const editCourse = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getCourseEditStatement(
    req.locals.user,
    req.locals.newCourse,
    req.locals.oldCourse,
    origin
  );
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.status(200).send(req.locals.response);
};
