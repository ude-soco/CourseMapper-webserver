import { v4 as uuidv4 } from "uuid";

const platform = "CourseMapper";
const language = "en-US";

export const getCourseCreationStatement = (user, course, origin) => {
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
      id: `${origin}/activity/course/${course._id}`,
      definition: {
        type: "http://adlnet.gov/expapi/activities/course",
        name: {
          [language]: course.name,
        },
        description: {
          [language]: course.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/course": {
            id: course._id,
            name: course.name,
            shortname: course.shortName,
            description: course.description,
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

export const getCourseDeletionStatement = (user, course, origin) => {
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
      id: `${origin}/activity/course/${course._id}`,
      definition: {
        type: "http://adlnet.gov/expapi/activities/course",
        name: {
          [language]: course.name,
        },
        description: {
          [language]: course.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/course": {
            id: course._id,
            name: course.name,
            shortname: course.shortName,
            description: course.description,
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

export const getCourseAccessStatement = (user, course, origin) => {
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
      id: `${origin}/activity/course/${course._id}`,
      definition: {
        type: "http://adlnet.gov/expapi/activities/course",
        name: {
          [language]: course.name,
        },
        description: {
          [language]: course.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/course": {
            id: course._id,
            name: course.name,
            shortname: course.shortName,
            description: course.description,
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

export const getCourseEnrollmentStatement = (user, course, origin) => {
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
      id: "http://www.tincanapi.co.uk/verbs/enrolled_onto_learning_plan",
      display: {
        [language]: "enrolled",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${course._id}`,
      definition: {
        type: "http://adlnet.gov/expapi/activities/course",
        name: {
          [language]: course.name,
        },
        description: {
          [language]: course.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/course": {
            id: course._id,
            name: course.name,
            shortname: course.shortName,
            description: course.description,
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

export const getCourseWithdrawStatement = (user, course, origin) => {
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
      id: "http://activitystrea.ms/schema/1.0/leave",
      display: {
        [language]: "left",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/course/${course._id}`,
      definition: {
        type: "http://adlnet.gov/expapi/activities/course",
        name: {
          [language]: course.name,
        },
        description: {
          [language]: course.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/course": {
            id: course._id,
            name: course.name,
            shortname: course.shortName,
            description: course.description,
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

export const getCourseEditStatement = (user, newCourse, oldCourse, origin) => {
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
      id: `${origin}/activity/course/${oldCourse._id}`,
      definition: {
        type: "http://adlnet.gov/expapi/activities/course",
        name: {
          [language]: oldCourse.name,
        },
        description: {
          [language]: oldCourse.description,
        },
        extensions: {
          "http://www.CourseMapper.de/extensions/course": {
            id: oldCourse._id,
            name: oldCourse.name,
            shortname: oldCourse.shortName,
            description: oldCourse.description,
          },
        },
      },
    },
    result: {
      extensions: {
        "http://www.CourseMapper.de/extensions/course": {
          name: newCourse.name,
          shortname: newCourse.shortName,
          description: newCourse.description,
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};
