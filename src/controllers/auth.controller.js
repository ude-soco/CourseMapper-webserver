import { sign } from "jsonwebtoken";
import { hashSync, compareSync } from "bcryptjs";
const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;

/**
 * @function signup
 * User registration controller
 *
 * @param {string} req.body.username The username
 * @param {string} req.body.email The email
 * @param {string} req.body.password The new password
 * @param {Array} req.body.role The roles e.g., ['user']
 */
export const signup = (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashSync(req.body.password, 8),
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ error: err });
      return;
    }

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles },
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ error: err });
            return;
          }

          user.roles = roles.map((role) => role._id);
          user.save((err) => {
            if (err) {
              res.status(500).send({ error: err });
              return;
            }

            res
              .status(200)
              .send({ success: "User is successfully registered!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ error: err });
          return;
        }

        user.roles = [role._id];
        user.save((err) => {
          if (err) {
            res.status(500).send({ error: err });
            return;
          }

          res.status(200).send({ success: "User is successfully registered!" });
        });
      });
    }
  });
};

/**
 * @function signin
 * User login controller
 *
 * @param {string} req.body.username The username
 * @param {string} req.body.password The new password
 */
export const signin = (req, res) => {
  User.findOne({
    username: req.body.username,
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ error: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ error: "User not found." });
      }

      let passwordIsValid = compareSync(req.body.password, user.password);

      if (!passwordIsValid) {
        return res.status(401).send({ error: "Invalid Password!" });
      }

      let token = sign({ id: user.id }, config.secret, {
        expiresIn: 86400, // 24 hours
      });

      let authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }

      req.session.token = token;

      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        roles: authorities,
      });
    });
};

/**
 * @function signout
 * User logout controller
 *
 */
export const signout = async (req, res) => {
  try {
    req.session = null;
    return res.status(200).send({ success: "You've been signed out!" });
  } catch (err) {
    this.next(err);
  }
};
