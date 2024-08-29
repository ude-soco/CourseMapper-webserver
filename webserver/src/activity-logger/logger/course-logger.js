const courseActivityGenerator = require("../generator/course-generator");
const lrs = require("../lrs/lrs");
const activityController = require("../controller/activity-controller");
const ORIGIN = process.env.ORIGIN;

export const createCourseLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      courseActivityGenerator.generateCreateCourseActivity(req),
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
};

export const deleteCourseLogger = async (req, res) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const statement = courseActivityGenerator.getCourseDeletionStatement(
    req.locals.user,
    req.locals.course,
    origin,
  );
  const sent = await lrs.sendStatementToLrs(statement);
  activityController.createActivityOld(statement, sent);
  res.send(req.locals.response);
};

export const getCourseLogger = async (req, res) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const statement = courseActivityGenerator.getCourseAccessStatement(
    req.locals.user,
    req.locals.course,
    origin,
  );
  const sent = await lrs.sendStatementToLrs(statement);
  activityController.createActivityOld(statement, sent);
  res.status(200).send(req.locals.response);
};

export const enrolToCourseLogger = async (req, res) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const statement = courseActivityGenerator.getCourseEnrollmentStatement(
    req.locals.user,
    req.locals.course,
    origin,
  );
  const sent = await lrs.sendStatementToLrs(statement);
  activityController.createActivityOld(statement, sent);
  res.status(200).send(req.locals.response);
};

export const withdrawFromCourseLogger = async (req, res) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const statement = courseActivityGenerator.getCourseWithdrawStatement(
    req.locals.user,
    req.locals.course,
    origin,
  );
  const sent = await lrs.sendStatementToLrs(statement);
  activityController.createActivityOld(statement, sent);
  res.status(200).send(req.locals.response);
};

export const editCourseLogger = async (req, res) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const statement = courseActivityGenerator.getCourseEditStatement(
    req.locals.user,
    req.locals.newCourse,
    req.locals.oldCourse,
    origin,
  );
  const sent = await lrs.sendStatementToLrs(statement);
  activityController.createActivityOld(statement, sent);
  res.status(200).send(req.locals.response);
};
