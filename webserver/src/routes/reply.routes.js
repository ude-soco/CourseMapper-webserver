const { authJwt } = require("../middlewares");
const controller = require("../controllers/reply.controller");
const logger = require('../xAPILogger/logger/reply.logger');

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get all replies
  // Enrolled users
  app.get(
    "/courses/:courseId/annotations/:annotationId/replies",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getReplies
  );

  // Add a new reply
  // Enrolled users
  app.post(
    "/courses/:courseId/annotations/:annotationId/reply",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.newReply,
    logger.newReply
  );

  // Delete a reply
  // Only enrolled users (authors)/moderator/admin
  app.delete(
    "/courses/:courseId/replies/:replyId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.deleteReply,
    logger.deleteReply
  );

  // Edit a reply
  // Only enrolled users (authors)/moderator/admin
  app.put(
    "/courses/:courseId/replies/:replyId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.editReply
  );

  // Like a reply
  // Only enrolled users/moderator/admin
  // Note: A user when disliked a reply, it cannot be liked
  app.post(
    "/courses/:courseId/replies/:replyId/like",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.likeReply
  );

  // Like a reply
  // Only enrolled users/moderator/admin
  // Note: A user when liked a reply, it cannot be disliked
  app.post(
    "/courses/:courseId/replies/:replyId/dislike",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.dislikeReply
  );
};
