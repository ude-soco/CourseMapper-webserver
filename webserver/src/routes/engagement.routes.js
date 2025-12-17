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

  // Get peer activities data
  app.get(
    "/api/engagement/peer-activities",
    [authJwt.verifyToken],
    controller.getPeerActivities
  );

  // Verify activity logging is working (for debugging)
  app.get(
    "/api/engagement/user/:userId/course/:courseId/verify-activities",
    [authJwt.verifyToken],
    controller.verifyActivityLogging
  );

  // Get same engagement level statistics
  app.get(
    "/api/engagement/user/:userId/course/:courseId/same-level-stats",
    [authJwt.verifyToken],
    controller.getSameEngagementLevelStats
  );

  // Get higher engagement level boundaries
  app.get(
    "/api/engagement/user/:userId/course/:courseId/higher-level-boundaries",
    [authJwt.verifyToken],
    controller.getHigherEngagementLevelBoundaries
  );

  // Get annotation activity details
  app.get(
    "/api/engagement/user/:userId/course/:courseId/annotation-activities",
    [authJwt.verifyToken],
    controller.getAnnotationActivityDetails
  );

  // Get knowledge graph activity details
  app.get(
    "/api/engagement/user/:userId/course/:courseId/kg-activities",
    [authJwt.verifyToken],
    controller.getKGActivityDetails
  );

  // Get recommendation activity details
  app.get(
    "/api/engagement/user/:userId/course/:courseId/recommendation-activities",
    [authJwt.verifyToken],
    controller.getRecommendationActivityDetails
  );

  // Get access activity details
  app.get(
    "/api/engagement/user/:userId/course/:courseId/access-activities",
    [authJwt.verifyToken],
    controller.getAccessActivityDetails
  );
};

