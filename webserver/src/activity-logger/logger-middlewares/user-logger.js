const userActivityGenerator = require("../generator/user-generator");
const activityController = require("../controller/activity-controller");

export const newPersonalIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      userActivityGenerator.generateNewPersonalIndicatorActivity(req)
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
export const deletePersonalIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      userActivityGenerator.generateDeletePersonalIndicatorActivity(req)
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
export const viewPersonalIndicatorsLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      userActivityGenerator.generateViewPersonalIndicatorsActivity(req)
    );
    res.status(200).send(req.locals.indicators);
  } catch (err) {
    res
      .status(500)
      .send({ error: "Error saving activity log", details: err.message });
  }
};
export const resizePersonalIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      userActivityGenerator.generateResizePersonalIndicatorActivity(req)
    );
    res.status(200).send({ success: `Indicator resized successfully!` });
  } catch (err) {
    res
      .status(500)
      .send({ error: "Error saving activity log", details: err.message });
  }
};
export const reorderPersonalIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      userActivityGenerator.generateReorderPersonalIndicatorActivity(req)
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
