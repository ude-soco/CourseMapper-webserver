const { authJwt, notifications, utili } = require("../middlewares");
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
    [authJwt.verifyToken, authJwt.isModeratorOrCo,
    utili.isPermissionAllowed("can_create_channel")],
    controller.newChannel,
    logger.createChannelLogger,
    notifications.updateBlockingNotificationsNewChannel,
    notifications.channelCourseUpdateNotificationUsers,
    notifications.populateUserNotification,
  );

  // Delete a channel
  // Only moderator/admin
  app.delete(
    "/api/courses/:courseId/channels/:channelId",
    [authJwt.verifyToken, authJwt.isModeratorOrCo, utili.isPermissionAllowed("can_delete_channels")],
    controller.deleteChannel,
    logger.deleteChannelLogger,
    notifications.channelCourseUpdateNotificationUsers,
    notifications.populateUserNotification,
  );

  // Edit a channel
  // Only moderator/admin
  app.put(
    "/api/courses/:courseId/channels/:channelId",
    [authJwt.verifyToken, authJwt.isModeratorOrCo, utili.isPermissionAllowed("can_rename_channels")],
    controller.editChannel,
    logger.editChannelLogger,
    notifications.channelCourseUpdateNotificationUsers,
    notifications.populateUserNotification,
  );

  app.post(
    "/api/courses/:courseId/channels/:channelId/indicator",
    [authJwt.verifyToken, authJwt.isModeratorOrCo],
    controller.newIndicator,
  );

  app.delete(
    "/api/courses/:courseId/channels/:channelId/indicator/:indicatorId",
    [authJwt.verifyToken, authJwt.isModeratorOrCo],
    controller.deleteIndicator,
  );

  app.get(
    "/api/courses/:courseId/channels/:channelId/indicator",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getIndicators,
  );

  app.put(
    "/api/courses/:courseId/channels/:channelId/indicator/:indicatorId/resize/:width/:height",
    [authJwt.verifyToken, authJwt.isModeratorOrCo],
    controller.resizeIndicator,
  );

  app.put(
    "/api/courses/:courseId/channels/:channelId/reorder/:newIndex/:oldIndex",
    [authJwt.verifyToken, authJwt.isModeratorOrCo],
    controller.reorderIndicators,
  );

};
