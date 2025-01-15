import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "./util/generator-util";
import config from "./util/config";

const createTagObject = (req) => {
  const tag = req.locals.tag;
  const annotation = req.locals.annotation;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/annotation/${annotation._id}/tag/${tag._id}`, //to Verify
    definition: {
      type: "http://id.tincanapi.com/activitytype/tag", // to Verify
      name: {
        [config.language]: tag.name,
      },
      annotation: {
        [config.language]: annotation.content,
      },
      extensions: {
        [`${origin}/extensions/course`]: {
          tagId: tag._id,
          annotationId: tag.annotationId,
          courseId: tag.courseId,
          topicId: tag.topicId,
          channelId: tag.courseId,
          materialId: tag.materialId,
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
    id: `${origin}/activity/course/${course._id}/tag/${tag._id}`, //to Verify
    definition: {
      type: "http://id.tincanapi.com/activitytype/tag",
      name: {
        [config.language]: tag.name,
      },
      extensions: {
        [`${origin}/extensions/course`]: {
          id: tag._id,
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
    id: `${origin}/activity/topic/${topic._id}/tag/${tag._id}`, //to Verify
    definition: {
      type: "http://id.tincanapi.com/activitytype/tag",
      name: {
        [config.language]: tag.name,
      },
      extensions: {
        [`${origin}/extensions/topic`]: {
          id: tag._id,
          topicName: topic.name,
          courseId: topic.courseId,
          channelId: tag.channelId,
          materialId: tag.materialId,
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
    id: `${origin}/activity/channel/${channel._id}/tag/${tag._id}`, //to Verify
    definition: {
      type: "http://id.tincanapi.com/activitytype/tag",
      name: {
        [config.language]: tag.name,
      },
      extensions: {
        [`${origin}/extensions/channel`]: {
          id: tag._id,
          channelName: channel.name,
          courseId: channel.courseId,
          channelId: tag.channelId,
          materialId: tag.materialId,
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
    id: `${origin}/activity/material/${material._id}/tag/${tag._id}`, //to Verify
    definition: {
      type: "http://id.tincanapi.com/activitytype/tag",
      name: {
        [config.language]: tag.name,
      },
      extensions: {
        [`${origin}/extensions/material`]: {
          id: tag._id,
          materialName: material.name,
          courseId: material.courseId,
          channelId: tag.channelId,
          materialId: tag.materialId,
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
    verb: createVerb("http://id.tincanapi.com/verb/selected", "selected"),
    object: createCourseTagObject(req),
    context: createContext(),
  };
};
export const generateSelectTopicTagActivity = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/selected", "selected"),
    object: createTopicTagObject(req),
    context: createContext(),
  };
};
export const generateSelectChannelTagActivity = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/selected", "selected"),
    object: createChannelTagObject(req),
    context: createContext(),
  };
};
export const generateSelectMaterialTagActivity = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/selected", "selected"),
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
