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

export const generateCreateAnnotationActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      "http://risc-inc.com/annotator/verbs/annotated",
      "annotated",
    ),
    object: createAnnotationMaterialObject(req),
    result: createAnnotationCommentMaterialResultObject(req, "annotation"),
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
          [config.language]: `${annotation.content.slice(0, 50)}${annotation.content.length > 50 ? " ..." : ""}`,
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
