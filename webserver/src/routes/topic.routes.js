const { authJwt, notifications, utili } = require("../middlewares");
const controller = require("../controllers/topic.controller");
const logger = require("../activity-logger/logger-middlewares/topic-logger");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get topic details
  // Only enrolled users can view topic
  app.get(
    "/api/courses/:courseId/topics/:topicId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getTopic,
    logger.accessTopicLogger,
  );

  // Create a new topic
  // Only moderators and Allowed custom/Co teachers
  app.post(
    "/api/courses/:courseId/topic",
    [authJwt.verifyToken, authJwt.isModeratorOrCo, utili.isPermissionAllowed("can_create_topic")],
    controller.newTopic,
    logger.createTopicLogger,
    notifications.updateBlockingNotificationsNewTopic,
    notifications.topicCourseUpdateNotificationUsers,
    notifications.populateUserNotification,
  );

  // Delete a topic
  // Only moderators and Allowed custom/Co teachers
  app.delete(
    "/api/courses/:courseId/topics/:topicId",
    [authJwt.verifyToken, authJwt.isModeratorOrCo, utili.isPermissionAllowed("can_delete_topics")],
    controller.deleteTopic,
    logger.deleteTopicLogger,
    notifications.topicCourseUpdateNotificationUsers,
    notifications.populateUserNotification,
  );

  // Edit a topic
  // Only moderators and Allowed custom/Co teachers
  app.put(
    "/api/courses/:courseId/topics/:topicId",
    [authJwt.verifyToken, authJwt.isModeratorOrCo, utili.isPermissionAllowed("can_rename_topics")],
    controller.editTopic,
    logger.editTopicLogger,
    notifications.topicCourseUpdateNotificationUsers,
    notifications.populateUserNotification,
  );

  app.post(
    "/api/courses/:courseId/topics/:topicId/indicator",
    [authJwt.verifyToken, authJwt.isModeratorOrCo],
    controller.newIndicator,
  );

  app.delete(
    "/api/courses/:courseId/topics/:topicId/indicator/:indicatorId",
    [authJwt.verifyToken, authJwt.isModeratorOrCo],
    controller.deleteIndicator,
  );

  app.get(
    "/api/courses/:courseId/topics/:topicId/indicator",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getIndicators,
  );

  app.put(
    "/api/courses/:courseId/topics/:topicId/indicator/:indicatorId/resize/:width/:height",
    [authJwt.verifyToken, authJwt.isModeratorOrCo],
    controller.resizeIndicator,
  );

  app.put(
    "/api/courses/:courseId/topics/:topicId/reorder/:newIndex/:oldIndex",
    [authJwt.verifyToken, authJwt.isModeratorOrCo],
    controller.reorderIndicators,
  );
};
