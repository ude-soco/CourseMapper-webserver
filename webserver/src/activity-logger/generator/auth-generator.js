import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "./util/generator-util";
import config from "./util/config";

const createLMSObject = (req) => {
  return {
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
  };
};

export const generateSignInActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      "https://brindlewaye.com/xAPITerms/verbs/loggedin",
      "logged in",
    ),
    object: createLMSObject(req),
    context: createContext(),
  };
};

export const generateSignOutActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      "https://brindlewaye.com/xAPITerms/verbs/loggedout",
      "logged out",
    ),
    object: createLMSObject(req),
    context: createContext(),
  };
};

export const generateRegisterActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      "https://adlnet.gov/expapi/verbs/registered",
      "registered",
    ),
    object: createLMSObject(req),
    context: createContext(),
  };
};
