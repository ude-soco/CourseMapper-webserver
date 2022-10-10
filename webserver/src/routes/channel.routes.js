const { authJwt } = require("../middlewares");
const controller = require("../controllers/channel.controller");
const logger = require("../xAPILogger/logger/channel.logger");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get channel details
  // Only enrolled/admin
  app.get(
    "/courses/:courseId/channels/:channelId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getChannel
  );

  // Create a new channel
  // Only moderator/admin
  app.post(
    "/courses/:courseId/topics/:topicId/channel",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.newChannel,
    logger.newChannel
  );

  // Delete a channel
  // Only moderator/admin
  app.delete(
    "/courses/:courseId/channels/:channelId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteChannel,
    logger.deleteChannel
  );

  // Edit a channel
  // Only moderator/admin
  app.put(
    "/courses/:courseId/channels/:channelId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.editChannel
  );
};
