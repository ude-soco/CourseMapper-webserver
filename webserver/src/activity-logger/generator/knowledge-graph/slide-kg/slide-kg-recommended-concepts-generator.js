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
