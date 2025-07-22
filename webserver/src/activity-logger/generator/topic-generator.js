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
const createTopicDashboardObject = (req) => {
  const topic = req.locals.topic;
  const origin = req.get("origin");

  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${topic.courseId}/topic/${topic._id}/topic-dashboard`,
    definition: {
      type: `${DOMAIN}/activityType/topic-dashboard`,
      name: {
        [config.language]: `Topic Dashboard - ${topic.name}`,
      },
      extensions: {
        [`${origin}/extensions/topic-dashboard`]: {
          indicators: topic.indicators,
          courseId: topic.courseId,
          topicId: topic._id,
          topicName: topic.name,
        },
      },
    },
  };
};

export const generateAccessTopicDashboardActivity = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/access", "accessed"),
    object: createTopicDashboardObject(req),
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

export const generateResizeTopicIndicatorActivity = (req) => {
  const metadata = createMetadata();
  const newDimensions = req.locals.newDimentions;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/resize`, "resized"),
    object: createResizedTopicIndicatorObject(req),
    context: createContext(),
  };
};
export const generateReorderTopicIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/reorder`, "reordered"),
    object: createReorderedTopicIndicatorObject(req),
    context: createContext(),
  };
};

export const createTopicIndicatorObject = (req) => {
  const indicator = req.locals.indicator;
  const topic = req.locals.topic;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${topic.courseId}/topic/${topic._id}/indicator/${indicator._id}`,
    definition: {
      type: `${DOMAIN}/activityType/topic-indicator`,
      name: {
        [config.language]: `Topic Indicator Id: ${indicator._id} - ${topic.name} Dashboard`,
      },
      extensions: {
        [`${origin}/extensions/topic-indicator`]: {
          id: indicator._id,
          source: indicator.src,
          width: indicator.width,
          height: indicator.height,
          frameborder: indicator.frameborder,
          topicId: topic._id,
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
  const newDimensions = req.locals.newDimentions;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${topic.courseId}/topic/${topic._id}/indicator/${indicator._id}`,
    definition: {
      type: `${DOMAIN}/activityType/topic-indicator`,
      name: {
        [config.language]: `Topic Indicator Id: ${indicator._id} - ${topic.name} Dashboard`,
      },
      extensions: {
        [`${origin}/extensions/topic-indicator`]: {
          id: indicator._id,
          oldDimensions: oldDimensions,
          newDimensions: newDimensions,
          source: indicator.src,
          frameborder: indicator.frameborder,
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
    id: `${origin}/activity/course/${topic.courseId}/topic/${topic._id}/indicator/${indicator._id}`,
    definition: {
      type: `${DOMAIN}/activityType/topic-indicator`,
      name: {
        [config.language]: `Topic Indicator Id: ${indicator._id} - ${topic.name} Dashboard`, //TODO: Maybe we can add course.name Dashboard
      },
      extensions: {
        [`${origin}/extensions/topic-indicator`]: {
          id: indicator._id,
          oldIndex: oldIndex,
          newIndex: newIndex,
          source: indicator.src,
          frameborder: indicator.frameborder,
          topicId: topic._id,
          topicName: topic.name,
          courseId: topic.courseId,
        },
      },
    },
  };
};
