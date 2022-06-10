import {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
} from "../middlewares/verifySignUp";
import { signin, signup, signout } from "../controllers/auth.controller";

export const authRoute = (app) => {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post(
    "/api/auth/signup",
    [checkDuplicateUsernameOrEmail, checkRolesExisted],
    signup
  );

  app.post("/api/auth/signin", signin);

  app.post("/api/auth/signout", signout);
};
