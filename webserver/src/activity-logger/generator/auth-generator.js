import {
  createContext,
  createUserActivity,
  createVerb,
} from "./util/generator-util";
import config from "./util/config";

export const generateSignInActivity = (req) => {
  const userActivity = createUserActivity(req);
  return {
    ...userActivity,
    verb: createVerb(
      "https://brindlewaye.com/xAPITerms/verbs/loggedin",
      "logged in",
    ),
    object: {
      objectType: config.activity,
      id: `${req.get("origin")}/activity/CourseMapper`,
      definition: {
        type: "http://id.tincanapi.com/activitytype/lms",
        name: {
          [config.language]: config.platform,
        },
        description: {
          [config.language]: "Course Annotation and Analytics platform",
        },
      },
    },
    context: createContext(),
  };
};

export const generateSignOutActivity = (req) => {
  const userActivity = createUserActivity(req);
  return {
    ...userActivity,
    verb: createVerb(
      "https://brindlewaye.com/xAPITerms/verbs/loggedout",
      "logged out",
    ),
    object: {
      objectType: config.activity,
      id: `${req.get("origin")}/activity/CourseMapper`,
      definition: {
        type: "https://id.tincanapi.com/activitytype/lms",
        name: {
          [config.language]: config.platform,
        },
        description: {
          [config.language]: "Course Annotation and Analytics platform",
        },
      },
    },
    context: createContext(),
  };
};

export const generateRegisterActivity = (req) => {
  const userActivity = createUserActivity(req);
  return {
    ...userActivity,
    verb: createVerb(
      "https://adlnet.gov/expapi/verbs/registered",
      "registered",
    ),
    object: {
      objectType: config.activity,
      id: `${req.get("origin")}/activity/CourseMapper`,
      definition: {
        type: "https://id.tincanapi.com/activitytype/lms",
        name: {
          [config.language]: config.platform,
        },
        description: {
          [config.language]: "Course Annotation and Analytics platform",
        },
      },
    },
    context: createContext(),
  };
};
