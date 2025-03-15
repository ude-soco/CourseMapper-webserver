import config from "../../util/config";

import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../../util/generator-util";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

const formatActivityType = (type) => {
  return type.toLowerCase().replace(/-/g, " ");
};
function replaceUnderscoreWithHyphen(word) {
  return word.replace(/_/g, "-");
}
// To edit
const createConceptObject = (req) => {
  const material = req.locals.material;
  const conceptName = req.locals.conceptName;
  const slides = req.locals.slides;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/concept/${conceptName}`,
    definition: {
      type: `${DOMAIN}/activityType/concept`,
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
export const generateViewedConceptMaterialKG = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const concept = req.locals.concept;
  let conceptType = replaceUnderscoreWithHyphen(req.locals.concept.type);
  let origin = req.get("origin");

  let formattedType = formatActivityType(conceptType); // Human readable without _

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/concept/${concept.id}`,
      definition: {
        type: `${DOMAIN}/activityType/material-kg-${conceptType}`, //Type could be main-concept/ related-concept/ category
        name: {
          [config.language]: `${formattedType}: '${concept.name}' - Material '${material.name}' Knowledge Graph`,
        },
        description: {
          [config.language]: concept.abstract || "",
        },
        extensions: {
          [`${DOMAIN}/extensions/material-kg-${conceptType}`]: {
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
  //TODO: edit key to conceptType
  const metadata = createMetadata();
  const material = req.locals.material;
  let conceptType = replaceUnderscoreWithHyphen(req.locals.key);
  let origin = req.get("origin");
  let type;
  if (conceptType === "related-concept") {
    type = "Related concepts";
  } else if (conceptType === "category") {
    type = "Categories";
  }

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/hide`, "hid"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/${conceptType}`,
      definition: {
        type: `${DOMAIN}/activityType/material-kg-${conceptType}`, //Type could be related-concept/ category
        name: {
          [config.language]: `${type} - Material '${material.name}' - Knowledge Graph`,
        },
        extensions: {
          [`${DOMAIN}/extensions/material-kg-${conceptType}`]: {
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
  let conceptType = replaceUnderscoreWithHyphen(req.locals.key);
  let origin = req.get("origin");
  let type;
  if (conceptType === "related-concept") {
    type = "Related concepts";
  } else if (conceptType === "category") {
    type = "Categories";
  }
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/unhide`, "unhid"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/${conceptType}`,
      definition: {
        type: `${DOMAIN}/activityType/material-kg-${conceptType}`, //Type could be related_concept/ category
        name: {
          [config.language]: `${type} - Material '${material.name}' - Knowledge Graph`,
        },
        extensions: {
          [`${DOMAIN}/extensions/material-kg-${conceptType}`]: {
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
export const generateViewedFullArticleMaterialKG = (req) => {
  const metadata = createMetadata();
  let origin = req.get("origin");
  const material = req.locals.material;
  const concept_id = req.locals.concept_id;
  const concept_name = req.locals.concept_name;
  const concept_wikipedia = req.locals.concept_wikipedia;
  const concept_abstract = req.locals.concept_abstract;
  let concept_type = replaceUnderscoreWithHyphen(req.locals.concept_type);
  console.log(concept_type);
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      `${DOMAIN}/verb/viewed-full-article`,
      "viewed full article"
    ),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/concept/${concept_id}/wiki-article/${concept_wikipedia}`,
      definition: {
        type: `${DOMAIN}/activityType/material-kg-${concept_type}`,
        name: {
          [config.language]: `Concept: '${concept_name}' - Material '${material.name}' Knowledge Graph`,
        },
        description: {
          [config.language]: concept_abstract || "",
        },
        extensions: {
          [`${DOMAIN}/extensions/material-kg-${concept_type}`]: {
            concept_id: req.locals.concept_id,
            concept_cid: req.locals.concept_cid,
            concept_name: req.locals.concept_name,
            concept_type: req.locals.concept_type,
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
  let origin = req.get("origin");

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
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/material-knowledge-graph`,
      definition: {
        type: `${DOMAIN}/activityType/material-knowledge-graph`,
        name: {
          [config.language]: `Material '${material.name}' Knowledge Graph`,
        },
        extensions: {
          [`${DOMAIN}/extensions/material-knowledge-graph`]: {
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
  let origin = req.get("origin");

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/finalize`, "finalized"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/material/${material._id}/material-knowledge-graph`,
      definition: {
        type: `${DOMAIN}/activityType/material-knowledge-graph`,
        name: {
          [config.language]: `Material '${material.name}' Knowledge Graph`,
        },
        extensions: {
          [`${DOMAIN}/extensions/material-knowledge-graph`]: {
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
