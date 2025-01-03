const { authJwt, notifications } = require("../middlewares");
const controller = require("../controllers/material.controller");
const logger = require("../activity-logger/logger-middlewares/material-logger");
const knowledgeGraphController = require("../controllers/knowledgeGraph.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get details of material
  // Only enrolled users/admin
  app.get(
    "/api/courses/:courseId/materials/:materialId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getMaterial,
    logger.accessMaterialLogger
  );

  // Create a new material
  // Only moderator/admin
  app.post(
    "/api/courses/:courseId/channels/:channelId/material",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.newMaterial,
    logger.addMaterialLogger,
    notifications.updateBlockingNotificationsNewMaterial,
    notifications.materialCourseUpdateNotificationsUsers,
    notifications.populateUserNotification
  );

  // Delete a material
  // Only moderator/admin
  app.delete(
    "/api/courses/:courseId/materials/:materialId",
    [authJwt.verifyToken, authJwt.isModerator],
    knowledgeGraphController.deleteMaterial,
    controller.deleteMaterial,
    logger.deleteMaterialLogger,
    notifications.materialCourseUpdateNotificationsUsers,
    notifications.populateUserNotification
  );

  // Edit a material
  // Only moderator/admin
  app.put(
    "/api/courses/:courseId/materials/:materialId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.editMaterial,
    logger.editMaterialLogger,
    notifications.materialCourseUpdateNotificationsUsers,
    notifications.populateUserNotification
  );

  app.get(
    "/api/courses/:courseId/materials/:materialId/:hours/:minutes/:seconds/video/play",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getMaterial,
    logger.playVideoLogger
  );

  app.get(
    "/api/courses/:courseId/materials/:materialId/:hours/:minutes/:seconds/video/pause",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getMaterial,
    logger.pauseVideoLogger
  );

  app.get(
    "/api/courses/:courseId/materials/:materialId/video/complete",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getMaterial,
    logger.completeVideoLogger
  );

  app.get(
    "/api/courses/:courseId/materials/:materialId/pdf/slide/:slideNr/view",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getMaterial,
    // knowledgeGraphController.readSlide,
    logger.viewSlideLogger
  );

  app.get(
    "/api/courses/:courseId/materials/:materialId/pdf/complete",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getMaterial,
    logger.completePDFLogger
  );

  app.post(
    "/api/courses/:courseId/materials/:materialId/indicator",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.newIndicator,
    logger.newIndicatorLogger
  );

  app.delete(
    "/api/courses/:courseId/materials/:materialId/indicator/:indicatorId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteIndicator
  );

  app.get(
    "/api/courses/:courseId/materials/:materialId/indicator",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getIndicators
  );

  app.put(
    "/api/courses/:courseId/materials/:materialId/indicator/:indicatorId/resize/:width/:height",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.resizeIndicator
  );
  app.put(
    "/api/courses/:courseId/materials/:materialId/reorder/:newIndex/:oldIndex",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.reorderIndicators
  );
};
