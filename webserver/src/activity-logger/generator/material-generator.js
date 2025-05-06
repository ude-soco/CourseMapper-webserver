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
  // let materialType = req.locals.materialType;
  let origin = req.get("origin");
  let materialType;
  if (material.type === "pdf") {
    materialType = "pdf";
  } else if (material.type === "video") {
    if (material.url.includes("www.youtube.com")) {
      materialType = "youtube";
    } else {
      materialType = "video";
    }
  } else {
    materialType = material.type;
  }
  // let type;
  // if (materialType === "pdf") {
  //   type = `${DOMAIN}/activityType/pdf`;
  // } else if (materialType === "video" && req.locals.videoType === "fileVideo") {
  //   type = `${DOMAIN}/activityType/video`;
  // } else if (materialType === "video" && req.locals.videoType === "urlVideo") {
  //   type = `${DOMAIN}/activityType/youtube`;
  // } else {
  //   type = `${DOMAIN}/activityType/${material.type}`;
  // }
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
    definition: {
      type: `${DOMAIN}/activityType/${materialType}`,
      name: {
        [config.language]: material.name,
      },
      description: {
        [config.language]: material.description || "",
      },
      extensions: {
        [`${DOMAIN}/extensions/${materialType}`]: {
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
        ? `${DOMAIN}/verb/uploaded`
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

  let materialType;
  if (updatedMaterial.type === "pdf") {
    materialType = "pdf";
  } else if (updatedMaterial.type === "video") {
    if (updatedMaterial.url.includes("www.youtube.com")) {
      materialType = "youtube";
    } else {
      materialType = "video";
    }
  }
  let origin = req.get("origin");
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://curatr3.com/define/verb/edited", "edited"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${materialToEdit.courseId}/topic/${materialToEdit.topicId}/channel/${materialToEdit.channelId}/material/${materialToEdit._id}`,
      definition: {
        type: `${DOMAIN}/activityType/${materialType}`,
        name: {
          [config.language]: materialToEdit.name,
        },
        description: {
          [config.language]: materialToEdit.description || "",
        },
        extensions: {
          [`${DOMAIN}/extensions/${materialType}`]: {
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
        [`${DOMAIN}/extensions/${materialType}`]: {
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
  let materialType;

  if (material.type === "video") {
    if (material.url.includes("www.youtube.com")) {
      materialType = "youtube";
    } else {
      materialType = "video";
    }
  }
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
    definition: {
      type: `${DOMAIN}/activityType/${materialType}`,
      name: {
        [config.language]: material.name,
      },
      description: {
        [config.language]: material.description || "",
      },
      extensions: {
        [`${DOMAIN}/extensions/${materialType}`]: {
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
  let originalMaterial = req.locals.material;
  let materialType;

  if (originalMaterial.type === "video") {
    if (originalMaterial.url.includes("www.youtube.com")) {
      materialType = "youtube";
    } else {
      materialType = "video";
    }
  }
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      "http://activitystrea.ms/schema/1.0/complete",
      "completed"
    ),
    object: createMaterialObject(req, `${DOMAIN}/activityType/${materialType}`),
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
        [config.language]: material.description || "",
      },
      extensions: {
        [`${DOMAIN}/extensions/slide`]: {
          material_id: material._id,
          material_name: material.name,
          material_pageNr: slideNr,
          material_description: material.description,
          material_type: material.type,
          material_url: material.url,
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
  const origin = req.get("origin");

  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/material-dashboard`,
    definition: {
      type: `${DOMAIN}/activityType/material-dashboard`,
      name: {
        [config.language]: `Material Dashboard - ${material.name}`,
      },
      extensions: {
        [`${origin}/extensions/material-dashboard`]: {
          indicators: material.indicators,
          materialName: material.name,
          materialType: material.type,
          materialDescription: material.description,
          materialId: material._id,
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
    verb: createVerb(`${DOMAIN}/verb/resize`, "resized"),
    object: createResizedMaterialIndicatorObject(req),
    context: createContext(),
  };
};
export const generateReorderMaterialIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/reorder`, "reordered"),
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
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/indicator/${indicator._id}`,
    definition: {
      type: `${DOMAIN}/activityType/material-indicator`,
      name: {
        [config.language]: `Material Indicator Id: ${indicator._id} - ${material.name} Dashboard`,
      },
      extensions: {
        [`${origin}/extensions/material-indicator`]: {
          id: indicator._id,
          source: indicator.src,
          width: indicator.width,
          height: indicator.height,
          frameborder: indicator.frameborder,
          materialId: material._id,
          materialName: material.name,
          channelId: material.channelId,
          topicId: material.topicId,
          courseId: material.courseId,
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
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/indicator/${indicator._id}`,
    definition: {
      type: `${DOMAIN}/activityType/material-indicator`,
      name: {
        [config.language]: `Material Indicator Id: ${indicator._id} - ${material.name} Dashboard`,
      },
      extensions: {
        [`${origin}/extensions/material-indicator`]: {
          id: indicator._id,
          oldDimensions: oldDimensions,
          newDimensions: newDimensions,
          frameborder: indicator.frameborder,
          courseId: material.courseId,
          topicId: material.topicId,
          channelId: material.channelId,
          materialId: material._id,
          materialName: material.name,
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
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/indicator/${indicator._id}`,
    definition: {
      type: `${DOMAIN}/activityType/material-indicator`,
      name: {
        [config.language]: `Material Indicator Id: ${indicator._id} - ${material.name} Dashboard`,
      },
      extensions: {
        [`${origin}/extensions/material-indicator`]: {
          id: indicator._id,
          oldIndex: oldIndex,
          newIndex: newIndex,
          frameborder: indicator.frameborder,
          courseId: material.courseId,
          topicId: material.topicId,
          channelId: material.channelId,
          materialId: material._id,
          materialName: material.name,
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
  let verbURI;
  if (buttonId == "zoomIn") {
    verbURI = "zoomed-in";
    verb = "zoomed in";
  } else if (buttonId == "zoomOut") {
    verbURI = "zoomed-out";
    verb = "zoomed out";
  } else if (buttonId == "resetZoom") {
    verbURI = "reset-zoom";
    verb = "reset zoom";
  }

  let origin = req.get("origin");
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/${verbURI}`, verb),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: `${DOMAIN}/activityType/${material.type}`,
        name: {
          [config.language]: material.name,
        },
        description: {
          [config.language]: material.description || "",
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
