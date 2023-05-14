const { authJwt } = require("../middlewares");
const controller = require("../controllers/activity.controller");
const activityRouter = require("express").Router();

activityRouter.use(function (req, res, next) {
  res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
  next();
});

activityRouter.get(
  "/collect-activities",
  [authJwt.verifyToken, authJwt.isAdmin],
  controller.collectActivities
);

module.exports = activityRouter;
