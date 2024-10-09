import config from "../util/config";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

const createReplyAnnotationResultObject = (req) => {
  let reply = req.locals.reply;
  let annotation = req.locals.annotation;
  return {
    extensions: {
      [`${DOMAIN}/extensions/reply`]: {
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
      type: `${DOMAIN}/activityType/reply`,
      name: {
        [config.language]:
          "Reply: " +
          reply.content.slice(0, 50) +
          (reply.content.length > 50 ? " ..." : ""),
      },
      description: {
        [config.language]: reply.content,
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
  };
};

const createReplyResultObject = (req) => {
  let annotation = req.locals.annotation;
  return {
    extensions: {
      [`${DOMAIN}/extensions/reply`]: {
        location: annotation.location,
      },
    },
  };
};

export {
  createReplyAnnotationResultObject,
  createReplyObject,
  createReplyResultObject,
};
