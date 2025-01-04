const { authJwt, notifications } = require("../middlewares");
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
    logger.accessTopicLogger
  );

  // Create a new topic
  // Only moderator/admin
  app.post(
    "/api/courses/:courseId/topic",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.newTopic,
    logger.createTopicLogger,
    notifications.updateBlockingNotificationsNewTopic,
    notifications.topicCourseUpdateNotificationUsers,
    notifications.populateUserNotification
  );

  // Delete a topic
  // Only moderator/admin
  app.delete(
    "/api/courses/:courseId/topics/:topicId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteTopic,
    logger.deleteTopicLogger,
    notifications.topicCourseUpdateNotificationUsers,
    notifications.populateUserNotification
  );

  // Edit a topic
  // Only moderator/admin
  app.put(
    "/api/courses/:courseId/topics/:topicId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.editTopic,
    logger.editTopicLogger,
    notifications.topicCourseUpdateNotificationUsers,
    notifications.populateUserNotification
  );

  app.post(
    "/api/courses/:courseId/topics/:topicId/indicator",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.newIndicator,
    logger.newTopicIndicatorLogger
  );

  app.delete(
    "/api/courses/:courseId/topics/:topicId/indicator/:indicatorId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteIndicator,
    logger.deleteTopicIndicatorLogger
  );

  app.get(
    "/api/courses/:courseId/topics/:topicId/indicator",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getIndicators,
    logger.viewTopicIndicatorsLogger
  );

  app.put(
    "/api/courses/:courseId/topics/:topicId/indicator/:indicatorId/resize/:width/:height",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.resizeIndicator,
    logger.resizeTopicIndicatorLogger
  );

  app.put(
    "/api/courses/:courseId/topics/:topicId/reorder/:newIndex/:oldIndex",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.reorderIndicators,
    logger.reorderTopicIndicatorLogger
  );
};
