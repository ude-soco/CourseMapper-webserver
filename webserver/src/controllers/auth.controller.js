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
    verified: false, // Mark user as unverified initially
  });

  try {
    await user.save();
    let token = sign({ email: user.email }, config.secret, {
      expiresIn: 3000, // 5 min change to 300
    });

    // Email details
    let mailDetails = {
      from: "coursemapper.soco@gmail.com",
      to: user.email,
      subject: "Verify Your Email",
      html: `<html>
            <head>
                <title>CourseMapper Email Verification</title> 
            </head>
            <body>
            <p>Dear ${user.username},</p>
            <p>Thank you for registering with CourseMapper. Please click <a href="https://${process.env.WEBAPP_URL}/verify/${token}">here</a> to verify your email address. If the above link doesn't work, copy and paste this link into your browser: https://${process.env.WEBAPP_URL}/verify/${token}</p>
            <p>Please note that this link is only valid for 24 hours. If you did not register, please ignore this email.</p>
            <p>Regards,</p>
            <p>The CourseMapper Team</p>
            </body>
        </html>`,
    };
    mailTransporter.sendMail(mailDetails, async (err, data) => {
      if (err) {
        return res
          .status(500)
          .send({ error: "Error sending verification email: " + err.message });
        //return next(CreateError(500, "something went wrong"));
      } else {
        req.session.token = token;
        return res.status(200).send({
          user: user,
          token:token,
          success: `Registration successful! Please verify your email.`,
        });
      }
    });
    
    req.locals = {
      user: user,
      
      response: { success: "User is successfully registered!" },
    };
    // return next();
  } catch (err) {
    return res.status(500).send({ error: "Error saving user" });
  }
};
const mailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "coursemapper.soco@gmail.com",
    pass: "gzxi ednk zaft zyow",
  },
});

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
    //check if the email is verified or not ahhs i have it in email vervication just the flag
    let token = sign({ id: user.id }, config.secret, {
      expiresIn: 86400, // 24 hours
    });
    // If the flag is missing (undefined) or false, send verification email
    if (!user.verified) {
      // Send the verification email using nodemailer

      let mailDetails = {
        from: "coursemapper.soco@gmail.com",
        to: user.email,
        subject: "Verify Your Email",
        html: `<html>
          <head>
              <title>CourseMapper Email Verification</title> 
          </head>
          <body>
          <p>Dear ${user.username},</p>
          <p>Thank you for registering with CourseMapper. Please click <a href="https://${process.env.WEBAPP_URL}/verify/${token}">here</a> to verify your email address. If the above link doesn't work, copy and paste this link into your browser: https://${process.env.WEBAPP_URL}/verify/${token}</p>
          <p>Please note that this link is only valid for 24 hours. If you did not register, please ignore this email.</p>
          <p>Regards,</p>
          <p>The CourseMapper Team</p>
          </body>
      </html>`,
      };
      try {
        user.verified = false;
        await user.save();
        await mailTransporter.sendMail(mailDetails);
        return res.status(403).send({
          error:
            "Email not verified. A verification link has been sent to your email.",
        });
      } catch (emailError) {
        return res.status(500).send({
          error: "Failed to send verification email. Please try again later.",
        });
      }
    }

    let passwordIsValid = await compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({ error: "Invalid Password!" });
    }

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
        verified: user.verified,
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
      // const mailTransporter = nodemailer.createTransport({
      //   host: "smtp.gmail.com",
      //   port: 587,
      //   secure: false,
      //   auth: {
      //     user: "coursemapper.soco@gmail.com",
      //     pass: "gzxi ednk zaft zyow",
      //   },
      // });

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
        { new: true }
      );
      return res.status(200).send({
        success: `Reset Password scussess`,
      });
    } catch (error) {
      return res.status(500).send({ error: "Some went wrong" });
    }
  });
};

export const verifyEmail = async (req, res, next) => {
  let token = req.body.token;

  try {
    verify(token, config.secret, async (err, data) => {
      if (err) {
        return res.status(500).send({ message: "Reset link is expired!" });
      }

      let user = await User.findOne({
        $or: [
          { email: data.email },
          { _id: data.id }, // Assuming 'data.id' holds the user ID when email is not present
        ],
      });

      if (!user || user.verified) {
        return res.status(500).send({ message: "Invalid or already verified" });
      }
      user.verified = true;

      req.locals = {
        user: await user.save(),
        response: { message: "Email verified successfully" },
      };
      return next();
      //return res.status(200).send({ message: 'Email verified successfully' });
    });
  } catch (error) {
    return res.status(500).send({ error: "Some went wrong" });
  }
};


export const resendVerifyEmail = async (req, res, next) => {
  let token = req.body.token;




    verify(token, config.secret, async (err, data) => {
      if (err) {
        return res.status(500).send({ message: "Reset link is expired!" });
      }

      let user = await User.findOne({
        $or: [
          { email: data.email },
          { _id: data.id }, // Assuming 'data.id' holds the user ID when email is not present
        ],
      });

      if (!user) {
        return res.status(404).send({ error: "User not found." });
    }

    if (user.verified) {
        return res.status(400).send({ message: "Email is already verified." });
    }
    
       // Send verification email
    let mailDetails = {
      from: "coursemapper.soco@gmail.com",
      to: user.email,
      subject: "Verify Your Email",
      html: `<html>
        <head>
            <title>CourseMapper Email Verification</title> 
        </head>
        <body>
        <p>Dear ${user.username},</p>
        <p>Thank you for registering with CourseMapper. Please click <a href="https://${process.env.WEBAPP_URL}/verify/${token}">here</a> to verify your email address. If the above link doesn't work, copy and paste this link into your browser: https://${process.env.WEBAPP_URL}/verify/${token}</p>
        <p>Please note that this link is only valid for 24 hours. If you did not register, please ignore this email.</p>
        <p>Regards,</p>
        <p>The CourseMapper Team</p>
        </body>
    </html>`,
    };


    try {
     
      await mailTransporter.sendMail(mailDetails);
      return res.status(200).send({
        message:
          "A verification link has been sent to your email.",
      });
    } catch (emailError) {
      return res.status(500).send({
        error: "Failed to send verification email. Please try again later.",
      });
    }
    });


    // const userId = req.params.userId;
    // const user = await User.findById(userId);


    // Generate a new verification token
    // let token = sign({ id: user.id }, config.secret, {
    //   expiresIn: 86400, // 24 hours
    // });
    

   

};
