const courseActivityGenerator = require("../generator/course-generator");
const activityController = require("../controller/activity-controller");

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
  try {
    await activityController.createActivity(
      courseActivityGenerator.generateDeleteCourseActivity(req),
    );
    res.status(200).send(req.locals.response);
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
};

export const accessCourseLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      courseActivityGenerator.generateCourseAccessActivity(req),
    );
    res.status(200).send(req.locals.response);
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
};

export const enrolToCourseLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      courseActivityGenerator.generateEnrolToCourseActivity(req),
    );
    res.status(200).send(req.locals.response);
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
};

export const withdrawFromCourseLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      courseActivityGenerator.generateWithdrawFromCourseActivity(req),
    );
    res.status(200).send(req.locals.response);
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
};

export const editCourseLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      courseActivityGenerator.generateEditCourseLogger(req),
    );
    res.status(200).send(req.locals.response);
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
};
