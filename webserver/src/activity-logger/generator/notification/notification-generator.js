import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../util/generator-util";
import config from "../util/config";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

const createNotificationObject = (req) => {
  let notifications = req.locals.notifications;
  let origin = req.get("origin");

  return {
    objectType: config.activity,
    id: `${origin}/activity/notifications`, // Represents all notifications as a group
    definition: {
      type: `${DOMAIN}/activityType/view-notifications`, // Custom type for viewing notifications
      name: {
        [config.language]: "View All Notifications",
      },
      extensions: {
        [`${origin}/extensions/notifications`]: notifications.map(
          (notification) => ({
            id: notification._id,
            course_id: notification.courseId,
            topic_id: notification.topicId,
            channel_id: notification.channelId,
            material_id: notification.materialId,
            annotation_id: notification.annotationId,
            reply_id: notification.replyId,
            isRead: notification.isRead,
            isStar: notification.isStar,
            createdAt: notification.createdAt,
          })
        ),
      },
    },
  };
};

const createNotificationObjectforUpdating = (req) => {
  let notification = req.locals.notification;
  // console.log(notification);
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/notification/${notification._id}`,
    name: {
      [config.language]: "Notification",
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
    object: createNotificationObject(req),
    context: createContext(),
  };
};
export const generateMarkNotificationsAsRead = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/read", "read"),
    object: createNotificationObjectforUpdating(req),
    context: createContext(),
  };
};

export const generateMarkNotificationsAsUnread = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      "http://id.tincanapi.com/verb/marked-unread",
      "marked-unread"
    ),
    object: createNotificationObjectforUpdating(req),
    context: createContext(),
  };
};

export const generateStarNotification = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      "http://activitystrea.ms/schema/1.0/favorite", //Can I use the verb favorited instead of starred?
      "favorited"
    ),
    object: createNotificationObjectforUpdating(req),
    context: createContext(),
  };
};
export const generateUnstarNotification = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      "http://activitystrea.ms/schema/1.0/unfavorite", //Can I use the verb unfavorited instead of starred?
      "unfavorited"
    ),
    object: createNotificationObjectforUpdating(req),
    context: createContext(),
  };
};
export const generateRemoveNotification = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/remove", "removed"),
    object: createNotificationObject(req),
    context: createContext(),
  };
};
export const generateFollowAnnotation = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/follow", "followed"),
    //object: createNotificationObject(req),
    context: createContext(),
  };
};
export const generateUnfollowAnnotation = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      "http://activitystrea.ms/schema/1.0/stop-following",
      "stopped following"
    ),
    //object: createNotificationObject(req),
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
    object: createMaterialNotificationSettingsObject(req),
    context: createContext(),
  };
};
export const generateUnsetMaterialNotificationSettings = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/unset", "unset"), // Problem: which verb should I use?
    object: createMaterialNotificationSettingsObject(req),
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
