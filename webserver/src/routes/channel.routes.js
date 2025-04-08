const { authJwt, notifications } = require("../middlewares");
const controller = require("../controllers/channel.controller");
const logger = require("../activity-logger/logger-middlewares/channel-logger");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get channel details
  // Only enrolled/admin
  app.get(
    "/api/courses/:courseId/channels/:channelId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getChannel
  );

  // Create a new channel
  // Only moderator/admin
  app.post(
    "/api/courses/:courseId/topics/:topicId/channel",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.newChannel,
    logger.createChannelLogger,
    notifications.updateBlockingNotificationsNewChannel,
    notifications.channelCourseUpdateNotificationUsers,
    notifications.populateUserNotification
  );

  // Delete a channel
  // Only moderator/admin
  app.delete(
    "/api/courses/:courseId/channels/:channelId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteChannel,
    logger.deleteChannelLogger,
    notifications.channelCourseUpdateNotificationUsers,
    notifications.populateUserNotification
  );

  // Edit a channel
  // Only moderator/admin
  app.put(
    "/api/courses/:courseId/channels/:channelId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.editChannel,
    logger.editChannelLogger,
    notifications.channelCourseUpdateNotificationUsers,
    notifications.populateUserNotification
  );

  app.post(
    "/api/channels/:channelId/log-dashboard",
    [authJwt.verifyToken],
    controller.accessChannelDashboard,
    logger.accessChannelDashboardLogger
  );

  app.post(
    "/api/courses/:courseId/channels/:channelId/indicator",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.newIndicator,
    logger.newChannelIndicatorLogger
  );

  app.delete(
    "/api/courses/:courseId/channels/:channelId/indicator/:indicatorId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteIndicator,
    logger.deleteChannelIndicatorLogger
  );

  app.get(
    "/api/courses/:courseId/channels/:channelId/indicator",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getIndicators
  );

  app.put(
    "/api/courses/:courseId/channels/:channelId/indicator/:indicatorId/resize/:width/:height",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.resizeIndicator,
    logger.resizeChannelIndicatorLogger
  );

  app.put(
    "/api/courses/:courseId/channels/:channelId/reorder/:newIndex/:oldIndex",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.reorderIndicators,
    logger.reorderChannelIndicatorLogger
  );

  app.get(
    "/api/courses/:courseId/channels/:channelId/log",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getChannelLog,
    logger.accessChannelLogger
  );
};
