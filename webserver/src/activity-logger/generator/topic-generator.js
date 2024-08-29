import { v4 as uuidv4 } from "uuid";
import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "./util/generator-util";
import config from "./util/config";

const platform = "CourseMapper";
const language = "en-US";

const createTopicObject = (req) => {
  let topic = req.locals.topic;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${topic.courseId}/topic/${topic._id}`,
    definition: {
      type: [`${origin}/activityType/topic`],
      name: {
        [config.language]: topic.name,
      },
      extensions: {
        [`${origin}/extensions/topic`]: {
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

export const getTopicDeletionStatement = (user, topic, origin) => {
  const userId = user._id.toString();
  const userFullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: userFullname,
      mbox: user.mbox,
      mbox_sha1sum: user.mbox_sha1sum,
      account: {
        homePage: origin,
        name: userId,
      },
    },
    verb: {
      id: "http://activitystrea.ms/schema/1.0/delete",
      display: {
        [language]: "deleted",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${topic.courseId}/topic/${topic._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/topic",
        name: {
          [language]: topic.name,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/topic": {
            id: topic._id,
            course_id: topic.courseId,
            name: topic.name,
          },
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};

export const getTopicAccessStatement = (user, topic, origin) => {
  const userId = user._id.toString();
  const userFullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: userFullname,
      mbox: user.mbox,
      mbox_sha1sum: user.mbox_sha1sum,
      account: {
        homePage: origin,
        name: userId,
      },
    },
    verb: {
      id: "http://activitystrea.ms/schema/1.0/access",
      display: {
        [language]: "accessed",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${topic.courseId}/topic/${topic._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/topic",
        name: {
          [language]: topic.name,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/topic": {
            id: topic._id,
            course_id: topic.courseId,
            name: topic.name,
          },
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};

export const getTopicEditStatement = (user, newTopic, oldtTopic, origin) => {
  const userId = user._id.toString();
  const userFullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: userFullname,
      mbox: user.mbox,
      mbox_sha1sum: user.mbox_sha1sum,
      account: {
        homePage: origin,
        name: userId,
      },
    },
    verb: {
      id: "http://curatr3.com/define/verb/edited",
      display: {
        [language]: "edited",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${oldtTopic.courseId}/topic/${oldtTopic._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/topic",
        name: {
          [language]: oldtTopic.name,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/topic": {
            id: oldtTopic._id,
            course_id: oldtTopic.courseId,
            name: oldtTopic.name,
          },
        },
      },
    },
    result: {
      extensions: {
        "http://www.CourseMapper.de/extensions/topic": {
          name: newTopic.name,
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};
