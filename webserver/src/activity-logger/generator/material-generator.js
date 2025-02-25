import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "./util/generator-util";
import config from "./util/config";
import { material } from "../../models";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

const createMaterialObject = (req, typeURI) => {
  let material = req.locals.material;
  const materialType = req.locals.materialType;
  let origin = req.get("origin");
  //let type = typeURI ? typeURI : `${DOMAIN}/activityType/material`;
  let type;
  if (materialType === "pdf") {
    type = `${DOMAIN}/activityType/pdf`;
  } else if (materialType === "video" && req.locals.videoType === "fileVideo") {
    type = `${DOMAIN}/activityType/video`;
  } else if (materialType === "video" && req.locals.videoType === "urlVideo") {
    type = `${DOMAIN}/activityType/youtube`;
  } else {
    type = `${DOMAIN}/activityType/material`;
  }
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
        [`${DOMAIN}/extensions/material`]: {
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
  const materialType = req.locals.materialType;
  const metadata = createMetadata();

  let verb;
  if (materialType === "pdf") {
    verb = "uploaded";
  } else if (materialType === "video" && req.locals.videoType === "fileVideo") {
    verb = "uploaded";
  } else if (materialType === "video" && req.locals.videoType === "urlVideo") {
    verb = "added";
  } else {
    verb = "added";
  }

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      verb === "uploaded"
        ? "https://xapi.elearn.rwth-aachen.de/definitions/generic/verbs/uploaded" //To verify!
        : "http://activitystrea.ms/schema/1.0/add",
      verb
    ),
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
        type: `${DOMAIN}/activityType/material`,
        name: {
          [config.language]: materialToEdit.name,
        },
        description: {
          [config.language]: materialToEdit.description,
        },
        extensions: {
          [`${DOMAIN}/extensions/material`]: {
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
        [`${DOMAIN}/extensions/material`]: {
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
        [`${DOMAIN}/extensions/material`]: {
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
      "completed"
    ),
    object: createMaterialObject(
      req,
      "http://activitystrea.ms/schema/1.0/video"
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
        [config.language]: `${material.name} - Slide  ${slideNr}`,
      },
      description: {
        [config.language]: material.description,
      },
      extensions: {
        [`${DOMAIN}/extensions/material`]: {
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
      "completed"
    ),
    object: createMaterialObject(req, `${DOMAIN}/activityType/pdf`),
    context: createContext(),
  };
};
const createMaterialDashboardObject = (req) => {
  const material = req.locals.material;
  console.log(material);
  const origin = req.get("origin");

  return {
    objectType: config.activity,
    id: `${origin}/activity/material/${material._id}/dashboard`, //To Verify
    definition: {
      type: "http://adlnet.gov/expapi/activities/dashboard", //To Verify
      name: {
        [config.language]: `Material Dashboard`,
      },
      extensions: {
        [`${origin}/extensions/material`]: {
          materialId: material._id,
          materialName: material.name,
          materialType: material.type,
          materialDescription: material.description,
          topicId: material.topicId,
          courseId: material.courseId,
          channelId: material.channelId,
        },
      },
    },
  };
};

export const generateAccessMaterialDashboardActivity = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/access", "accessed"),
    object: createMaterialDashboardObject(req),
    context: createContext(),
  };
};
export const generateNewMaterialIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/add", "added"),
    object: createMaterialIndicatorObject(req),
    context: createContext(),
  };
};
export const generateDeleteMaterialIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/delete", "deleted"),
    object: createMaterialIndicatorObject(req),
    context: createContext(),
  };
};
export const generateResizeMaterialIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/resize", "resized"), // TO VERIFY AND CORRECT, I couldn't find the verb in the registry Database
    object: createResizedMaterialIndicatorObject(req),
    context: createContext(),
  };
};
export const generateReorderMaterialIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/reorder", "reordered"), // TO VERIFY AND CORRECT, I couldn't find the verb in the registry Database
    object: createReorderedMaterialIndicatorObject(req),
    context: createContext(),
  };
};

export const createMaterialIndicatorObject = (req) => {
  const indicator = req.locals.indicator;
  const material = req.locals.material;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/materialIndicator/${indicator._id}`, //To verify
    definition: {
      type: `http://id.tincanapi.com/activitytype/materialIndicator`, //To verify
      source: {
        [config.language]: indicator.src,
      },
      width: {
        [config.language]: indicator.width,
      },
      height: {
        [config.language]: indicator.height,
      },
      frameborder: {
        [config.language]: indicator.frameborder,
      },
      extensions: {
        [`${DOMAIN}/extensions/materialIndicator`]: {
          materialId: material._id,
          materialName: material.name,
          materialDescription: material.description,
          materialType: material.type,
          materialUrl: material.url,
          topicId: material.topicId,
          courseId: material.courseId,
          channelId: material.channelId,
        },
      },
    },
  };
};
export const createResizedMaterialIndicatorObject = (req) => {
  const indicator = req.locals.indicator;
  const material = req.locals.material;
  const oldDimensions = req.locals.oldDimensions;
  const newDimensions = req.locals.newDimentions;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/materialIndicator/${indicator._id}`, //To verify
    definition: {
      type: `http://id.tincanapi.com/activitytype/materialIndicator`, //To verify
      source: {
        [config.language]: indicator.src,
      },
      oldDimensions: {
        oldWidth: { [config.language]: oldDimensions.width },
        oldHeight: { [config.language]: oldDimensions.height },
      },
      newDimensions: {
        newWidth: { [config.language]: newDimensions.width },
        newHeight: { [config.language]: newDimensions.height },
      },
      frameborder: {
        [config.language]: indicator.frameborder,
      },
      extensions: {
        [`${DOMAIN}/extensions/materialIndicator`]: {
          materialId: material._id,
          materialName: material.name,
          materialDescription: material.description,
          materialType: material.type,
          materialUrl: material.url,
          topicId: material.topicId,
          courseId: material.courseId,
          channelId: material.channelId,
        },
      },
    },
  };
};
export const createReorderedMaterialIndicatorObject = (req) => {
  const indicator = req.locals.indicator;
  const material = req.locals.material;
  const oldIndex = req.locals.oldIndex;
  const newIndex = req.locals.newIndex;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/materialIndicator/${indicator._id}`, //To verify
    definition: {
      type: `http://id.tincanapi.com/activitytype/materialIndicator`, //To verify
      source: {
        [config.language]: indicator.src,
      },
      width: {
        [config.language]: indicator.width,
      },
      height: {
        [config.language]: indicator.height,
      },
      oldIndex: {
        [config.language]: oldIndex,
      },
      newIndex: {
        [config.language]: newIndex,
      },
      frameborder: {
        [config.language]: indicator.frameborder,
      },
      extensions: {
        [`${DOMAIN}/extensions/materialIndicator`]: {
          materialId: material._id,
          materialName: material.name,
          materialDescription: material.description,
          materialType: material.type,
          materialUrl: material.url,
          topicId: material.topicId,
          courseId: material.courseId,
          channelId: material.channelId,
        },
      },
    },
  };
};
export const generateZoomPDFActivity = (req) => {
  const metadata = createMetadata();
  const material = req.locals.material;
  const buttonId = req.locals.buttonId;
  const oldZoom = req.locals.oldZoom;
  const newZoom = req.locals.newZoom;
  let verb;

  if (buttonId == "zoomIn") {
    verb = "zoomed-in";
  } else if (buttonId == "zoomOut") {
    verb = "zoomed-out";
  } else if (buttonId == "resetZoom") {
    verb = "reset";
  }

  let origin = req.get("origin");
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/${verb}`, verb),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: `${DOMAIN}/activityType/${material.type}`,
        name: {
          [config.language]: material.name,
        },
        description: {
          [config.language]: material.description,
        },
        extensions: {
          [`${DOMAIN}/extensions/${material.type}`]: {
            oldZoom: oldZoom,
            newZoom: newZoom,
            id: material._id,
            channel_id: material.channelId,
            topic_id: material.topicId,
            course_id: material.courseId,
          },
        },
      },
    },
    context: createContext(),
  };
};
