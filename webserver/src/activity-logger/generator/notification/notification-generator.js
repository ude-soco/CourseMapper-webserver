import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../util/generator-util";
import config from "../util/config";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

const createNotificationsObject = (req) => {
  let notifications = req.locals.notifications;
  let user = req.locals.user;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/${user._id}/notifications`,
    definition: {
      type: `${DOMAIN}/activityType/notifications`,
      name: {
        [config.language]: "Notifications",
      },
      description: {
        [config.language]: "A collection of notifications.",
      },
      extensions: {
        [`${origin}/extensions/notifications`]: {
          notifications: notifications.map((notification) => ({
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
    id: `${origin}/activity/${user._id}/notification/${notification._id}`,
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
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/annotation/${annotation._id}`,
    definition: {
      type: `${DOMAIN}/activityType/${annotation.type}`,
      name: {
        [config.language]: `${annotation.type}`,
      },
      description: {
        [config.language]: annotation.content,
      },
      extensions: {
        [`${origin}/extensions/${annotation.type}`]: {
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

const createMaterialNotificationSettingsObject = (req) => {
  let notificationSettings = req.locals.response;
  //console.log(notificationSettings);
  // let origin = req.get("origin");
  // return {
  //   objectType: config.activity,
  //   id: `${origin}/activity/materialNotificationSettings/${notificationSettings._id}`,
  //   name: {
  //     [config.language]: "Material Notification Settings",
  //   },
  //   extensions: {
  //     [`${origin}/extensions/MaterialNotificationSettings`]: {
  //       courseId: notificationSettings.courseId,
  //       isAnnotationNotificationsEnabled:
  //         notificationSettings.isAnnotationNotificationsEnabled,
  //       isReplyAndMentionedNotificationsEnabled:
  //         notificationSettings.isReplyAndMentionedNotificationsEnabled,
  //       isCourseUpdateNotificationsEnabled:
  //         notificationSettings.isReplyAndMentionedNotificationsEnabled,
  //       isCourseLevelOverride:
  //         notificationSettings.isReplyAndMentionedNotificationsEnabled,
  //     },
  //   },
  // };
};
const createBlockingNotificationObject = (req) => {
  let blockedUser = req.locals.blockedUser;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/user/${blockedUser._id}`,
    definition: {
      type: `${DOMAIN}/activityType/user`,
      name: {
        [config.language]: "Blocked User",
      },
      extensions: {
        [`${origin}/extensions/User`]: {
          firstName: blockedUser.firstname,
          lastName: blockedUser.lastname,
          email: blockedUser.email,
        },
      },
    },
  };
};
const createUnblockingNotificationObject = (req) => {
  let unblockedUser = req.locals.unblockedUser;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/user/${unblockedUser._id}`,
    definition: {
      type: `${DOMAIN}/activityType/user`,
      name: {
        [config.language]: "Unblocked User",
      },
      extensions: {
        [`${origin}/extensions/User`]: {
          firstName: unblockedUser.firstname,
          lastName: unblockedUser.lastname,
          email: unblockedUser.email,
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
    object: createNotificationsObject(req),
    context: createContext(),
  };
};
export const generateMarkNotificationsAsRead = (req) => {
  const metadata = createMetadata();
  const notifications = req.locals.notifications;

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/marked-read`, "marked-read"),
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
      "marked-unread"
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
export const generateRemoveNotification = (req) => {
  const metadata = createMetadata();
  const notifications = req.locals.notifications;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/delete", "delete"),
    object:
      notifications.length > 1
        ? createNotificationsObject(req)
        : createNotificationObject(req),
    context: createContext(),
  };
};
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
    verb: createVerb(
      "https://xapi.elearn.rwth-aachen.de/definitions/lms/verbs/blocked",
      "blocked"
    ),
    object: createBlockingNotificationObject(req),
    context: createContext(),
  };
};
export const generateUnblockUser = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      "https://xapi.elearn.rwth-aachen.de/definitions/lms/verbs/unblocked",
      "unblocked"
    ),
    object: createUnblockingNotificationObject(req),
    context: createContext(),
  };
};
export const generateSetMaterialNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/set", "set"), // Problem: which verb should I use?
    // object: createMaterialNotificationSettingsObject(req),
    context: createContext(),
  };
};
export const generateUnsetMaterialNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/unset", "unset"), // Problem: which verb should I use?
    // object: createMaterialNotificationSettingsObject(req),
    context: createContext(),
  };
};
export const generateSetChannelNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/set", "set"), // Problem: which verb should I use?
    //object: ,
    context: createContext(),
  };
};
export const generateUnsetChannelNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/unset", "unset"), // Problem: which verb should I use?
    // object: ,
    context: createContext(),
  };
};
export const generateSetTopicNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/set", "set"), // Problem: which verb should I use?
    //object: ,
    context: createContext(),
  };
};
export const generateUnsetTopicNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/unset", "unset"), // Problem: which verb should I use?
    // object: ,
    context: createContext(),
  };
};
export const generateSetCourseNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/set", "set"), // Problem: which verb should I use?
    //object: ,
    context: createContext(),
  };
};
export const generateUnsetCourseNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/unset", "unset"), // Problem: which verb should I use?
    // object: ,
    context: createContext(),
  };
};
export const generateSetGlobalNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/set", "set"), // Problem: which verb should I use?
    //object: ,
    context: createContext(),
  };
};
