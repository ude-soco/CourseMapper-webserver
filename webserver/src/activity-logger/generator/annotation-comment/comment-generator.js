import { v4 as uuidv4 } from "uuid";
import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../util/generator-util";
import {
  createAnnotationCommentMaterialObject,
  createAnnotationCommentObject,
  createAnnotationCommentMaterialResultObject,
  createAnnotationCommentResultObject,
} from "./utils";
import config from "../util/config";

const platform = "CourseMapper";
const language = "en-US";

export const generateCommentActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://adlnet.gov/expapi/verbs/commented", "commented"),
    object: createAnnotationCommentMaterialObject(req),
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
    object: createAnnotationCommentObject(req, "comment"),
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
    object: createAnnotationCommentObject(req, "comment"),
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
    object: createAnnotationCommentObject(req, "comment"),
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
    object: createAnnotationCommentObject(req, "comment"),
    result: createAnnotationCommentResultObject(req, "comment"),
    context: createContext(),
  };
};

export const generateUndislikeCommentActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${req.get("origin")}/verbs/undisliked`, "un-disliked"),
    object: createAnnotationCommentObject(req, "comment"),
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
          [config.language]: `${oldAnnotation.content.slice(0, 50)} ${oldAnnotation.content.length > 50 ? " ..." : ""}`,
        },
        description: {
          [config.language]: oldAnnotation.content,
        },
        extensions: {
          [`${origin}/extensions/comment`]: {
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
        [`${origin}/extensions/comment`]: {
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
