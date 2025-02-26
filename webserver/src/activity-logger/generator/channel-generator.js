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
    verb: createVerb("http://id.tincanapi.com/verb/resize", "resized"), // TO VERIFY AND CORRECT, I couldn't find the verb in the registry Database
    object: createResizedChannelIndicatorObject(req),
    context: createContext(),
  };
};
export const generateReorderChannelIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/reorder", "reordered"), // TO VERIFY AND CORRECT, I couldn't find the verb in the registry Database
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
    id: `${origin}/activity/channelIndicator/${indicator._id}`, //To verify
    definition: {
      type: `http://id.tincanapi.com/activitytype/channelIndicator`, //To verify
      source: {
        [config.language]: indicator.src,
      },
      width: {
        [config.language]: indicator.width,
      },
      height: {
        [config.language]: indicator.height,
      },
      frameborder: {
        [config.language]: indicator.frameborder,
      },
      extensions: {
        [`${origin}/extensions/channelIndicator`]: {
          channelId: channel._id,
          channelName: channel.name,
          channelDescription: channel.description,
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
    id: `${origin}/activity/channelIndicator/${indicator._id}`, //To verify
    definition: {
      type: `http://id.tincanapi.com/activitytype/channelIndicator`, //To verify
      source: {
        [config.language]: indicator.src,
      },
      oldDimensions: {
        oldWidth: { [config.language]: oldDimensions.width },
        oldHeight: { [config.language]: oldDimensions.height },
      },
      newDimensions: {
        newWidth: { [config.language]: newDimensions.width },
        newHeight: { [config.language]: newDimensions.height },
      },
      frameborder: {
        [config.language]: indicator.frameborder,
      },
      extensions: {
        [`${origin}/extensions/channelIndicator`]: {
          channelId: channel._id,
          channelName: channel.name,
          channelDescription: channel.description,
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
    id: `${origin}/activity/channelIndicator/${indicator._id}`, //To verify
    definition: {
      type: `http://id.tincanapi.com/activitytype/channelIndicator`, //To verify
      source: {
        [config.language]: indicator.src,
      },
      width: {
        [config.language]: indicator.width,
      },
      height: {
        [config.language]: indicator.height,
      },
      oldIndex: {
        [config.language]: oldIndex,
      },
      newIndex: {
        [config.language]: newIndex,
      },
      frameborder: {
        [config.language]: indicator.frameborder,
      },
      extensions: {
        [`${origin}/extensions/channelIndicator`]: {
          channelId: channel._id,
          channelName: channel.name,
          channelDescription: channel.description,
          topicId: channel.topicId,
          courseId: channel.courseId,
        },
      },
    },
  };
};
