import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "./util/generator-util";
import config from "./util/config";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

export const generateAccessPersonalDashboardActivity = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/access", "accessed"),
    object: createPersonalDashboardObject(req),
    context: createContext(),
  };
};

export const generateNewPersonalIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/add", "added"),
    object: createPersonalIndicatorObject(req),
    context: createContext(),
  };
};

export const generateDeletePersonalIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/delete", "deleted"),
    object: createPersonalIndicatorObject(req),
    context: createContext(),
  };
};

export const generateResizePersonalIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/resize", "resized"), // TO VERIFY AND CORRECT, I couldn't find the verb in the registry Database
    object: createResizedPersonalIndicatorObject(req),
    context: createContext(),
  };
};
export const generateReorderPersonalIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/reorder", "reordered"), // TO VERIFY AND CORRECT, I couldn't find the verb in the registry Database
    object: createReorderedPersonalIndicatorObject(req),
    context: createContext(),
  };
};
const createPersonalDashboardObject = (req) => {
  const user = req.locals.user;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/user/${user._id}/personal-dashboard`,
    definition: {
      type: `${DOMAIN}/activityType/personal-dashboard`,
      name: {
        [config.language]: "Personal Dashboard",
      },
      extensions: {
        [`${origin}/extensions/personal-dashboard`]: {
          indicators: user.indicators,
          userId: user._id,
          username: user.username,
        },
      },
    },
  };
};
export const createPersonalIndicatorObject = (req) => {
  const indicator = req.locals.indicator;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/personalIndicator/${indicator._id}`, //To verify
    definition: {
      type: `http://id.tincanapi.com/activitytype/personalIndicator`, //To verify
      source: {
        [config.language]: indicator.src,
      },
      width: {
        [config.language]: indicator.width,
      },
      height: {
        [config.language]: indicator.height,
      },
      frameborder: {
        [config.language]: indicator.frameborder,
      },
    },
  };
};

export const createResizedPersonalIndicatorObject = (req) => {
  const indicator = req.locals.indicator;
  const oldDimensions = req.locals.oldDimensions;
  const newDimensions = req.locals.newDimensions;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/personalIndicator/${indicator._id}`, //To verify
    definition: {
      type: `http://id.tincanapi.com/activitytype/personalIndicator`, //To verify
      source: {
        [config.language]: indicator.src,
      },
      oldDimensions: {
        oldWidth: { [config.language]: oldDimensions.width },
        oldHeight: { [config.language]: oldDimensions.height },
      },
      newDimensions: {
        newWidth: { [config.language]: newDimensions.width },
        newHeight: { [config.language]: newDimensions.height },
      },
      frameborder: {
        [config.language]: indicator.frameborder,
      },
    },
  };
};
export const createReorderedPersonalIndicatorObject = (req) => {
  const indicator = req.locals.indicator;
  const oldIndex = req.locals.oldIndex;
  const newIndex = req.locals.newIndex;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/personalIndicator/${indicator._id}`, //To verify
    definition: {
      type: `http://id.tincanapi.com/activitytype/personalIndicator`, //To verify
      source: {
        [config.language]: indicator.src,
      },
      width: {
        [config.language]: indicator.width,
      },
      height: {
        [config.language]: indicator.height,
      },
      oldIndex: {
        [config.language]: oldIndex,
      },
      newIndex: {
        [config.language]: newIndex,
      },
      frameborder: {
        [config.language]: indicator.frameborder,
      },
    },
  };
};
