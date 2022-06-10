/**
 * @function allAccess
 * Test public access to all type of user roles
 *
 */
exports.allAccess = (req, res) => {
  res.status(200).send("Public content");
};

/**
 * @function userBoard
 * Test access to role user
 *
 */
exports.userBoard = (req, res) => {
  res.status(200).send("User content");
};

/**
 * @function moderatorBoard
 * Test access to role moderator
 *
 */
exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator content");
};

/**
 * @function adminBoard
 * Test access to role admin
 *
 */
exports.adminBoard = (req, res) => {
  res.status(200).send("Admin content");
};
