const { authJwt } = require("../middlewares");
const controller = require("../controllers/annotation.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.get(
    "/courses/:courseId/materials/:materialId/annotations",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getAnnotation
  );

  // Add a new annotation
  // Enrolled users
  app.post(
    "/courses/:courseId/materials/:materialId/annotation",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.newAnnotation
  );

  // Delete an annotation
  // Only enrolled users (authors)/moderator/admin
  app.delete(
    "/courses/:courseId/annotations/:annotationId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.deleteAnnotation
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

  app.post(
    "/courses/:courseId/annotations/:annotationId/closeDiscussion",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.closeDiscussion
  );

  app.get(
    "/courses/:courseId/annotations/:annotationId/isAnnotationClosed",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.isAnnotationClosed
  );
};
