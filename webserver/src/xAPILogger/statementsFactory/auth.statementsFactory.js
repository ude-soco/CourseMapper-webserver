import { v4 as uuidv4 } from "uuid";

const platform = "CourseMapper";
const language = "en-US";

export const getLoginStatement = (user, origin) => {
  let userId = user._id.toString();
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: userId,
      account: {
        homePage: origin,
        name: userId,
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
            language: "Course Annotation and Analytics platform"
        }
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};

export const getLogoutStatement = (user, origin) => {
  let userId = user._id.toString();
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: userId,
      account: {
        homePage: origin,
        name: userId,
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
            language: "Course Annotation and Analytics platform"
        }
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};

export const getSignupStatement = (user, origin) => {
  let userId = user._id.toString();
  const fullname = `${user.firstname} ${user.lastname}`;
  return {
    id: uuidv4(),
    timestamp: new Date(),
    actor: {
      objectType: "Agent",
      name: userId,
      account: {
        homePage: origin,
        name: userId,
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
            language: "Course Annotation and Analytics platform"
        }
      },
    },
    context: {
      platform: platform,
      language: language,
    },
  };
};
