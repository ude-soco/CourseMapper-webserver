const notificationActivityGenerator = require("../generator/notification/notification-generator");
const activityController = require("../controller/activity-controller");
const notifications = require("../../middlewares/Notifications/notifications");

export const viewAllNotificationsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateViewAllNotificationsLog(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};

export const markNotificationsAsReadLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateMarkNotificationsAsRead(req)
    );
    res.status(200).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const markNotificationsAsUnreadLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateMarkNotificationsAsUnread(req)
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const starNotificationLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateStarNotification(req)
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const unstarNotificationLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateUnstarNotification(req)
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const removeNotificationLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateRemoveNotification(req)
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const followAnnotationLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateFollowAnnotation(req)
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const unfollowAnnotationLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateUnfollowAnnotation(req)
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const blockUserLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateBlockUser(req)
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const unblockUserLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateUnblockUser(req)
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const setMaterialNotificationSettingsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateSetMaterialNotificationSettings(req)
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const unsetMaterialNotificationSettingsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateUnsetMaterialNotificationSettings(
        req
      )
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const setChannelNotificationSettingsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateSetChannelNotificationSettings(req)
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const unsetChannelNotificationSettingsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateUnsetChannelNotificationSettings(
        req
      )
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const setTopicNotificationSettingsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateSetTopicNotificationSettings(req)
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const unsetTopicNotificationSettingsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateUnsetTopicNotificationSettings(req)
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const setCourseNotificationSettingsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateSetCourseNotificationSettings(req)
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const unsetCourseNotificationSettingsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateUnsetCourseNotificationSettings(req)
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
export const setGlobalNotificationSettingsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateSetGlobalNotificationSettings(req)
    );
    res.status(201).send(req.locals.response);
  } catch (error) {
    res.status(400).send({ error: "Error saving statement to mongo", error });
  }
};
