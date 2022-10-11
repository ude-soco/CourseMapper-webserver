const { authJwt } = require("../middlewares");
const controller = require("../controllers/material.controller");
const logger = require("../xAPILogger/logger/material.logger");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get details of material
  // Only enrolled users/admin
  app.get(
    "/courses/:courseId/materials/:materialId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getMaterial,
    logger.getMaterial
  );

  // Create a new material
  // Only moderator/admin
  app.post(
    "/courses/:courseId/channels/:channelId/material",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.newMaterial,
    logger.newMaterial
  );

  // Delete a material
  // Only moderator/admin
  app.delete(
    "/courses/:courseId/materials/:materialId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteMaterial,
    logger.deleteMaterial
  );

  // Edit a material
  // Only moderator/admin
  app.put(
    "/courses/:courseId/materials/:materialId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.editMaterial
  );
};
