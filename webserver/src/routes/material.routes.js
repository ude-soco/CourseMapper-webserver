const { authJwt } = require("../middlewares");
const controller = require("../controllers/material.controller");
const {editMaterial} = require("../controllers/material.controller");

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

  // Add a new material
  // Only moderator/admin
  app.post(
    "/courses/:courseId/new-material/:channelId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.newMaterial
  );

  // Delete material
  // Only moderator/admin
  app.delete(
    "/courses/:courseId/material/:materialId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.editMaterial
  );

  // Edit material
  // Only moderator/admin
  app.put(
    "/courses/:courseId/material/:materialId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteMaterial
  );
};
