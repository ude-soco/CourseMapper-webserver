const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const User = db.user;
const Role = db.role;
const Course = db.course;
const Topic = db.topic;
const Channel = db.channel;
const Annotation = db.annotation;
const Material = db.material;
const Reply = db.reply;
const Tag = db.tag;
const Activity = db.activity;

/**
 * @function getAllCourses
 * Get all courses controller
 *
 */
export const getAllCourses = async (req, res) => {
  let courses;
  console.log("get all courses");
  try {
    courses = await Course.find({}).populate("topics", "-__v").populate({ path: "users", populate: { path: "role" } });
  } catch (err) {
    return res.status(500).send({ message: err });
  }
  let results = [];
  courses.forEach((c) => {
    let course = {
      _id: c.id,
      name: c.name,
      shortName: c.shortName,
      description: c.description,
      numberTopics: c.topics.length,
      numberChannels: c.channels.length,
      numberUsers: c.users.length,
      channels: c.channels,
      createdAt: c.createdAt,
      users: c.users,
    };
    results.push(course);
  });
  return res.status(200).send(results);
};
/**
 * @function getMyCourses
 * Get all courses the logged in user is enrolled in controller
 *
 */
export const getMyCourses = async (req, res) => {
  let user;
  let userId = req.userId;
  let results = [];
  try {
    user = await User.findOne({ _id: userId })
      .populate({ path: "courses", populate: { path: "role" } })
      .populate({ path: "courses", populate: { path: "courseId" } });
  } catch (err) {
    return res.status(500).send({ message: err });
  }
  user.courses.forEach((object) => {
    let course = {
      _id: object.courseId._id,
      name: object.courseId.name,
      shortName: object.courseId.shortName,
      description: object.courseId.description,
      numberTopics: object.courseId.topics.length,
      numberChannels: object.courseId.channels.length,
      numberUsers: object.courseId.users.length,
      role: object.role.name,
      channels: object.courseId.channels,
      createdAt: object.courseId.createdAt,
      users: object.courseId.users,
    };
    results.push(course);
  });
  return res.status(200).send(results);
};

/**
 * @function getCourse
 * Get details of a course controller
 *
 * @param {string} req.params.courseId The id of the course
 */
// export const getCourse = async (req, res) => {
//   const courseId = req.params.courseId;
//   let foundCourse;
//   try {
//     foundCourse = await Course.findOne({
//       _id: ObjectId(courseId),
//     }).populate("topics channels", "-__v");
//     if (!foundCourse) {
//       return res.status(404).send({
//         error: `Course with id ${courseId} doesn't exist!`,
//       });
//     }
//   } catch (err) {
//     return res.status(500).send({ message: err });
//   }
//   return res.status(200).send(foundCourse);
// };

/**
 * @function getCourse
 * Get Topics of a course controller
 *
 * @param {string} req.params.courseId The id of the course
 */
export const getCourse = async (req, res) => {
  const courseId = req.params.courseId;
  const userId = req.userId; //"63387f529dd66f86548d3537"

  let foundUser;
  try {
    
    foundUser = await User.findOne({ _id: userId })
    if (!foundUser) {
      return res.status(404).send({
        error: `User not found!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundCourse;
  let results = [];
  try {
    
    foundCourse = await Course.findOne({ _id: courseId })
      .populate("topics", "-__v")
      .populate({ path: "topics", populate: { path: "channels" } });
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ message: `${err}, error when finding a course!` });
  }
  return res.status(200).send(foundCourse);

  // TODO: Uncomment these code when logger is added
  // results = foundCourse.topics.map((topic) => {
  //   let channels = topic.channels.map((channel) => {
  //     return {
  //       _id: channel._id,
  //       name: channel.name,
  //       topic_id: channel.topicId,
  //       course_id: channel.courseId,
  //     };
  //   });
  //   return {
  //     _id: topic._id,
  //     name: topic.name,
  //     course_id: topic.courseId,
  //     channels: channels,
  //   };
  // });
  // req.locals = {
  //   response: results,
  //   course: foundCourse,
  //   user: foundUser,
  // };
  // return next();
};

/**
 * @function enrolCourse
 * Enrol in a new course controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.userId The user enrolling in the course
 */
export const enrolCourse = async (req, res, next) => {
  const courseId = req.params.courseId;
  const userId = req.userId;

  let foundCourse;
  try {
    foundCourse = await Course.findById(courseId);
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundUser;
  try {
    foundUser = await User.findOne({ _id: userId });
    if (!foundUser) {
      return res.status(404).send({
        error: `User not found!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let alreadyEnrolled = foundUser.courses.find(
    (course) => course.courseId.valueOf() === courseId
  );

  if (!alreadyEnrolled) {
    let role;
    try {
      role = await Role.findOne({ name: "user" });
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    foundUser.courses.push({
      courseId: foundCourse._id,
      role: role._id,
    });

    try {
      await foundUser.save();
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    foundCourse.users.push({
      userId: foundUser._id,
      role: role._id,
    });

    try {
      await foundCourse.save();
    } catch (err) {
      return res.status(500).send({ error: err });
    }
    req.locals = {
      response: { success: `User enrolled to course ${foundCourse.name}` },
      user: foundUser,
      course: foundCourse,
    };
    return next();
  } else {
    return res
      .status(403)
      .send({ error: `User already enrolled in course ${foundCourse.name}` });
  }
};
/**
 * @function withdrawCourse
 * Leave a course controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.userId The user enrolling in the course
 */
export const withdrawCourse = async (req, res, next) => {
  const courseId = req.params.courseId;
  const userId = req.userId;

  let foundCourse;
  try {
    foundCourse = await Course.findById(courseId);
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundUser;
  try {
    foundUser = await User.findOne({ _id: userId });
    if (!foundUser) {
      return res.status(404).send({
        error: `User not found!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundUser.courses = foundUser.courses.filter(
    (course) => course.courseId.valueOf() !== courseId
  );

  try {
    await foundUser.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundCourse.users = foundCourse.users.filter(
    (user) => user.userId.valueOf() !== userId
  );

  try {
    await foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  req.locals = {
    response: { success: `User withdrew from course ${foundCourse.name}` },
    user: foundUser,
    course: foundCourse,
  };
  return next();
};

/**
 * @function newCourse
 * Create a new course controller
 *
 * @param {string} req.body.name The name of the course, e.g., Advanced Web Technologies
 * @param {string} req.body.description The description of the course, e.g., Teaching students about modern web technologies
 * @param {string} req.userId The owner of the course
 */
export const newCourse = async (req, res, next) => {
  console.log("newCourse");
  const courseName = req.body.name;
  const courseDesc = req.body.description;
  let shortName = req.body.shortname;
  const userId = req.userId;

  let foundUser;
  try {
    foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).send({
        error: `User not found!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundCourse;
  try {
    foundCourse = await Course.findOne({ name: courseName });
    if (foundCourse) {
      return res.status(403).send({ error: "Course name already taken!" });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  if (!shortName) {
    shortName = courseName
      .split(" ")
      .map((word, index) => {
        if (index < 3) {
          return word[0];
        }
      })
      .join("");
  }

  let foundRole;
  try {
    foundRole = await Role.findOne({ name: "moderator" });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let userList = [];
  let newUser = {
    userId: foundUser._id,
    role: foundRole._id,
  };
  userList.push(newUser);

  let course = new Course({
    name: courseName,
    shortName: shortName,
    userId: req.userId,
    description: courseDesc,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    users: userList,
  });

  let courseSaved;
  try {
    courseSaved = await course.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundUser.courses.push({
    courseId: courseSaved._id,
    role: foundRole.id,
    role: foundRole.name,
  });

  try {
    await foundUser.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  const response = {
    courseSaved: {
      _id: courseSaved._id,
      name: courseSaved.name,
      shortName: courseSaved.shortName,
      description: courseSaved.description,
      numberTopics: courseSaved.topics.length,
      numberChannels: courseSaved.channels.length,
      numberUsers: courseSaved.users.length,
      role: foundRole.name,
    },
    success: `New course '${courseSaved.name}' added!`,
  };
  req.locals = {
    course: courseSaved,
    user: foundUser,
    response: response,
  };
  return next();
};

/**
 * @function deleteCourse
 * Delete a course controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.userId The owner of the course
 */
export const deleteCourse = async (req, res, next) => {
  const courseId = req.params.courseId;

  let foundCourse;
  try {
    foundCourse = await Course.findByIdAndRemove({ _id: ObjectId(courseId) });
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }

    try {
      await Topic.deleteMany({ _id: { $in: foundCourse.topics } });
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    try {
      await Channel.deleteMany({ _id: { $in: foundCourse.channels } });
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    try {
      await Material.deleteMany({ courseId: courseId });
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    try {
      await Annotation.deleteMany({ courseId: courseId });
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    try {
      await Reply.deleteMany({ courseId: courseId });
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    try {
      await Tag.deleteMany({ courseId: courseId });
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    let activitiesToBeDeleted;
    try {
      activitiesToBeDeleted = await Activity.aggregate([
        {
          $addFields: {
            extensionFields: {
              $objectToArray: "$statement.object.definition.extensions",
            },
          },
        },
        {
          $match: {
            $or: [
              { "extensionFields.v.id": ObjectId(courseId) },
              { "extensionFields.v.id": courseId },
              { "extensionFields.v.course_id": ObjectId(courseId) },
              { "extensionFields.v.course_id": courseId },
            ],
          },
        },
        {
          $project: { _id: 1 },
        },
      ]);

      let activitiesToBeDeletedIds = activitiesToBeDeleted.map(
        (actvity) => actvity._id
      );

      await Activity.deleteMany({ _id: { $in: activitiesToBeDeletedIds } });
    } catch (error) {
      return res.status(500).send({ error: err });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundUsers;
  try {
    foundUsers = await User.find();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundUsers.forEach((user) => {
    user.courses = user.courses.filter(
      (course) => course.courseId.valueOf() !== courseId
    );
  });

  foundUsers.forEach(async (user) => {
    try {
      await user.save();
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  });

  let foundUser;
  try {
    foundUser = await User.findOne({ _id: req.userId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  const response = {
    success: `Course '${foundCourse.name}' successfully deleted!`,
  };
  req.locals = {
    response: response,
    course: foundCourse,
    user: foundUser,
  };
  return next();
};

/**
 * @function editCourse
 * Delete a course controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.body.name The edited name of the course
 * @param {string} req.body.description The edited description of the course
 */
export const editCourse = async (req, res, next) => {
  const courseId = req.params.courseId;
  const courseName = req.body.name;
  const courseDesc = req.body.description;
  const userId = req.userId;

  let foundCourse;
  try {
    foundCourse = await Course.findById(courseId);
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  req.locals = {};
  req.locals.oldCourse = JSON.parse(JSON.stringify(foundCourse));

  let shortName = courseName
    .split(" ")
    .map((word, index) => {
      if (index < 3) {
        return word[0];
      }
    })
    .join("");

  foundCourse.name = courseName;
  foundCourse.shortName = shortName;
  foundCourse.description = courseDesc;
  foundCourse.updatedAt = Date.now();

  let foundUser;
  try {
    foundUser = await User.findOne({ _id: userId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  try {
    await foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  req.locals.response = {
    success: `Course '${courseName}' has been updated successfully!`,
  };
  req.locals.user = foundUser;
  req.locals.newCourse = foundCourse;
  return next();
};

/**
 * @function newIndicator
 * add new indicator controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.body.src The sourse of the iframe
 * @param {string} req.body.width The width of the iframe
 * @param {string} req.body.height The height of the iframe
 * @param {string} req.body.frameborder The frameborder of the iframe
 */
export const newIndicator = async (req, res, next) => {
  const courseId = req.params.courseId;

  let foundCourse;
  try {
    foundCourse = await Course.findById(courseId);
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  const indicator = {
    _id: ObjectId(),
    src: req.body.src,
    width: req.body.width,
    height: req.body.height,
    frameborder: req.body.frameborder,
  };

  foundCourse.indicators.push(indicator);

  try {
    foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  return res.status(200).send({
    success: `indicator with id = '${indicator._id}' has been added successfully!`,
    indicator: indicator,
  });
};

/**
 * @function deleteIndicator
 * delete indicator controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.indicatorId The id of the indicator
 */
export const deleteIndicator = async (req, res, next) => {
  const courseId = req.params.courseId;
  const indicatorId = req.params.indicatorId;

  let foundCourse;
  try {
    foundCourse = await Course.findOne({ "indicators._id": indicatorId });
    if (!foundCourse) {
      return res.status(404).send({
        error: `indicator with id ${indicatorId} doesn't exist!`,
      });
    }

    if (foundCourse._id.toString() !== courseId) {
      return res.status(404).send({
        error: `indicator with id ${indicatorId} doesn't belong to course with id ${courseId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundCourse.indicators = foundCourse.indicators.filter(
    (indicator) => indicator._id.toString() !== indicatorId
  );

  try {
    foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  return res.status(200).send({
    success: `indicator with id = '${indicatorId}' has been deleted successfully!`,
  });
};

/**
 * @function getIndicators
 * get indicators controller
 *
 * @param {string} req.params.courseId The id of the course
 */
export const getIndicators = async (req, res, next) => {
  const courseId = req.params.courseId;

  let foundCourse;
  try {
    foundCourse = await Course.findById(courseId);
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  const response = foundCourse.indicators ? foundCourse.indicators : [];

  return res.status(200).send(response);
};

/**
 * @function resizeIndicator
 * resize indicator controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.indicatorId The id of the indicator
 * @param {string} req.params.width The width of the indicator
 * @param {string} req.params.height The height of the indicator
 */
export const resizeIndicator = async (req, res, next) => {
  const courseId = req.params.courseId;
  const indicatorId = req.params.indicatorId;
  const width = req.params.width;
  const height = req.params.height;

  let foundCourse;
  try {
    foundCourse = await Course.findOne({ "indicators._id": indicatorId });
    if (!foundCourse) {
      return res.status(404).send({
        error: `indicator with id ${indicatorId} doesn't exist!`,
      });
    }

    if (foundCourse._id.toString() !== courseId) {
      return res.status(404).send({
        error: `indicator with id ${indicatorId} doesn't belong to course with id ${courseId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundCourse.indicators.forEach((indicator) => {
    if (indicator._id.toString() === indicatorId.toString()) {
      indicator.width = width;
      indicator.height = height;
    }
  });

  try {
    foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  return res.status(200).send({
    success: `indicator with id = '${indicatorId}' has been updated successfully!`,
  });
};

/**
 * @function reorderIndicators
 * reorder indicators controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.newIndex The newIndex of the reordered indicator
 * @param {string} req.params.oldIndex The oldIndex of the reordered indicator
 */
export const reorderIndicators = async (req, res, next) => {
  const courseId = req.params.courseId;
  const newIndex = parseInt(req.params.newIndex);
  const oldIndex = parseInt(req.params.oldIndex);

  let foundCourse;
  try {
    foundCourse = await Course.findOne({ _id: courseId });
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let indicator = foundCourse.indicators[oldIndex];

  if (oldIndex < newIndex) {
    for (let i = oldIndex; i < newIndex; i++) {
      foundCourse.indicators[i] = foundCourse.indicators[i + 1];
    }
  } else {
    for (let i = oldIndex; i > newIndex; i--) {
      foundCourse.indicators[i] = foundCourse.indicators[i - 1];
    }
  }

  foundCourse.indicators[newIndex] = indicator;

  try {
    foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  return res.status(200).send({
    success: `indicators have been updated successfully!`,
    indicators: foundCourse.indicators,
  });
};
