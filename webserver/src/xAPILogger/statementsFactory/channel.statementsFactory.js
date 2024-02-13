import { v4 as uuidv4 } from "uuid";

const platform = "CourseMapper";
const language = "en-US";

export const getChannelCreationStatement = (user, channel, origin) => {
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
      id: "http://activitystrea.ms/schema/1.0/create",
      display: {
        [language]: "created",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/channel",
        name: {
          [language]: channel.name,
        },
        description: {
          [language]: channel.description,
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
      platform: platform,
      language: language,
    },
  };
};

export const getChannelDeletionStatement = (user, channel, origin) => {
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
      id: `${origin}/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/channel",
        name: {
          [language]: channel.name,
        },
        description: {
          [language]: channel.description,
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
      platform: platform,
      language: language,
    },
  };
};

export const getChannelAccessStatement = (user, channel, origin) => {
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
      id: "http://activitystrea.ms/schema/1.0/access",
      display: {
        [language]: "accessed",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/channel",
        name: {
          [language]: channel.name,
        },
        description: {
          [language]: channel.description,
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
      platform: platform,
      language: language,
    },
  };
};

export const getChannelEditStatement = (
  user,
  newChannel,
  oldtChannel,
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
      id: "http://curatr3.com/define/verb/edited",
      display: {
        [language]: "edited",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${oldtChannel.courseId}/topic/${oldtChannel.topicId}/channel/${oldtChannel._id}`,
      definition: {
        type: "http://www.CourseMapper.de/activityType/channel",
        name: {
          [language]: oldtChannel.name,
        },
        description: {
          [language]: oldtChannel.description,
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
      platform: platform,
      language: language,
    },
  };
};
