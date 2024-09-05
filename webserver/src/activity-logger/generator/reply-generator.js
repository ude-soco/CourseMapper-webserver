import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "./util/generator-util";
import { createAnnotationCommentObject } from "./annotation-comment/utils";
import config from "./util/config";

const createReplyAnnotationResultObject = (req) => {
  let reply = req.locals.reply;
  let annotation = req.locals.annotation;
  let origin = req.get("origin");
  return {
    extensions: {
      [`${origin}/extensions/reply`]: {
        id: reply._id,
        content: reply.content,
        location: annotation.location,
      },
    },
  };
};

const createReplyObject = (req) => {
  let reply = req.locals.reply;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${reply.courseId}/topic/${reply.topicId}/channel/${reply.channelId}/material/${reply.materialId}/annotation/${reply.annotationId}/reply/${reply._id}`,
    definition: {
      type: `${origin}/activityType/reply`,
      name: {
        [config.language]: `${reply.content.slice(0, 50)} ${reply.content.length > 50 ? " ..." : ""}`,
      },
      description: {
        [config.language]: reply.content,
      },
      extensions: {
        [`${origin}/extensions/reply`]: {
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
  };
};

const createReplyResultObject = (req) => {
  let origin = req.get("origin");
  let annotation = req.locals.annotation;
  return {
    extensions: {
      [`${origin}/extensions/reply`]: {
        location: annotation.location,
      },
    },
  };
};

export const generateReplyToAnnotationActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/replied", "replied"),
    object: createAnnotationCommentObject(req, "annotation"),
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
    object: createAnnotationCommentObject(req, "comment"),
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
  let origin = req.get("origin");
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${origin}/verbs/undisliked`, "undisliked"),
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
        type: `${origin}/activityType/reply`,
        name: {
          [config.language]:
            updatedReply.content.slice(0, 50) +
            (updatedReply.content.length > 50 ? " ..." : ""),
        },
        description: {
          [config.language]: replyToEdit.content,
        },
        extensions: {
          [`${origin}/extensions/reply`]: {
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
        [`${origin}/extensions/reply`]: {
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
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`http://id.tincanapi.com/verb/mentioned`, "mentioned"),
    object: createReplyObject(req),
    result: createReplyResultObject(req),
    context: createContext(),
  };
};
