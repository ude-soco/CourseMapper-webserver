const channelActivityGenerator = require("../generator/channel-generator");
const activityController = require("../controller/activity-controller");
const notifications = require("../../middlewares/Notifications/notifications");

export const createChannelLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      channelActivityGenerator.generateCreateChannelActivity(req),
      notifications.generateNotificationInfo(req)
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
      notifications.generateNotificationInfo(req)
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const accessChannelLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      channelActivityGenerator.generateAccessChannelActivity(req)
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
      notifications.generateNotificationInfo(req)
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const accessChannelDashboardLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      channelActivityGenerator.generateAccessChannelDashboardActivity(req)
    );
    res
      .status(200)
      .json({ message: "Channel dashboard access logged successfully" });
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};
export const newChannelIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      channelActivityGenerator.generateNewChannelIndicatorActivity(req)
    );
    res.status(201).send({
      success: req.locals.success,
      indicator: req.locals.indicator,
    });
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};
export const deleteChannelIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      channelActivityGenerator.generateDeleteChannelIndicatorActivity(req)
    );
    res.status(201).send({
      success: req.locals.success,
    });
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};
export const resizeChannelIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      channelActivityGenerator.generateResizeChannelIndicatorActivity(req)
    );
    res.status(200).send({ success: `Indicator resized successfully!` });
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};
export const reorderChannelIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      channelActivityGenerator.generateReorderChannelIndicatorActivity(req)
    );
    res.status(200).send({
      success: `Indicators updated successfully!`,
      indicators: req.locals.indicators,
    });
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};
