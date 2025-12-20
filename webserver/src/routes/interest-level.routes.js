const { authJwt } = require("../middlewares");
const controller = require("../controllers/interest-level.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get interest level data for a specific user and concept
  app.get(
    "/api/interest-level/user/:userId/concept/:conceptName",
    [authJwt.verifyToken],
    controller.getUserConceptInterest
  );

  // Get all interest level data for a user
  app.get(
    "/api/interest-level/user/:userId",
    [authJwt.verifyToken],
    controller.getAllUserInterests
  );

  // Get top concepts by interest score for a user
  app.get(
    "/api/interest-level/user/:userId/top-concepts",
    [authJwt.verifyToken],
    controller.getTopConceptsByInterest
  );

  // Get all activities used by a user across all concepts
  app.get(
    "/api/interest-level/user/:userId/activities",
    [authJwt.verifyToken],
    controller.getAllUserActivities
  );
};
