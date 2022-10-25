import { v4 as uuidv4 } from "uuid";

export const getAnnotationCreationStatement = (user, annotation, material) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: "http://www.CourseMapper.v2.de",
        name: user.username,
      },
    },
    verb: {
      id: "http://risc-inc.com/annotator/verbs/annotated",
      display: {
        "en-US": "annotated",
      },
    },
    object: {
      objectType: "Activity",
      id: `http://www.CourseMapper.v2.de/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: "http://www.CourseMapper.v2.de/activityType/material",
        name: {
          "en-US": material.name,
        },
        description: {
          "en-US": material.description,
        },
        extensions: {
          "http://www.CourseMapper.v2.de/extensions/material": {
            id: material._id,
            type: material.type,
            channel_id: material.channelId,
            topic_id: material.topicId,
            course_id: material.courseId,
          },
        },
      },
    },
    result: {
      extensions: {
        "http://www.CourseMapper.v2.de/extensions/annotation": {
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
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};
export const getCommentCreationStatement = (user, annotation, material) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: "http://www.CourseMapper.v2.de",
        name: user.username,
      },
    },
    verb: {
      id: "http://adlnet.gov/expapi/verbs/commented",
      display: {
        "en-US": "commented",
      },
    },
    object: {
      objectType: "Activity",
      id: `http://www.CourseMapper.v2.de/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: "http://www.CourseMapper.v2.de/activityType/material",
        name: {
          "en-US": material.name,
        },
        description: {
          "en-US": material.description,
        },
        extensions: {
          "http://www.CourseMapper.v2.de/extensions/material": {
            id: material._id,
            type: material.type,
            channel_id: material.channelId,
            topic_id: material.topicId,
            course_id: material.courseId,
          },
        },
      },
    },
    result: {
      extensions: {
        "http://www.CourseMapper.v2.de/extensions/comment": {
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
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getAnnotaionDeletionStatement = (user, annotation) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: "http://www.CourseMapper.v2.de",
        name: user.username,
      },
    },
    verb: {
      id: "http://activitystrea.ms/schema/1.0/delete",
      display: {
        "en-US": "deleted",
      },
    },
    object: {
      objectType: "Activity",
      id: `http://www.CourseMapper.v2.de/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/annotation/${annotation._id}`,
      definition: {
        type: "http://www.CourseMapper.v2.de/activityType/annotation",
        name: {
          "en-US":
            "Annotation:" +
            annotation.content.slice(0, 50) +
            (annotation.content.length > 50 ? " ..." : ""),
        },
        description: {
          "en-US": annotation.content,
        },
        extensions: {
          "http://www.CourseMapper.v2.de/extensions/annotation": {
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
    },
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};
export const getCommentDeletionStatement = (user, annotation) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: "http://www.CourseMapper.v2.de",
        name: user.username,
      },
    },
    verb: {
      id: "http://activitystrea.ms/schema/1.0/delete",
      display: {
        "en-US": "deleted",
      },
    },
    object: {
      objectType: "Activity",
      id: `http://www.CourseMapper.v2.de/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/comment/${annotation._id}`,
      definition: {
        type: "http://www.CourseMapper.v2.de/activityType/comment",
        name: {
          "en-US":
            "Comment:" +
            annotation.content.slice(0, 50) +
            (annotation.content.length > 50 ? " ..." : ""),
        },
        description: {
          "en-US": annotation.content,
        },
        extensions: {
          "http://www.CourseMapper.v2.de/extensions/comment": {
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
    },
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getAnnotationLikeStatement = (user, annotation) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: "http://www.CourseMapper.v2.de",
        name: user.username,
      },
    },
    verb: {
      id: "http://activitystrea.ms/schema/1.0/like",
      display: {
        "en-US": "liked",
      },
    },
    object: {
      objectType: "Activity",
      id: `http://www.CourseMapper.v2.de/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/annotation/${annotation._id}`,
      definition: {
        type: "http://www.CourseMapper.v2.de/activityType/annotation",
        name: {
          "en-US":
            "Annotation:" +
            annotation.content.slice(0, 50) +
            (annotation.content.length > 50 ? " ..." : ""),
        },
        description: {
          "en-US": annotation.content,
        },
        extensions: {
          "http://www.CourseMapper.v2.de/extensions/annotation": {
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
    },
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getCommentLikeStatement = (user, annotation) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: "http://www.CourseMapper.v2.de",
        name: user.username,
      },
    },
    verb: {
      id: "http://activitystrea.ms/schema/1.0/like",
      display: {
        "en-US": "liked",
      },
    },
    object: {
      objectType: "Activity",
      id: `http://www.CourseMapper.v2.de/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/comment/${annotation._id}`,
      definition: {
        type: "http://www.CourseMapper.v2.de/activityType/comment",
        name: {
          "en-US":
            "Comment:" +
            annotation.content.slice(0, 50) +
            (annotation.content.length > 50 ? " ..." : ""),
        },
        description: {
          "en-US": annotation.content,
        },
        extensions: {
          "http://www.CourseMapper.v2.de/extensions/comment": {
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
    },
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getAnnotationUnlikeStatement = (user, annotation) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: "http://www.CourseMapper.v2.de",
        name: user.username,
      },
    },
    verb: {
      id: "http://activitystrea.ms/schema/1.0/unlike",
      display: {
        "en-US": "unliked",
      },
    },
    object: {
      objectType: "Activity",
      id: `http://www.CourseMapper.v2.de/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/annotation/${annotation._id}`,
      definition: {
        type: "http://www.CourseMapper.v2.de/activityType/annotation",
        name: {
          "en-US":
            "Annotation:" +
            annotation.content.slice(0, 50) +
            (annotation.content.length > 50 ? " ..." : ""),
        },
        description: {
          "en-US": annotation.content,
        },
        extensions: {
          "http://www.CourseMapper.v2.de/extensions/annotation": {
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
    },
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getCommentUnlikeStatement = (user, annotation) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: "http://www.CourseMapper.v2.de",
        name: user.username,
      },
    },
    verb: {
      id: "http://activitystrea.ms/schema/1.0/unlike",
      display: {
        "en-US": "unliked",
      },
    },
    object: {
      objectType: "Activity",
      id: `http://www.CourseMapper.v2.de/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/comment/${annotation._id}`,
      definition: {
        type: "http://www.CourseMapper.v2.de/activityType/comment",
        name: {
          "en-US":
            "Comment:" +
            annotation.content.slice(0, 50) +
            (annotation.content.length > 50 ? " ..." : ""),
        },
        description: {
          "en-US": annotation.content,
        },
        extensions: {
          "http://www.CourseMapper.v2.de/extensions/comment": {
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
    },
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getAnnotationDislikeStatement = (user, annotation) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: "http://www.CourseMapper.v2.de",
        name: user.username,
      },
    },
    verb: {
      id: "http://activitystrea.ms/schema/1.0/dislike",
      display: {
        "en-US": "disliked",
      },
    },
    object: {
      objectType: "Activity",
      id: `http://www.CourseMapper.v2.de/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/annotation/${annotation._id}`,
      definition: {
        type: "http://www.CourseMapper.v2.de/activityType/annotation",
        name: {
          "en-US":
            "Annotation:" +
            annotation.content.slice(0, 50) +
            (annotation.content.length > 50 ? " ..." : ""),
        },
        description: {
          "en-US": annotation.content,
        },
        extensions: {
          "http://www.CourseMapper.v2.de/extensions/annotation": {
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
    },
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getAnnotationUndislikeStatement = (user, annotation) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: "http://www.CourseMapper.v2.de",
        name: user.username,
      },
    },
    verb: {
      id: "http://www.CourseMapper.v2.de/verbs/undisliked",
      display: {
        "en-US": "un-disliked",
      },
    },
    object: {
      objectType: "Activity",
      id: `http://www.CourseMapper.v2.de/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/annotation/${annotation._id}`,
      definition: {
        type: "http://www.CourseMapper.v2.de/activityType/annotation",
        name: {
          "en-US":
            "Annotation:" +
            annotation.content.slice(0, 50) +
            (annotation.content.length > 50 ? " ..." : ""),
        },
        description: {
          "en-US": annotation.content,
        },
        extensions: {
          "http://www.CourseMapper.v2.de/extensions/annotation": {
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
    },
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getAnnotationEditStatement = (
  user,
  newAnnotation,
  oldAnnotation
) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: "http://www.CourseMapper.v2.de",
        name: user.username,
      },
    },
    verb: {
      id: "http://curatr3.com/define/verb/edited",
      display: {
        "en-US": "edited",
      },
    },
    object: {
      objectType: "Activity",
      id: `http://www.CourseMapper.v2.de/activity/course/${oldAnnotation.courseId}/topic/${oldAnnotation.topicId}/channel/${oldAnnotation.channelId}/material/${oldAnnotation.materialId}/annotation/${oldAnnotation._id}`,
      definition: {
        type: "http://www.CourseMapper.v2.de/activityType/annotation",
        name: {
          "en-US":
            "Annotation:" +
            oldAnnotation.content.slice(0, 50) +
            (oldAnnotation.content.length > 50 ? " ..." : ""),
        },
        description: {
          "en-US": oldAnnotation.content,
        },
        extensions: {
          "http://www.CourseMapper.v2.de/extensions/annotation": {
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
        "http://www.CourseMapper.v2.de/extensions/annotation": {
          content: newAnnotation.content,
          type: newAnnotation.type,
          tool: newAnnotation.tool,
          location: newAnnotation.location,
        },
      },
    },
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};
