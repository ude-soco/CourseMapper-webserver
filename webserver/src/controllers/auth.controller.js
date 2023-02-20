import { sign } from "jsonwebtoken";
import { compareSync, hashSync } from "bcryptjs";

const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;

/**
 * @function signup
 * User registration controller
 *
 * @param {string} req.body.firstname The username
 * @param {string} req.body.lastname The username
 * @param {string} req.body.username The username
 * @param {string} req.body.email The email
 * @param {string} req.body.password The new password
 */
export const signup = async (req, res, next) => {
  let role;
  try {
    role = await Role.findOne({ name: "user" });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let user = new User({

    firstname: req.body.firstname,
    lastname: req.body.lastname,
    username: req.body.username,
    email: req.body.email,
    role: role._id,
    password: hashSync(req.body.password, 8),
  });

  try {
    await user.save();

    req.locals = {
      user: user,
      response: { success: "User is successfully registered!" }
    }
    return next();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
};

/**
 * @function signin
 * User login controller
 *
 * @param {string} req.body.username The username
 * @param {string} req.body.password The new password
 */
export const signin = async (req, res, next) => {
  let username = req.body.username;
  let password = req.body.password;

  try {
    let user = await User.findOne({ username: username }).populate(
      "role",
      "-__v"
    );
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    let passwordIsValid = await compareSync(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({ error: "Invalid Password!" });
    }

    let token = sign({ id: user.id }, config.secret, {
      expiresIn: 86400, // 24 hours
    });

    req.session.token = token;

    const userName = `${user.firstname} ${user.lastname}`;

    req.locals = {
      user: user,
      response: {
        id: user._id,
        name: userName,
        username: user.username,
        email: user.email,
        courses: user.courses,
      }
    }
    return next();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
};

/**
 * @function signout
 * User logout controller
 *
 */
export const signout = async (req, res, next) => {
  const userId = req.userId;
  try {
    let user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    req.session = null;

    req.locals = {
      user: user,
      response: { success: "You've been signed out!" }
    }
    return next();
  } catch (err) {
    this.next(err);
  }
};
