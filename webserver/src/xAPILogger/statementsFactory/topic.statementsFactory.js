import { v4 as uuidv4 } from "uuid";
export const getTopicCreationStatement = (user, topic, origin) => {
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
      id: "http://activitystrea.ms/schema/1.0/create",
      display: {
        "en-US": "created",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${topic.courseId}/topic/${topic._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/topic",
        name: {
          "en-US": topic.name,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/topic": {
            id: topic._id,
            course_id: topic.courseId,
            name: topic.name,
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

export const getTopicDeletionStatement = (user, topic, origin) => {
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
      id: `${origin}/activity/course/${topic.courseId}/topic/${topic._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/topic",
        name: {
          "en-US": topic.name,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/topic": {
            id: topic._id,
            course_id: topic.courseId,
            name: topic.name,
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

export const getTopicAccessStatement = (user, topic, origin) => {
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
      id: "http://activitystrea.ms/schema/1.0/access",
      display: {
        "en-US": "accessed",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${topic.courseId}/topic/${topic._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/topic",
        name: {
          "en-US": topic.name,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/topic": {
            id: topic._id,
            course_id: topic.courseId,
            name: topic.name,
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

export const getTopicEditStatement = (user, newTopic, oldtTopic, origin) => {
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
      id: `${origin}/activity/course/${oldtTopic.courseId}/topic/${oldtTopic._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/topic",
        name: {
          "en-US": oldtTopic.name,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/topic": {
            id: oldtTopic._id,
            course_id: oldtTopic.courseId,
            name: oldtTopic.name,
          },
        },
      },
    },
    result: {
      extensions: {
        "http://www.CourseMapper.de/extensions/topic": {
          name: newTopic.name,
        },
      },
    },
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};
