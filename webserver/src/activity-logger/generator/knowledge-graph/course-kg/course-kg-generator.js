import config from "../../util/config";

import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../../util/generator-util";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

function replaceUnderscoreWithHyphen(word) {
  return word.replace(/_/g, "-");
}
export const generateViewedConceptCourseKG = (req) => {
  const metadata = createMetadata();
  let origin = req.get("origin");
  const course = req.locals.course;
  const concept = req.locals.concept;
  let conceptType = replaceUnderscoreWithHyphen(concept.type);
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${course._id}/concept/${concept.id}`,
      definition: {
        type: `${DOMAIN}/activityType/course-kg-${conceptType}`,
        name: {
          [config.language]: `Concept: '${concept.name}' - Course '${course.name}' Knowledge Graph`,
        },
        description: {
          [config.language]: concept.abstract || "",
        },
        extensions: {
          [`${DOMAIN}/extensions/course-kg-${conceptType}`]: {
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
export const generateViewedFullArticleCourseKG = (req) => {
  const metadata = createMetadata();
  let origin = req.get("origin");
  const course = req.locals.course;
  const concept_id = req.locals.concept_id;
  const concept_wikipedia = req.locals.concept_wikipedia;
  const concept_name = req.locals.concept_name;
  let concept_type = replaceUnderscoreWithHyphen(req.locals.concept_type); //To verify
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      `${DOMAIN}/verb/viewed-full-article`,
      "viewed full article"
    ),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${course._id}/concept/${concept_id}/wiki-article/${concept_wikipedia}`,
      definition: {
        type: `${DOMAIN}/activityType/course-kg-${concept_type}`,
        name: {
          [config.language]: `Concept: '${concept_name}' - Course '${course.name}' Knowledge Graph`,
        },
        description: {
          [config.language]: req.locals.concept_abstract || "",
        },
        extensions: {
          [`${DOMAIN}/extensions/course-kg-${concept_type}`]: {
            concept_id: req.locals.concept_id,
            concept_cid: req.locals.concept_cid,
            concept_type: req.locals.concept_type,
            concept_abstract: req.locals.concept_abstract,
            concept_wikipedia: concept_wikipedia,
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
        type: `${DOMAIN}/activityType/course-knowledge-graph`,
        name: {
          [config.language]: `Course '${course.name}' Knowledge Graph`,
        },
        extensions: {
          [`${DOMAIN}/extensions/course-knowledge-graph`]: {
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
