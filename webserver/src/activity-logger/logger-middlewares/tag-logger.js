const tagActivityGenerator = require("../generator/tag-generator");
const activityController = require("../controller/activity-controller");

export const selectCourseTagLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      tagActivityGenerator.generateSelectCourseTagActivity(req)
    );
    res.status(200).json({ message: "Tag selection logged successfully" });
  } catch (error) {
    console.error("Error in logging tag selection:", error);
    res.status(400).send("Failed to log tag selection");
  }
};
export const selectTopicTagLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      tagActivityGenerator.generateSelectTopicTagActivity(req)
    );
    res.status(200).json({ message: "Tag selection logged successfully" });
  } catch (error) {
    console.error("Error in logging tag selection:", error);
    res.status(400).send("Failed to log tag selection");
  }
};
export const selectChannelTagLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      tagActivityGenerator.generateSelectChannelTagActivity(req)
    );
    res.status(200).json({ message: "Tag selection logged successfully" });
  } catch (error) {
    console.error("Error in logging tag selection:", error);
    res.status(400).send("Failed to log tag selection");
  }
};
export const selectMaterialTagLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      tagActivityGenerator.generateSelectMaterialTagActivity(req)
    );
    res.status(200).json({ message: "Tag selection logged successfully" });
  } catch (error) {
    console.error("Error in logging tag selection:", error);
    res.status(400).send("Failed to log tag selection");
  }
};
export const addTagToAnnotationLogger = async (req, res, next) => {
  const tags = req.locals.tags || [];
  try {
    for (const tag of tags) {
      req.locals.tag = tag; // Add the individual tag to req.locals
      await activityController.createActivity(
        tagActivityGenerator.generateAddTagToAnnotationActivity(req)
      );
    }
    next();
  } catch (error) {
    console.error("Error logging tag activities:", error);
    next();
  }
};
