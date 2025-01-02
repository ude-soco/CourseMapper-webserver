const { authJwt } = require("../middlewares");
const controller = require("../controllers/course.controller");
const logger = require("../activity-logger/logger-middlewares/course-logger");
const { getCourseOriginal } = require("../controllers/course.controller");
// const controller2 = require("../controllers/user.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get all courses
  // app.get("/courses",  controller.getAllCourses);
  //app.get("/courses", [authJwt.verifyToken], controller.getAllCourses);
  app.get("/api/courses", controller.getAllCourses);

  // Get all courses the user is enrolled in
  // app.get("/my-courses",  controller.getMyCourses);
  app.get("/api/my-courses", [authJwt.verifyToken], controller.getMyCourses);

  // Get course details
  // Only enrolled user & admins
  app.get(
    "/api/courses/:courseId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getCourse,
    // TODO: Probably we need to provide the getCourse logger
  );
  app.get(
    "/api/coursesTest/:courseId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getCourseTest,
    // TODO: Probably we need to provide the getCourse logger
  );
  // app.get("/courses/:courseId", controller.getCourse);

  // Create a new course
  app.post(
    "/api/course",
    [authJwt.verifyToken],
    controller.newCourse,
    logger.createCourseLogger,
  );

  // Enrol in a course
  app.post(
    "/api/enrol/:courseId",
    [authJwt.verifyToken],
    controller.enrolCourse,
    logger.enrolToCourseLogger,
  );

  // Withdraw from a course
  // Only enrolled user
  app.post(
    "/api/withdraw/:courseId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.withdrawCourse,
    logger.withdrawFromCourseLogger,
  );

  // Delete a course
  // Only moderator/admin
  app.delete(
    "/api/courses/:courseId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteCourse,
    logger.deleteCourseLogger,
    // controller2.moderatorBoard
  );

  // Update a course
  // Only moderator/admin
  app.put(
    "/api/courses/:courseId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.editCourse,
    logger.editCourseLogger,
  );

  app.post(
    "/api/courses/:courseId/indicator",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.newIndicator,
  );

  app.delete(
    "/api/courses/:courseId/indicator/:indicatorId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteIndicator,
  );

  app.get(
    "/api/courses/:courseId/indicators",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getIndicators,
  );

  app.put(
    "/api/courses/:courseId/indicator/:indicatorId/resize/:width/:height",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.resizeIndicator,
  );

  app.put(
    "/api/courses/:courseId/reorder/:newIndex/:oldIndex",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.reorderIndicators,
  );

  app.get(
    "/api/courses/:courseId/log",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getCourseOriginal,
    logger.accessCourseLogger,
  );
};
