const channelActivityGenerator = require("../generator/channel-generator");
const activityController = require("../controller/activity-controller");
const notifications = require("../../middlewares/Notifications/notifications");

export const createChannelLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      channelActivityGenerator.generateCreateChannelActivity(req),
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const deleteChannelLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      channelActivityGenerator.generateDeleteChannelActivity(req),
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const accessChannelLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      channelActivityGenerator.generateAccessChannelActivity(req),
    );
    res.status(200).send(req.locals.response);
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
};

export const editChannelLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      channelActivityGenerator.generateEditChannelActivity(req),
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
