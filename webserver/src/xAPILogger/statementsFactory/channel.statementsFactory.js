import { v4 as uuidv4 } from "uuid";

export const getChannelCreationStatement = (user, channel, origin) => {
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
      id: `${origin}/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/channel",
        name: {
          "en-US": channel.name,
        },
        description: {
          "en-US": channel.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/channel": {
            id: channel._id,
            course_id: channel.courseId,
            topic_id: channel.topicId,
            name: channel.name,
            description: channel.description,
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

export const getChannelDeletionStatement = (user, channel, origin) => {
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
      id: `${origin}/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/channel",
        name: {
          "en-US": channel.name,
        },
        description: {
          "en-US": channel.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/channel": {
            id: channel._id,
            course_id: channel.courseId,
            topic_id: channel.topicId,
            name: channel.name,
            description: channel.description,
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

export const getChannelAccessStatement = (user, channel, origin) => {
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
      id: `${origin}/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/channel",
        name: {
          "en-US": channel.name,
        },
        description: {
          "en-US": channel.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/channel": {
            id: channel._id,
            course_id: channel.courseId,
            topic_id: channel.topicId,
            name: channel.name,
            description: channel.description,
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

export const getChannelEditStatement = (user, newChannel, oldtChannel, origin) => {
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
      id: `${origin}/activity/course/${oldtChannel.courseId}/topic/${oldtChannel.topicId}/channel/${oldtChannel._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/channel",
        name: {
          "en-US": oldtChannel.name,
        },
        description: {
          "en-US": oldtChannel.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/channel": {
            id: oldtChannel._id,
            course_id: oldtChannel.courseId,
            topic_id: oldtChannel.topicId,
            name: oldtChannel.name,
            description: oldtChannel.description,
          },
        },
      },
    },
    result: {
      extensions: {
        "http://www.CourseMapper.de/extensions/channel": {
          name: newChannel.name,
          description: newChannel.description,
        },
      },
    },
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};
