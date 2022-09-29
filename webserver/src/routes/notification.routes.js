const { authJwt } = require("../middlewares");
const controller = require("../controllers/notification.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get all the notifcations

  // Create a new notification
  app.post(
    "/notifications/notification",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.newNotification
  );
};
