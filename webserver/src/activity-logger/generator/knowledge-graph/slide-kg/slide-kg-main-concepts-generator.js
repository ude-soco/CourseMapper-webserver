import config from "../../util/config";

import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../../util/generator-util";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

const createMainConceptObject = (req) => {
  let material = req.locals.material;
  let concept = req.locals.concept;
  const materialPage = req.locals.materialPage;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/main-concept/${concept.id}`,
    definition: {
      type: `${DOMAIN}/activityType/slide-kg-main-concept`,
      name: {
        [config.language]: `Main concept '${concept.name}' - Slide '${materialPage}' Knowledge Graph - Material '${material.name}'`,
      },
      extensions: {
        [`${DOMAIN}/extensions/slide-kg-main-concept`]: {
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

export const generateDidNotUnderstandSlide = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const materialPage = req.locals.materialPage;
  const concepts = req.locals.records;
  let origin = req.get("origin");
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/did-not-understand`, "did not understand"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/materialPage/${materialPage}`,
      definition: {
        type: "http://id.tincanapi.com/activitytype/slide",
        name: {
          [config.language]: `${material.name} - Slide ${materialPage}`,
        },
        extensions: {
          [`${DOMAIN}/extensions/slide`]: {
            courseId: material.courseId,
            topicId: material.topicId,
            channelId: material.channelId,
            materialId: material._id,
            materialName: material.name,
            materialPage: materialPage,
          },
        },
      },
    },
    context: createContext(),
  };
};

export const generateAccessSlideKG = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const materialPage = req.locals.materialPage;
  const concepts = req.locals.records;
  let origin = req.get("origin");
  const formattedConcepts = concepts.map((concept) => ({
    id: concept.id,
    name: concept.name,
  }));
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/access", "accessed"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/materialPage/${materialPage}/slide-knowledge-graph`,
      definition: {
        type: `${DOMAIN}/activityType/slide-knowledge-graph`,
        name: {
          [config.language]: `Slide '${materialPage}' Knowledge Graph - Material '${material.name}'`,
        },
        extensions: {
          [`${DOMAIN}/extensions/slide-knowledge-graph`]: {
            courseId: material.courseId,
            topicId: material.topicId,
            channelId: material.channelId,
            materialId: material._id,
            materialName: material.name,
            materialPage: materialPage,
            concepts: formattedConcepts,
          },
        },
      },
    },
    context: createContext(),
  };
};
export const generateViewedAllMainConcepts = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const concepts = req.locals.mainConcepts;
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
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/main-concept`,
      definition: {
        type: `${DOMAIN}/activityType/slide-kg-main-concept`,
        name: {
          [config.language]: `Main concepts of Slide '${materialPage}' Knowledge Graph - Material '${material.name}'`,
        },
        extensions: {
          [`${DOMAIN}/extensions/slide-kg-main-concept`]: {
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
export const generateViewedMoreConcepts = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const concepts = req.locals.mainConcepts;
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
    verb: createVerb(`${DOMAIN}/verb/view-more`, "viewed more"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/main-concept`,
      definition: {
        type: `${DOMAIN}/activityType/slide-kg-main-concept`,
        name: {
          [config.language]: `Main concepts of Slide ${materialPage} Knowledge Graph - Material '${material.name}'`,
        },
        extensions: {
          [`${DOMAIN}/extensions/slide-kg-main-concept`]: {
            concepts: formattedConcepts,
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
export const generateViewedLessConcepts = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const concepts = req.locals.mainConcepts;
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
    verb: createVerb(`${DOMAIN}/verb/view-less`, "viewed less"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/main-concept`,
      definition: {
        type: `${DOMAIN}/activityType/slide-kg-main-concept`,
        name: {
          [config.language]: `Main concepts of Slide ${materialPage} Knowledge Graph - Material '${material.name}'`,
        },
        extensions: {
          [`${DOMAIN}/extensions/slide-kg-main-concept`]: {
            concepts: formattedConcepts,
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
      id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/main-concept/${concept.id}`,
      definition: {
        type: `${DOMAIN}/activityType/slide-kg-main-concept`,
        name: {
          [config.language]: `Main concept '${concept.name}' - Slide ${materialPage} Knowledge Graph - Material '${material.name}'`,
        },
        description: {
          [config.language]: concept.abstract || "",
        },
        extensions: {
          [`${DOMAIN}/extensions/slide-kg-main-concept`]: {
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
export const generateViewedFullArticleMainConcept = (req) => {
  const metadata = createMetadata();
  let origin = req.get("origin");
  const material = req.locals.material;
  const concept_id = req.locals.concept_id;
  const materialPage = req.locals.materialPage;
  const concept_wikipedia = req.locals.concept_wikipedia;
  const concept_name = req.locals.concept_name;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      `${DOMAIN}/verb/viewed-full-article`,
      "viewed full article"
    ),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/main-concept/${concept_id}/wiki-article/${concept_wikipedia}`,
      definition: {
        type: `${DOMAIN}/activityType/slide-kg-main-concept`,
        name: {
          [config.language]: `Main concept '${concept_name}' - Slide ${materialPage} Knowledge Graph - Material '${material.name}'`,
        },
        extensions: {
          [`${DOMAIN}/extensions/slide-kg-main-concept`]: {
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
    object: createMainConceptObject(req),
    context: createContext(),
  };
};
export const generateMarkConceptAsUnderstood = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/mark-understood`, "marked as understood"),
    object: createMainConceptObject(req),
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
    object: createMainConceptObject(req),
    context: createContext(),
  };
};
