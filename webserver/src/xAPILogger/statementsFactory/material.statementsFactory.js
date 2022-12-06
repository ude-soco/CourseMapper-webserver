import { v4 as uuidv4 } from "uuid";
export const getMaterialUploadStatement = (user, material, origin) => {
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
      id: "http://activitystrea.ms/schema/1.0/share",
      display: {
        "en-US": "shared",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: `http://www.CourseMapper.de/activityType/material`,
        name: {
          "en-US": material.name,
        },
        description: {
          "en-US": material.description,
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
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getMaterialAccessStatement = (user, material, origin) => {
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
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: `http://www.CourseMapper.de/activityType/material`,
        name: {
          "en-US": material.name,
        },
        description: {
          "en-US": material.description,
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
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getMaterialDeletionStatement = (user, material, origin) => {
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
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: `http://www.CourseMapper.de/activityType/material`,
        name: {
          "en-US": material.name,
        },
        description: {
          "en-US": material.description,
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
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getMaterialEditStatement = (user, newMaterial, oldMaterial, origin) => {
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
      id: `${origin}/activity/course/${oldMaterial.courseId}/topic/${oldMaterial.topicId}/channel/${oldMaterial.channelId}/material/${oldMaterial._id}`,
      definition: {
        type: `http://www.CourseMapper.de/activityType/material`,
        name: {
          "en-US": oldMaterial.name,
        },
        description: {
          "en-US": oldMaterial.description,
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
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getVideoPlayStatement = (user, material, hours, minutes, seconds, origin) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  const duration = (parseInt(hours)*60*60) + (parseInt(minutes)*60) + parseInt(seconds);
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
      id: "http://activitystrea.ms/schema/1.0/play",
      display: {
        "en-US": "played",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: `http://activitystrea.ms/schema/1.0/video`,
        name: {
          "en-US": material.name,
        },
        description: {
          "en-US": material.description,
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
            duration: duration,
          },
        },
      },
    },
    result: {
      duration: `PT${duration}S`
    },
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getVideoPauseStatement = (user, material, hours, minutes, seconds, origin) => {
  const fullname = `${user.firstname} ${user.lastname}`;
  const duration = (parseInt(hours)*60*60) + (parseInt(minutes)*60) + parseInt(seconds);
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
      id: "http://id.tincanapi.com/verb/paused",
      display: {
        "en-US": "paused",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: `http://activitystrea.ms/schema/1.0/video`,
        name: {
          "en-US": material.name,
        },
        description: {
          "en-US": material.description,
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
            duration: duration,
          },
        },
      },
    },
    result: {
      duration: `PT${duration}S`
    },
    context: {
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getVideoEndStatement = (user, material, origin) => {
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
      id: "http://activitystrea.ms/schema/1.0/complete",
      display: {
        "en-US": "completed",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: `http://activitystrea.ms/schema/1.0/video`,
        name: {
          "en-US": material.name,
        },
        description: {
          "en-US": material.description,
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
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getSlideViewStatement = (user, material, slideNr, origin) => {
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
      id: "http://id.tincanapi.com/verb/viewed",
      display: {
        "en-US": "viewed",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}/slide/${slideNr}`,
      definition: {
        type: `http://id.tincanapi.com/activitytype/slide`,
        name: {
          "en-US": material.name,
        },
        description: {
          "en-US": material.description,
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
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};

export const getPdfCompleteStatement = (user, material, origin) => {
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
      id: "http://activitystrea.ms/schema/1.0/complete",
      display: {
        "en-US": "completed",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
      definition: {
        type: `http://www.CourseMapper.de/activityType/pdf`,
        name: {
          "en-US": material.name,
        },
        description: {
          "en-US": material.description,
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
      platform: "CourseMapper",
      language: "en-US",
    },
  };
};
