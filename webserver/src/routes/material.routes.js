const {authJwt} = require("../middlewares");
const controller = require("../controllers/material.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.get("/materials/:materialId", [authJwt.verifyToken], controller.getMaterial);

  // TODO:  Later, isAdmin middleware needs to be removed.
  //        A new middleware will be required to check whether a user is the creator of the course.
  //        Only authorized creator can update the courses. Maybe update the isModerator middleware
  app.post("/new-material/:channelId", [authJwt.verifyToken, authJwt.isAdmin], controller.newMaterial);

  app.delete("/material/:materialId", [authJwt.verifyToken, authJwt.isAdmin], controller.deleteMaterial);
};
