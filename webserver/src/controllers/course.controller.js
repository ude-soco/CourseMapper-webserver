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
const UserNotification = db.userNotifications;
const BlockingNotifications = db.blockingNotifications;
const FollowAnnotation = db.followAnnotation;
const socketio = require("../socketio");
const BlockingNotification = db.blockingNotifications;
const helpers = require("../helpers/helpers");
const notifications = require("../middlewares/Notifications/notifications");
const {
  getNotificationSettingsWithFollowingAnnotations,
} = require("../middlewares/Notifications/notifications");
/**
 * @function getAllCourses
 * Get all courses controller
 *
 */
export const getAllCourses = async (req, res) => {
  let courses;
  try {
    courses = await Course.find({})
      .populate("topics", "-__v")
      .populate({ path: "users", populate: { path: "role" } });
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
    user = await User.findById(userId)
      .populate({ path: "courses", populate: { path: "role" } })
      .populate({ path: "courses", populate: { path: "courseId" } });
  } catch (err) {
    return res.status(500).send({ message: "Error finding user" });
  }

  user.courses?.forEach((object) => {
    let course = {
      _id: object?.courseId?._id,
      name: object?.courseId.name,
      shortName: object?.courseId.shortName,
      description: object?.courseId.description,
      numberTopics: object?.courseId.topics?.length,
      numberChannels: object?.courseId.channels?.length,
      numberUsers: object?.courseId.users?.length,
      role: object?.role?.name,
      channels: object?.courseId?.channels,
      createdAt: object?.courseId?.createdAt,
      users: object?.courseId?.users,
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
    foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).send({
        error: `User not found!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }

  let foundCourse;
  try {
    /*     foundCourse = await Course.aggregate([
      {
        $match: {
          _id: new ObjectId(courseId),
        },
      },
      {
        $lookup: {
          from: "roles",
          localField: "users.role",
          foreignField: "_id",
          as: "result",
        },
      },
      {
        $addFields: {
          users: {
            $map: {
              input: "$users",
              as: "user",
              in: {
                userId: "$$user.userId",
                _id: "$$user._id",
                role: {
                  $arrayElemAt: [
                    "$result",
                    {
                      $indexOfArray: ["$result._id", "$$user.role"],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $unset: "result",
      },
      {
        $lookup: {
          from: "channels",
          localField: "channels",
          foreignField: "_id",
          as: "result",
        },
      },
      {
        $lookup: {
          from: "followannotations",
          let: {
            cId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$$cId", "$courseId"],
                    },
                    {
                      $eq: ["$userId", new ObjectId(userId)],
                    },
                  ],
                },
              },
            },
          ],
          as: "followannotations",
        },
      },
      {
        $lookup: {
          from: "annotations",
          localField: "followannotations.annotationId",
          foreignField: "_id",
          as: "annotations",
        },
      },
      {
        $addFields: {
          mergedObjects: {
            $map: {
              input: "$annotations",
              in: {
                $mergeObjects: [
                  {
                    materialType: "$$this.materialType",
                    content: "$$this.content",
                  },
                  {
                    $arrayElemAt: [
                      "$followannotations",
                      {
                        $indexOfArray: [
                          "$followannotations.annotationId",
                          "$$this._id",
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $unset: "annotations",
      },
      {
        $unset: "followannotations",
      },
      {
        $addFields: {
          channels: {
            $map: {
              input: "$result",
              as: "channel",
              in: {
                $mergeObjects: [
                  "$$channel",
                  {
                    followingAnnotations: {
                      $filter: {
                        input: "$mergedObjects",
                        as: "mergedObj",
                        cond: {
                          $eq: ["$$mergedObj.channelId", "$$channel._id"],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $unset: "mergedObjects",
      },
      {
        $unset: "result",
      },
      {
        $lookup: {
          from: "topics",
          localField: "topics",
          foreignField: "_id",
          as: "result",
        },
      },
      {
        $addFields: {
          topics: {
            $map: {
              input: "$result",
              as: "topic",
              in: {
                $mergeObjects: [
                  "$$topic",
                  {
                    channels: {
                      $filter: {
                        input: "$channels",
                        as: "channel",
                        cond: {
                          $eq: ["$$channel.topicId", "$$topic._id"],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $unset: "result",
      },
      {
        $unset: "channels",
      },
    ]); */
    foundCourse = await Course.findById(courseId)
      .populate("topics", "-__v")
      .populate({ path: "users", populate: { path: "role" } })
      .populate({ path: "topics", populate: { path: "channels" } });
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ message: "Error finding a course" });
  }

  let notificationSettings;
  try {
    /*     notificationSettings = await BlockingNotification.findOne({
      userId: userId,
      courseId: courseId,
    }); */

    notificationSettings =
      await getNotificationSettingsWithFollowingAnnotations(courseId, userId);
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error finding notification settings" });
  }

  return res.status(200).send({
    course: foundCourse,
    notificationSettings: notificationSettings[0],
  });

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
    foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).send({
        error: `User not found!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }
  let alreadyEnrolled = foundUser.courses.find(
    (course) => course.courseId.valueOf() === courseId
  );
  if (!alreadyEnrolled) {
    let role;
    try {
      role = await Role.findOne({ name: "user" });
    } catch (err) {
      return res.status(500).send({ error: "Error finding role" });
    }

    //the default notification settings are to be found in the User Model
    foundUser.courses.push({
      courseId: foundCourse._id,
      role: role._id,
    });
    try {
      foundUser = await foundUser.save();
    } catch (err) {
      return res.status(500).send({ error: "Error savinguser" });
    }
    foundCourse.users.push({
      userId: foundUser._id,
      role: role._id,
    });
    try {
      foundCourse = await foundCourse.save();
    } catch (err) {
      return res.status(500).send({ error: "Error saving course" });
    }

    await helpers.initialiseNotificationSettings(foundCourse, foundUser);

    req.locals = {
      response: { success: `User enrolled to course ${foundCourse.name}` },
      user: foundUser,
      course: foundCourse,
    };

    let notificationSettings;
    try {
      notificationSettings =
        await notifications.getNotificationSettingsWithFollowingAnnotations(
          foundCourse._id,
          userId
        );
    } catch (err) {
      return res
        .status(500)
        .send({ message: "Error finding updated notification settings" });
    }

    req.locals.response.updatedNotificationSettings = notificationSettings[0];
    return next();
  } else {
    return res
      .status(403)
      .send({ error: `User already enrolled in course ${foundCourse.name}` });
  }
};

export const getCourseOriginal = async (req, res, next) => {
  const courseId = req.params.courseId;
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
    return res.status(500).send({ error: "Error finding user" });
  }
  let foundCourse;
  try {
    foundCourse = await Course.findById(courseId)
      .populate("topics", "-__v")
      .populate({ path: "users", populate: { path: "role" } })
      .populate({ path: "topics", populate: { path: "channels" } });
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ message: "Error finding a course" });
  }

  let results = foundCourse.topics.map((topic) => {
    let channels = topic.channels.map((channel) => {
      return {
        _id: channel._id,
        name: channel.name,
        topic_id: channel.topicId,
        course_id: channel.courseId,
      };
    });
    return {
      _id: topic._id,
      name: topic.name,
      course_id: topic.courseId,
      channels: channels,
    };
  });
  req.locals = {
    response: results,
    course: foundCourse,
    user: foundUser,
  };
  return next();
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
    return res.status(500).send({ error: "Error finding course" });
  }
  let foundUser;
  try {
    foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).send({
        error: `User not found!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }
  foundUser.courses = foundUser.courses.filter(
    (course) => course.courseId.valueOf() !== courseId
  );
  try {
    await foundUser.save();
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }
  foundCourse.users = foundCourse.users.filter(
    (user) => user.userId.valueOf() !== userId
  );
  try {
    await foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving user" });
  }

  try {
    await BlockingNotifications.deleteMany({
      courseId: courseId,
      userId: userId
    });
  } catch (err) {
    return res
      .status(500)
      .send({ error: "Error deleting blocking notifications" });
  }

  try {
    await FollowAnnotation.deleteMany({
      courseId: courseId,
      userId: userId
    });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting follow annotations" });
  }

  try {
    await UserNotification.deleteMany({
      courseId: foundCourse._id,
      userId: userId
    });
  } catch (error) {
    return res.status(500).send({ error: "Error deleting user notification" });
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
    return res.status(500).send({ error: "Error finding user" });
  }
  let foundCourse;
  try {
    foundCourse = await Course.findOne({ name: courseName });
    if (foundCourse) {
      return res.status(403).send({ error: "Course name already taken!" });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding course" });
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
    return res.status(500).send({ error: "Error finding role" });
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
    return res.status(500).send({ error: "Error saving course" });
  }
  foundUser.courses.push({
    courseId: courseSaved._id,
    role: foundRole._id,
  });
  try {
    await foundUser.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving user" });
  }

  await helpers.initialiseNotificationSettings(courseSaved, foundUser);
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

  let notificationSettings;
  try {
    notificationSettings =
      await notifications.getNotificationSettingsWithFollowingAnnotations(
        courseSaved._id,
        userId
      );
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error finding updated notification settings" });
  }

  req.locals.response.updatedNotificationSettings = notificationSettings[0];
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
    foundCourse = await Course.findByIdAndDelete(courseId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding course" });
  }

  try {
    try {
      await Topic.deleteMany({ _id: { $in: foundCourse.topics } });
    } catch (err) {
      return res.status(500).send({ error: "Error deleting topic" });
    }
    try {
      await Channel.deleteMany({ _id: { $in: foundCourse.channels } });
    } catch (err) {
      return res.status(500).send({ error: "Error deleting channel" });
    }
    try {
      await Material.deleteMany({ courseId: courseId });
    } catch (err) {
      return res.status(500).send({ error: "Error deleting material" });
    }
    try {
      await Annotation.deleteMany({ courseId: courseId });
    } catch (err) {
      return res.status(500).send({ error: "Error deleting annotation" });
    }
    try {
      await Reply.deleteMany({ courseId: courseId });
    } catch (err) {
      return res.status(500).send({ error: "Error deleting reply" });
    }
    try {
      await Tag.deleteMany({ courseId: courseId });
    } catch (err) {
      return res.status(500).send({ error: "Error deleting tag" });
    }
    let activitiesToBeDeleted;
    let activitiesToBeDeletedIds;
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
              { "extensionFields.v.id": courseId },
              { "extensionFields.v.id": courseId },
              { "extensionFields.v.course_id": courseId },
              { "extensionFields.v.course_id": courseId },
            ],
          },
        },
        {
          $project: { _id: 1 },
        },
      ]);
      activitiesToBeDeletedIds = activitiesToBeDeleted.map(
        (actvity) => actvity._id
      );
      await Activity.deleteMany({ _id: { $in: activitiesToBeDeletedIds } });
    } catch (error) {
      return res.status(500).send({ error: "Error deleting activity" });
    }

    //delete all entries from UserNotification where acitivityId is in activitiesToBeDeleted array
    //TODO: Test the below method
    try {
      await UserNotification.deleteMany({
        courseId: foundCourse._id,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ error: "Error deleting user notification" });
    }

    //find all blockingNotifications where courseId is courseId
    let usersSubscribedToCourse = [];
    try {
      let blockingNotificationDocuments = await BlockingNotification.find({
        courseId: courseId,
      });

      usersSubscribedToCourse = blockingNotificationDocuments.map(
        (blockingNotification) => blockingNotification.userId
      );
    } catch (err) {
      return res.status(500).send({
        error: "Error finding blocking Notifications!",
      });
    }

    try {
      await BlockingNotifications.deleteMany({
        courseId: courseId,
      });
    } catch (err) {
      return res
        .status(500)
        .send({ error: "Error deleting blocking notifications" });
    }

    try {
      await FollowAnnotation.deleteMany({
        courseId: courseId,
      });
    } catch (err) {
      return res
        .status(500)
        .send({ error: "Error deleting follow annotations" });
    }

    usersSubscribedToCourse.forEach((userId) => {
      socketio
        .getIO()
        .emit(userId, [{ courseId: courseId, isDeletingCourse: true }]);
    });
  } catch (err) {
    return res.status(500).send({ error: "Error finding and removing course" });
  }
  let foundUsers;
  try {
    foundUsers = await User.find();
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
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
      return res.status(500).send({ error: "Error saving user" });
    }
  });
  let foundUser;

  try {
    foundUser = await User.findById(req.userId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
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
    return res.status(500).send({ error: "Error finding course" });
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
    foundUser = await User.findById(userId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }

  try {
    await foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving course" });
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
    return res.status(500).send({ error: "Error finding course" });
  }

  const indicator = {
    _id: new ObjectId(),
    src: req.body.src,
    width: req.body.width,
    height: req.body.height,
    frameborder: req.body.frameborder,
  };

  foundCourse.indicators.push(indicator);

  try {
    foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving course" });
  }

  return res.status(200).send({
    success: `Indicator added successfully!`,
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
    return res.status(500).send({ error: "Error finding course" });
  }

  foundCourse.indicators = foundCourse.indicators.filter(
    (indicator) => indicator._id.toString() !== indicatorId
  );

  try {
    foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving course" });
  }

  return res.status(200).send({
    success: `Indicator deleted successfully!`,
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
    return res.status(500).send({ error: "Error finding course" });
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
    return res.status(500).send({ error: "Error saving course" });
  }

  return res.status(200).send();
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
    foundCourse = await Course.findById(courseId);
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding course" });
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
    return res.status(500).send({ error: "Error saving course" });
  }
  return res.status(200).send({
    success: `Indicators updated successfully!`,
    indicators: foundCourse.indicators,
  });
};

export const getCourseTest = async (req, res) => {
  const courseId = req.params.courseId;
  const userId = req.userId; //"63387f529dd66f86548d3537"

  let foundUser;
  try {
    foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).send({
        error: `User not found!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }

  let foundCourse;
  let results = [];
  foundCourse = await BlockingNotification.aggregate([
    {
      $match: {
        courseId: new ObjectId(courseId),
        userId: new ObjectId(userId),
      },
    },
    {
      $unset: "materials",
    },

    {
      $lookup: {
        from: "topics",
        localField: "topics.topicId",
        foreignField: "_id",
        as: "result",
      },
    },

    {
      $addFields: {
        topics: {
          $map: {
            input: "$topics",
            as: "topic",
            in: {
              $mergeObjects: [
                "$$topic",
                {
                  $arrayElemAt: [
                    "$result",
                    {
                      $indexOfArray: ["$result._id", "$$topic.topicId"],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        result: 0,
      },
    },
    /* 
    {
      $project: {
        topics: {
          $map: {
            input: "$topics",
            as: "topic",
            in: {
              $arrayToObject: {
                $filter: {
                  input: {
                    $objectToArray: "$$topic"
                  },
                  cond: {
                    $ne: ["$$this.k", "channels"]
                  }
                }
              }
            }
          }
        },
        courseId: 1,
        userId: 1,
        materials: 1,
        channels: 1,
        __v: 1
      }
    }, */

    {
      $lookup: {
        from: "channels",
        localField: "channels.channelId",
        foreignField: "_id",
        as: "result",
      },
    },
    {
      $addFields: {
        channels: {
          $map: {
            input: "$channels",
            as: "channel",
            in: {
              $mergeObjects: [
                "$$channel",
                {
                  $arrayElemAt: [
                    "$result",
                    {
                      $indexOfArray: ["$result._id", "$$channel.channelId"],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
    {
      $addFields: {
        topics: {
          $map: {
            input: "$topics",
            as: "topic",
            in: {
              $mergeObjects: [
                "$$topic",
                {
                  channels: {
                    $filter: {
                      input: "$channels",
                      as: "channel",
                      cond: {
                        $eq: ["$$channel.topicId", "$$topic.topicId"],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
    {
      $unset: "result",
    },
    {
      $lookup: {
        from: "courses",
        localField: "courseId",
        foreignField: "_id",
        as: "course",
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ $arrayElemAt: ["$course", 0] }, "$$ROOT"],
        },
      },
    },
    {
      $unset: "course",
    },

    {
      $set: {
        _id: "$courseId",
      },
    },
    {
      $unset: ["courseId", "userId"],
    },
    {
      $lookup: {
        from: "roles",
        localField: "users.role",
        foreignField: "_id",
        as: "result",
      },
    },
    {
      $addFields: {
        users: {
          $map: {
            input: "$users",
            as: "user",
            in: {
              $mergeObjects: [
                "$$user",
                {
                  role: {
                    $first: {
                      $filter: {
                        input: "$result",
                        as: "result",
                        cond: {
                          $eq: ["$$user.role", "$$result._id"],
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
    {
      $unset: "result",
    },
  ]);
  if (!foundCourse) {
    return res.status(404).send({
      error: `Course with id ${courseId} doesn't exist!`,
    });
  }
  /* catch (err) {
    return res.status(500).send({ message: "Error finding a course", err });
  } */
  return res.status(200).send(foundCourse[0]);
};
