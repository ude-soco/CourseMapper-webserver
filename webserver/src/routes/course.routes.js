const { authJwt } = require("../middlewares");
const controller = require("../controllers/course.controller");
const logger = require('../xAPILogger/logger/course.logger')
// const controller2 = require("../controllers/user.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get all courses
  // app.get("/courses",  controller.getAllCourses);
  app.get("/courses", [authJwt.verifyToken], controller.getAllCourses);

  // Get all courses the user is enrolled in
  // app.get("/my-courses",  controller.getMyCourses);
  app.get("/my-courses", [authJwt.verifyToken], controller.getMyCourses);

  // Get course details
  // Only enrolled user & admins
  app.get("/courses/:courseId", [authJwt.verifyToken, authJwt.isEnrolled], controller.getCourse);
  // app.get("/courses/:courseId", controller.getCourse);


  // Create a new course
  app.post(
    "/course",
    [authJwt.verifyToken],
    controller.newCourse,
    logger.newCourse
  );

  // Enrol in a course
  app.post(
    "/enrol/:courseId",
    [authJwt.verifyToken],
    controller.enrolCourse,
    logger.enrolCourse
  )

  // Withdraw from a course
  // Only enrolled user
  app.post(
    "/withdraw/:courseId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.withdrawCourse,
    logger.withdrawCourse
  )

  // Delete a course
  // Only moderator/admin
  app.delete(
    "/courses/:courseId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteCourse,
    logger.deleteCourse
    // controller2.moderatorBoard
  );

  // Update a course
  // Only moderator/admin
  app.put(
    "/courses/:courseId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.editCourse,
    logger.editCourse
  );

  app.post(
    "/courses/:courseId/indicator",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.newIndicator
  );

  app.delete(
    '/courses/:courseId/indicator/:indicatorId',
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteIndicator
  );

  app.get(
    '/courses/:courseId/indicators', 
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getIndicators
  );

  app.put(
    '/courses/:courseId/indicator/:indicatorId/resize/:width/:height', 
    [authJwt.verifyToken, authJwt.isModerator],
    controller.resizeIndicator
  );

  app.put(
    '/courses/:courseId/reorder/:newIndex/:oldIndex', 
    [authJwt.verifyToken, authJwt.isModerator],
    controller.reorderIndicators
  );
};
