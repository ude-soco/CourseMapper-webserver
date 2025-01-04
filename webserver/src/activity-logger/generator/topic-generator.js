import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "./util/generator-util";
import config from "./util/config";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

const createTopicObject = (req) => {
  let topic = req.locals.topic;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${topic.courseId}/topic/${topic._id}`,
    definition: {
      type: `${DOMAIN}/activityType/topic`,
      name: {
        [config.language]: topic.name,
      },
      extensions: {
        [`${DOMAIN}/extensions/topic`]: {
          id: topic._id,
          course_id: topic.courseId,
          name: topic.name,
        },
      },
    },
  };
};

export const generateCreateTopicActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/create", "created"),
    object: createTopicObject(req),
    context: createContext(),
  };
};

export const generateDeleteTopicActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/delete", "deleted"),
    object: createTopicObject(req),
    context: createContext(),
  };
};

export const generateAccessTopicActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/access", "accessed"),
    object: createTopicObject(req),
    context: createContext(),
  };
};

export const generateEditTopicActivity = (req) => {
  const metadata = createMetadata();
  let updatedTopic = req.locals.newTopic;
  let topicToEdit = req.locals.oldTopic;
  let origin = req.get("origin");
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://curatr3.com/define/verb/edited", "edited"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${topicToEdit.courseId}/topic/${topicToEdit._id}`,
      definition: {
        type: `${DOMAIN}/activityType/topic`,
        name: {
          [config.language]: topicToEdit.name,
        },
        extensions: {
          [`${DOMAIN}/extensions/topic`]: {
            id: topicToEdit._id,
            course_id: topicToEdit.courseId,
            name: topicToEdit.name,
          },
        },
      },
    },
    result: {
      extensions: {
        [`${DOMAIN}/extensions/topic`]: {
          name: updatedTopic.name,
        },
      },
    },
    context: createContext(),
  };
};
export const generateNewTopicIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/add", "added"),
    object: createTopicIndicatorObject(req),
    context: createContext(),
  };
};
export const generateDeleteTopicIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/delete", "deleted"),
    object: createTopicIndicatorObject(req),
    context: createContext(),
  };
};
export const generateViewTopicIndicatorsActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: createGetTopicIndicatorsObject(req),
    context: createContext(),
  };
};
export const generateResizeTopicIndicatorActivity = (req) => {
  const metadata = createMetadata();
  const newDimensions = req.locals.newDimentions;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/resize", "resized"), // TO VERIFY AND CORRECT, I couldn't find the verb in the registry Database
    object: createResizedTopicIndicatorObject(req),
    result: {
      extensions: {
        [`${DOMAIN}/extensions/topicIndicator`]: {
          newDimensions: {
            newWidth: { [config.language]: newDimensions.width },
            newHeight: { [config.language]: newDimensions.height },
          },
        },
      },
    },
    context: createContext(),
  };
};
export const generateReorderTopicIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/reorder", "reordered"), // TO VERIFY AND CORRECT, I couldn't find the verb in the registry Database
    object: createReorderedTopicIndicatorObject(req),
    context: createContext(),
  };
};
export const createGetTopicIndicatorsObject = (req) => {
  const indicators = req.locals.indicators;
  const topic = req.locals.topic;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/topicIndicators`, // TO VERIFY
    definition: {
      type: `http://id.tincanapi.com/activitytype/topicIndicators`, // TO VERIFY
      items: indicators.map((indicator) => ({
        id: `${origin}/activity/indicator/${indicator._id}`,
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
      })),
      extensions: {
        [`${DOMAIN}/extensions/topicIndicators`]: {
          topicId: topic._id,
          topicName: topic.name,
          courseId: topic.courseId,
        },
      },
    },
  };
};
export const createTopicIndicatorObject = (req) => {
  const indicator = req.locals.indicator;
  const topic = req.locals.topic;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/topicIndicator/${indicator._id}`, //To verify
    definition: {
      type: `http://id.tincanapi.com/activitytype/topicIndicator`, //To verify
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
        [`${DOMAIN}/extensions/topicIndicator`]: {
          topicId: topic._id,
          topicName: topic.name,
          courseId: topic.courseId,
        },
      },
    },
  };
};
export const createResizedTopicIndicatorObject = (req) => {
  const indicator = req.locals.indicator;
  const topic = req.locals.topic;
  const oldDimensions = req.locals.oldDimensions;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/topicIndicator/${indicator._id}`, //To verify
    definition: {
      type: `http://id.tincanapi.com/activitytype/topicIndicator`, //To verify
      source: {
        [config.language]: indicator.src,
      },
      oldDimensions: {
        oldWidth: { [config.language]: oldDimensions.width },
        oldHeight: { [config.language]: oldDimensions.height },
      },
      frameborder: {
        [config.language]: indicator.frameborder,
      },
      extensions: {
        [`${DOMAIN}/extensions/topicIndicator`]: {
          topicId: topic._id,
          topicName: topic.name,
          courseId: topic.courseId,
        },
      },
    },
  };
};
export const createReorderedTopicIndicatorObject = (req) => {
  const indicator = req.locals.indicator;
  const topic = req.locals.topic;
  const oldIndex = req.locals.oldIndex;
  const newIndex = req.locals.newIndex;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/topicIndicator/${indicator._id}`, //To verify
    definition: {
      type: `http://id.tincanapi.com/activitytype/topicIndicator`, //To verify
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
        [`${DOMAIN}/extensions/topicIndicator`]: {
          topicId: topic._id,
          topicName: topic.name,
          courseId: topic.courseId,
        },
      },
    },
  };
};
