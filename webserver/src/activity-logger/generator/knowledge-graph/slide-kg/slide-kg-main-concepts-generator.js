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
    verb: createVerb(`${DOMAIN}/verb/did-not-understand`, "did-not-understand"),
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
        type: `${DOMAIN}/activityType/knowledge-graph`,
        name: {
          [config.language]: `Slide ${materialPage} Knowledge Graph`,
        },
        extensions: {
          [`${DOMAIN}/extensions/knowledge-graph`]: {
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
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/main-concepts`,
      definition: {
        type: `${DOMAIN}/activityType/concept`,
        name: {
          [config.language]: "Main concepts",
        },
        extensions: {
          [`${DOMAIN}/extensions/main-concepts`]: {
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
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/main-concepts`,
      definition: {
        type: `${DOMAIN}/activityType/concept`,
        name: {
          [config.language]: "Main concepts",
        },
        extensions: {
          [`${DOMAIN}/extensions/main-concepts`]: {
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
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/main-concepts`,
      definition: {
        type: `${DOMAIN}/activityType/concept`,
        name: {
          [config.language]: "Main concepts",
        },
        extensions: {
          [`${DOMAIN}/extensions/main-concepts`]: {
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
        type: `${DOMAIN}/schema/1.0/concept`,
        name: {
          [config.language]: concept.name,
        },
        description: {
          [config.language]: concept.abstract,
        },
        extensions: {
          [`${DOMAIN}/extensions/main-concept`]: {
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
  const node_id = req.locals.node_id;
  const materialPage = req.locals.materialPage;
  const node_wikipedia = req.locals.node_wikipedia;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/main-concept/${node_id}/wiki-article/${node_wikipedia}`,
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
    object: createMainConceptObject(req),
    context: createContext(),
  };
};
export const generateMarkConceptAsUnderstood = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/mark-understood`, "marked-understood"),
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
      "marked-not-understood"
    ),
    object: createMainConceptObject(req),
    context: createContext(),
  };
};
