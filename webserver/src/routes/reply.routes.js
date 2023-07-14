const { authJwt } = require("../middlewares");
const controller = require("../controllers/reply.controller");
const logger = require("../xAPILogger/logger/reply.logger");
const { notifications } = require("../middlewares");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get all replies
  // Enrolled users
  app.get(
    "/api/courses/:courseId/annotations/:annotationId/replies",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getReplies
  );

  // Add a new reply
  // Enrolled users
  app.post(
    "/api/courses/:courseId/annotations/:annotationId/reply",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.newReply,
    logger.newReply,
    notifications.calculateUsersFollowingAnnotation,
    notifications.populateUserNotification
  );

  // Delete a reply
  // Only enrolled users (authors)/moderator/admin
  app.delete(
    "/api/courses/:courseId/replies/:replyId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.deleteReply,
    logger.deleteReply,
    notifications.calculateUsersFollowingAnnotation,
    notifications.populateUserNotification
  );

  // Edit a reply
  // Only enrolled users (authors)/moderator/admin
  app.put(
    "/api/courses/:courseId/replies/:replyId",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.editReply,
    logger.editReply,
    notifications.calculateUsersFollowingAnnotation,
    notifications.populateUserNotification
  );

  // Like a reply
  // Only enrolled users/moderator/admin
  // Note: A user when disliked a reply, it cannot be liked
  app.post(
    "/api/courses/:courseId/replies/:replyId/like",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.likeReply,
    logger.likeReply,
    notifications.populateUserNotification
  );

  // Dislike a reply
  // Only enrolled users/moderator/admin
  // Note: A user when liked a reply, it cannot be disliked
  app.post(
    "/api/courses/:courseId/replies/:replyId/dislike",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.dislikeReply,
    logger.dislikeReply,
    notifications.populateUserNotification
  );
};
