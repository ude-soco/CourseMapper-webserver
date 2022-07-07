const { authJwt } = require("../middlewares");
const controller = require("../controllers/tag.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.get(
    "/course-tags/:courseId",
    [authJwt.verifyToken],
    controller.courseTags
  );

  app.get(
    "/topic-tags/:topicId",
    [authJwt.verifyToken],
    controller.topicTags
  );

  app.get(
    "/channel-tags/:channelId",
    [authJwt.verifyToken],
    controller.channelTags
  );

  app.get(
    "/material-tags/:materialId",
    [authJwt.verifyToken],
    controller.materialTags
  );

};
