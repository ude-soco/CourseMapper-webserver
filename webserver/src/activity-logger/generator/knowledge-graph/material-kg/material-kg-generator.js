import config from "../../util/config";

import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../../util/generator-util";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

export const generateViewedFullArticleMKG = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const node_id = req.locals.node_id;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: "Activity",
      id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/concept/${node_id}/wiki-article`,
      definition: {
        type: "http://activitystrea.ms/schema/1.0/article",
        name: {
          [config.language]: req.locals.node_name,
        },
        extensions: {
          [`${DOMAIN}/extensions/article`]: {
            node_id: req.locals.node_id,
            node_cid: req.locals.node_cid,
            node_name: req.locals.node_name,
            node_type: req.locals.node_type,
            materialId: material._id,
            channelId: material.channelId,
            topicId: material.topicId,
            courseId: material.courseId,
          },
        },
      },
    },
    context: createContext(),
  };
};
export const generateAccessMaterialKG = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const concepts = req.locals.records;
  console.log("Inside Generator.");
  // Filter only "main_concept" types
  const formattedConcepts = concepts
    .filter((concept) => concept.type === "main_concept")
    .map((concept) => ({
      id: concept.id,
      name: concept.name,
    }));
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/access", "accessed"),
    object: {
      objectType: "Activity",
      id: `${DOMAIN}/activity/course/${material.courseId}/material/${material._id}/material-knowledge-graph`,
      definition: {
        type: `${DOMAIN}/schema/1.0/knowledge-graph`,
        name: {
          [config.language]: "Material Knowledge Graph",
        },
        extensions: {
          [`${DOMAIN}/extensions/material-kg`]: {
            courseId: material.courseId,
            topic: material.topicId,
            channel: material.channelId,
            materialId: material._id,
            materialName: material.name,
            concepts: formattedConcepts,
          },
        },
      },
    },
    context: createContext(),
  };
};
