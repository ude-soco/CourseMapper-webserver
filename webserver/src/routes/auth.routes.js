const { verifySignUp, authJwt } = require("../middlewares");
const controller = require("../controllers/auth.controller");
const logger = require("../activity-logger/logger-middlewares/authentication-logger");

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
    controller.register,
    logger.registerLogger,
  );

  app.post("/api/auth/signin", controller.signIn, logger.signInLogger);

  app.post(
    "/api/auth/signout",
    [authJwt.verifyToken],
    controller.signOut,
    logger.signOutLogger,
  );

  app.post("/api/auth/sendEmail", controller.sendEmail);

  app.post("/api/auth/resetPassword", controller.resetPassword);
  app.post("/api/auth/verify", controller.verifyEmail, logger.signup);
  app.post("/api/auth/resendVerifyEmail", controller.resendVerifyEmail);

};
