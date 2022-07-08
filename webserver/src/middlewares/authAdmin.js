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
  let role;
  try {
    role = await Role.find({ _id: user.role });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  if (role.name === "admin") {
    req.isAdmin = true;
  }
  next();
};

module.exports = authAdmin;
