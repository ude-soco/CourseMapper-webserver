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
    verb: createVerb(`${DOMAIN}/verb/resize`, "resized"),
    object: createResizedPersonalIndicatorObject(req),
    context: createContext(),
  };
};
export const generateReorderPersonalIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/reorder`, "reordered"),
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
  const user = req.locals.user;
  const indicator = req.locals.indicator;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/user/${user._id}/indicator/${indicator._id}`,
    definition: {
      type: `${DOMAIN}/activityType/personal-indicator`,
      name: {
        [config.language]: "Personal Indicator", // To verify
      },
      extensions: {
        [`${origin}/extensions/personal-indicator`]: {
          id: indicator._id,
          source: indicator.src,
          width: indicator.width,
          height: indicator.height,
          frameborder: indicator.frameborder,
          userId: user._id,
          username: user.username,
        },
      },
    },
  };
};

export const createResizedPersonalIndicatorObject = (req) => {
  const user = req.locals.user;
  const indicator = req.locals.indicator;
  const oldDimensions = req.locals.oldDimensions;
  const newDimensions = req.locals.newDimensions;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/user/${user._id}/indicator/${indicator._id}`,
    definition: {
      type: `${DOMAIN}/activityType/personal-indicator`, //To verify
      name: {
        [config.language]: "Personal indicator", //To verify
      },
      extensions: {
        [`${origin}/extensions/personal-indicator`]: {
          id: indicator._id,
          oldDimensions: oldDimensions,
          newDimensions: newDimensions,
          height: indicator.height,
          frameborder: indicator.frameborder,
          userId: user._id,
          username: user.username,
        },
      },
    },
  };
};
export const createReorderedPersonalIndicatorObject = (req) => {
  const user = req.locals.user;
  const indicator = req.locals.indicator;
  const oldIndex = req.locals.oldIndex;
  const newIndex = req.locals.newIndex;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/user/${user._id}/indicator/${indicator._id}`,
    definition: {
      type: `${DOMAIN}/activityType/personal-indicator`, //To verify
      name: {
        [config.language]: "Personal indicator", //To verify
      },
      extensions: {
        [`${origin}/extensions/personal-indicator`]: {
          id: indicator._id,
          oldIndex: oldIndex,
          newIndex: newIndex,
          frameborder: indicator.frameborder,
          userId: user._id,
          username: user.username,
        },
      },
    },
  };
};
