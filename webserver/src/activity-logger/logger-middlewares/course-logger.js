const courseActivityGenerator = require("../generator/course-generator");
const activityController = require("../controller/activity-controller");

export const createCourseLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      courseActivityGenerator.generateCreateCourseActivity(req)
    );
    res.status(201).send(req.locals.response);
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};

export const deleteCourseLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      courseActivityGenerator.generateDeleteCourseActivity(req)
    );
    res.status(200).send(req.locals.response);
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};

export const shareCourseLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      courseActivityGenerator.generateShareCourseActivity(req)
    );
    res.status(200).send({
      success: req.locals.success,
      courseUrl: req.locals.courseUrl,
    });
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};

export const accessCourseLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      courseActivityGenerator.generateCourseAccessActivity(req)
    );
    res.status(200).send(req.locals.response);
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};

export const enrolToCourseLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      courseActivityGenerator.generateEnrolToCourseActivity(req)
    );
    res.status(200).send(req.locals.response);
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};

export const withdrawFromCourseLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      courseActivityGenerator.generateWithdrawFromCourseActivity(req)
    );
    res.status(200).send(req.locals.response);
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};

export const editCourseLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      courseActivityGenerator.generateEditCourseLogger(req)
    );
    res.status(200).send(req.locals.response);
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};
export const accessCourseDashboardLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      courseActivityGenerator.generateAccessCourseDashboardActivity(req)
    );
    res
      .status(200)
      .json({ message: "Course dashboard access logged successfully" });
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};

export const newCourseIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      courseActivityGenerator.generateNewCourseIndicatorActivity(req)
    );
    res.status(200).send({
      success: req.locals.success,
      indicator: req.locals.indicator,
    });
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};
export const deleteCourseIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      courseActivityGenerator.generateDeleteCourseIndicatorActivity(req)
    );
    res.status(201).send({
      success: req.locals.success,
    });
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};
export const resizeCourseIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      courseActivityGenerator.generateResizeCourseIndicatorActivity(req)
    );
    res.status(200).send();
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};
export const reorderCourseIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      courseActivityGenerator.generateReorderCourseIndicatorActivity(req)
    );
    res.status(200).send({
      success: req.locals.success,
      indicators: req.locals.indicators,
    });
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};
