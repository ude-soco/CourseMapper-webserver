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

// Videos Section
const createRecommendedVideoObject = (req) => {
  const videoId = req.locals.videoId;
  const videoTitle = req.locals.videoTitle;
  const videoDescription = req.locals.videoDescription;
  const material = req.locals.material;
  const origin = req.get("origin");

  return {
    objectType: "Activity",
    id: `${origin}/activity/KnowledgeGraph/recommendedMaterials/video/${videoId}`,
    definition: {
      type: "http://activitystrea.ms/schema/1.0/video",
      name: {
        [config.language]: videoTitle,
      },
      description: {
        [config.language]: videoDescription,
      },
      extensions: {
        [`${DOMAIN}/extensions/recommended-video`]: {
          videoId: videoId,
          concepts: req.locals.concepts,
          materialId: material._id,
          channelId: material.channelId,
          topicId: material.topicId,
          courseId: material.courseId,
        },
      },
    },
  };
};
//TO VERIFY
export const generateViewedAllRecommendedVideos = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const videos = req.locals.videos;

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: "Activity",
      id: `${DOMAIN}/activity/recommended-videos`, //TO VERIFY
      definition: {
        type: "http://activitystrea.ms/schema/1.0/video",
        name: {
          [config.language]: "Recommended videos",
        },
        extensions: {
          [`${DOMAIN}/extensions/recommended-videos`]: {
            materialId: material._id,
            channelId: material.channelId,
            topicId: material.topicId,
            courseId: material.courseId,
            videos: videos, // That results all the 10 videos and their informations
          },
        },
      },
    },
    context: createContext(),
  };
};
export const generateMarkVideoAsHelpful = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/marked-helpful`, "marked-helpful"),
    object: createRecommendedVideoObject(req),
    context: createContext(),
  };
};
export const generateMarkVideoAsUnhelpful = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/marked-not-helpful`, "marked-not-helpful"),
    object: createRecommendedVideoObject(req),
    context: createContext(),
  };
};
export const generateUnmarkVideoAsHelpful = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/un-marked-helpful`, "un-marked-helpful"),
    object: createRecommendedVideoObject(req),
    context: createContext(),
  };
};

export const generateUnmarkVideoAsUnhelpful = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      `${DOMAIN}/verb/un-marked-as-helpful`,
      "un-marked-not-helpful"
    ),
    object: createRecommendedVideoObject(req),
    context: createContext(),
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

const createRecommendedArticleObject = (req) => {
  const articleId = req.locals.articleId;
  const articleTitle = req.locals.articleTitle;
  const articleAbstract = req.locals.articleAbstract;
  const material = req.locals.material;
  const origin = req.get("origin");

  return {
    objectType: "Activity",
    id: `${origin}/activity/KnowledgeGraph/recommendedMaterials/article/${articleId}`,
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
          concepts: req.locals.concepts, // * those are actual names of the checked concepts
          materialId: material._id,
          channelId: material.channelId,
          topicId: material.topicId,
          courseId: material.courseId,
        },
      },
    },
  };
};
export const generateViewedAllRecommendedArticles = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const articles = req.locals.articles;

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: "Activity",
      id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/recommended-articles`, //TO VERIFY
      definition: {
        type: "http://activitystrea.ms/schema/1.0/article",
        name: {
          [config.language]: "Recommended articles",
        },
        extensions: {
          [`${DOMAIN}/extensions/recommended-articles`]: {
            materialId: material._id,
            channelId: material.channelId,
            topicId: material.topicId,
            courseId: material.courseId,
            articles: articles, // That results all the 10 articles and their informations
          },
        },
      },
    },
    context: createContext(),
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
export const generateMarkArticleAsHelpful = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/marked-helpful`, "marked-helpful"),
    object: createRecommendedArticleObject(req),
    context: createContext(),
  };
};
export const generateMarkArticleAsUnhelpful = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/marked-not-helpful`, "marked-not-helpful"),
    object: createRecommendedArticleObject(req),
    context: createContext(),
  };
};
export const generateUnmarkArticleAsHelpful = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/un-marked-helpful`, "un-marked-helpful"),
    object: createRecommendedArticleObject(req),
    context: createContext(),
  };
};
export const generateUnmarkArticleAsUnhelpful = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      `${DOMAIN}/verb/un-marked-not-helpful`,
      "un-marked-not-helpful"
    ),
    object: createRecommendedArticleObject(req),
    context: createContext(),
  };
};
