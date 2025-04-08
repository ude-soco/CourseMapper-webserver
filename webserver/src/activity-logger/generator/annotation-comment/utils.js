import config from "../util/config";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

const createAnnotationCommentObject = (
  req,
  type,
  special = false,
  mentioned = false
) => {
  let annotation = req.locals.annotation;
  let origin = req.get("origin");
  let activityType = mentioned
    ? `${DOMAIN}/activityType/user`
    : type === "comment"
    ? "http://activitystrea.ms/schema/1.0/comment"
    : `${DOMAIN}/activityType/${type}`;
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/${type}/${annotation._id}`,
    definition: {
      type: activityType,
      name: {
        [config.language]:
          `${special ? "Annotation:" : ""}` +
          annotation.content.slice(0, 50) +
          (annotation.content.length > 50 ? " ..." : ""),
      },
      description: {
        [config.language]: annotation.content,
      },
      extensions: {
        [`${DOMAIN}/extensions/${type}`]: {
          id: annotation._id,
          material_id: annotation.materialId,
          channel_id: annotation.channelId,
          topic_id: annotation.topicId,
          course_id: annotation.courseId,
          content: annotation.content,
          type: annotation.type,
          tool: annotation.tool,
          location: annotation.location,
        },
      },
    },
  };
};

const createAnnotationCommentResultObject = (req, type) => {
  let annotation = req.locals.annotation;
  return {
    extensions: {
      [`${DOMAIN}/extensions/${type}`]: {
        location: annotation.location,
      },
    },
  };
};

const createAnnotationCommentMaterialResultObject = (req, type) => {
  let annotation = req.locals.annotation;
  return {
    extensions: {
      [`${DOMAIN}/extensions/${type}`]: {
        id: annotation._id,
        material_id: annotation.materialId,
        channel_id: annotation.channelId,
        topic_id: annotation.topicId,
        course_id: annotation.courseId,
        content: annotation.content,
        type: annotation.type,
        tool: annotation.tool,
        location: annotation.location,
      },
    },
  };
};

export {
  createAnnotationCommentObject,
  createAnnotationCommentMaterialResultObject,
  createAnnotationCommentResultObject,
};
