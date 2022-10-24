import { v4 as uuidv4 } from "uuid";
export const getTopicCreationStatement = (user, topic) => {
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
      id: "http://activitystrea.ms/schema/1.0/create",
      display: {
        "en-US": "created",
      },
    },
    object: {
      objectType: "Activity",
      id: `http://www.CourseMapper.v2.de/activity/course/${topic.courseId}/topic/${topic._id}`,
      definition: {
        type: "http://www.CourseMapper.v2.de/activityType/topic",
        name: {
          "en-US": topic.name,
        },
        extensions: {
          "http://www.CourseMapper.v2.de/extensions/topic": {
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

export const getTopicDeletionStatement = (user, topic) => {
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
      id: `http://www.CourseMapper.v2.de/activity/course/${topic.courseId}/topic/${topic._id}`,
      definition: {
        type: "http://www.CourseMapper.v2.de/activityType/topic",
        name: {
          "en-US": topic.name,
        },
        extensions: {
          "http://www.CourseMapper.v2.de/extensions/topic": {
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

export const getTopicAccessStatement = (user, topic) => {
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
      id: "http://activitystrea.ms/schema/1.0/access",
      display: {
        "en-US": "accessed",
      },
    },
    object: {
      objectType: "Activity",
      id: `http://www.CourseMapper.v2.de/activity/course/${topic.courseId}/topic/${topic._id}`,
      definition: {
        type: "http://www.CourseMapper.v2.de/activityType/topic",
        name: {
          "en-US": topic.name,
        },
        extensions: {
          "http://www.CourseMapper.v2.de/extensions/topic": {
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

export const getTopicEditStatement = (user, newTopic, oldtTopic) => {
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
      id: `http://www.CourseMapper.v2.de/activity/course/${oldtTopic.courseId}/topic/${oldtTopic._id}`,
      definition: {
        type: "http://www.CourseMapper.v2.de/activityType/topic",
        name: {
          "en-US": oldtTopic.name,
        },
        extensions: {
          "http://www.CourseMapper.v2.de/extensions/topic": {
            id: oldtTopic._id,
            course_id: oldtTopic.courseId,
            name: oldtTopic.name,
          },
        },
      },
    },
    result: {
      extensions: {
        "http://www.CourseMapper.v2.de/extensions/topic": {
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
