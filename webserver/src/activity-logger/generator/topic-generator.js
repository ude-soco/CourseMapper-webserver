import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "./util/generator-util";
import config from "./util/config";

let DOMAIN = "http://www.CourseMapper.de" // TODO: Hardcoded due to frontend implementation

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
