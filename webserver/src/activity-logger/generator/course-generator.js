import {
  createContext,
  createMetadata,
  createUser,
  createVerb,
} from "./util/generator-util";
import config from "./util/config";

let DOMAIN = "http://www.CourseMapper.de"; // TODO: Hardcoded due to frontend implementation

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
const createCourseDashboardObject = (req) => {
  const course = req.locals.course;
  const origin = req.get("origin");
  return {
    objectType: config.activity,
    id: `${origin}/activity/course/${course._id}/dashboard`,
    definition: {
      type: `${DOMAIN}/activityType/course-dashboard`,
      name: {
        [config.language]: `${course.name} Dashboard`,
      },
      extensions: {
        [`${origin}/extensions/course-dashboard`]: {
          indicators: course.indicators,
          courseId: course._id,
          courseName: course.name,
          courseDescription: course.description,
        },
      },
    },
  };
};

export const generateAccessCourseDashboardActivity = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb("http://activitystrea.ms/schema/1.0/access", "accessed"),
    object: createCourseDashboardObject(req),
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
export const generateResizeCourseIndicatorActivity = (req) => {
  const metadata = createMetadata();

  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/resize`, "resized"),
    object: createResizedCourseIndicatorObject(req),
    context: createContext(),
  };
};
export const generateReorderCourseIndicatorActivity = (req) => {
  const metadata = createMetadata();
  return {
    ...metadata,
    actor: createUser(req),
    verb: createVerb(`${DOMAIN}/verb/reorder`, "reordered"),
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
    id: `${origin}/activity/course/${course._id}/indicator/${indicator._id}`,
    definition: {
      type: `${DOMAIN}/activityType/course-indicator`,
      name: {
        [config.language]: "Course Indicator", // To verify
      },
      extensions: {
        [`${origin}/extensions/course-indicator`]: {
          id: indicator._id,
          source: indicator.src,
          width: indicator.width,
          height: indicator.height,
          frameborder: indicator.frameborder,
          courseId: course._id,
          courseName: course.name,
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
    id: `${origin}/activity/course/${course._id}/indicator/${indicator._id}`,
    definition: {
      type: `${DOMAIN}/activityType/course-indicator`, //To verify
      name: {
        [config.language]: "Course indicator", //To verify
      },
      extensions: {
        [`${origin}/extensions/course-indicator`]: {
          id: indicator._id,
          oldDimensions: oldDimensions,
          newDimensions: newDimensions,
          height: indicator.height,
          frameborder: indicator.frameborder,
          courseId: course._id,
          courseName: course.name,
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
    id: `${origin}/activity/course/${course._id}/indicator/${indicator._id}`,
    definition: {
      type: `${DOMAIN}/activityType/course-indicator`, //To verify
      name: {
        [config.language]: "Course indicator", //To verify
      },
      extensions: {
        [`${origin}/extensions/course-indicator`]: {
          id: indicator._id,
          oldIndex: oldIndex,
          newIndex: newIndex,
          frameborder: indicator.frameborder,
          courseId: course._id,
          courseName: course.name,
        },
      },
    },
  };
};
