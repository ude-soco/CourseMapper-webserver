const { authJwt } = require("../middlewares");
const controller = require("../controllers/engagement.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get user engagement metrics for a specific course
  app.get(
    "/api/engagement/user/:userId/course/:courseId/metrics",
    [authJwt.verifyToken],
    controller.getUserEngagementMetrics
  );
};

