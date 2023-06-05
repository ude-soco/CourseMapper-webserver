const { authJwt } = require("../middlewares");
const controller = require("../controllers/notificationBaohui.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get all the notifications for user
  app.get(
    "/api/notifications",
    [authJwt.verifyToken],
    controller.getAllNotifications
  );

  // Delete a notification
  app.delete(
    "/api/notifications/:notificationId",
    [authJwt.verifyToken],
    controller.deleteNotification
  );

  // Delete all notifications
  app.put(
    "/api/notifications/deleteAll",
    [authJwt.verifyToken],
    controller.deleteAllNotifications
  );

  // Delete by type
  app.put(
    "/api/notifications/courseupdates",
    [authJwt.verifyToken],
    controller.deleteNotificationsByCourseUpdates
  );
  app.put(
    "/notifications/replies",
    [authJwt.verifyToken],
    controller.deleteNotificationsByReplies
  );
  app.put(
    "/api/notifications/annotations",
    [authJwt.verifyToken],
    controller.deleteNotificationsByAnnotations
  );

  // Mark single notification as read
  app.put(
    "/api/notifications/:notificationId",
    [authJwt.verifyToken],
    controller.readNotification
  );

  // Mark all notification as read
  app.patch(
    "/api/notifications/readAll",
    [authJwt.verifyToken],
    controller.readAllNotifications
  );

  // Mark single notification as starred
  app.put(
    "/api/notifications/:notificationId/star",
    [authJwt.verifyToken],
    controller.starNotification
  );

  // Turn off notification from specific type

  app.put(
    "/api/notifications/deactivate/course",
    [authJwt.verifyToken],
    controller.toggleActiveCourse
  );

  app.put(
    "/api/notifications/deactivate/annotation",
    [authJwt.verifyToken],
    controller.toggleAnnotation
  );

  app.put(
    "/api/notifications/deactivate/reply",
    [authJwt.verifyToken],
    controller.toggleReply
  );

  app.post(
    "/api/notification/deactivate/:userId",
    [authJwt.verifyToken],
    controller.deactivateUser
  );

  app.get(
    "/api/notification/isCourseTurnOff",
    [authJwt.verifyToken],
    controller.getUserIsCourseTurnOff
  );

  app.get(
    "/api/notification/isRepliesTurnOff",
    [authJwt.verifyToken],
    controller.getUserIsRepliesTurnOff
  );

  app.get(
    "/api/notification/isAnnotationTurnOff",
    [authJwt.verifyToken],
    controller.getUserIsAnnotationTurnOff
  );

  app.get(
    "/api/notifications/:channelId/channelNotifications",
    [authJwt.verifyToken],
    controller.getChannelNotifications
  );

  app.get(
    "/api/notifications/:courseId/courseNotifications",
    [authJwt.verifyToken],
    controller.getCourseNotifications
  );
};
