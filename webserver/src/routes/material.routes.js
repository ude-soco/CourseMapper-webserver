const { authJwt } = require("../middlewares");
const controller = require("../controllers/material.controller");

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
    controller.getMaterial
  );

  // Create a new material
  // Only moderator/admin
  app.post(
    "/courses/:courseId/channels/:channelId/material",
    // [authJwt.verifyToken, authJwt.isModerator],
    controller.newMaterial
  );

  // Delete a material
  // Only moderator/admin
  app.delete(
    "/courses/:courseId/materials/:materialId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteMaterial
  );

  // Edit a material
  // Only moderator/admin
  app.put(
    "/courses/:courseId/materials/:materialId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.editMaterial
  );
};
