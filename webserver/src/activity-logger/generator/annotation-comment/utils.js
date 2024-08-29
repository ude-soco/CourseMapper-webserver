import config from "../util/config";

// TODO: Clear differentiation of type of material annotated or commented
const createAnnotationCommentMaterialObject = (req) => {
  let material = req.locals.material;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
    definition: {
      type: `${origin}/activityType/material`,
      name: {
        [config.language]: material.name,
      },
      description: {
        [config.language]: material.description,
      },
      extensions: {
        [`${origin}/extensions/material`]: {
          id: material._id,
          type: material.type,
          channel_id: material.channelId,
          topic_id: material.topicId,
          course_id: material.courseId,
        },
      },
    },
  };
};

const createAnnotationCommentObject = (req, type) => {
  let annotation = req.locals.annotation;
  let origin = req.get("origin");
  let activityType =
    type === "comment"
      ? "http://activitystrea.ms/schema/1.0/comment"
      : `${origin}/activityType/${type}`;
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/${type}/${annotation._id}`,
    definition: {
      type: activityType,
      name: {
        [config.language]: `${annotation.content.slice(0, 50)} ${annotation.content.length > 50 ? " ..." : ""}`,
      },
      description: {
        [config.language]: annotation.content,
      },
      extensions: {
        [`${origin}/extensions/${type}`]: {
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
  let origin = req.get("origin");
  return {
    extensions: {
      [`${origin}/extensions/${type}`]: {
        location: annotation.location,
      },
    },
  };
};

const createAnnotationCommentMaterialResultObject = (req, type) => {
  let annotation = req.locals.annotation;
  let origin = req.get("origin");
  return {
    extensions: {
      [`${origin}/extensions/${type}`]: {
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
  createAnnotationCommentMaterialObject,
  createAnnotationCommentObject,
  createAnnotationCommentMaterialResultObject,
  createAnnotationCommentResultObject,
};
