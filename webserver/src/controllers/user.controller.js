/**
 * @function allAccess
 * Test public access to all type of user roles
 *
 */
export const allAccess = (req, res) => {
  res.status(200).send("Public content");
};

/**
 * @function userBoard
 * Test access to role user
 *
 */
export const userBoard = (req, res) => {
  res.status(200).send("User content");
};

/**
 * @function moderatorBoard
 * Test access to role moderator
 *
 */
export const moderatorBoard = (req, res) => {
  res.status(200).send("Moderator content");
};

/**
 * @function adminBoard
 * Test access to role admin
 *
 */
export const adminBoard = (req, res) => {
  res.status(200).send("Admin content");
};
