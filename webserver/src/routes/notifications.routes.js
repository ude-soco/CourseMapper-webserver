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

  app.delete("/api/notifications", controller.deleteAllNotifications);
};
