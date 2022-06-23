const db = require("../models");
const User = db.user;
const Role = db.role;

const authAdmin = (req, res, next) => {
  req.isAdmin = false;

  User.findById(req.userId).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    Role.find({ _id: { $in: user.roles } }, (err, roles) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "admin") {
          req.isAdmin = true;
        }
      }
      next();
    });
  });
};

module.exports = authAdmin;
