import config from "../../util/config";

import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../../util/generator-util";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

export const generateViewedConcept = (req) => {
  const metadata = createMetadata();
  let origin = req.get("origin");
  const course = req.locals.course;
  const concept = req.locals.concept;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${course._id}/concept/${concept.id}`,
      definition: {
        type: `${DOMAIN}/activityType/concept`,
        name: {
          [config.language]: `Concept: ${concept.name} - Course Knowledge Graph`,
        },
        description: {
          [config.language]: concept.abstract,
        },
        extensions: {
          [`${DOMAIN}/extensions/concept`]: {
            conceptId: concept.id,
            conceptCid: concept.cid,
            concept_wiki_url: concept.wikipedia,
            conceptType: concept.type,
            courseId: course._id,
          },
        },
      },
    },
    context: createContext(),
  };
};
export const generateViewedFullArticleCKG = (req) => {
  const metadata = createMetadata();
  let origin = req.get("origin");
  const course = req.locals.course;
  const node_id = req.locals.node_id;
  const node_wikipedia = req.locals.node_wikipedia;
  const node_name = req.locals.node_name;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${course._id}/concept/${node_id}/wiki-article/${node_wikipedia}`,
      definition: {
        type: "http://activitystrea.ms/schema/1.0/article",
        name: {
          [config.language]: `Article: ${node_name} - Course Knowledge Graph`,
        },
        description: {
          [config.language]: req.locals.node_abstract,
        },
        extensions: {
          [`${DOMAIN}/extensions/article`]: {
            concept_id: req.locals.node_id,
            concept_cid: req.locals.node_cid,
            concept_type: req.locals.node_type,
            concept_abstract: req.locals.node_abstract,
            concept_wikipedia: node_wikipedia,
            courseId: course._id,
          },
        },
      },
    },
    context: createContext(),
  };
};
export const generateAccessCourseKG = (req) => {
  const metadata = createMetadata();
  const course = req.locals.course;
  const concepts = req.locals.records.nodes;
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
      id: `${origin}/activity/course/${course._id}/course-knowledge-graph`,
      definition: {
        type: `${DOMAIN}/activityType/knowledge-graph`,
        name: {
          [config.language]: `Course ${course.name} Knowledge Graph`,
        },
        extensions: {
          [`${DOMAIN}/extensions/knowledge-graph`]: {
            courseId: course._id,
            courseName: course.name,
            concepts: formattedConcepts,
          },
        },
      },
    },
    context: createContext(),
  };
};
