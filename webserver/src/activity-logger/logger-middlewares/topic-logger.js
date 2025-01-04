const topicActivityGenerator = require("../generator/topic-generator");
const activityController = require("../controller/activity-controller");
const notifications = require("../../middlewares/Notifications/notifications");

export const createTopicLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      topicActivityGenerator.generateCreateTopicActivity(req),
      notifications.generateNotificationInfo(req)
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const deleteTopicLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      topicActivityGenerator.generateDeleteTopicActivity(req),
      notifications.generateNotificationInfo(req)
    );
    next();
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};

export const accessTopicLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      topicActivityGenerator.generateAccessTopicActivity(req)
    );
    res.status(200).send(req.locals.response);
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
};

export const editTopicLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      topicActivityGenerator.generateEditTopicActivity(req),
      notifications.generateNotificationInfo(req)
    );
    next();
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};
export const newTopicIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      topicActivityGenerator.generateNewTopicIndicatorActivity(req)
    );
    res.status(201).send({
      success: req.locals.success,
      indicator: req.locals.indicator,
    });
  } catch (err) {
    res
      .status(500)
      .send({ error: "Error saving activity log", details: err.message });
  }
};
export const deleteTopicIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      topicActivityGenerator.generateDeleteTopicIndicatorActivity(req)
    );
    res.status(201).send({
      success: req.locals.success,
    });
  } catch (err) {
    res
      .status(500)
      .send({ error: "Error saving activity log", details: err.message });
  }
};
export const viewTopicIndicatorsLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      topicActivityGenerator.generateViewTopicIndicatorsActivity(req)
    );
    res.status(200).send(req.locals.indicators);
  } catch (err) {
    res
      .status(500)
      .send({ error: "Error saving activity log", details: err.message });
  }
};
export const resizeTopicIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      topicActivityGenerator.generateResizeTopicIndicatorActivity(req)
    );
    res.status(200).send();
  } catch (err) {
    res
      .status(500)
      .send({ error: "Error saving activity log", details: err.message });
  }
};
export const reorderTopicIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      topicActivityGenerator.generateReorderTopicIndicatorActivity(req)
    );
    res.status(200).send({
      success: `Indicators updated successfully!`,
      indicators: req.locals.indicators,
    });
  } catch (err) {
    res
      .status(500)
      .send({ error: "Error saving activity log", details: err.message });
  }
};
