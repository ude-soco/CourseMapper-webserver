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
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const markNotificationsAsReadLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateMarkNotificationsAsRead(req)
    );
    res.status(200).send(req.locals.response);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const markNotificationsAsUnreadLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateMarkNotificationsAsUnread(req)
    );
    res.status(200).send(req.locals.response);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const starNotificationLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateStarNotification(req)
    );
    res.status(200).send(req.locals.response);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const unstarNotificationLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateUnstarNotification(req)
    );
    res.status(200).send(req.locals.response);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const removeNotificationLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateRemoveNotification(req)
    );
    res.status(200).send(req.locals.response);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const followAnnotationLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateFollowAnnotation(req)
    );
    res.status(201).send(req.locals.response);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const unfollowAnnotationLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateUnfollowAnnotation(req)
    );
    res.status(201).send(req.locals.response);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const blockUserLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateBlockUser(req)
    );
    res.status(201).send(req.locals.response);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const unblockUserLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateUnblockUser(req)
    );
    res.status(201).send(req.locals.response);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const setMaterialNotificationSettingsLogger = async (req, res) => {
  try {
    if (req.locals.key) {
      await activityController.createActivity(
        notificationActivityGenerator.generateEnableMaterialNotificationSettings(
          req
        )
      ); // Enable
    } else {
      await activityController.createActivity(
        notificationActivityGenerator.generateDisableMaterialNotificationSettings(
          req
        )
      ); //Disable
    }

    res.status(201).send(req.locals.response);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
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
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const setChannelNotificationSettingsLogger = async (req, res) => {
  try {
    if (req.locals.key) {
      await activityController.createActivity(
        notificationActivityGenerator.generateEnableChannelNotificationSettings(
          req
        )
      ); // Enable
    } else {
      await activityController.createActivity(
        notificationActivityGenerator.generateDisableChannelNotificationSettings(
          req
        )
      ); //Disable
    }
    res.status(201).send(req.locals.response);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
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
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const setTopicNotificationSettingsLogger = async (req, res) => {
  try {
    if (req.locals.key) {
      await activityController.createActivity(
        notificationActivityGenerator.generateEnableTopicNotificationSettings(
          req
        )
      ); // Enable
    } else {
      await activityController.createActivity(
        notificationActivityGenerator.generateDisableTopicNotificationSettings(
          req
        )
      ); //Disable
    }
    res.status(201).send(req.locals.response);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const unsetTopicNotificationSettingsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateUnsetTopicNotificationSettings(req)
    );
    res.status(201).send(req.locals.response);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const setCourseNotificationSettingsLogger = async (req, res) => {
  try {
    if (req.locals.key) {
      await activityController.createActivity(
        notificationActivityGenerator.generateEnableCourseNotificationSettings(
          req
        )
      ); // Enable
    } else {
      await activityController.createActivity(
        notificationActivityGenerator.generateDisableCourseNotificationSettings(
          req
        )
      ); //Disable
    }
    res.status(201).send(req.locals.response);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const unsetCourseNotificationSettingsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      notificationActivityGenerator.generateUnsetCourseNotificationSettings(req)
    );
    res.status(201).send(req.locals.response);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const setGlobalNotificationSettingsLogger = async (req, res) => {
  try {
    if (req.locals.key) {
      await activityController.createActivity(
        notificationActivityGenerator.generateEnableGlobalNotificationSettings(
          req
        )
      ); // Enable
    } else {
      await activityController.createActivity(
        notificationActivityGenerator.generateDisableGlobalNotificationSettings(
          req
        )
      ); //Disable
    }
    res.status(201).send(req.locals.response);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
