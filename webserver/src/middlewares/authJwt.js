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

/**
 * @function isAdmin
 * Validates if a user is admin
 *
 * @param {string} req.userId The id of the user
 */
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

/**
 * @function isModerator
 * Validates if a user is the moderator a course
 * Validates if a user is admin
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.userId The id of the user
 */
const isModerator = async (req, res, next) => {
  const courseId = req.params.courseId;
  let user;
  try {
    user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).send({
        error: `User not found!`,
      });
    }
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

/**
 * @function isEnrolled
 * Validates if a user is enrolled to a course
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.userId The id of the user
 */
const isEnrolled = async (req, res, next) => {
  const courseId = req.params.courseId;
  let user;
  try {
    user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).send({
        error: `User not found!`,
      });
    }
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
  } else {
    let foundCourse = user.courses.find(
      (item) => item.courseId.valueOf() === courseId
    );

    if (foundCourse) {
      return next();
    } else {
      return res
        .status(403)
        .send({ message: "Access denied! User need to be enrolled!" });
    }
  }
}

const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
  isEnrolled,
};
module.exports = authJwt;
