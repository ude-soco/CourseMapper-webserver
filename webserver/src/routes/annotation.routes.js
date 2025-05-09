const { authJwt, notifications } = require("../middlewares");
const controller = require("../controllers/annotation.controller");
const logger = require("../activity-logger/logger-middlewares/annotation-comment-logger");
const tagLogger = require("../activity-logger/logger-middlewares/tag-logger");
const notificationsController = require("../controllers/notification.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Add a new annotation
  // Enrolled users
  app.post(
    "/api/courses/:courseId/materials/:materialId/annotation",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.newAnnotation,
    tagLogger.addTagToAnnotationLogger,
    logger.annotateMaterialLogger, // log when user annotates in a material
    logger.createAnnotationLogger, //log when adding an annotation using the annotation panel
    notificationsController.followAnnotation,
    notifications.newAnnotationNotificationUsersCalculate,
    notifications.populateUserNotification,
    logger.addMentionLogger,
    notifications.newMentionNotificationUsersCalculate,
    notifications.populateUserNotification
  );

  // Delete an annotation
  // Only enrolled users (authors)/moderator/admin
  app.delete(
    "/api/courses/:courseId/annotations/:annotationId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.deleteAnnotation,
    logger.deleteAnnotationLogger,
    notifications.calculateUsersFollowingAnnotation,
    notifications.populateUserNotification
  );

  // Edit an annotation
  // Only enrolled users (authors)/moderator/admin
  app.put(
    "/api/courses/:courseId/annotations/:annotationId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.editAnnotation,
    logger.editAnnotation,
    notifications.calculateUsersFollowingAnnotation,
    notifications.populateUserNotification
  );

  // Like an annotation
  // Only enrolled users/moderator/admin
  // Note: A user when disliked an annotation, it cannot be liked
  app.post(
    "/api/courses/:courseId/annotations/:annotationId/like",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.likeAnnotation,
    logger.likeAnnotationLogger,
    notifications.LikesDislikesAnnotationNotificationUsers,
    notifications.populateUserNotification
  );

  // Dislike an annotation
  // Only enrolled users/moderator/admin
  // Note: A user when liked an annotation, it cannot be disliked
  app.post(
    "/api/courses/:courseId/annotations/:annotationId/dislike",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.dislikeAnnotation,
    logger.dislikeAnnotationLogger,
    notifications.LikesDislikesAnnotationNotificationUsers,
    notifications.populateUserNotification
  );

  // TODO: Change the getAnnotations to get-all-annotations
  // get annotations
  // Only enrolled users/moderator/admin
  app.get(
    "/api/courses/:courseId/materials/:materialId/getAnnotations",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getAllAnnotations
  );

  // get annotations for specific tag
  // Only enrolled users/moderator/admin
  app.get(
    "/api/courses/:courseId/tag/:tagName/get-all-annotation-for-tag",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getAllAnnotationsForSpecificTag
  );
  app.post(
    "/api/courses/:courseId/materials/:materialId/hideAnnotations",
    [authJwt.verifyToken],
    controller.hideShowAnnotations,
    logger.hideAnnotationsLogger
  );
  app.post(
    "/api/courses/:courseId/materials/:materialId/unhideAnnotations",
    [authJwt.verifyToken],
    controller.hideShowAnnotations,
    logger.unhideAnnotationsLogger
  );
  app.post(
    "/api/courses/:courseId/materials/:materialId/filter-annotations",
    [authJwt.verifyToken],
    controller.filterAnnotations,
    logger.filterAnnotationsLogger
  );
};
