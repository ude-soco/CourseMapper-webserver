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
      type: `${DOMAIN}/activityType/recommended-video`,
      name: {
        [config.language]: `Recommended video '${videoTitle}'`,
      },
      description: {
        [config.language]: videoDescription || "",
      },
      extensions: {
        [`${DOMAIN}/extensions/recommended-video`]: {
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
    verb: createVerb(`${DOMAIN}/verb/viewed-all`, "viewed all"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/recommended-video`,
      definition: {
        type: `${DOMAIN}/activityType/recommended-video`,
        name: {
          [config.language]: "Recommended videos",
        },
        extensions: {
          [`${DOMAIN}/extensions/recommended-video`]: {
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
    verb: createVerb(`${DOMAIN}/verb/marked-helpful`, "marked as helpful"),
    object: createRecommendedVideoObject(req),
    context: createContext(),
  };
};
export const generateMarkVideoAsUnhelpful = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      `${DOMAIN}/verb/marked-not-helpful`,
      "marked as not helpful"
    ),
    object: createRecommendedVideoObject(req),
    context: createContext(),
  };
};
export const generateUnmarkVideoAsHelpful = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/un-marked-helpful`, "unmarked as helpful"),
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
      "unmarked as not helpful"
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
      type: `${DOMAIN}/activityType/recommended-article`,
      name: {
        [config.language]: `Recommended article '${articleTitle}'`,
      },
      description: {
        [config.language]: articleAbstract || "",
      },
      extensions: {
        [`${DOMAIN}/extensions/recommended-article`]: {
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
    verb: createVerb(`${DOMAIN}/verb/viewed-all`, "viewed all"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/recommended-article`,
      definition: {
        type: `${DOMAIN}/activityType/recommended-article`,
        name: {
          [config.language]: "Recommended articles",
        },
        extensions: {
          [`${DOMAIN}/extensions/recommended-article`]: {
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
    verb: createVerb(`${DOMAIN}/verb/expand`, "expanded"),
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
    verb: createVerb(`${DOMAIN}/verb/marked-helpful`, "marked as helpful"),
    object: createRecommendedArticleObject(req),
    context: createContext(),
  };
};
export const generateMarkArticleAsUnhelpful = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      `${DOMAIN}/verb/marked-not-helpful`,
      "marked as not helpful"
    ),
    object: createRecommendedArticleObject(req),
    context: createContext(),
  };
};
export const generateUnmarkArticleAsHelpful = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/un-marked-helpful`, "unmarked as helpful"),
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
      "unmarked as not helpful"
    ),
    object: createRecommendedArticleObject(req),
    context: createContext(),
  };
};
