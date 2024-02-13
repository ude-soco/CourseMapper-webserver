import { v4 as uuidv4 } from "uuid";

const platform = "CourseMapper";
const language = "en-US";

export const getLoginStatement = (user, origin) => {
  const userFullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      mbox: user.mbox,
      mbox_sha1sum: user.mbox_sha1sum,
      account: {
        homePage: origin,
        name: userFullname,
      },
    },
    verb: {
      id: "https://brindlewaye.com/xAPITerms/verbs/loggedin/",
      display: {
        language: "logged in",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/CourseMapper`,
      definition: {
        type: "http://id.tincanapi.com/activitytype/lms",
        name: {
          language: platform,
        },
        description: {
          language: "Course Annotation and Analytics platform",
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};

export const getLogoutStatement = (user, origin) => {
  const userFullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      mbox: user.mbox,
      mbox_sha1sum: user.mbox_sha1sum,
      account: {
        homePage: origin,
        name: userFullname,
      },
    },
    verb: {
      id: "https://brindlewaye.com/xAPITerms/verbs/loggedout/",
      display: {
        language: "logged out",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/CourseMapper`,
      definition: {
        type: "http://id.tincanapi.com/activitytype/lms",
        name: {
          language: platform,
        },
        description: {
          language: "Course Annotation and Analytics platform",
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};

export const getSignupStatement = (user, origin) => {
  const userFullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      mbox: user.mbox,
      mbox_sha1sum: user.mbox_sha1sum,
      account: {
        homePage: origin,
        name: userFullname,
      },
    },
    verb: {
      id: "http://adlnet.gov/expapi/verbs/registered",
      display: {
        language: "registered",
      },
    },
    object: {
      objectType: "Activity",
      id: `${origin}/activity/CourseMapper`,
      definition: {
        type: "http://id.tincanapi.com/activitytype/lms",
        name: {
          language: platform,
        },
        description: {
          language: "Course Annotation and Analytics platform",
        },
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};
