const topicActivityGenerator = require("../generator/topic-generator");
const activityController = require("../controller/activity-controller");
const notifications = require("../../middlewares/Notifications/notifications");

export const createTopicLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      topicActivityGenerator.generateCreateTopicActivity(req),
      notifications.generateNotificationInfo(req),
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
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};

// TODO: Not logged from frontend
export const accessTopicLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      topicActivityGenerator.generateAccessTopicActivity(req),
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
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};
