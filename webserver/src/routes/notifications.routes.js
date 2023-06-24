const { authJwt } = require("../middlewares");
const controller = require("../controllers/notification.controller");

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

  //end point for marking the notifications as read. It should not generate a notification itself
  app.put(
    "/api/notifications/read",
    [authJwt.verifyToken],
    controller.markNotificationsAsRead
  );
  //end point for marking the notifications as unread. It should not generate a notification itself
  app.put(
    "/api/notifications/unread",
    [authJwt.verifyToken],
    controller.markNotificationsAsUnread
  );

  app.put(
    "/api/notifications/star",
    [authJwt.verifyToken],
    controller.starNotification
  );

  app.put(
    "/api/notifications/unstar",
    [authJwt.verifyToken],
    controller.unstarNotification
  );

  app.delete("/api/notifications", controller.deleteAllNotifications);
};
