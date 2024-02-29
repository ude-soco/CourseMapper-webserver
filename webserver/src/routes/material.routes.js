const { authJwt, notifications } = require("../middlewares");
const controller = require("../controllers/material.controller");
const logger = require("../xAPILogger/logger/material.logger");
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
    logger.getMaterial
  );

  // Create a new material
  // Only moderator/admin
  app.post(
    "/api/courses/:courseId/channels/:channelId/material",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.newMaterial,
    logger.newMaterial,
    notifications.updateBlockingNotificationsNewMaterial,
    notifications.materialCourseUpdateNotificationsUsers,
    notifications.populateUserNotification
  );

  // Delete a material
  // Only moderator/admin
  app.delete(
    "/api/courses/:courseId/materials/:materialId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteMaterial,
    logger.deleteMaterial,
    notifications.materialCourseUpdateNotificationsUsers,
    notifications.populateUserNotification
  );

  // Edit a material
  // Only moderator/admin
  app.put(
    "/api/courses/:courseId/materials/:materialId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.editMaterial,
    logger.editMaterial,
    notifications.materialCourseUpdateNotificationsUsers,
    notifications.populateUserNotification
  );

  app.get(
    "/api/courses/:courseId/materials/:materialId/:hours/:minutes/:seconds/video/play",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getMaterial,
    logger.playVideo
  );

  app.get(
    "/api/courses/:courseId/materials/:materialId/:hours/:minutes/:seconds/video/pause",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getMaterial,
    logger.pauseVideo
  );

  app.get(
    "/api/courses/:courseId/materials/:materialId/video/complete",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getMaterial,
    logger.completeVideo
  );

  app.get(
    "/api/courses/:courseId/materials/:materialId/pdf/slide/:slideNr/view",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getMaterial,
    knowledgeGraphController.readSlide,
    logger.viewSlide
  );

  app.get(
    "/api/courses/:courseId/materials/:materialId/pdf/complete",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getMaterial,
    logger.completePDF
  );

  app.post(
    "/api/courses/:courseId/materials/:materialId/indicator",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.newIndicator
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
