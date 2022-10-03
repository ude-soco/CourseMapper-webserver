const { verifySignUp, authJwt } = require("../middlewares");
const controller = require("../controllers/auth.controller");
const logger = require('../xAPILogger/logger/auth.logger');

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted,
    ],
    controller.signup,
    logger.logUserSignup
  );

  app.post("/api/auth/signin", controller.signin, logger.logUserLogin);

  app.post("/api/auth/signout", [authJwt.verifyToken], controller.signout, logger.logUserLogout);
};
