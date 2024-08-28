const statementFactory = require("../generator/channel-generator");
const lrs = require("../lrs/lrs");
const controller = require("../controller/activity-controller");
const ORIGIN = process.env.ORIGIN;
const notifications = require("../../middlewares/Notifications/notifications");

export const newChannel = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const statement = statementFactory.getChannelCreationStatement(
    req.locals.user,
    req.locals.channel,
    origin,
  );

  const notificationInfo = notifications.generateNotificationInfo(req);
  const sent = await lrs.sendStatementToLrs(statement);
  try {
    const activity = await controller.createActivityOld(
      statement,
      sent,
      notificationInfo,
    );
    //Add activity to req.locals so it can be used in the notification
    req.locals.activity = activity;
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
  next();
};

export const deleteChannel = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const statement = statementFactory.getChannelDeletionStatement(
    req.locals.user,
    req.locals.channel,
    origin,
  );
  const notificationInfo = notifications.generateNotificationInfo(req);
  const sent = await lrs.sendStatementToLrs(statement);
  try {
    const activity = await controller.createActivityOld(
      statement,
      sent,
      notificationInfo,
    );
    //Add activity to req.locals so it can be used in the notification
    req.locals.activity = activity;
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
  next();
};

export const editChannel = async (req, res, next) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const statement = statementFactory.getChannelEditStatement(
    req.locals.user,
    req.locals.newChannel,
    req.locals.oldChannel,
    origin,
  );
  const notificationInfo = notifications.generateNotificationInfo(req);
  const sent = await lrs.sendStatementToLrs(statement);
  try {
    const activity = await controller.createActivityOld(
      statement,
      sent,
      notificationInfo,
    );
    //Add activity to req.locals so it can be used in the notification
    req.locals.activity = activity;
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
  next();
};

export const getChannel = async (req, res) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const statement = statementFactory.getChannelAccessStatement(
    req.locals.user,
    req.locals.channel,
    origin,
  );

  const sent = await lrs.sendStatementToLrs(statement);
  controller.createActivityOld(statement, sent);
  res.status(200).send(req.locals.response);
};
