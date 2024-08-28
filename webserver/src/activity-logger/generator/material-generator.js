import { v4 as uuidv4 } from "uuid";

const platform = "CourseMapper";
const language = "en-US";

export const getMaterialUploadStatement = (user, material, origin) => {
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
      id: "http://activitystrea.ms/schema/1.0/share",
      display: {
        [language]: "shared",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: `http://www.CourseMapper.de/activityType/material`,
        name: {
          [language]: material.name,
        },
        description: {
          [language]: material.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/material": {
            id: material._id,
            name: material.name,
            description: material.description,
            type: material.type,
            url: material.url,
            channel_id: material.channelId,
            topic_id: material.topicId,
            course_id: material.courseId,
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

export const getMaterialAccessStatement = (user, material, origin) => {
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
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: `http://www.CourseMapper.de/activityType/material`,
        name: {
          [language]: material.name,
        },
        description: {
          [language]: material.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/material": {
            id: material._id,
            name: material.name,
            description: material.description,
            type: material.type,
            url: material.url,
            channel_id: material.channelId,
            topic_id: material.topicId,
            course_id: material.courseId,
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

export const getMaterialDeletionStatement = (user, material, origin) => {
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
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: `http://www.CourseMapper.de/activityType/material`,
        name: {
          [language]: material.name,
        },
        description: {
          [language]: material.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/material": {
            id: material._id,
            name: material.name,
            description: material.description,
            type: material.type,
            url: material.url,
            channel_id: material.channelId,
            topic_id: material.topicId,
            course_id: material.courseId,
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

export const getMaterialEditStatement = (
  user,
  newMaterial,
  oldMaterial,
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
      id: `${origin}/activity/course/${oldMaterial.courseId}/topic/${oldMaterial.topicId}/channel/${oldMaterial.channelId}/material/${oldMaterial._id}`,
      definition: {
        type: `http://www.CourseMapper.de/activityType/material`,
        name: {
          [language]: oldMaterial.name,
        },
        description: {
          [language]: oldMaterial.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/material": {
            id: oldMaterial._id,
            name: oldMaterial.name,
            description: oldMaterial.description,
            type: oldMaterial.type,
            url: oldMaterial.url,
            channel_id: oldMaterial.channelId,
            topic_id: oldMaterial.topicId,
            course_id: oldMaterial.courseId,
          },
        },
      },
    },
    result: {
      extensions: {
        "http://www.CourseMapper.de/extensions/material": {
          name: newMaterial.name,
          description: newMaterial.description,
          url: newMaterial.url,
          type: newMaterial.type,
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};

export const getVideoPlayStatement = (
  user,
  material,
  hours,
  minutes,
  seconds,
  origin
) => {
  const duration =
    parseInt(hours) * 60 * 60 + parseInt(minutes) * 60 + parseInt(seconds);
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
      id: "http://activitystrea.ms/schema/1.0/play",
      display: {
        [language]: "played",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: `http://activitystrea.ms/schema/1.0/video`,
        name: {
          [language]: material.name,
        },
        description: {
          [language]: material.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/material": {
            id: material._id,
            name: material.name,
            description: material.description,
            type: material.type,
            url: material.url,
            channel_id: material.channelId,
            topic_id: material.topicId,
            course_id: material.courseId,
            timestamp: duration,
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

export const getVideoPauseStatement = (
  user,
  material,
  hours,
  minutes,
  seconds,
  origin
) => {
  const duration =
    parseInt(hours) * 60 * 60 + parseInt(minutes) * 60 + parseInt(seconds);
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
      id: "http://id.tincanapi.com/verb/paused",
      display: {
        [language]: "paused",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: `http://activitystrea.ms/schema/1.0/video`,
        name: {
          [language]: material.name,
        },
        description: {
          [language]: material.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/material": {
            id: material._id,
            name: material.name,
            description: material.description,
            type: material.type,
            url: material.url,
            channel_id: material.channelId,
            topic_id: material.topicId,
            course_id: material.courseId,
            timestamp: duration,
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

export const getVideoEndStatement = (user, material, origin) => {
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
      id: "http://activitystrea.ms/schema/1.0/complete",
      display: {
        [language]: "completed",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: `http://activitystrea.ms/schema/1.0/video`,
        name: {
          [language]: material.name,
        },
        description: {
          [language]: material.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/material": {
            id: material._id,
            name: material.name,
            description: material.description,
            type: material.type,
            url: material.url,
            channel_id: material.channelId,
            topic_id: material.topicId,
            course_id: material.courseId,
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

export const getSlideViewStatement = (user, material, slideNr, origin) => {
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
      id: "http://id.tincanapi.com/verb/viewed",
      display: {
        [language]: "viewed",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slide/${slideNr}`,
      definition: {
        type: `http://id.tincanapi.com/activitytype/slide`,
        name: {
          [language]: material.name,
        },
        description: {
          [language]: material.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/material": {
            id: material._id,
            name: material.name,
            pageNr: slideNr,
            description: material.description,
            type: material.type,
            url: material.url,
            channel_id: material.channelId,
            topic_id: material.topicId,
            course_id: material.courseId,
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

export const getPdfCompleteStatement = (user, material, origin) => {
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
      id: "http://activitystrea.ms/schema/1.0/complete",
      display: {
        [language]: "completed",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: `http://www.CourseMapper.de/activityType/pdf`,
        name: {
          [language]: material.name,
        },
        description: {
          [language]: material.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/material": {
            id: material._id,
            name: material.name,
            description: material.description,
            type: material.type,
            url: material.url,
            channel_id: material.channelId,
            topic_id: material.topicId,
            course_id: material.courseId,
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
