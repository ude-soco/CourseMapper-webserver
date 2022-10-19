const { authJwt } = require("../middlewares");
const controller = require("../controllers/annotation.controller");
const logger = require('../xAPILogger/logger/annotation.logger')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Add a new annotation
  // Enrolled users
  app.post(
    "/courses/:courseId/materials/:materialId/annotation",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.newAnnotation,
    logger.newAnnotation
  );

  // Delete an annotation
  // Only enrolled users (authors)/moderator/admin
  app.delete(
    "/courses/:courseId/annotations/:annotationId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.deleteAnnotation,
    logger.deleteAnnotation
  );

  // Edit an annotation
  // Only enrolled users (authors)/moderator/admin
  app.put(
    "/courses/:courseId/annotations/:annotationId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.editAnnotation
  );

  // Like an annotation
  // Only enrolled users/moderator/admin
  // Note: A user when disliked an annotation, it cannot be liked
  app.post(
    "/courses/:courseId/annotations/:annotationId/like",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.likeAnnotation
  );

  // Dislike an annotation
  // Only enrolled users/moderator/admin
  // Note: A user when liked an annotation, it cannot be disliked
  app.post(
    "/courses/:courseId/annotations/:annotationId/dislike",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.dislikeAnnotation
  );
};
