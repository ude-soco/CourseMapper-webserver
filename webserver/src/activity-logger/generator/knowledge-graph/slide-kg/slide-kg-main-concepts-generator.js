import config from "../../util/config";

import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../../util/generator-util";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

// Just to have it as a background
const createChannelObject = (req) => {
  let channel = req.locals.channel;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}`,
    definition: {
      type: `${DOMAIN}/activityType/channel`,
      name: {
        [config.language]: channel.name,
      },
      description: {
        [config.language]: channel.description,
      },
      extensions: {
        [`${DOMAIN}/extensions/channel`]: {
          id: channel._id,
          course_id: channel.courseId,
          topic_id: channel.topicId,
          name: channel.name,
          description: channel.description,
        },
      },
    },
  };
};

export const generateViewedAllMainConcepts = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const concepts = req.locals.mainConcepts;
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
      id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/main-concepts`,
      definition: {
        type: `${DOMAIN}/schema/1.0/concept`,
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
      id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/more-main-concepts`,
      definition: {
        type: `${DOMAIN}/schema/1.0/concept`,
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
      id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/more-main-concepts`,
      definition: {
        type: `${DOMAIN}/schema/1.0/concept`,
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
      objectType: "Activity",
      id: `${DOMAIN}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slideNr/${materialPage}/concept/${concept.id}`,
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
// ? I added this one to have it ready for a better structure...
