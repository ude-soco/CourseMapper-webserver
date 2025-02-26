const userActivityGenerator = require("../generator/user-generator");
const activityController = require("../controller/activity-controller");

export const accessPersonalDashboardLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      userActivityGenerator.generateAccessPersonalDashboardActivity(req)
    );
    res
      .status(200)
      .json({ message: "Personal dashboard access logged successfully" });
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};

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
    res.status(500).send({ error: "Error saving statement to mongo", err });
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
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};
export const resizePersonalIndicatorLogger = async (req, res) => {
  try {
    req.locals.activity = await activityController.createActivity(
      userActivityGenerator.generateResizePersonalIndicatorActivity(req)
    );
    res.status(200).send({ success: `Indicator resized successfully!` });
  } catch (err) {
    res.status(500).send({ error: "Error saving statement to mongo", err });
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
    res.status(500).send({ error: "Error saving statement to mongo", err });
  }
};
