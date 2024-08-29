const materialActivityGenerator = require("../generator/material-generator");
const lrs = require("../lrs/lrs");
const activityController = require("../controller/activity-controller");
const ORIGIN = process.env.ORIGIN;
const notifications = require("../../middlewares/Notifications/notifications");

export const addMaterialLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      materialActivityGenerator.generateAddMaterialActivity(req),
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const accessMaterialLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      materialActivityGenerator.generateAccessMaterialActivity(req),
    );
    res.status(200).send(req.locals.response);
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
};

export const deleteMaterialLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      materialActivityGenerator.generateDeleteMaterialActivity(req),
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const editMaterialLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      materialActivityGenerator.generateEditMaterialActivity(req),
      notifications.generateNotificationInfo(req),
    );
    next();
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};

export const playVideoLogger = async (req, res) => {
  if (req.locals.material.type === "video") {
    await activityController.createActivity(
      materialActivityGenerator.generatePlayVideoActivity(req),
    );
    res.status(204).send();
  } else {
    res.status(406).send({
      error: `Material with id ${req.locals.material._id} is not a video`,
    });
  }
};

export const pauseVideoLogger = async (req, res) => {
  if (req.locals.material.type === "video") {
    await activityController.createActivity(
      materialActivityGenerator.generatePauseVideoActivity(req),
    );
    res.status(204).send();
  } else {
    res.status(406).send({
      error: `Material with id ${req.locals.material._id} is not a Video`,
    });
  }
};

export const completeVideoLogger = async (req, res) => {
  if (req.locals.material.type === "video") {
    await activityController.createActivity(
      materialActivityGenerator.generateCompleteVideoActivity(req),
    );
    res.status(204).send();
  } else {
    res.status(406).send({
      error: `Material with id ${req.locals.material._id} is not a Video`,
    });
  }
};

export const viewSlideLogger = async (req, res) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  const slideNr = req.params.slideNr;
  if (req.locals.material.type === "pdf") {
    const statement = materialActivityGenerator.generateViewSlideActivity(
      req.locals.user,
      req.locals.material,
      slideNr,
      origin,
    );
    const sent = await lrs.sendStatementToLrs(statement);
    await activityController.createActivityOld(statement, sent);
    return res.status(204).send();
  }
  return res.status(406).send({
    error: `Material with id ${req.locals.material._id} is not a pdf`,
  });
};

export const completePDFLogger = async (req, res) => {
  const origin = req.get("origin") ? req.get("origin") : ORIGIN;
  if (req.locals.material.type === "pdf") {
    const statement = materialActivityGenerator.generateCompletePdfActivity(
      req.locals.user,
      req.locals.material,
      origin,
    );
    const sent = await lrs.sendStatementToLrs(statement);
    await activityController.createActivityOld(statement, sent);
    return res.status(204).send();
  }

  return res.status(406).send({
    error: `Material with id ${req.locals.material._id} is not a pdf`,
  });
};
