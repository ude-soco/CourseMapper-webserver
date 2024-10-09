import config from "../util/config";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

// TODO: Clear differentiation of type of material annotated or commented
const createAnnotationMaterialObject = (req) => {
  let material = req.locals.material;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
    definition: {
      type: `${DOMAIN}/activityType/material`,
      name: {
        [config.language]: material.name,
      },
      description: {
        [config.language]: material.description,
      },
      extensions: {
        [`${DOMAIN}/extensions/material`]: {
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

const createAnnotationObject = (req) => {
  let annotation = req.locals.annotation;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/annotation/${annotation._id}`,
    definition: {
      type: `${DOMAIN}/activityType/annotation`,
      name: {
        [config.language]:
          "Annotation:" +
          annotation.content.slice(0, 50) +
          (annotation.content.length > 50 ? " ..." : ""),
      },
      description: {
        [config.language]: annotation.content,
      },
      extensions: {
        [`${DOMAIN}/extensions/annotation`]: {
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

export { createAnnotationMaterialObject, createAnnotationObject };
