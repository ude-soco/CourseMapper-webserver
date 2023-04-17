const { authJwt } = require("../middlewares");
const controller = require("../controllers/user.controller");

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
    "/user/indicator",
    [authJwt.verifyToken],
    controller.newIndicator
  );

  app.delete(
    '/user/indicator/:indicatorId',
    [authJwt.verifyToken],
    controller.deleteIndicator
  );

  app.get(
    '/user/indicators', 
    [authJwt.verifyToken],
    controller.getIndicators
  );

  app.put(
    '/user/indicator/:indicatorId/resize/:width/:height', 
    [authJwt.verifyToken],
    controller.resizeIndicator
  );

  app.put(
    '/user/reorder/:newIndex/:oldIndex', 
    [authJwt.verifyToken],
    controller.reorderIndicators
  );
  app.get("/users",  controller.getAllUsers);

  app.get(
    "/users/:userId",
    
    controller.getUser
  );

  app.get(
    "/users/user-concepts/:userId",
    controller.getUserConcepts
  );
  app.post(
    "/users/user-concepts/",
    // [authJwt.verifyToken],
    controller.updateUserConcepts
  );
};
