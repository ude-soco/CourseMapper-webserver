import config from "../../util/config";

import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../../util/generator-util";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

const createConceptObject = (req) => {
  const material = req.locals.material;
  const conceptName = req.locals.conceptName;
  const slides = req.locals.slides;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/concept/${conceptName}`,
    definition: {
      type: `${DOMAIN}/schema/1.0/concept`,
      name: {
        [config.language]: conceptName,
      },
      extensions: {
        [`${DOMAIN}/extensions/concept`]: {
          conceptName: conceptName,
          slides: slides,
          materialId: material._id,
          channelId: material.channelId,
          topicId: material.topicId,
          courseId: material.courseId,
        },
      },
    },
  };
};
export const generateViewedConcept = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const concept = req.locals.concept;

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: config.activity,
      id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/concept/${concept.id}`,
      definition: {
        type: `${DOMAIN}/schema/1.0/${concept.type}`, //Type could be main concept/ related concept/ category
        name: {
          [config.language]: concept.name,
        },
        description: {
          [config.language]: concept.abstract,
        },
        extensions: {
          [`${DOMAIN}/extensions/${concept.type}`]: {
            conceptId: concept.id,
            concept_wiki_url: concept.wikipedia,
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
export const generateAddConcept = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/add", "added"),
    object: createConceptObject(req),
    context: createContext(),
  };
};
export const generateDeleteConcept = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/delete", "deleted"),
    object: createConceptObject(req),
    context: createContext(),
  };
};
export const generateHidConcepts = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const key = req.locals.key; // related_concept Or categories

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/hide`, "hid"),
    object: {
      objectType: config.activity,
      id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/${key}`,
      definition: {
        type: `${DOMAIN}/schema/1.0/${key}`, //Type could be related concept/ category
        name: {
          [config.language]: `${key}`,
        },
        extensions: {
          [`${DOMAIN}/extensions/${key}`]: {
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
export const generateUnhidConcepts = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const key = req.locals.key; // related_concept Or categories

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/unhide`, "unhid"),
    object: {
      objectType: config.activity,
      id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/${key}`,
      definition: {
        type: `${DOMAIN}/schema/1.0/${key}`, //Type could be related concept/ category
        name: {
          [config.language]: `${key}`,
        },
        extensions: {
          [`${DOMAIN}/extensions/${key}`]: {
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
      objectType: config.activity,
      id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/material-knowledge-graph`,
      definition: {
        type: `${DOMAIN}/activityType/knowledge-graph`,
        name: {
          [config.language]: `Material ${material.name} Knowledge Graph`,
        },
        extensions: {
          [`${DOMAIN}/extensions/knowledge-graph`]: {
            courseId: material.courseId,
            topicId: material.topicId,
            channelId: material.channelId,
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

export const generateFinalizeMaterialKG = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const result = req.locals.result;

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/finalize`, "finalized"),
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
            topicId: material.topicId,
            channelId: material.channelId,
            materialId: material._id,
            materialName: material.name,
            // concepts: ,
          },
        },
      },
    },
    context: createContext(),
  };
};
