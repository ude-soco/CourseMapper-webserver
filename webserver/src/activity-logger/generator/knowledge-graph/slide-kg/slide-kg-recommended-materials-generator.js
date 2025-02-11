import config from "../../util/config";

import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../../util/generator-util";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation
// Just to have it as a background
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

//Articles Section
const createArticleObject = (req) => {
  const articleTitle = req.locals.articleTitle;
  const articleId = req.locals.articleId;
  const articleAbstract = req.locals.articleDescription;
  const material = req.locals.material;
  const origin = req.get("origin");
  return {
    objectType: "Activity",
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/recommended-materials/article/${articleId}`,
    definition: {
      type: "http://activitystrea.ms/schema/1.0/article",
      name: {
        [config.language]: articleTitle,
      },
      description: {
        [config.language]: articleAbstract,
      },
      extensions: {
        [`${DOMAIN}/extensions/recommended-article`]: {
          articleId: articleId,
          materialId: material._id,
          channelId: material.channelId,
          topicId: material.topicId,
          courseId: material.courseId,
        },
      },
    },
  };
};
export const generateViewFullWikipediaArticle = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: createArticleObject(req),
    context: createContext(),
  };
};
export const generateExpandArticleAbstract = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/expand`, "expanded"), // * Custom verb
    object: createArticleObject(req),
    context: createContext(),
  };
};
export const generateCollapseArticleAbstract = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/collapse`, "collapsed"),
    object: createArticleObject(req),
    context: createContext(),
  };
};
