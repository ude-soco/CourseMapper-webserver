const { authJwt, authAdmin } = require("../middlewares");
const controller = require("../controllers/course.controller");
const controller2 = require("../controllers/user.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get all courses
  app.get("/courses", [authJwt.verifyToken], controller.getAllCourses);

  // Get details about a course
  app.get("/courses/:courseId", [authJwt.verifyToken], controller.getCourse);

  // TODO:  isAdmin middleware needs to be removed.
  //        A new middleware will be required to check whether a user is the creator of the course.
  //        Only authorized creator can update the courses. Maybe update the isModerator middleware
  // Create a new course
  app.post(
    "/course",
    [authJwt.verifyToken],
    controller.newCourse
  );

  // Enrol in a course
  app.post(
    "/enrol/:courseId",
    [authJwt.verifyToken],
    controller.enrolCourse
  )

  // Withdraw from a course
  app.post(
    "/withdraw/:courseId",
    [authJwt.verifyToken],
    controller.withdrawCourse
  )

  // Delete a course
  app.delete(
    "/courses/:courseId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteCourse
    // controller2.moderatorBoard
  );

  // Update a course
  app.put(
    "/courses/:courseId",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.editCourse
  );
};
