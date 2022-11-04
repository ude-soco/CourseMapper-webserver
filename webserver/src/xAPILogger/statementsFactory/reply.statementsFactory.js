import { v4 as uuidv4 } from "uuid";

export const getReplyToAnnotationCreationStatement = (
  user,
  annotation,
  reply,
  origin
) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: origin,
        name: user.username,
      },
    },
    verb: {
      id: "http://id.tincanapi.com/verb/replied",
      display: {
        "en-US": "replied",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/annotation/${annotation._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/annotation",
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
          "http://www.CourseMapper.de/extensions/annotation": {
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
    result: {
      extensions: {
        "http://www.CourseMapper.de/extensions/reply": {
          id: reply._id,
          content: reply.content,
        },
      },
    },
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getReplyToCommentCreationStatement = (
  user,
  annotation,
  reply,
  origin
) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: origin,
        name: user.username,
      },
    },
    verb: {
      id: "http://id.tincanapi.com/verb/replied",
      display: {
        "en-US": "replied",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/comment/${annotation._id}`,
      definition: {
        type: "http://activitystrea.ms/schema/1.0/comment",
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
          "http://www.CourseMapper.de/extensions/comment": {
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
    result: {
      extensions: {
        "http://www.CourseMapper.de/extensions/reply": {
          id: reply._id,
          content: reply.content,
        },
      },
    },
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getReplyDeletionStatement = (user, reply, origin) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: origin,
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
      id: `${origin}/activity/course/${reply.courseId}/topic/${reply.topicId}/channel/${reply.channelId}/material/${reply.materialId}/annotation/${reply.annotationId}/reply/${reply._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/reply",
        name: {
          "en-US":
            "Reply: " +
            reply.content.slice(0, 50) +
            (reply.content.length > 50 ? " ..." : ""),
        },
        description: {
          "en-US": reply.content,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/reply": {
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
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getReplyLikeStatement = (user, reply, origin) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: origin,
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
      id: `${origin}/activity/course/${reply.courseId}/topic/${reply.topicId}/channel/${reply.channelId}/material/${reply.materialId}/annotation/${reply.annotationId}/reply/${reply._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/reply",
        name: {
          "en-US":
            "Reply: " +
            reply.content.slice(0, 50) +
            (reply.content.length > 50 ? " ..." : ""),
        },
        description: {
          "en-US": reply.content,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/reply": {
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
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getReplyUnlikeStatement = (user, reply, origin) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: origin,
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
      id: `${origin}/activity/course/${reply.courseId}/topic/${reply.topicId}/channel/${reply.channelId}/material/${reply.materialId}/annotation/${reply.annotationId}/reply/${reply._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/reply",
        name: {
          "en-US":
            "Reply: " +
            reply.content.slice(0, 50) +
            (reply.content.length > 50 ? " ..." : ""),
        },
        description: {
          "en-US": reply.content,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/reply": {
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
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getReplyDislikeStatement = (user, reply, origin) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: origin,
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
      id: `${origin}/activity/course/${reply.courseId}/topic/${reply.topicId}/channel/${reply.channelId}/material/${reply.materialId}/annotation/${reply.annotationId}/reply/${reply._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/reply",
        name: {
          "en-US":
            "Reply: " +
            reply.content.slice(0, 50) +
            (reply.content.length > 50 ? " ..." : ""),
        },
        description: {
          "en-US": reply.content,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/reply": {
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
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getReplyUndislikeStatement = (user, reply, origin) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: origin,
        name: user.username,
      },
    },
    verb: {
      id: "http://www.CourseMapper.de/verbs/undisliked",
      display: {
        "en-US": "un-disliked",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${reply.courseId}/topic/${reply.topicId}/channel/${reply.channelId}/material/${reply.materialId}/annotation/${reply.annotationId}/reply/${reply._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/reply",
        name: {
          "en-US":
            "Reply: " +
            reply.content.slice(0, 50) +
            (reply.content.length > 50 ? " ..." : ""),
        },
        description: {
          "en-US": reply.content,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/reply": {
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
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getReplyEditStatement = (user, oldReply, newReply, origin) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: fullname,
      account: {
        homePage: origin,
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
      id: `${origin}/activity/course/${oldReply.courseId}/topic/${oldReply.topicId}/channel/${oldReply.channelId}/material/${oldReply.materialId}/annotation/${oldReply.annotationId}/reply/${oldReply._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/reply",
        name: {
          "en-US":
            "Reply: " +
            oldReply.content.slice(0, 50) +
            (oldReply.content.length > 50 ? " ..." : ""),
        },
        description: {
          "en-US": oldReply.content,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/reply": {
            id: oldReply._id,
            annotation_id: oldReply.annotationId,
            material_id: oldReply.materialId,
            channel_id: oldReply.channelId,
            topic_id: oldReply.topicId,
            course_id: oldReply.courseId,
            content: oldReply.content,
          },
        },
      },
    },
    result: {
      extensions: {
        "http://www.CourseMapper.de/extensions/reply": {
          content: newReply.content,
        },
      },
    },
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};
