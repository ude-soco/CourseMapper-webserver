import { verify } from "jsonwebtoken";

const ObjectId = require("mongoose").Types.ObjectId;

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
  let role;
  try {
    role = await Role.findOne({ _id: user.role });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  if (role.name === "admin") {
    return next();
  }
  return res.status(403).send({ message: "Require Admin Role!" });
};

const isModerator = async (req, res, next) => {
  const courseId = req.params.courseId;
  let user;
  try {
    user = await User.findById(req.userId);
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let role;
  try {
    role = await Role.findOne({ _id: user.role });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  if (role.name === "admin") {
    // console.log("admin")
    return next();
  } else {
    let foundCourse = user.courses.find(
      (item) => item.courseId.valueOf() === courseId
    );

    if (foundCourse) {
      try {
        role = await Role.findOne({ _id: foundCourse.role });
      } catch (err) {
        return res.status(500).send({ error: err });
      }

      if (role.name === "moderator") {
        // console.log("moderator")
        return next();
      }
      return res.status(403).send({ message: "Require Moderator Role!" });
    } else {
      return res.status(403).send({ message: "Require Moderator Role!" });
    }
  }
};

const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
};
module.exports = authJwt;
