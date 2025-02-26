import config from "./util/config";
import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "./util/generator-util";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

const createChannelObject = (req) => {
  let channel = req.locals.channel;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}`,
    definition: {
      type: `${DOMAIN}/activityType/channel`,
      name: {
        [config.language]: channel.name,
      },
      description: {
        [config.language]: channel.description,
      },
      extensions: {
        [`${DOMAIN}/extensions/channel`]: {
          id: channel._id,
          course_id: channel.courseId,
          topic_id: channel.topicId,
          name: channel.name,
          description: channel.description,
        },
      },
    },
  };
};
export const generateCreateChannelActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/create", "created"),
    object: createChannelObject(req),
    context: createContext(),
  };
};

export const generateDeleteChannelActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/delete", "deleted"),
    object: createChannelObject(req),
    context: createContext(),
  };
};

export const generateAccessChannelActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/access", "accessed"),
    object: createChannelObject(req),
    context: createContext(),
  };
};

export const generateEditChannelActivity = (req) => {
  const metadata = createMetadata();
  let updatedChannel = req.locals.newChannel;
  let channelToEdit = req.locals.oldChannel;
  let origin = req.get("origin");
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://curatr3.com/define/verb/edited", "edited"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${channelToEdit.courseId}/topic/${channelToEdit.topicId}/channel/${channelToEdit._id}`,
      definition: {
        type: `${DOMAIN}/activityType/channel`,
        name: {
          [config.language]: channelToEdit.name,
        },
        description: {
          [config.language]: channelToEdit.description,
        },
        extensions: {
          [`${DOMAIN}/extensions/channel`]: {
            id: channelToEdit._id,
            course_id: channelToEdit.courseId,
            topic_id: channelToEdit.topicId,
            name: channelToEdit.name,
            description: channelToEdit.description,
          },
        },
      },
    },
    result: {
      extensions: {
        [`${DOMAIN}/extensions/channel`]: {
          name: updatedChannel.name,
          description: updatedChannel.description,
        },
      },
    },
    context: createContext(),
  };
};
const createChannelDashboardObject = (req) => {
  const channel = req.locals.channel;
  const origin = req.get("origin");

  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}/dashboard`,
    definition: {
      type: `${DOMAIN}/activityType/channel-dashboard`,
      name: {
        [config.language]: `${channel.name} Dashboard`,
      },
      extensions: {
        [`${origin}/extensions/channel-dashboard`]: {
          indicators: channel.indicators,
          channelName: channel.name,
          channelDescription: channel.description,
          channelId: channel._id,
          topicId: channel.topicId,
          courseId: channel.courseId,
        },
      },
    },
  };
};

export const generateAccessChannelDashboardActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/access", "accessed"),
    object: createChannelDashboardObject(req),
    context: createContext(),
  };
};
export const generateNewChannelIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/add", "added"),
    object: createChannelIndicatorObject(req),
    context: createContext(),
  };
};
export const generateDeleteChannelIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/delete", "deleted"),
    object: createChannelIndicatorObject(req),
    context: createContext(),
  };
};

export const generateResizeChannelIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/resize`, "resized"),
    object: createResizedChannelIndicatorObject(req),
    context: createContext(),
  };
};
export const generateReorderChannelIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/reorder`, "reordered"),
    object: createReorderedChannelIndicatorObject(req),
    context: createContext(),
  };
};
export const createChannelIndicatorObject = (req) => {
  const indicator = req.locals.indicator;
  const channel = req.locals.channel;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}/indicator/${indicator._id}`,
    definition: {
      type: `${DOMAIN}/activityType/channel-indicator`,
      name: {
        [config.language]: "Channel Indicator", // To verify
      },
      extensions: {
        [`${origin}/extensions/channel-indicator`]: {
          id: indicator._id,
          source: indicator.src,
          width: indicator.width,
          height: indicator.height,
          frameborder: indicator.frameborder,
          channelId: channel._id,
          topicId: channel.topicId,
          courseId: channel.courseId,
        },
      },
    },
  };
};
export const createResizedChannelIndicatorObject = (req) => {
  const indicator = req.locals.indicator;
  const channel = req.locals.channel;
  const oldDimensions = req.locals.oldDimensions;
  const newDimensions = req.locals.newDimentions;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}/indicator/${indicator._id}`,
    definition: {
      type: `${DOMAIN}/activityType/channel-indicator`,
      name: {
        [config.language]: "Channel Indicator", // To verify
      },
      extensions: {
        [`${origin}/extensions/channel-indicator`]: {
          id: indicator._id,
          oldDimensions: oldDimensions,
          newDimensions: newDimensions,
          frameborder: indicator.frameborder,
          channelId: channel._id,
          topicId: channel.topicId,
          courseId: channel.courseId,
        },
      },
    },
  };
};
export const createReorderedChannelIndicatorObject = (req) => {
  const indicator = req.locals.indicator;
  const channel = req.locals.channel;
  const oldIndex = req.locals.oldIndex;
  const newIndex = req.locals.newIndex;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}/indicator/${indicator._id}`,
    definition: {
      type: `${DOMAIN}/activityType/channel-indicator`,
      name: {
        [config.language]: "Channel Indicator", // To verify
      },
      extensions: {
        [`${origin}/extensions/channel-indicator`]: {
          id: indicator._id,
          oldIndex: oldIndex,
          newIndex: newIndex,
          frameborder: indicator.frameborder,
          channelId: channel._id,
          topicId: channel.topicId,
          courseId: channel.courseId,
        },
      },
    },
  };
};
