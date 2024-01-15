const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const User = db.user;

/**endpoint which only prints a random string */
export const debug = (req, res) => {
  res.status(200).send("Debug content");
};
