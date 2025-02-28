import config from "../../util/config";

import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../../util/generator-util";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation
// Videos Section
const createRecommendedVideoObject = (req) => {
  const videoId = req.locals.videoId;
  const videoTitle = req.locals.videoTitle;
  const videoDescription = req.locals.videoDescription;
  const material = req.locals.material;
  const materialPage = req.locals.materialPage;
  const origin = req.get("origin");

  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/recommended-video/${videoId}`,
    definition: {
      type: "http://activitystrea.ms/schema/1.0/video",
      name: {
        [config.language]: videoTitle,
      },
      description: {
        [config.language]: videoDescription,
      },
      extensions: {
        [`${DOMAIN}/extensions/video`]: {
          videoId: videoId,
          concepts: req.locals.concepts,
          materialId: material._id,
          channelId: material.channelId,
          topicId: material.topicId,
          courseId: material.courseId,
          materialPage: materialPage,
        },
      },
    },
  };
};

export const generateViewedAllRecommendedVideos = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const videos = req.locals.videos;
  const materialPage = req.locals.materialPage;
  const origin = req.get("origin");
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/recommended-videos`,
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
            materialPage: materialPage,
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
const createRecommendedArticleObject = (req) => {
  const articleTitle = req.locals.articleTitle;
  const articleId = req.locals.articleId;
  const articleAbstract = req.locals.articleDescription;
  const material = req.locals.material;
  const materialPage = req.locals.materialPage;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/recommended-article/${articleId}`,
    definition: {
      type: "http://activitystrea.ms/schema/1.0/article",
      name: {
        [config.language]: articleTitle,
      },
      description: {
        [config.language]: articleAbstract,
      },
      extensions: {
        [`${DOMAIN}/extensions/article`]: {
          articleId: articleId,
          materialId: material._id,
          channelId: material.channelId,
          topicId: material.topicId,
          courseId: material.courseId,
          materialPage: materialPage,
        },
      },
    },
  };
};

export const generateViewedAllRecommendedArticles = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const articles = req.locals.articles;
  const materialPage = req.locals.materialPage;
  const origin = req.get("origin");
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/recommended-articles`,
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
            materialPage: materialPage,
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
    object: createRecommendedArticleObject(req),
    context: createContext(),
  };
};
export const generateExpandArticleAbstract = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/expand`, "expanded"), // * Custom verb
    object: createRecommendedArticleObject(req),
    context: createContext(),
  };
};
export const generateCollapseArticleAbstract = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/collapse`, "collapsed"),
    object: createRecommendedArticleObject(req),
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
