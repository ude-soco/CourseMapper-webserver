const { authJwt } = require("../middlewares");
const controller = require("../controllers/activity.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.get(
    "/api/collect-activities",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.collectActivities
  );
};
