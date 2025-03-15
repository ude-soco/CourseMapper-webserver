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
  const materialPage = req.locals.materialPage;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/recommended-concept/${concept.id}`,
    definition: {
      type: `${DOMAIN}/activityType/slide-kg-recommended-concept`,
      name: {
        [config.language]: `Recommended concept '${concept.name}' - Slide ${materialPage} Knowledge Graph - Material '${material.name}'`,
      },
      extensions: {
        [`${DOMAIN}/extensions/slide-kg-recommended-concept`]: {
          id: concept.id,
          cid: concept.cid,
          materialId: material._id,
          topicId: material.topicId,
          channelId: material.channelId,
          courseId: material.courseId,
          materialPage: materialPage,
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
        type: `${DOMAIN}/activityType/slide-kg-recommended-concept`,
        name: {
          [config.language]: `Recommended concept '${concept.name}' - Slide ${materialPage} Knowledge Graph - Material '${material.name}'`,
        },
        description: {
          [config.language]: concept.abstract || "",
        },
        extensions: {
          [`${DOMAIN}/extensions/slide-kg-recommended-concept`]: {
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
  let origin = req.get("origin");

  // Extract only id and name from all concepts
  const formattedConcepts = concepts.map((concept) => ({
    id: concept.data.id,
    name: concept.data.name,
  }));
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/viewed-all`, "viewed all"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/recommended-concept`,
      definition: {
        type: `${DOMAIN}/activityType/slide-kg-recommended-concept`,
        name: {
          [config.language]: `Recommended concepts - Slide ${materialPage} Knowledge Graph - Material '${material.name}'`,
        },
        extensions: {
          [`${DOMAIN}/extensions/slide-kg-recommended-concept`]: {
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
  const concept_id = req.locals.concept_id;
  const concept_name = req.locals.concept_name;
  const materialPage = req.locals.materialPage;
  let origin = req.get("origin");
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/concept/${concept_id}/textual-explanation`,
      definition: {
        type: `${DOMAIN}/activityType/slide-kg-recommended-concept`,
        name: {
          [config.language]: `Textual explanation of recommended concept '${concept_name}' - Slide ${materialPage} Knowledge Graph - Material '${material.name}'`,
        },
        extensions: {
          [`${DOMAIN}/extensions/slide-kg-recommended-concept`]: {
            concept_id: req.locals.concept_id,
            concept_cid: req.locals.concept_cid,
            concept_name: req.locals.concept_name,
            concept_type: req.locals.concept_type,
            concept_abstract: req.locals.concept_abstract,
            concept_reason: req.locals.concept_reason,
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
  const concept_id = req.locals.concept_id;
  const concept_name = req.locals.concept_name;
  const materialPage = req.locals.materialPage;
  let origin = req.get("origin");
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/concept/${concept_id}/visual-explanation`,
      definition: {
        type: `${DOMAIN}/activityType/slide-kg-recommended-concept`,
        name: {
          [config.language]: `Visual explanation of recommended concept '${concept_name}' - Slide ${materialPage} Knowledge Graph - Material '${material.name}'`,
        },
        extensions: {
          [`${DOMAIN}/extensions/slide-kg-recommended-concept`]: {
            concept_id: req.locals.concept_id,
            concept_cid: req.locals.concept_cid,
            concept_name: req.locals.concept_name,
            concept_type: req.locals.concept_type,
            concept_abstract: req.locals.concept_abstract,
            concept_roads: req.locals.concept_roads,
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
  let origin = req.get("origin");
  const material = req.locals.material;
  const concept_id = req.locals.concept_id;
  const materialPage = req.locals.materialPage;
  const concept_name = req.locals.concept_name;
  const concept_wikipedia = req.locals.concept_wikipedia;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      `${DOMAIN}/verb/viewed-full-article`,
      "viewed full article"
    ),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/concept/${concept_id}/wiki-article`,
      definition: {
        type: `${DOMAIN}/activityType/slide-kg-recommended-concept`,
        name: {
          [config.language]: `Recommended concept '${concept_name}' - Slide ${materialPage} Knowledge Graph - Material '${material.name}'`,
        },
        extensions: {
          [`${DOMAIN}/extensions/slide-kg-recommended-concept`]: {
            concept_id: req.locals.concept_id,
            concept_cid: req.locals.concept_cid,
            concept_name: concept_name,
            concept_type: req.locals.concept_type,
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
    verb: createVerb(`${DOMAIN}/verb/mark-new`, "marked as new"),
    object: createRecommendedConceptObject(req),
    context: createContext(),
  };
};
export const generateMarkConceptAsUnderstood = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/mark-understood`, "marked as understood"),
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
      "marked as not understood"
    ),
    object: createRecommendedConceptObject(req),
    context: createContext(),
  };
};
