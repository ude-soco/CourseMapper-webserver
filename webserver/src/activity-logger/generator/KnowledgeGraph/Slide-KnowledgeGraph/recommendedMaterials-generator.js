const config = require("../../util/config");

import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../../util/generator-util";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

const createArticleObject = (req) => {
  const articleTitle = req.locals.articleTitle;
  const articleUrl = req.locals.articleUrl;
  console.log("Article URL:", articleUrl);
  const origin = req.get("origin");

  return {
    objectType: "Activity",
    id: `${origin}/activity/KnowledgeGraph/recommendedMaterials/article/${articleTitle}/`, //To verify
    definition: {
      type: "http://adlnet.gov/expapi/activities/Wiki-Article", //To verify
      title: {
        en: articleTitle,
      },
      url: {
        en: articleUrl,
      },
    },
  };
};

export const generateViewFullWikipediaArticle = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/viewed", "viewed"), //To Verify
    object: createArticleObject(req),
    context: createContext(),
  };
};
