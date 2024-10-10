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
      "enrolled",
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
