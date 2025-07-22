// Probably this will not be used anymore
import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../util/generator-util";
import {
  createAnnotationCommentMaterialResultObject,
  createAnnotationCommentResultObject,
} from "../annotation-comment/utils";
import config from "../util/config";
import {
  createCommentMaterialObject,
  createCommentObject,
} from "./comment-utils";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

export const generateCommentActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://adlnet.gov/expapi/verbs/commented", "commented"),
    object: createCommentMaterialObject(req),
    result: createAnnotationCommentMaterialResultObject(req, "comment"),
    context: createContext(),
  };
};

export const generateDeleteCommentActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/delete", "deleted"),
    object: createCommentObject(req),
    result: createAnnotationCommentResultObject(req, "comment"),
    context: createContext(),
  };
};

export const generateLikeCommentActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/like", "liked"),
    object: createCommentObject(req),
    result: createAnnotationCommentResultObject(req, "comment"),
    context: createContext(),
  };
};

export const generateUnlikeCommentActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/unlike", "unliked"),
    object: createCommentObject(req),
    result: createAnnotationCommentResultObject(req, "comment"),
    context: createContext(),
  };
};

export const generateDislikeCommentActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/dislike", "disliked"),
    object: createCommentObject(req),
    result: createAnnotationCommentResultObject(req, "comment"),
    context: createContext(),
  };
};

export const generateUndislikeCommentActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verbs/undisliked`, "un-disliked"),
    object: createCommentObject(req),
    result: createAnnotationCommentResultObject(req, "comment"),
    context: createContext(),
  };
};

export const generateEditCommentActivity = (req) => {
  const metadata = createMetadata();
  let newAnnotation = req.locals.newAnnotation;
  let oldAnnotation = req.locals.oldAnnotation;
  let origin = req.get("origin");
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://curatr3.com/define/verb/edited", "edited"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${oldAnnotation.courseId}/topic/${oldAnnotation.topicId}/channel/${oldAnnotation.channelId}/material/${oldAnnotation.materialId}/comment/${oldAnnotation._id}`,
      definition: {
        type: "http://activitystrea.ms/schema/1.0/comment",
        name: {
          [config.language]:
            "Comment:" +
            oldAnnotation.content.slice(0, 50) +
            (oldAnnotation.content.length > 50 ? " ..." : ""),
        },
        description: {
          [config.language]: oldAnnotation.content,
        },
        extensions: {
          [`${DOMAIN}/extensions/comment`]: {
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
        [`${DOMAIN}/extensions/comment`]: {
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
