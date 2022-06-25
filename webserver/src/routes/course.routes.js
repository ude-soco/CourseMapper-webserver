const {authJwt} = require("../middlewares");
const controller = require("../controllers/course.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.get("/courses", [authJwt.verifyToken], controller.getAllCourses);

  app.get("/courses/:courseId", [authJwt.verifyToken], controller.getCourse);

  // TODO:  isAdmin middleware needs to be removed.
  //        A new middleware will be required to check whether a user is the creator of the course.
  //        Only authorized creator can update the courses. Maybe update the isModerator middleware
  app.post("/new-course", [authJwt.verifyToken, authJwt.isAdmin], controller.newCourse);

  app.delete("/course/:courseId", [authJwt.verifyToken, authJwt.isAdmin], controller.deleteCourse);

  app.post("/edit-course/:courseId", [authJwt.verifyToken, authJwt.isAdmin], controller.editCourse);
};
