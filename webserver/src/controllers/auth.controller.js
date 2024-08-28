import { JsonWebTokenError, sign } from "jsonwebtoken";
import { compareSync, hashSync } from "bcryptjs";
import nodemailer from "nodemailer";
import RestPassSchema from "../models/resetPassword.model.js";
import { authJwt } from "../middlewares";
import { verify } from "jsonwebtoken";

const config = require("../config/auth.config");
const db = require("../models");
const helpers = require("../helpers/helpers");
const User = db.user;
const Role = db.role;

/**
 * @function register
 * User registration controller
 *
 * @param {string} req.body.firstname The username
 * @param {string} req.body.lastname The username
 * @param {string} req.body.username The username
 * @param {string} req.body.email The email
 * @param {string} req.body.password The new password
 */
export const register = async (req, res, next) => {
  let role;
  try {
    role = await Role.findOne({ name: "user" });
  } catch (err) {
    return res.status(500).send({ error: "Error finding role" });
  }

  let generateMboxAndMboxSha1Sum = helpers.generateMboxAndMboxSha1Sum(
    req.body.email,
  );

  let user = new User({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    username: req.body.username,
    email: req.body.email,
    mbox: generateMboxAndMboxSha1Sum.mbox,
    mbox_sha1sum: generateMboxAndMboxSha1Sum.mbox_sha1sum,
    role: role._id,
    password: hashSync(req.body.password, 8),
  });

  try {
    await user.save();
    req.locals = {
      user: user,
      response: { success: "User is successfully registered!" },
    };
    return next();
  } catch (err) {
    return res.status(500).send({ error: "Error saving user" });
  }
};

/**
 * @function signIn
 * User login controller
 *
 * @param {string} req.body.username The username
 * @param {string} req.body.password The new password
 */
export const signIn = async (req, res, next) => {
  let username = req.body.username;
  let password = req.body.password;

  try {
    let user = await User.findOne({ username: username }).populate(
      "role",
      "-__v",
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
        role: user.role,
        email: user.email,
        mbox_sha1sum: user.mbox_sha1sum,
        courses: user.courses,
        token: token,
      },
    };
    return next();
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }
};

/**
 * @function signOut
 * User logout controller
 *
 */
export const signOut = async (req, res, next) => {
  const userId = req.userId;
  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
    req.session = null;
    req.locals = {
      user: user,
      response: { success: "You've been signed out!" },
    };
    return next();
  } catch (err) {
    this.next(err);
  }
};

export const sendEmail = async (req, res, next) => {
  let email = req.body.email;

  try {
    let user = await User.findOne({
      email: email,
    });

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    } else {
      let token = sign({ email: user.email }, config.secret, {
        expiresIn: 300, // 5 min change to 300
      });

      const newToken = new RestPassSchema({
        userId: user._id,
        token: token,
        email: user.email,
      });
      const mailTransporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: "coursemapper.soco@gmail.com",
          pass: "gzxi ednk zaft zyow",
        },
      });

      let mailDetails = {
        from: "coursemapper.soco@gmail.com",
        to: user.email,
        subject: "Reset Password",
        html: `<html>
        <head>
            <title>CourseMapper Password Reset </title> 
        </head>
        <body>
  
        <p>Dear ${user.username}, </p>
        <p>We have just received a password reset request for your account ${user.email} in CourseMapper. Please click
        <a href="https://${process.env.WEBAPP_URL}/restPassword/${token}"> here  </a> to reset your password. If the abve link dosent work copy and past this link into your browser: https://${process.env.WEBAPP_URL}/restPassword/${token}</p>

        <p>Please note that this link is only valid for 5 minutes. If you did not request a password reset, please ignore this email.</p>

        <p>Regards,</p>

        <p>The CourseMapper Team</p>
            
        </body>
    </html>`,
      };

      mailTransporter.sendMail(mailDetails, async (err, data) => {
        if (err) {
          return res
            .status(500)
            .send({ error: "something went wrong: " + err.message });
          //return next(CreateError(500, "something went wrong"));
        } else {
          await newToken.save();
          return res.status(200).send({
            success: `Email sent successfully`,
          });
        }
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }
};
export const resetPassword = async (req, res, next) => {
  let token = req.body.resetObj.token;
  let Passowrd = req.body.resetObj.password;
  verify(token, config.secret, async (err, data) => {
    if (err) {
      return res.status(500).send({ message: "Reset link is expired!" });
    }
    const dataResponse = data;
    let user = await User.findOne({
      email: dataResponse.email,
    });
    const enryptedPassword = hashSync(Passowrd, 8);
    user.password = enryptedPassword;
    try {
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        { $set: user },
        { new: true },
      );
      return res.status(200).send({
        success: `Reset Password scussess`,
      });
    } catch (error) {
      return res.status(500).send({ error: "Some went wrong" });
    }
  });
};
