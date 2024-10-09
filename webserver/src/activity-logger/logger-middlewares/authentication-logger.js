const authenticationGenerator = require("../generator/auth-generator");
const activityController = require("../controller/activity-controller");

export const registerLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      authenticationGenerator.generateRegisterActivity(req),
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
};

export const signInLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      authenticationGenerator.generateSignInActivity(req),
    );
    res.status(200).send(req.locals.response);
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
};

export const signOutLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      authenticationGenerator.generateSignOutActivity(req),
    );
    res.status(200).send(req.locals.response);
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
};
