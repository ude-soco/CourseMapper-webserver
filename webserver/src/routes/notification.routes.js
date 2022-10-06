const { authJwt } = require("../middlewares");
const controller = require("../controllers/notification.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get all the notifications for user
  app.get(
    "/notifications/:userId",
    // [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getAllNotifications
  );

  // Delete a notification
  app.delete("/notifications/:notificationId", controller.deleteNotification);

  // Delete all notifications // get notification for this user
  app.delete("/notifications/all/:userId", controller.deleteAllNotifications);

  // Delete by type // need to test out
  app.put(
    "/notifications/courseupdates/:userId",
    controller.deleteNotificationsByCourseUpdates
  );
  // need to test out
  app.put(
    "/notifications/replies/:userId",
    controller.deleteNotificationsByReplies
  );
  // need to test out
  app.put(
    "/notifications/annotations/:userId",
    controller.deleteNotificationsByAnnotations
  );

  // Mark single notification as read
  app.put("/notifications/:notificationId", controller.readNotification);

  // Mark all notification as read // get notification for this user
  app.put("/notifications/read/:userId", controller.readAllNotifications);

  // Mark single notification as starred
  app.put("/notifications/:notificationId/star", controller.starNotification);

  // Turn off notification from specific type
  // just a condition before inserting data to document isCourseUpdateTurnOff?
  //isCommentTurnOff,isAnnotaionTurnOff?
  app.put(
    "/notifications/:userId/deactivate/course",
    controller.toggleActiveCourse
  );

  app.put(
    "/notifications/:userId/deactivate/annotation",
    controller.toggleAnnotation
  );

  app.put("/notifications/:userId/deactivate/reply", controller.toggleReply);

  // Turn off notifications from specific user
  // condition-> the user under which type
  // once is has turned off, eg(for type courseupdate
  // it has the username that this user turn off
  // check if user is in userList[] then insert
  // edit,delete notification?
};
