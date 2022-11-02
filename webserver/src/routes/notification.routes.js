const { authJwt } = require("../middlewares");
const controller = require("../controllers/notification.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get all the notifications for user
  app.get(
    "/notifications",
    [authJwt.verifyToken],
    controller.getAllNotifications
  );

  // Delete a notification
  app.delete(
    "/notifications/:notificationId",
    [authJwt.verifyToken],
    controller.deleteNotification
  );

  // Delete all notifications
  app.put(
    "/notifications/deleteAll",
    [authJwt.verifyToken],
    controller.deleteAllNotifications
  );

  // Delete by type
  app.put(
    "/notifications/courseupdates",
    [authJwt.verifyToken],
    controller.deleteNotificationsByCourseUpdates
  );
  app.put(
    "/notifications/replies",
    [authJwt.verifyToken],
    controller.deleteNotificationsByReplies
  );
  app.put(
    "/notifications/annotations",
    [authJwt.verifyToken],
    controller.deleteNotificationsByAnnotations
  );

  // Mark single notification as read
  app.put(
    "/notifications/:notificationId",
    [authJwt.verifyToken],
    controller.readNotification
  );

  // Mark all notification as read
  app.patch(
    "/notifications/readAll",
    [authJwt.verifyToken],
    controller.readAllNotifications
  );

  // Mark single notification as starred
  app.put(
    "/notifications/:notificationId/star",
    [authJwt.verifyToken],
    controller.starNotification
  );

  // Turn off notification from specific type

  app.put(
    "/notifications/deactivate/course",
    [authJwt.verifyToken],
    controller.toggleActiveCourse
  );

  app.put(
    "/notifications/deactivate/annotation",
    [authJwt.verifyToken],
    controller.toggleAnnotation
  );

  app.put(
    "/notifications/deactivate/reply",
    [authJwt.verifyToken],
    controller.toggleReply
  );

  app.post(
    "/notification/deactivate/:userId",
    [authJwt.verifyToken],
    controller.deactivateUser
  );

  app.get(
    "/notification/isCourseTurnOff",
    [authJwt.verifyToken],
    controller.getUserIsCourseTurnOff
  );

  app.get(
    "/notification/isRepliesTurnOff",
    [authJwt.verifyToken],
    controller.getUserIsRepliesTurnOff
  );

  app.get(
    "/notification/isAnnotationTurnOff",
    [authJwt.verifyToken],
    controller.getUserIsAnnotationTurnOff
  );

  app.get(
    "/notifications/:channelId/channelNotifications",
    [authJwt.verifyToken],
    controller.getChannelNotifications
  );

  app.get(
    "/notifications/:courseId/courseNotifications",
    [authJwt.verifyToken],
    controller.getCourseNotifications
  );
};
