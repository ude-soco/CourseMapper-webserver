import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "../util/generator-util";
import { createAnnotationCommentObject } from "../annotation-comment/utils";
import config from "../util/config";
import {
  createReplyAnnotationResultObject,
  createReplyObject,
  createReplyResultObject,
} from "./reply-utils";
import { createAnnotationObject } from "../annotation-comment/annotation-utils";
import { createCommentObject } from "../comment/comment-utils";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

export const generateReplyToAnnotationActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/replied", "replied"),
    object: createAnnotationObject(req),
    result: createReplyAnnotationResultObject(req),
    context: createContext(),
  };
};

export const generateReplyToCommentActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/replied", "replied"),
    object: createCommentObject(req),
    result: createReplyAnnotationResultObject(req),
    context: createContext(),
  };
};

export const generateDeleteReplyActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/delete", "deleted"),
    object: createReplyObject(req),
    result: createReplyResultObject(req),
    context: createContext(),
  };
};

export const generateLikeReplyActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/like", "liked"),
    object: createReplyObject(req),
    result: createReplyAnnotationResultObject(req),
    context: createContext(),
  };
};

export const generateUnlikeReplyActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/unlike", "unliked"),
    object: createReplyObject(req),
    result: createReplyResultObject(req),
    context: createContext(),
  };
};

export const generateDislikeReplyActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/dislike", "disliked"),
    object: createReplyObject(req),
    result: createReplyResultObject(req),
    context: createContext(),
  };
};

export const generateUndislikeReplyActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verbs/undisliked`, "un-disliked"),
    object: createReplyObject(req),
    result: createReplyResultObject(req),
    context: createContext(),
  };
};

export const generateEditReplyActivity = (req) => {
  const metadata = createMetadata();
  let origin = req.get("origin");
  let annotation = req.locals.annotation;
  let replyToEdit = req.locals.oldReply;
  let updatedReply = req.locals.newReply;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`http://curatr3.com/define/verb/edited`, "edited"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${updatedReply.courseId}/topic/${updatedReply.topicId}/channel/${updatedReply.channelId}/material/${updatedReply.materialId}/annotation/${updatedReply.annotationId}/reply/${updatedReply._id}`,
      definition: {
        type: `${DOMAIN}/activityType/reply`,
        name: {
          [config.language]:
            "Reply: " +
            updatedReply.content.slice(0, 50) +
            (updatedReply.content.length > 50 ? " ..." : ""),
        },
        description: {
          [config.language]: replyToEdit.content,
        },
        extensions: {
          [`${DOMAIN}/extensions/reply`]: {
            id: updatedReply._id,
            annotation_id: updatedReply.annotationId,
            material_id: updatedReply.materialId,
            channel_id: updatedReply.channelId,
            topic_id: updatedReply.topicId,
            course_id: updatedReply.courseId,
            content: updatedReply.content,
          },
        },
      },
    },
    result: {
      extensions: {
        [`${DOMAIN}/extensions/reply`]: {
          location: annotation.location,
          content: updatedReply.content,
        },
      },
    },
    context: createContext(),
  };
};

export const getNewMentionCreationStatement = (req) => {
  const metadata = createMetadata();
  let reply = req.locals.reply;
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`http://id.tincanapi.com/verb/mentioned`, "mentioned"),
    object: {
      objectType: "User",
      definition: {
        type: `${DOMAIN}/activityType/you`,
        name: {
          [config.language]: `${reply.content.slice(0, 50)}${reply.content.length > 50 ? " ..." : ""}`,
        },
        extensions: {
          [`${DOMAIN}/extensions/reply`]: {
            id: reply._id,
            annotation_id: reply.annotationId,
            material_id: reply.materialId,
            channel_id: reply.channelId,
            topic_id: reply.topicId,
            course_id: reply.courseId,
            content: reply.content,
          },
        },
      },
    },
    result: createReplyResultObject(req),
    context: createContext(),
  };
};
