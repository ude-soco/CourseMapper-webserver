import config from "./util/config";
import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "./util/generator-util";

const createChannelObject = (req) => {
  let channel = req.locals.channel;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}`,
    definition: {
      type: [`${origin}/activityType/channel`],
      name: {
        [config.language]: channel.name,
      },
      description: {
        [config.language]: channel.description,
      },
      extensions: {
        [`${origin}/extensions/channel`]: {
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
        type: [`${origin}/activityType/channel`],
        name: {
          [config.language]: channelToEdit.name,
        },
        description: {
          [config.language]: channelToEdit.description,
        },
        extensions: {
          [`${origin}/extensions/channel`]: {
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
        [`${origin}/extensions/channel`]: {
          name: updatedChannel.name,
          description: updatedChannel.description,
        },
      },
    },
    context: createContext(),
  };
};
