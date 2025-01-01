const { authJwt } = require("../middlewares");
const controller = require("../controllers/notification.controller");
const logger = require("../activity-logger/logger-middlewares/notification-logger");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get all the notifications for user Logging
  // This function triggers when the user clicks the Bell icon to view notifications in real-time, unlike the getAllNotifications function, which fetches notifications more generally.
  app.get(
    "/api/notifications/logs",
    [authJwt.verifyToken],
    controller.getAllNotificationsLog,
    logger.viewAllNotificationsLogger
  );

  // Get all the notifications for user
  app.get(
    "/api/notifications",
    [authJwt.verifyToken],
    controller.getAllNotifications
  );

  //end point for marking the notifications as read. It should not generate a notification itself
  app.put(
    "/api/notifications/read",
    [authJwt.verifyToken],
    controller.markNotificationsAsRead,
    logger.markNotificationsAsReadLogger
  );

  app.put(
    "/api/notifications/unread",
    [authJwt.verifyToken],
    controller.markNotificationsAsUnread,
    logger.markNotificationsAsUnreadLogger
  );

  app.put(
    "/api/notifications/star",
    [authJwt.verifyToken],
    controller.starNotification,
    logger.starNotificationLogger
  );

  app.put(
    "/api/notifications/unstar",
    [authJwt.verifyToken],
    controller.unstarNotification,
    logger.unstarNotificationLogger
  );

  app.put(
    "/api/notifications/remove",
    [authJwt.verifyToken],
    controller.removeNotification,
    logger.removeNotificationLogger
  );
  //THE LOGGER TO IMPLEMENT
  app.delete("/api/notifications", controller.deleteAllNotifications);
  //THE LOGGER TO IMPLEMENT
  app.get("/api/notifications/searchUsers", controller.searchUsers);

  app.post(
    "/api/notifications/followAnnotation/:annotationId",
    [authJwt.verifyToken],
    controller.followAnnotation,
    //controller.followAnnotationSuccess,
    logger.followAnnotationLogger
  );

  app.post(
    "/api/notifications/unfollowAnnotation/:annotationId",
    [authJwt.verifyToken],
    controller.unfollowAnnotation,
    logger.unfollowAnnotationLogger
  );

  app.put(
    "/api/notifications/setMaterialNotificationSettings",
    [authJwt.verifyToken],
    controller.setMaterialNotificationSettings,
    logger.setMaterialNotificationSettingsLogger
  );

  app.put(
    "/api/notifications/unsetMaterialNotificationSettings",
    [authJwt.verifyToken],
    controller.unsetMaterialNotificationSettings,
    logger.unsetMaterialNotificationSettingsLogger
  );

  app.put(
    "/api/notifications/setChannelNotificationSettings",
    [authJwt.verifyToken],
    controller.setChannelNotificationSettings,
    logger.setChannelNotificationSettingsLogger
  );

  app.put(
    "/api/notifications/unsetChannelNotificationSettings",
    [authJwt.verifyToken],
    controller.unsetChannelNotificationSettings,
    logger.unsetChannelNotificationSettingsLogger
  );

  app.put(
    "/api/notifications/setTopicNotificationSettings",
    [authJwt.verifyToken],
    controller.setTopicNotificationSettings,
    logger.setTopicNotificationSettingsLogger
  );

  app.put(
    "/api/notifications/unsetTopicNotificationSettings",
    [authJwt.verifyToken],
    controller.unsetTopicNotificationSettings,
    logger.unsetTopicNotificationSettingsLogger
  );

  app.put(
    "/api/notifications/setCourseNotificationSettings",
    [authJwt.verifyToken],
    controller.setCourseNotificationSettings,
    logger.setCourseNotificationSettingsLogger
  );

  app.put(
    "/api/notifications/unsetCourseNotificationSettings",
    [authJwt.verifyToken],
    controller.unsetCourseNotificationSettings,
    logger.unsetCourseNotificationSettingsLogger
  );

  app.put(
    "/api/notifications/setGlobalNotificationSettings",
    [authJwt.verifyToken],
    controller.setGlobalNotificationSettings,
    logger.setGlobalNotificationSettingsLogger
  );

  app.put(
    "/api/notifications/blockUser",
    [authJwt.verifyToken],
    controller.blockUser,
    logger.blockUserLogger
  );

  app.put(
    "/api/notifications/unblockUser",
    [authJwt.verifyToken],
    controller.unblockUser,
    logger.unblockUserLogger
  );

  app.get(
    "/api/notifications/getAllCourseNotificationSettings",
    [authJwt.verifyToken],
    controller.getAllCourseNotificationSettings
  );
};
