const { authJwt } = require("../middlewares");
const controller = require("../controllers/notification.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get all the notifications
  app.get(
    "/notifications",
    // [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getAllNotifications
  );
  // Delete a notification
  app.delete("/notifications/:notificationId", controller.deleteNotification);

  // Delete all notifications
  app.delete("/notifications", controller.deleteAllNotifications);

  // Mark single notification as read
  app.put("/notifications/:notificationId", controller.readNotification);

  // Mark all notification as read
  app.put("/notifications", controller.readAllNotifications);

  // Mark single notification as starred
  app.put("/notifications/:notificationId/star", controller.starNotification);

  // Turn off notification from specific type
  // Turn off notifications from specific user
};
