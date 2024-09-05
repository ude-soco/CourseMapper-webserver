import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "./util/generator-util";
import config from "./util/config";

const createMaterialObject = (req, typeURI) => {
  let material = req.locals.material;
  let origin = req.get("origin");
  let type = typeURI ? typeURI : `${origin}/activityType/material`;
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
    definition: {
      type: type,
      name: {
        [config.language]: material.name,
      },
      description: {
        [config.language]: material.description,
      },
      extensions: {
        [`${origin}/extensions/material`]: {
          id: material._id,
          name: material.name,
          description: material.description,
          type: material.type,
          url: material.url,
          channel_id: material.channelId,
          topic_id: material.topicId,
          course_id: material.courseId,
        },
      },
    },
  };
};

export const generateAddMaterialActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/add", "added"),
    object: createMaterialObject(req),
    context: createContext(),
  };
};

export const generateAccessMaterialActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/access", "accessed"),
    object: createMaterialObject(req),
    context: createContext(),
  };
};

export const generateDeleteMaterialActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/delete", "deleted"),
    object: createMaterialObject(req),
    context: createContext(),
  };
};

export const generateEditMaterialActivity = (req) => {
  const metadata = createMetadata();
  let updatedMaterial = req.locals.newMaterial;
  let materialToEdit = req.locals.oldMaterial;
  let origin = req.get("origin");
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://curatr3.com/define/verb/edited", "edited"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${materialToEdit.courseId}/topic/${materialToEdit.topicId}/channel/${materialToEdit.channelId}/material/${materialToEdit._id}`,
      definition: {
        type: [`${origin}/activityType/material`],
        name: {
          [config.language]: materialToEdit.name,
        },
        description: {
          [config.language]: materialToEdit.description,
        },
        extensions: {
          [`${origin}/extensions/material`]: {
            id: materialToEdit._id,
            name: materialToEdit.name,
            description: materialToEdit.description,
            type: materialToEdit.type,
            url: materialToEdit.url,
            channel_id: materialToEdit.channelId,
            topic_id: materialToEdit.topicId,
            course_id: materialToEdit.courseId,
          },
        },
      },
    },
    result: {
      extensions: {
        [`${origin}/extensions/material`]: {
          name: updatedMaterial.name,
          description: updatedMaterial.description,
          url: updatedMaterial.url,
          type: updatedMaterial.type,
        },
      },
    },
    context: createContext(),
  };
};

const createVideoMaterialWithDurationObject = (req) => {
  const hours = req.params.hours;
  const minutes = req.params.minutes;
  const seconds = req.params.seconds;
  const material = req.locals.material;
  const origin = req.get("origin");
  const duration =
    parseInt(hours) * 60 * 60 + parseInt(minutes) * 60 + parseInt(seconds);
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
    definition: {
      type: `http://activitystrea.ms/schema/1.0/video`,
      name: {
        [config.language]: material.name,
      },
      description: {
        [config.language]: material.description,
      },
      extensions: {
        [`${origin}/extensions/material`]: {
          id: material._id,
          name: material.name,
          description: material.description,
          type: material.type,
          url: material.url,
          channel_id: material.channelId,
          topic_id: material.topicId,
          course_id: material.courseId,
          timestamp: duration,
        },
      },
    },
  };
};

export const generatePlayVideoActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/play", "played"),
    object: createVideoMaterialWithDurationObject(req),
    context: createContext(),
  };
};

export const generatePauseVideoActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/paused", "paused"),
    object: createVideoMaterialWithDurationObject(req),
    context: createContext(),
  };
};

export const generateCompleteVideoActivity = (req, user, material, origin) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      "http://activitystrea.ms/schema/1.0/complete",
      "completed",
    ),
    object: createMaterialObject(
      req,
      "http://activitystrea.ms/schema/1.0/video",
    ),
    context: createContext(),
  };
};

const createPDFMaterialWithSlideObject = (req) => {
  const slideNr = req.params.slideNr;
  const material = req.locals.material;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slide/${slideNr}`,
    definition: {
      type: `http://id.tincanapi.com/activitytype/slide`,
      name: {
        [config.language]: material.name,
      },
      description: {
        [config.language]: material.description,
      },
      extensions: {
        [`${origin}/extensions/material`]: {
          id: material._id,
          name: material.name,
          pageNr: slideNr,
          description: material.description,
          type: material.type,
          url: material.url,
          channel_id: material.channelId,
          topic_id: material.topicId,
          course_id: material.courseId,
        },
      },
    },
  };
};

export const generateViewSlideActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: createPDFMaterialWithSlideObject(req),
    context: createContext(),
  };
};

export const generateCompletePdfActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      "http://activitystrea.ms/schema/1.0/complete",
      "completed",
    ),
    object: createMaterialObject(req, `${req.get("origin")}/activityType/pdf`),
    context: createContext(),
  };
};
