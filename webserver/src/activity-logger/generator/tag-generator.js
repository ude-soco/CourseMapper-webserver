import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "./util/generator-util";
import config from "./util/config";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

const createTagObject = (req) => {
  const material = req.locals.material;
  const tag = req.locals.tag;
  let annotation = req.locals.annotation;
  if (req.locals.reply) {
    // If the Tag is generated in a reply, consider reply as an annotation, to keep the logging data correct.
    annotation = req.locals.reply;
  }
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/annotation/${annotation._id}/tag/${tag._id}`,
    definition: {
      type: "http://id.tincanapi.com/activitytype/tag",
      name: {
        [config.language]: tag.name,
      },
      extensions: {
        [`${origin}/extensions/tag`]: {
          tagId: tag._id,
          tagName: tag.name,
          courseId: material.courseId,
          topicId: material.topicId,
          channelId: material.courseId,
          materialId: material._id,
        },
      },
    },
  };
};
const createCourseTagObject = (req) => {
  const course = req.locals.course;
  const tag = req.locals.tag;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${course._id}/tag/${tag._id}`,
    definition: {
      type: "http://id.tincanapi.com/activitytype/tag",
      name: {
        [config.language]: `Annotations for ${tag.name} `,
      },
      extensions: {
        [`${DOMAIN}/extensions/tag`]: {
          id: tag._id,
          courseId: course._id,
          courseName: course.name,
        },
      },
    },
  };
};
const createTopicTagObject = (req) => {
  const topic = req.locals.topic;
  const tag = req.locals.tag;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${topic.courseId}/topic/${topic._id}/tag/${tag._id}`, //to Verify
    definition: {
      type: "http://id.tincanapi.com/activitytype/tag",
      name: {
        [config.language]: `Annotations for ${tag.name} `,
      },
      extensions: {
        [`${origin}/extensions/tag`]: {
          id: tag._id,
          topicName: topic.name,
          topicId: topic._id,
          courseId: topic.courseId,
        },
      },
    },
  };
};
const createChannelTagObject = (req) => {
  const channel = req.locals.channel;
  const tag = req.locals.tag;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}/tag/${tag._id}`,
    definition: {
      type: "http://id.tincanapi.com/activitytype/tag",
      name: {
        [config.language]: `Annotations for ${tag.name} `,
      },
      extensions: {
        [`${origin}/extensions/tag`]: {
          id: tag._id,
          channelName: channel.name,
          courseId: channel.courseId,
          topicId: channel.topicId,
          channelId: channel._id,
        },
      },
    },
  };
};
const createMaterialTagObject = (req) => {
  const material = req.locals.material;
  const tag = req.locals.tag;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/tag/${tag._id}`, //to Verify
    definition: {
      type: "http://id.tincanapi.com/activitytype/tag",
      name: {
        [config.language]: `Annotations for ${tag.name} `,
      },
      extensions: {
        [`${origin}/extensions/tag`]: {
          id: tag._id,
          materialName: material.name,
          courseId: material.courseId,
          topicId: material.topicId,
          channelId: material.channelId,
          materialId: material._id,
        },
      },
    },
  };
};
export const generateSelectCourseTagActivity = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: createCourseTagObject(req),
    context: createContext(),
  };
};
export const generateSelectTopicTagActivity = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: createTopicTagObject(req),
    context: createContext(),
  };
};
export const generateSelectChannelTagActivity = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: createChannelTagObject(req),
    context: createContext(),
  };
};
export const generateSelectMaterialTagActivity = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: createMaterialTagObject(req),
    context: createContext(),
  };
};
export const generateAddTagToAnnotationActivity = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/added", "added"),
    object: createTagObject(req),
    context: createContext(),
  };
};
