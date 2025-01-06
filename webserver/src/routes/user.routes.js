const { authJwt } = require("../middlewares");
const controller = require("../controllers/user.controller");
const logger = require("../activity-logger/logger-middlewares/user-logger");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.get("/api/test/all", controller.allAccess);

  app.get("/api/test/user", [authJwt.verifyToken], controller.userBoard);

  app.get(
    "/api/test/mod",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.moderatorBoard
  );

  app.get(
    "/api/test/admin",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );

  app.post(
    "/api/user/indicator",
    [authJwt.verifyToken],
    controller.newIndicator,
    logger.newPersonalIndicatorLogger
  );

  app.delete(
    "/api/user/indicator/:indicatorId",
    [authJwt.verifyToken],
    controller.deleteIndicator,
    logger.deletePersonalIndicatorLogger
  );

  app.get(
    "/api/user/indicators",
    [authJwt.verifyToken],
    controller.getIndicators,
    logger.viewPersonalIndicatorsLogger
  );

  app.put(
    "/api/user/indicator/:indicatorId/resize/:width/:height",
    [authJwt.verifyToken],
    controller.resizeIndicator,
    logger.resizePersonalIndicatorLogger
  );

  app.put(
    "/api/user/reorder/:newIndex/:oldIndex",
    [authJwt.verifyToken],
    controller.reorderIndicators,
    logger.reorderPersonalIndicatorLogger
  );
  app.get("/api/users", controller.getAllUsers);

  app.get("/api/users/:userId", controller.getUser);

  app.get(
    "/api/user/lastTimeCourseMapperOpened",
    [authJwt.verifyToken],
    controller.getLastTimeCourseMapperOpened
  );

  app.put(
    "/api/user/lastTimeCourseMapperOpened",
    [authJwt.verifyToken],
    controller.updateLastTimeCourseMapperOpened
  );

  app.get("/api/users/user-concepts/:userId", controller.getUserConcepts);
  app.post(
    "/api/users/user-concepts",
    // [authJwt.verifyToken],
    controller.updateUserConcepts
  );
};
