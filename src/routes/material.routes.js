import { authJwt } from "../middlewares";
import { newMaterial } from "../controllers/material.controller";

export const materialRoute = (app) => {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // TODO:  Later, isAdmin middleware needs to be removed.
  //        A new middleware will be required to check whether a user is the creator of the course.
  //        Only authorized creator can update the courses. Maybe update the isModerator middleware
  app.post(
    "/new-material/:channelId",
    [authJwt.verifyToken, authJwt.isAdmin],
    newMaterial
  );
};
