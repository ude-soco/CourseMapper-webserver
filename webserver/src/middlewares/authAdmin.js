const db = require("../models");
const User = db.user;
const Role = db.role;

const authAdmin = async (req, res, next) => {
  req.isAdmin = false;

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
      req.isAdmin = true;
    }
  }
  next();
};

module.exports = authAdmin;
