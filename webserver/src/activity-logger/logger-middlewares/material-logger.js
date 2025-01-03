const materialActivityGenerator = require("../generator/material-generator");
const activityController = require("../controller/activity-controller");
const notifications = require("../../middlewares/Notifications/notifications");

export const addMaterialLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      materialActivityGenerator.generateAddMaterialActivity(req),
      notifications.generateNotificationInfo(req)
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const accessMaterialLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      materialActivityGenerator.generateAccessMaterialActivity(req)
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
      notifications.generateNotificationInfo(req)
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
      notifications.generateNotificationInfo(req)
    );
    next();
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};

export const playVideoLogger = async (req, res) => {
  if (req.locals.material.type === "video") {
    await activityController.createActivity(
      materialActivityGenerator.generatePlayVideoActivity(req)
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
      materialActivityGenerator.generatePauseVideoActivity(req)
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
      materialActivityGenerator.generateCompleteVideoActivity(req)
    );
    res.status(204).send();
  } else {
    res.status(406).send({
      error: `Material with id ${req.locals.material._id} is not a Video`,
    });
  }
};

export const viewSlideLogger = async (req, res) => {
  if (req.locals.material.type === "pdf") {
    await activityController.createActivity(
      materialActivityGenerator.generateViewSlideActivity(req)
    );
    res.status(204).send();
  } else {
    res.status(406).send({
      error: `Material with id ${req.locals.material._id} is not a pdf`,
    });
  }
};

export const completePDFLogger = async (req, res) => {
  if (req.locals.material.type === "pdf") {
    await activityController.createActivity(
      materialActivityGenerator.generateCompletePdfActivity(req)
    );
    res.status(204).send();
  } else {
    res.status(406).send({
      error: `Material with id ${req.locals.material._id} is not a pdf`,
    });
  }
};

export const newIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      materialActivityGenerator.generateNewIndicatorActivity(req)
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

export const deleteIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      materialActivityGenerator.generateDeleteIndicatorActivity(req)
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
export const viewIndicatorsLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      materialActivityGenerator.generateViewIndicatorsActivity(req)
    );
    res.status(200).send(req.locals.indicators);
  } catch (err) {
    res
      .status(500)
      .send({ error: "Error saving activity log", details: err.message });
  }
};
