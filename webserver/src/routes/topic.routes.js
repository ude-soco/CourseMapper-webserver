const { authJwt } = require("../middlewares");
const controller = require("../controllers/topic.controller");
const logger = require("../xAPILogger/logger/topic.logger");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get topic details
  // Only enrolled users can view topic
  app.get(
    "/courses/:courseId/topics/:topicId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getTopic,
    logger.getTopic
  );

  // Create a new topic
  // Only moderator/admin
  app.post(
    "/courses/:courseId/topic",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.newTopic,
    logger.newTopic
  );

  // Delete a topic
  // Only moderator/admin
  app.delete(
    "/courses/:courseId/topics/:topicId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteTopic,
    logger.deleteTopic
  );

  // Edit a topic
  // Only moderator/admin
  app.put(
    "/courses/:courseId/topics/:topicId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.editTopic,
    logger.editTopic
  );
};
