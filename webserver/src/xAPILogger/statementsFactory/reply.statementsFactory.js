import { v4 as uuidv4 } from "uuid";

export const getReplyCreationStatement = (user, annotation, reply) => {
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
      id: "http://id.tincanapi.com/verb/replied",
      display: {
        "en-US": "replied",
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
    result: {
      extensions: {
        "http://www.CourseMapper.v2.de/extensions/reply": {
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
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getReplyDeletionStatement = (user, reply) => {
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
      id: `http://www.CourseMapper.v2.de/activity/course/${reply.courseId}/topic/${reply.topicId}/channel/${reply.channelId}/material/${reply.materialId}/annotation/${reply.annotationId}/reply/${reply._id}`,
      definition: {
        type: "http://www.CourseMapper.v2.de/activityType/reply",
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
          "http://www.CourseMapper.v2.de/extensions/reply": {
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
