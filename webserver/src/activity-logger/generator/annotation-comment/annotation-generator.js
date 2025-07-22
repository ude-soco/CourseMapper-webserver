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

const formatActivityType = (type) => {
  // Convert to lowercase and replace spaces with underscores
  return type.toLowerCase().replace(/\s+/g, "-");
};

const createAnnotationsObject = (req) => {
  let annotations = req.locals.annotations;
  let material = req.locals.material;
  let origin = req.get("origin");

  const formattedAnnotations = annotations.map((annotation) => ({
    id: annotation._id,
    content: annotation.content,
    type: annotation.type,
  }));
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/annotation`,
    definition: {
      type: `${DOMAIN}/activityType/annotation`,
      name: {
        [config.language]: `Annotations - ${material.type}: ${material.name}`,
      },
      description: {
        [config.language]: "All annotations",
      },
      extensions: {
        [`${DOMAIN}/extensions/annotation`]: {
          annotations: formattedAnnotations,
          material_id: material._id,
          channel_id: material.channelId,
          topic_id: material.topicId,
          course_id: material.courseId,
        },
      },
    },
  };
};
const createMaterialFilteredAnnotationsObject = (req) => {
  let origin = req.get("origin");
  let annotations = req.locals.annotations;
  let material = req.locals.material;
  let filters = req.locals.filters;

  // Conditionally add currentPage or currentTime to the extensions
  const additionalInfo = {};
  if (material.type === "pdf" && req.body.currentPage !== undefined) {
    additionalInfo.currentPage = req.body.currentPage;
  } else if (material.type === "video" && req.body.currentTime !== undefined) {
    additionalInfo.currentTime = req.body.currentTime;
  }
  const formattedAnnotations = annotations.map((annotation) => ({
    id: annotation._id,
    content: annotation.content,
    type: annotation.type,
  }));

  const extensions = {
    [`${DOMAIN}/extensions/annotation`]: {
      annotations: formattedAnnotations,
      filters: filters,
      material_id: material._id,
      channel_id: material.channelId,
      topic_id: material.topicId,
      course_id: material.courseId,
      ...additionalInfo,
    },
  };

  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/annotation`,
    definition: {
      type: `${DOMAIN}/activityType/annotation`,
      name: {
        [config.language]: `Annotations - ${material.type}: ${material.name}`,
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
    //result: createAnnotationCommentMaterialResultObject(req, "annotation"), // We don't use comment/annotation differentiation anymore
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
  let formattedType = formatActivityType(req.locals.annotation.type);

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(verbURI, verb),
    object: createAnnotationObject(req),
    result: createAnnotationCommentResultObject(req, formattedType), // Confision related to annotation and comment, perhaps comment needs to be removed
    context: createContext(),
  };
};

export const generateDeleteAnnotationActivity = (req) => {
  const metadata = createMetadata();
  let formattedType = formatActivityType(req.locals.annotation.type);
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/delete", "deleted"),
    object: createAnnotationObject(req),
    result: createAnnotationCommentResultObject(req, formattedType),
    context: createContext(),
  };
};

export const generateLikeAnnotationActivity = (req) => {
  const metadata = createMetadata();
  let formattedType = formatActivityType(req.locals.annotation.type);
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/like", "liked"),
    object: createAnnotationObject(req),
    result: createAnnotationCommentResultObject(req, formattedType),
    context: createContext(),
  };
};

export const getAnnotationUnlikeStatement = (req) => {
  const metadata = createMetadata();
  let formattedType = formatActivityType(req.locals.annotation.type);
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/unlike", "unliked"),
    object: createAnnotationObject(req),
    result: createAnnotationCommentResultObject(req, formattedType),
    context: createContext(),
  };
};

export const generateDislikeAnnotationActivity = (req) => {
  const metadata = createMetadata();
  let formattedType = formatActivityType(req.locals.annotation.type);
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/dislike", "disliked"),
    object: createAnnotationObject(req),
    result: createAnnotationCommentResultObject(req, formattedType),
    context: createContext(),
  };
};

export const generateUndislikeAnnotationActivity = (req) => {
  const metadata = createMetadata();
  let formattedType = formatActivityType(req.locals.annotation.type);
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verbs/undisliked`, "un-disliked"),
    object: createAnnotationObject(req),
    result: createAnnotationCommentResultObject(req, formattedType),
    context: createContext(),
  };
};

// Log activity: User hid annotations from Material
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
// Log activity: User unhid annotations from Material
export const generateUnhideAnnotationsActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verbs/showed`, "showed"),
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
  let formattedType = formatActivityType(oldAnnotation.type);
  let origin = req.get("origin");
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://curatr3.com/define/verb/edited", "edited"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${oldAnnotation.courseId}/topic/${oldAnnotation.topicId}/channel/${oldAnnotation.channelId}/material/${oldAnnotation.materialId}/annotation/${oldAnnotation._id}`,
      definition: {
        type: `${DOMAIN}/activityType/${formattedType}`,
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
          [`${DOMAIN}/extensions/${formattedType}`]: {
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
      //TODO: This needs to be removed, use in the notification the deifinition's extensions
      extensions: {
        [`${DOMAIN}/extensions/${formattedType}`]: {
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

// export const generateAddMentionStatement = (req) => {
//   const metadata = createMetadata();
//   let annotation = req.locals.annotation;
//   let origin = req.get("origin");
//   return {
//     ...metadata,
//     actor: createUser(req),
//     verb: createVerb("http://id.tincanapi.com/verb/mentioned", "mentioned"),
//     object: {
//       objectType: config.activity,
//       id: `${origin}/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/mention/${req.locals.mentionedUser.userId}`,
//       definition: {
//         type: `${DOMAIN}/activityType/you`,
//         name: {
//           [config.language]: req.locals.mentionedUser.name,
//         },
//         extensions: {
//           [`${DOMAIN}/extensions/annotation`]: {
//             id: annotation._id,
//             material_id: annotation.materialId,
//             channel_id: annotation.channelId,
//             topic_id: annotation.topicId,
//             course_id: annotation.courseId,
//             content: annotation.content,
//           },
//         },
//       },
//     },
//     result: createAnnotationCommentResultObject(req, "annotation"),
//     context: createContext(),
//   };
// };
//TODO: Actually the type is user, but the notification section uses you/annotation
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
