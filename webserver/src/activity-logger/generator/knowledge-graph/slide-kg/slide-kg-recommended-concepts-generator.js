import config from "../../util/config";

import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../../util/generator-util";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

const createRecommendedConceptObject = (req) => {
  let material = req.locals.material;
  let concept = req.locals.concept;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/recommended-concept/${concept.id}`,
    definition: {
      type: `${DOMAIN}/activityType/concept`,
      name: {
        [config.language]: concept.name,
      },
      extensions: {
        [`${DOMAIN}/extensions/concept`]: {
          id: concept.id,
          cid: concept.cid,
          materialId: material._id,
          topicId: material.topicId,
          channelId: material.channelId,
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
  const materialPage = req.locals.materialPage;

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: config.activity,
      id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/recommended-concept/${concept.id}`,
      definition: {
        type: `${DOMAIN}/schema/1.0/concept`,
        name: {
          [config.language]: concept.name,
        },
        description: {
          [config.language]: concept.abstract,
        },
        extensions: {
          [`${DOMAIN}/extensions/recommended-concept`]: {
            conceptId: concept.id,
            conceptType: concept.type,
            concept_wiki_url: concept.wikipedia,
            materialId: material._id,
            channelId: material.channelId,
            topicId: material.topicId,
            courseId: material.courseId,
            materialPage: req.locals.materialPage,
          },
        },
      },
    },
    context: createContext(),
  };
};
export const generateViewedAllRecommendedConcepts = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const concepts = req.locals.recommendedConcepts;
  const materialPage = req.locals.materialPage;

  // Extract only id and name from all concepts
  const formattedConcepts = concepts.map((concept) => ({
    id: concept.data.id,
    name: concept.data.name,
  }));
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: "Activity",
      id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/recommended-concepts`,
      definition: {
        type: `${DOMAIN}/schema/1.0/concept`,
        name: {
          [config.language]: "Recommended concepts",
        },
        extensions: {
          [`${DOMAIN}/extensions/recommended-concepts`]: {
            concepts: formattedConcepts,
            materialId: material._id,
            channelId: material.channelId,
            topicId: material.topicId,
            courseId: material.courseId,
            materialPage: req.locals.materialPage,
            // ? This data is coming from the Frontend and is not useful for the moment
            // materialURL: req.locals.materialURL,
            // slideId: req.locals.slideId,
            // newConcepts: req.locals.newConcepts,
            // nonUnderstoodConcepts: req.locals.nonUnderstoodConcepts,
            // understoodConcepts: req.locals.understoodConcepts,
          },
        },
      },
    },
    context: createContext(),
  };
};
export const generateViewedTextualExplanationConcept = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const node_id = req.locals.node_id;
  const materialPage = req.locals.materialPage;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: "Activity",
      id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/concept/${node_id}/textual-explanation`,
      definition: {
        type: `${DOMAIN}/schema/1.0/explanation`,
        name: {
          [config.language]: "Textual explanation",
        },
        extensions: {
          [`${DOMAIN}/extensions/textual-explanation-concept`]: {
            node_id: req.locals.node_id,
            key: req.locals.key,
            node_cid: req.locals.node_cid,
            node_name: req.locals.node_name,
            node_type: req.locals.node_type,
            node_abstract: req.locals.node_abstract,
            node_reason: req.locals.node_reason,
            materialId: material._id,
            channelId: material.channelId,
            topicId: material.topicId,
            courseId: material.courseId,
            materialPage: materialPage,
          },
        },
      },
    },
    context: createContext(),
  };
};
export const generateViewedVisualExplanationConcept = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const node_id = req.locals.node_id;
  const materialPage = req.locals.materialPage;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: "Activity",
      id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/concept/${node_id}/visual-explanation`,
      definition: {
        type: `${DOMAIN}/schema/1.0/explanation`,
        name: {
          [config.language]: "Visual explanation",
        },
        extensions: {
          [`${DOMAIN}/extensions/visual-explanation-concept`]: {
            node_id: req.locals.node_id,
            key: req.locals.key,
            node_cid: req.locals.node_cid,
            node_name: req.locals.node_name,
            node_type: req.locals.node_type,
            node_abstract: req.locals.node_abstract,
            node_roads: req.locals.node_roads,
            materialId: material._id,
            channelId: material.channelId,
            topicId: material.topicId,
            courseId: material.courseId,
            materialPage: materialPage,
          },
        },
      },
    },
    context: createContext(),
  };
};

export const generateViewedFullArticleRecommendedConcept = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const node_id = req.locals.node_id;
  const materialPage = req.locals.materialPage;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: "Activity",
      id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/concept/${node_id}/wiki-article`,
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
            materialPage: materialPage,
          },
        },
      },
    },
    context: createContext(),
  };
};

export const generateMarkConceptAsNew = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/mark-new`, "marked-new"),
    object: createRecommendedConceptObject(req),
    context: createContext(),
  };
};
export const generateMarkConceptAsUnderstood = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/mark-understood`, "marked-understood"),
    object: createRecommendedConceptObject(req),
    context: createContext(),
  };
};
export const generateMarkConceptAsNotUnderstood = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      `${DOMAIN}/verb/mark-not-understood`,
      "marked-not-understood"
    ),
    object: createRecommendedConceptObject(req),
    context: createContext(),
  };
};
