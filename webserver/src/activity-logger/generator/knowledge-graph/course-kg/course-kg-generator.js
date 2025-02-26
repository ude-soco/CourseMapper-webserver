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
  const course = req.locals.course;
  const concept = req.locals.concept;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: config.activity,
      id: `${DOMAIN}/activity/course/${course._id}/concept/${concept.id}`,
      definition: {
        type: `${DOMAIN}/schema/1.0/${concept.type}`, // Type could be main concept/ related concept/ category
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
  const course = req.locals.course;
  const node_id = req.locals.node_id;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: "Activity",
      id: `${DOMAIN}/activity/course/${course._id}/concept/${node_id}/wiki-article`,
      definition: {
        type: "http://activitystrea.ms/schema/1.0/article",
        name: {
          [config.language]: req.locals.node_name,
        },
        // TO ADD the description
        extensions: {
          [`${DOMAIN}/extensions/article`]: {
            node_id: req.locals.node_id,
            node_cid: req.locals.node_cid,
            node_name: req.locals.node_name,
            node_type: req.locals.node_type,
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

  const formattedConcepts = concepts.map((concept) => ({
    id: concept.id,
    name: concept.name,
  }));

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/access", "accessed"),
    object: {
      objectType: "Activity",
      id: `${DOMAIN}/activity/course/${course._id}/course-knowledge-graph`,
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
