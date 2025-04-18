import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../util/generator-util";
import config from "../util/config";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

const formatActivityType = (type) => {
  // Convert to lowercase and replace spaces with hiffens
  return type.toLowerCase().replace(/\s+/g, "-");
};
// This activity-object is for when user views all notifications
const createAllNotificationsObject = (req) => {
  let notifications = req.locals.notifications;
  let user = req.locals.user;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/user/${user._id}/notification`,
    definition: {
      type: `${DOMAIN}/activityType/notification`,
      name: {
        [config.language]: "All Notifications",
      },
      extensions: {
        [`${origin}/extensions/notification`]: {
          notifications: notifications.map((notification) => ({
            //TODO_Shoeb: To be reviewed. The array could be very long
            id: notification._id,
            userId: notification.userId,
            course_id: notification.courseId,
            topic_id: notification.topicId,
            channel_id: notification.channelId,
            material_id: notification.materialId,
            isRead: notification.isRead,
            isStar: notification.isStar,
            createdAt: notification.createdAt,
          })),
        },
      },
    },
  };
};
const createNotificationsObject = (req) => {
  let notifications = req.locals.notifications;
  let user = req.locals.user;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/user/${user._id}/notification`,
    definition: {
      type: `${DOMAIN}/activityType/notification`,
      name: {
        [config.language]: "Notifications",
      },
      description: {
        [config.language]: "A collection of notifications.",
      },
      extensions: {
        [`${origin}/extensions/notification`]: {
          notifications: notifications.map((notification) => ({
            //TODO_Shoeb: To be reviewed. The array could be very long
            id: notification._id,
            userId: notification.userId,
            course_id: notification.courseId,
            topic_id: notification.topicId,
            channel_id: notification.channelId,
            material_id: notification.materialId,
            isRead: notification.isRead,
            isStar: notification.isStar,
            createdAt: notification.createdAt,
          })),
        },
      },
    },
  };
};

const createNotificationObject = (req) => {
  let notification = req.locals.notifications[0];
  let user = req.locals.user;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/user/${user._id}/notification/${notification._id}`,
    definition: {
      type: `${DOMAIN}/activityType/notification`,
      name: {
        [config.language]: "Notification",
      },
      extensions: {
        [`${origin}/extensions/notification`]: {
          id: notification._id,
          userId: notification.userId,
          courseId: notification.courseId,
          topicId: notification.topicId,
          channelId: notification.channelId,
          materialId: notification.materialId,
          isStar: notification.isStar,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        },
      },
    },
  };
};
const createAnnotationObject = (req) => {
  let annotation = req.locals.annotation;
  let user = req.locals.user;
  let origin = req.get("origin");

  const formattedType = formatActivityType(annotation.type);

  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/annotation/${annotation._id}`,
    definition: {
      type: `${DOMAIN}/activityType/${formattedType}`,
      name: {
        [config.language]: `${annotation.type}`,
      },
      description: {
        [config.language]: annotation.content,
      },
      extensions: {
        [`${origin}/extensions/${formattedType}`]: {
          // Use the new annotation type
          id: annotation._id,
          userId: annotation.author.userId,
          user_name: annotation.author.name,
          courseId: annotation.courseId,
          topicId: annotation.topicId,
          channelId: annotation.channelId,
          materialId: annotation.materialId,
          materialType: annotation.materialType,
          annotationType: annotation.type,
          createdAt: annotation.createdAt,
        },
      },
    },
  };
};

const createGlobalNotificationSettingsObject = (req) => {
  let user = req.locals.user;
  let labelClicked = req.locals.labelClicked;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/user/${user._id}/global-notification-setting`,
    definition: {
      type: `${DOMAIN}/activityType/global-notification-setting`,
      name: {
        [config.language]: `${labelClicked} - Global Notification Settings`,
      },
      extensions: {
        [`${DOMAIN}/extensions/global-notification-setting`]: {
          user_id: user._id,
        },
      },
    },
  };
};

const createMaterialNotificationSettingsObject = (req) => {
  let material = req.locals.material;
  let labelClicked = req.locals.labelClicked;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/notification-setting`,
    definition: {
      type: `${DOMAIN}/activityType/material-notification-setting`,
      name: {
        [config.language]: `${labelClicked} - Material Notification Settings`,
      },
      extensions: {
        [`${DOMAIN}/extensions/material-notification-setting`]: {
          material_id: material._id,
          course_id: material.courseId,
          topic_id: material.topicId,
          channel_id: material.channelId,
          materialName: material.name,
        },
      },
    },
  };
};

const createChannelNotificationSettingsObject = (req) => {
  let channel = req.locals.channel;
  let labelClicked = req.locals.labelClicked;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}/notification-setting`,
    definition: {
      type: `${DOMAIN}/activityType/channel-notification-setting`,
      name: {
        [config.language]: `${labelClicked} - Channel Notification Settings`,
      },
      extensions: {
        [`${DOMAIN}/extensions/channel-notification-setting`]: {
          channel_id: channel._id,
          course_id: channel.courseId,
          topic_id: channel.topicId,
        },
      },
    },
  };
};

const createTopicNotificationSettingsObject = (req) => {
  let topic = req.locals.topic;
  let labelClicked = req.locals.labelClicked;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${topic.courseId}/topic/${topic._id}/notification-setting`,
    definition: {
      type: `${DOMAIN}/activityType/topic-notification-setting`,
      name: {
        [config.language]: `${labelClicked} - Topic Notification Settings`,
      },
      extensions: {
        [`${DOMAIN}/extensions/topic-notification-setting`]: {
          topic_id: topic._id,
          course_id: topic.courseId,
        },
      },
    },
  };
};
const createCourseNotificationSettingsObject = (req) => {
  let course = req.locals.course;
  let labelClicked = req.locals.labelClicked;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${course._id}/notification-setting`,
    definition: {
      type: `${DOMAIN}/activityType/course-notification-setting`,
      name: {
        [config.language]: `${labelClicked} - Course Notification Settings`,
      },
      extensions: {
        [`${DOMAIN}/extensions/course-notification-setting`]: {
          course_id: course._id,
        },
      },
    },
  };
};

const createBlockingUserObject = (req) => {
  let user = req.locals.user;
  let blockedUser = req.locals.blockedUser;

  let origin = req.get("origin");
  return {
    objectType: config.activity, // Note_Shoeb: Maybe it should  be "Agent"
    id: `${origin}/activity/user/${user._id}/blockedUser/${blockedUser._id}`,
    definition: {
      type: `${DOMAIN}/activityType/user`,
      name: {
        [config.language]: `${blockedUser.firstname} ${blockedUser.lastname}`,
      },
      extensions: {
        [`${DOMAIN}/extensions/user`]: {
          userId: blockedUser._id,
          firstName: blockedUser.firstname,
          lastName: blockedUser.lastname,
          email: blockedUser.email,
        },
      },
    },
  };
};

export const generateViewAllNotificationsLog = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: createAllNotificationsObject(req),
    context: createContext(),
  };
};
export const generateMarkNotificationsAsRead = (req) => {
  const metadata = createMetadata();
  const notifications = req.locals.notifications;

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/marked-read`, "marked as read"),
    object:
      notifications.length > 1
        ? createNotificationsObject(req)
        : createNotificationObject(req),
    context: createContext(),
  };
};

export const generateMarkNotificationsAsUnread = (req) => {
  const metadata = createMetadata();
  const notifications = req.locals.notifications;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      "http://id.tincanapi.com/verb/marked-unread",
      "marked as unread"
    ),
    object:
      notifications.length > 1
        ? createNotificationsObject(req)
        : createNotificationObject(req),
    context: createContext(),
  };
};

export const generateStarNotification = (req) => {
  const metadata = createMetadata();
  const notifications = req.locals.notifications;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/starred`, "starred"),
    object:
      notifications.length > 1
        ? createNotificationsObject(req)
        : createNotificationObject(req),
    context: createContext(),
  };
};
export const generateUnstarNotification = (req) => {
  const metadata = createMetadata();
  const notifications = req.locals.notifications;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/unstarred`, "unstarred"),
    object:
      notifications.length > 1
        ? createNotificationsObject(req)
        : createNotificationObject(req),
    context: createContext(),
  };
};
export const generateDeleteNotification = (req) => {
  const metadata = createMetadata();
  const notifications = req.locals.notifications;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/delete", "deleted"),
    object:
      notifications.length > 1
        ? createNotificationsObject(req)
        : createNotificationObject(req),
    context: createContext(),
  };
};
// Ideally, this generator is meant to be under annotation generator
// Reason: The controller is available in notification route
export const generateFollowAnnotation = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/follow", "followed"),
    object: createAnnotationObject(req),
    context: createContext(),
  };
};
// Ideally, this generator is meant to be under annotation generator
// Reason: The controller is available in notification route
export const generateUnfollowAnnotation = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/unfollowed`, "unfollowed"),
    object: createAnnotationObject(req),
    context: createContext(),
  };
};
export const generateBlockUser = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/block`, "blocked"),
    object: createBlockingUserObject(req),
    context: createContext(),
  };
};
export const generateUnblockUser = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/unblock`, "unblocked"),
    object: createBlockingUserObject(req),
    context: createContext(),
  };
};
export const generateEnableMaterialNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/enabled", "enabled"),
    object: createMaterialNotificationSettingsObject(req),
    context: createContext(),
  };
};
export const generateDisableMaterialNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/disabled", "disabled"),
    object: createMaterialNotificationSettingsObject(req),
    context: createContext(),
  };
};
export const generateResetMaterialNotificationSettings = (req) => {
  const metadata = createMetadata();
  const origin = req.get("origin");
  let material = req.locals.material;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/reset`, "reset"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/notification-setting`,
      definition: {
        type: `${DOMAIN}/activityType/material-notification-setting`,
        name: {
          [config.language]: `Material Notification Settings`,
        },
        extensions: {
          [`${DOMAIN}/extensions/material-notification-setting`]: {
            material_id: material._id,
            course_id: material.courseId,
            topic_id: material.topicId,
            channel_id: material.channelId,
            materialName: material.name,
          },
        },
      },
    },
    context: createContext(),
  };
};
export const generateEnableChannelNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/enabled", "enabled"),
    object: createChannelNotificationSettingsObject(req),
    context: createContext(),
  };
};
export const generateDisableChannelNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/disabled", "disabled"),
    object: createChannelNotificationSettingsObject(req),
    context: createContext(),
  };
};
export const generateResetChannelNotificationSettings = (req) => {
  const metadata = createMetadata();
  const origin = req.get("origin");
  let channel = req.locals.channel;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/reset`, "reset"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}/notification-setting`,
      definition: {
        type: `${DOMAIN}/activityType/channel-notification-setting`,
        name: {
          [config.language]: `Channel Notification Settings`,
        },
        extensions: {
          [`${DOMAIN}/extensions/channel-notification-setting`]: {
            course_id: channel.courseId,
            topic_id: channel.topicId,
            channel_id: channel._id,
          },
        },
      },
    },
    context: createContext(),
  };
};
export const generateEnableTopicNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/enabled", "enabled"),
    object: createTopicNotificationSettingsObject(req),
    context: createContext(),
  };
};
export const generateDisableTopicNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/disabled", "disabled"),
    object: createTopicNotificationSettingsObject(req),
    context: createContext(),
  };
};
export const generateResetTopicNotificationSettings = (req) => {
  const metadata = createMetadata();
  const origin = req.get("origin");
  let topic = req.locals.topic;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/reset`, "reset"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${topic.courseId}/topic/${topic._id}/notification-setting`,
      definition: {
        type: `${DOMAIN}/activityType/topic-notification-setting`,
        name: {
          [config.language]: `Topic Notification Settings`,
        },
        extensions: {
          [`${DOMAIN}/extensions/topic-notification-setting`]: {
            course_id: topic.courseId,
            topic_id: topic._id,
          },
        },
      },
    },
    context: createContext(),
  };
};
export const generateEnableCourseNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/enabled", "enabled"),
    object: createCourseNotificationSettingsObject(req),
    context: createContext(),
  };
};
export const generateDisableCourseNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/disabled", "disabled"),
    object: createCourseNotificationSettingsObject(req),
    context: createContext(),
  };
};
export const generateResetCourseNotificationSettings = (req) => {
  const metadata = createMetadata();
  const origin = req.get("origin");
  let course = req.locals.course;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/reset`, "reset"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${course._id}/notification-setting`,
      definition: {
        type: `${DOMAIN}/activityType/course-notification-setting`,
        name: {
          [config.language]: `Course Notification Settings`,
        },
        extensions: {
          [`${DOMAIN}/extensions/course-notification-setting`]: {
            course_id: course._id,
          },
        },
      },
    },
    context: createContext(),
  };
};
export const generateEnableGlobalNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/enabled", "enabled"),
    object: createGlobalNotificationSettingsObject(req),
    context: createContext(),
  };
};
export const generateDisableGlobalNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/disabled", "disabled"),
    object: createGlobalNotificationSettingsObject(req),
    context: createContext(),
  };
};
