import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../util/generator-util";
import {
  createAnnotationCommentMaterialResultObject,
  createAnnotationCommentResultObject,
} from "./utils";
import config from "../util/config";
import {
  createAnnotationMaterialObject,
  createAnnotationObject,
} from "./annotation-utils";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

const createAnnotationsObject = (req) => {
  let annotations = req.locals.annotations;
  let material = req.locals.material;
  let origin = req.get("origin");

  return annotations.map((annotation) => ({
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/annotation/${annotation._id}`,
    definition: {
      type: `${DOMAIN}/activityType/${annotation.type}`,
      name: {
        [config.language]: annotation.content,
      },
      extensions: {
        [`${DOMAIN}/extensions/${annotation.type}`]: {
          annotation_id: annotation._id,
          material_id: material._id,
          channel_id: material.channelId,
          topic_id: material.topicId,
          course_id: material.courseId,
        },
      },
    },
  }));
};
const createMaterialFilteredAnnotationsObject = (req) => {
  let origin = req.get("origin");
  let annotations = req.locals.annotations;
  let material = req.locals.material;
  let filters = req.locals.filters;
  let currentPage; // defined only for pdfs
  let currentTime; // defined only for videos

  if (req.body.currentPage) {
    currentPage = req.body.currentPage;
  } else if (req.body.currentTime) {
    currentTime = req.body.currentTime;
  }

  const formattedAnnotations = annotations.map((annotation) => ({
    id: annotation._id,
    content: annotation.content,
    type: annotation.type,
  }));

  const extensions = {
    [`${DOMAIN}/extensions/${material.type}`]: {
      annotations: formattedAnnotations,
      filters: filters,
      material_id: material._id,
      channel_id: material.channelId,
      topic_id: material.topicId,
      course_id: material.courseId,
    },
  };

  // Conditionally add currentPage or currentTime to the extensions
  if (material.type === "pdf" && currentPage !== undefined) {
    extensions[`${DOMAIN}/extensions/${material.type}`].currentPage =
      currentPage;
  } else if (material.type === "video" && currentTime !== undefined) {
    extensions[`${DOMAIN}/extensions/${material.type}`].currentTime =
      currentTime;
  }

  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/annotations`,
    definition: {
      type: `${DOMAIN}/activityType/${material.type}`,
      name: {
        [config.language]: material.name,
      },
      description: {
        [config.language]: material.description,
      },
      extensions: extensions,
    },
  };
};

// export const generateCreateAnnotationActivity = (req) => {
//   const metadata = createMetadata();
//   return {
//     ...metadata,
//     actor: createUser(req),
//     verb: createVerb(
//       "http://risc-inc.com/annotator/verbs/annotated",
//       "annotated",
//     ),
//     object: createAnnotationMaterialObject(req),
//     result: createAnnotationCommentMaterialResultObject(req, "annotation"),
//     context: createContext(),
//   };
// };

// This function is for the activity User annotated a Material
export const generateAnnotateMaterialActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      "http://risc-inc.com/annotator/verbs/annotated",
      "annotated"
    ),
    object: createAnnotationMaterialObject(req),
    result: createAnnotationCommentMaterialResultObject(req, "annotation"), // ? what is it for.
    context: createContext(),
  };
};

// This function is for the activity User added an annotation (Note/ Question/ External resource)
export const generateCreateAnnotationActivity = (req) => {
  const metadata = createMetadata();
  let verb;
  let verbURI;
  if (req.locals.annotation.type === "Question") {
    verb = "asked";
    verbURI = "http://adlnet.gov/expapi/verbs/asked";
  } else {
    verb = "added";
    verbURI = "http://activitystrea.ms/schema/1.0/add";
  }

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(verbURI, verb),
    object: createAnnotationObject(req),
    result: createAnnotationCommentMaterialResultObject(req, "annotation"), // ? what is it for.
    context: createContext(),
  };
};

export const generateDeleteAnnotationActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/delete", "deleted"),
    object: createAnnotationObject(req),
    result: createAnnotationCommentResultObject(req, "annotation"),
    context: createContext(),
  };
};

export const generateLikeAnnotationActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/like", "liked"),
    object: createAnnotationObject(req),
    result: createAnnotationCommentResultObject(req, "annotation"),
    context: createContext(),
  };
};

export const getAnnotationUnlikeStatement = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/unlike", "unliked"),
    object: createAnnotationObject(req),
    result: createAnnotationCommentResultObject(req, "annotation"),
    context: createContext(),
  };
};

export const generateDislikeAnnotationActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/dislike", "disliked"),
    object: createAnnotationObject(req),
    result: createAnnotationCommentResultObject(req, "annotation"),
    context: createContext(),
  };
};

export const generateUndislikeAnnotationActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verbs/undisliked`, "un-disliked"),
    object: createAnnotationObject(req),
    result: createAnnotationCommentResultObject(req, "annotation"),
    context: createContext(),
  };
};

// Log activity: User hid annotations from PDF
export const generateHideAnnotationsActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verbs/hid`, "hid"),
    object: createAnnotationsObject(req),
    context: createContext(),
  };
};
// Log activity: User unhid annotations from PDF
export const generateUnhideAnnotationsActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verbs/unhid`, "unhid"),
    object: createAnnotationsObject(req),
    context: createContext(),
  };
};
export const generateFilterAnnotationsActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verbs/filtered`, "filtered"),
    object: createMaterialFilteredAnnotationsObject(req),
    context: createContext(),
  };
};

export const generateEditAnnotationActivity = (req) => {
  const metadata = createMetadata();
  let newAnnotation = req.locals.newAnnotation;
  let oldAnnotation = req.locals.oldAnnotation;
  let origin = req.get("origin");
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://curatr3.com/define/verb/edited", "edited"),
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${oldAnnotation.courseId}/topic/${oldAnnotation.topicId}/channel/${oldAnnotation.channelId}/material/${oldAnnotation.materialId}/annotation/${oldAnnotation._id}`,
      definition: {
        type: `${DOMAIN}/activityType/annotation`,
        name: {
          [config.language]:
            "Annotation:" +
            oldAnnotation.content.slice(0, 50) +
            (oldAnnotation.content.length > 50 ? " ..." : ""),
        },
        description: {
          [config.language]: oldAnnotation.content,
        },
        extensions: {
          [`${DOMAIN}/extensions/annotation`]: {
            id: oldAnnotation._id,
            material_id: oldAnnotation.materialId,
            channel_id: oldAnnotation.channelId,
            topic_id: oldAnnotation.topicId,
            course_id: oldAnnotation.courseId,
            content: oldAnnotation.content,
            type: oldAnnotation.type,
            tool: oldAnnotation.tool,
            location: oldAnnotation.location,
          },
        },
      },
    },
    result: {
      extensions: {
        [`${DOMAIN}/extensions/annotation`]: {
          content: newAnnotation.content,
          type: newAnnotation.type,
          tool: newAnnotation.tool,
          location: newAnnotation.location,
        },
      },
    },
    context: createContext(),
  };
};

export const generateAddMentionStatement = (req) => {
  const metadata = createMetadata();
  let annotation = req.locals.annotation;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/mentioned", "mentioned"),
    object: {
      objectType: "User",
      definition: {
        type: `${DOMAIN}/activityType/you`,
        name: {
          [config.language]: `${annotation.content.slice(0, 50)}${
            annotation.content.length > 50 ? " ..." : ""
          }`,
        },
        extensions: {
          [`${DOMAIN}/extensions/annotation`]: {
            id: annotation._id,
            material_id: annotation.materialId,
            channel_id: annotation.channelId,
            topic_id: annotation.topicId,
            course_id: annotation.courseId,
            content: annotation.content,
          },
        },
      },
    },
    result: createAnnotationCommentResultObject(req, "annotation"),
    context: createContext(),
  };
};
