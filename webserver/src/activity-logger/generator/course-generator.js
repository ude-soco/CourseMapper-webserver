import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "./util/generator-util";
import config from "./util/config";

const createCourseObject = (req) => {
  let course = req.locals.course;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${course._id}`,
    definition: {
      type: "http://adlnet.gov/expapi/activities/course",
      name: {
        [config.language]: course.name,
      },
      description: {
        [config.language]: course.description,
      },
      extensions: {
        [`${origin}/extensions/course`]: {
          id: course._id,
          name: course.name,
          shortname: course.shortName,
          description: course.description,
        },
      },
    },
  };
};
const createSharedCourseObject = (req) => {
  let course = req.locals.course;
  let sharedURL = req.locals.courseUrl;
  let origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${course._id}`,
    definition: {
      type: "http://adlnet.gov/expapi/activities/course",
      name: {
        [config.language]: course.name,
      },
      description: {
        [config.language]: course.description,
      },
      extensions: {
        [`${origin}/extensions/course`]: {
          id: course._id,
          name: course.name,
          shortname: course.shortName,
          description: course.description,
          sharedURL: sharedURL,
        },
      },
    },
  };
};

export const generateCreateCourseActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/create", "created"),
    object: createCourseObject(req),
    context: createContext(),
  };
};

export const generateDeleteCourseActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/delete", "deleted"),
    object: createCourseObject(req),
    context: createContext(),
  };
};

export const generateShareCourseActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/share", "shared"),
    object: createSharedCourseObject(req),
    context: createContext(),
  };
};
export const generateCourseAccessActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/access", "accessed"),
    object: createCourseObject(req),
    context: createContext(),
  };
};

export const generateEnrolToCourseActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(
      "http://www.tincanapi.co.uk/verbs/enrolled_onto_learning_plan",
      "enrolled"
    ),
    object: createCourseObject(req),
    context: createContext(),
  };
};

export const generateWithdrawFromCourseActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/leave", "left"),
    object: createCourseObject(req),
    context: createContext(),
  };
};

export const generateEditCourseLogger = (req) => {
  const metadata = createMetadata();
  let updatedCourse = req.locals.newCourse;
  let courseToEdit = req.locals.oldCourse;
  let origin = req.get("origin");
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://curatr3.com/define/verb/edited", "edited"),
    object: {
      objectType: config.activity,
      id: `${origin}/activity/course/${courseToEdit._id}`,
      definition: {
        type: "http://adlnet.gov/expapi/activities/course",
        name: {
          [config.language]: courseToEdit.name,
        },
        description: {
          [config.language]: courseToEdit.description,
        },
        extensions: {
          [`${origin}/extensions/course`]: {
            id: courseToEdit._id,
            name: courseToEdit.name,
            shortname: courseToEdit.shortName,
            description: courseToEdit.description,
          },
        },
      },
    },
    result: {
      extensions: {
        [`${origin}/extensions/course`]: {
          name: updatedCourse.name,
          shortname: updatedCourse.shortName,
          description: updatedCourse.description,
        },
      },
    },
    context: createContext(),
  };
};
export const generateNewCourseIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/add", "added"),
    object: createCourseIndicatorObject(req),
    context: createContext(),
  };
};
export const generateDeleteCourseIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/delete", "deleted"),
    object: createCourseIndicatorObject(req),
    context: createContext(),
  };
};
export const generateViewCourseIndicatorsActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/viewed", "viewed"),
    object: createGetCourseIndicatorsObject(req),
    context: createContext(),
  };
};
export const generateResizeCourseIndicatorActivity = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/resize", "resized"), // TO VERIFY AND CORRECT, I couldn't find the verb in the registry Database
    object: createResizedCourseIndicatorObject(req),
    context: createContext(),
  };
};
export const generateReorderCourseIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://id.tincanapi.com/verb/reorder", "reordered"), // TO VERIFY AND CORRECT, I couldn't find the verb in the registry Database
    object: createReorderedCourseIndicatorObject(req),
    context: createContext(),
  };
};

export const createCourseIndicatorObject = (req) => {
  const indicator = req.locals.indicator;
  const course = req.locals.course;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/courseIndicator/${indicator._id}`, //To verify
    definition: {
      type: `http://id.tincanapi.com/activitytype/courseIndicator`, //To verify
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
      extensions: {
        [`${origin}/extensions/courseIndicator`]: {
          courseId: course._id,
          courseName: course.name,
          courseShortName: course.shortName,
          courseDescription: course.description,
        },
      },
    },
  };
};
export const createGetCourseIndicatorsObject = (req) => {
  const indicators = req.locals.indicators;
  const course = req.locals.course;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/courseIndicators`, // TO VERIFY
    definition: {
      type: `http://id.tincanapi.com/activitytype/courseIndicators`, // TO VERIFY
      items: indicators.map((indicator) => ({
        id: `${origin}/activity/indicator/${indicator._id}`,
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
      })),
      extensions: {
        [`${origin}/extensions/courseIndicator`]: {
          courseId: course._id,
          courseName: course.name,
          courseShortName: course.shortName,
          courseDescription: course.description,
        },
      },
    },
  };
};
export const createResizedCourseIndicatorObject = (req) => {
  const indicator = req.locals.indicator;
  const course = req.locals.course;
  const oldDimensions = req.locals.oldDimensions;
  const newDimensions = req.locals.newDimentions;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/courseIndicator/${indicator._id}`, //To verify
    definition: {
      type: `http://id.tincanapi.com/activitytype/courseIndicator`, //To verify
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
      extensions: {
        [`${origin}/extensions/courseIndicator`]: {
          courseId: course._id,
          courseName: course.name,
          courseShortName: course.shortName,
          courseDescription: course.description,
        },
      },
    },
  };
};
export const createReorderedCourseIndicatorObject = (req) => {
  const indicator = req.locals.indicator;
  const course = req.locals.course;
  const oldIndex = req.locals.oldIndex;
  const newIndex = req.locals.newIndex;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/courseIndicator/${indicator._id}`, //To verify
    definition: {
      type: `http://id.tincanapi.com/activitytype/courseIndicator`, //To verify
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
      extensions: {
        [`${origin}/extensions/courseIndicator`]: {
          courseId: course._id,
          courseName: course.name,
          courseShortName: course.shortName,
          courseDescription: course.description,
        },
      },
    },
  };
};
