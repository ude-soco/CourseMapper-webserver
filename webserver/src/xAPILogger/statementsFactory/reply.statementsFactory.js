import { v4 as uuidv4 } from "uuid";

const platform = "CourseMapper";
const language = "en-US";

export const getReplyToAnnotationCreationStatement = (
  user,
  annotation,
  reply,
  origin
) => {
  const userId = user._id.toString();
  const userFullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: userFullname,
      mbox: user.mbox,
      mbox_sha1sum: user.mbox_sha1sum,
      account: {
        homePage: origin,
        name: userId,
      },
    },
    verb: {
      id: "http://id.tincanapi.com/verb/replied",
      display: {
        [language]: "replied",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/annotation/${annotation._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/annotation",
        name: {
          [language]:
            "Annotation:" +
            annotation.content.slice(0, 50) +
            (annotation.content.length > 50 ? " ..." : ""),
        },
        description: {
          [language]: annotation.content,
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
          location: annotation.location,
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};

export const getReplyToCommentCreationStatement = (
  user,
  annotation,
  reply,
  origin
) => {
  const userId = user._id.toString();
  const userFullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: userFullname,
      mbox: user.mbox,
      mbox_sha1sum: user.mbox_sha1sum,
      account: {
        homePage: origin,
        name: userId,
      },
    },
    verb: {
      id: "http://id.tincanapi.com/verb/replied",
      display: {
        [language]: "replied",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/comment/${annotation._id}`,
      definition: {
        type: "http://activitystrea.ms/schema/1.0/comment",
        name: {
          [language]:
            "Comment:" +
            annotation.content.slice(0, 50) +
            (annotation.content.length > 50 ? " ..." : ""),
        },
        description: {
          [language]: annotation.content,
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
          location: annotation.location,
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};

export const getReplyDeletionStatement = (user, reply, origin) => {
  const userId = user._id.toString();
  const userFullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: userFullname,
      mbox: user.mbox,
      mbox_sha1sum: user.mbox_sha1sum,
      account: {
        homePage: origin,
        name: userId,
      },
    },
    verb: {
      id: "http://activitystrea.ms/schema/1.0/delete",
      display: {
        [language]: "deleted",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${reply.courseId}/topic/${reply.topicId}/channel/${reply.channelId}/material/${reply.materialId}/annotation/${reply.annotationId}/reply/${reply._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/reply",
        name: {
          [language]:
            "Reply: " +
            reply.content.slice(0, 50) +
            (reply.content.length > 50 ? " ..." : ""),
        },
        description: {
          [language]: reply.content,
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
    result: {
      extensions: {
        "http://www.CourseMapper.de/extensions/reply": {
          location: annotation.location,
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};

export const getReplyLikeStatement = (user, reply, origin) => {
  const userId = user._id.toString();
  const userFullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: userFullname,
      mbox: user.mbox,
      mbox_sha1sum: user.mbox_sha1sum,
      account: {
        homePage: origin,
        name: userId,
      },
    },
    verb: {
      id: "http://activitystrea.ms/schema/1.0/like",
      display: {
        [language]: "liked",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${reply.courseId}/topic/${reply.topicId}/channel/${reply.channelId}/material/${reply.materialId}/annotation/${reply.annotationId}/reply/${reply._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/reply",
        name: {
          [language]:
            "Reply: " +
            reply.content.slice(0, 50) +
            (reply.content.length > 50 ? " ..." : ""),
        },
        description: {
          [language]: reply.content,
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
    result: {
      extensions: {
        "http://www.CourseMapper.de/extensions/reply": {
          id: reply._id,
          content: reply.content,
          location: annotation.location,
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};

export const getReplyUnlikeStatement = (user, reply, origin) => {
  const userId = user._id.toString();
  const userFullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: userFullname,
      mbox: user.mbox,
      mbox_sha1sum: user.mbox_sha1sum,
      account: {
        homePage: origin,
        name: userId,
      },
    },
    verb: {
      id: "http://activitystrea.ms/schema/1.0/unlike",
      display: {
        [language]: "unliked",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${reply.courseId}/topic/${reply.topicId}/channel/${reply.channelId}/material/${reply.materialId}/annotation/${reply.annotationId}/reply/${reply._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/reply",
        name: {
          [language]:
            "Reply: " +
            reply.content.slice(0, 50) +
            (reply.content.length > 50 ? " ..." : ""),
        },
        description: {
          [language]: reply.content,
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
    result: {
      extensions: {
        "http://www.CourseMapper.de/extensions/reply": {
          location: annotation.location,
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};

export const getReplyDislikeStatement = (user, reply, origin) => {
  const userId = user._id.toString();
  const userFullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: userFullname,
      mbox: user.mbox,
      mbox_sha1sum: user.mbox_sha1sum,
      account: {
        homePage: origin,
        name: userId,
      },
    },
    verb: {
      id: "http://activitystrea.ms/schema/1.0/dislike",
      display: {
        [language]: "disliked",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${reply.courseId}/topic/${reply.topicId}/channel/${reply.channelId}/material/${reply.materialId}/annotation/${reply.annotationId}/reply/${reply._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/reply",
        name: {
          [language]:
            "Reply: " +
            reply.content.slice(0, 50) +
            (reply.content.length > 50 ? " ..." : ""),
        },
        description: {
          [language]: reply.content,
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
    result: {
      extensions: {
        "http://www.CourseMapper.de/extensions/reply": {
          location: annotation.location,
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};

export const getReplyUndislikeStatement = (user, reply, origin) => {
  const userId = user._id.toString();
  const userFullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: userFullname,
      mbox: user.mbox,
      mbox_sha1sum: user.mbox_sha1sum,
      account: {
        homePage: origin,
        name: userId,
      },
    },
    verb: {
      id: "http://www.CourseMapper.de/verbs/undisliked",
      display: {
        [language]: "un-disliked",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${reply.courseId}/topic/${reply.topicId}/channel/${reply.channelId}/material/${reply.materialId}/annotation/${reply.annotationId}/reply/${reply._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/reply",
        name: {
          [language]:
            "Reply: " +
            reply.content.slice(0, 50) +
            (reply.content.length > 50 ? " ..." : ""),
        },
        description: {
          [language]: reply.content,
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
    result: {
      extensions: {
        "http://www.CourseMapper.de/extensions/reply": {
          location: annotation.location,
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};

export const getReplyEditStatement = (user, oldReply, newReply, origin) => {
  const userId = user._id.toString();
  const userFullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: userFullname,
      mbox: user.mbox,
      mbox_sha1sum: user.mbox_sha1sum,
      account: {
        homePage: origin,
        name: userId,
      },
    },
    verb: {
      id: "http://curatr3.com/define/verb/edited",
      display: {
        [language]: "edited",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${newReply.courseId}/topic/${newReply.topicId}/channel/${newReply.channelId}/material/${newReply.materialId}/annotation/${newReply.annotationId}/reply/${newReply._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/reply",
        name: {
          [language]:
            "Reply: " +
            newReply.content.slice(0, 50) +
            (newReply.content.length > 50 ? " ..." : ""),
        },
        description: {
          [language]: oldReply.content,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/reply": {
            id: newReply._id,
            annotation_id: newReply.annotationId,
            material_id: newReply.materialId,
            channel_id: newReply.channelId,
            topic_id: newReply.topicId,
            course_id: newReply.courseId,
            content: newReply.content,
          },
        },
      },
    },
    result: {
      extensions: {
        "http://www.CourseMapper.de/extensions/reply": {
          location: annotation.location,
          content: newReply.content,
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};

export const getNewMentionCreationStatement = (
  user,
  reply,
  origin,
  annotation
) => {
  const userId = user._id.toString();
  const userFullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: userFullname,
      mbox: user.mbox,
      mbox_sha1sum: user.mbox_sha1sum,
      account: {
        homePage: origin,
        name: userId,
      },
    },
    verb: {
      id: "http://id.tincanapi.com/verb/mentioned",
      display: {
        [language]: "mentioned",
      },
    },
    object: {
      objectType: "User",
      definition: {
        type: "http://www.CourseMapper.de/activityType/you",
        name: {
          [language]: "",
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
    result: {
      extensions: {
        "http://www.CourseMapper.de/extensions/reply": {
          location: annotation.location,
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};
