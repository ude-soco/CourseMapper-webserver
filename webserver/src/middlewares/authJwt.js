import { verify } from "jsonwebtoken";

const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;
const Role = db.role;

const verifyToken = (req, res, next) => {
  let token = req.session.token;

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    next();
  });
};

const isAdmin = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userId);
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  let roles;
  try {
    roles = await Role.find({ _id: { $in: user.roles } });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  for (let i = 0; i < roles.length; i++) {
    if (roles[i].name === "admin") {
      return next();
    }
  }
  return res.status(403).send({ message: "Require Admin Role!" });
};

const isModerator = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userId);
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  let roles;
  try {
    roles = await Role.find({ _id: { $in: user.roles } });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  for (let i = 0; i < roles.length; i++) {
    if (roles[i].name === "moderator") {
      return next();
    }
  }
  return res.status(403).send({ message: "Require Moderator Role!" });
};

const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
};
module.exports = authJwt;
