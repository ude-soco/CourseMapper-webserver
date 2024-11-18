// import { verify } from "jsonwebtoken";

const { verify, TokenExpiredError } = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;
const Role = db.role;

const verifyToken = (req, res, next) => {
  let token = req.session.token;

  if (!token) {
    return res.status(401).send({ message: "No token provided!" });
  }

  verify(token, config.secret, (err, decoded) => {
    if (err) {
      // if (err instanceof TokenExpiredError) {
      //   // Token has expired, clear the session and log the user out
      //   req.session = null;  // Clear session to log the user out
      //   return res.status(401).send({ message: "Token has expired. You have been logged out." });
      // }
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
  req.isAdmin = false;

  let user;
  try {
    user = await User.findById(req.userId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }
  let role;
  try {
    role = await Role.findOne({ _id: user.role });
  } catch (err) {
    return res.status(500).send({ error: "Error finding role" });
  }
  if (role.name === "admin") {
    req.isAdmin = true;
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
  req.isAdmin = false;
  req.isModerator = false;

  let user;
  try {
    user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).send({
        error: `User not found!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }

  let role;
  try {
    role = await Role.findOne({ _id: user.role });
  } catch (err) {
    return res.status(500).send({ error: "Error finding role" });
  }

  if (role.name === "admin") {
    req.isAdmin = true;
    return next();
  } else {
    let foundCourse = user.courses.find(
      (item) => item.courseId.valueOf() === courseId
    );

    if (foundCourse) {
      try {
        role = await Role.findOne({ _id: foundCourse.role });
      } catch (err) {
        return res.status(500).send({ error: "Error finding role" });
      }

      if (role.name === "moderator") {
        req.isModerator = true;
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
  req.isAdmin = false;
  req.isModerator = false;

  let user;
  try {
    user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).send({
        error: `User not found!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }

  let role;
  try {
    role = await Role.findOne({ _id: user.role });
  } catch (err) {
    return res.status(500).send({ error: "Error finding role" });
  }

  if (role.name === "admin") {
    req.isAdmin = true;
    return next();
  } else {
    let foundCourse = user.courses.find(
      (item) => item.courseId.valueOf() === courseId
    );

    if (foundCourse) {
      if (role.name === "moderator") {
        req.isModerator = true;
      }
      return next();
    } else {
      return res
        .status(403)
        .send({ message: "Access denied! User need to be enrolled!" });
    }
  }
};

const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
  isEnrolled,
};
module.exports = authJwt;
