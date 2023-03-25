const { verifySignUp, authJwt } = require("../middlewares");
const controller = require("../controllers/test.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post(
    "/api/generateTestData/:courseNr/:userPrefix",
    authJwt.verifyToken,
    controller.generteTestdata
  );
};
