const db = require("../models");
const ROLES = db.ROLES;
const User = db.user;
import catchAsync from "../helpers/catchAsync";

const checkDuplicateUsernameOrEmail = catchAsync(async (req, res, next) => {
  let user;
  try {
    user = await User.findOne({ username: req.body.username });
    if (user) {
      return res
        .status(400)
        .send({ message: "Failed! Username is already in use!" });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }
  try {
    user = await User.findOne({ email: req.body.email });
    if (user) {
      res.status(400).send({ message: "Failed! Email is already in use!" });
      return;
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }
  return next();
});

const checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        return res.status(400).send({
          message: `Failed! Role ${req.body.roles[i]} does not exist!`,
        });
      }
    }
  }
  return next();
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
};

module.exports = verifySignUp;
