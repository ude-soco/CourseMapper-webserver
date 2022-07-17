const { authJwt } = require("../middlewares");
const controller = require("../controllers/tag.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.get(
    "/courses/:courseId/tags",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.courseTags
  );

  app.get(
    "/courses/:courseId/topics/:topicId/tags",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.topicTags
  );

  app.get(
    "/courses/:courseId/channels/:channelId/tags",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.channelTags
  );

  app.get(
    "/courses/:courseId/materials/:materialId/tags",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.materialTags
  );

};
