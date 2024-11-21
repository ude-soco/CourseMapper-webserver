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
import catchAsync from "../helpers/catchAsync";
import { utili } from "../middlewares";


const {
  getNotificationSettingsWithFollowingAnnotations,
} = require("../middlewares/Notifications/notifications");
/**
 * @function getAllCourses
 * Get all courses controller
 *
 */
export const getAllCourses = catchAsync(async (req, res, next) => {
  let courses = await Course.find({})
    .populate("topics", "-__v")
    .populate({ path: "users", populate: { path: "role" } });


  let results = [];
  if (courses.length > 0) {
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
  }
  return res.status(200).send(results);
});

/**
 * @function getMyCourses
 * Get all courses the logged in user is enrolled in controller
 *
 */
export const getMyCourses = catchAsync(async (req, res, next) => {
  let userId = req.userId;
  let results = [];


  let user = await User.findById(userId)
    .populate({ path: "courses", populate: { path: "role" } })
    .populate({ path: "courses", populate: { path: "courseId" } });

  if (!user) {
    return res.status(500).send({ message: "Error finding user" });
  }

  user.courses?.forEach((object) => {
    let course = {
      _id: object?.courseId?._id,
      name: object?.courseId?.name,
      shortName: object?.courseId?.shortName,
      description: object?.courseId?.description,
      numberTopics: object?.courseId?.topics?.length,
      numberChannels: object?.courseId?.channels?.length,
      numberUsers: object?.courseId?.users?.length,
      role: object?.role?.name,
      channels: object?.courseId?.channels,
      createdAt: object?.courseId?.createdAt,
      users: object?.courseId?.users,
      co_teacher_permissions: object?.courseId?.co_teacher_permissions,
      blockedUsers: object?.courseId?.blockedUsers,
      non_editing_teacher_permissions: object?.courseId?.non_editing_teacher_permissions,
    };
    results.push(course);
  });
  return res.status(200).send(results);
});

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
export const getCourse = catchAsync(async (req, res, next) => {
  const courseId = req.params.courseId;
  const userId = req.userId; //"63387f529dd66f86548d3537"

  let foundUser = await User.findById(userId);
  if (!foundUser) {
    return res.status(404).send({ error: `User not found!` });
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
      .populate({ path: "users", populate: [{ path: "role" }, { path: "userId" }] })
      .populate({ path: "topics", populate: { path: "channels" } });

    if (!foundCourse) {
      return res.status(404).send({ error: `Course with id ${courseId} doesn't exist!` });
    }
  } catch (err) {
    return res.status(500).send({ message: "Error finding a course" });
  }


  // Check if the current user is blocked from the course
  const isUserBlocked = foundCourse.blockedUsers.some(
    (blockedUserId) => blockedUserId.toString() === userId.toString()
  );


  // add user role in this course
  const userRole = foundCourse.users.find(
    (ele) => ele?.userId?._id.toString() === userId.toString()
  );
  if (userRole) {
    foundCourse.role = userRole.role.name;
  }


  if (isUserBlocked) {
    return res.status(403).send({
      error: "You are blocked from accessing this course.",
    });
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

  const course = {
    _id: foundCourse?._id,
    blockedUsers: foundCourse?.blockedUsers,
    channels: foundCourse?.channels,
    description: foundCourse?.description,
    indicators: foundCourse?.indicators,
    name: foundCourse?.name,
    shortName: foundCourse?.shortName,
    topics: foundCourse?.topics,
    users: foundCourse?.users,
    role: userRole.role.name,
    createdAt: foundCourse?.createdAt,
    updatedAt: foundCourse?.updatedAt,
    co_teacher_permissions: foundCourse?.co_teacher_permissions,
    non_editing_teacher_permissions: foundCourse?.non_editing_teacher_permissions,
  }

  return res.status(200).send({
    course,
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
});

/**
 * @function enrolCourse
 * Enrol in a new course controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.userId The user enrolling in the course
 */
export const enrolCourse = catchAsync(async (req, res, next) => {
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
});

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
export const withdrawCourse = catchAsync(async (req, res, next) => {
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
});

/**
 * @function newCourse
 * Create a new course controller
 *
 * @param {string} req.body.name The name of the course, e.g., Advanced Web Technologies
 * @param {string} req.body.description The description of the course, e.g., Teaching students about modern web technologies
 * @param {string} req.userId The owner of the course
 */
export const newCourse = catchAsync(async (req, res, next) => {
  const { courseName, courseDesc } = req.body;
  let shortName = req.body.shortname;
  const userId = req.userId;

  let foundUser;
  try {
    foundUser = await User.findById(userId).populate("role", "-__v");
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
  };

  let foundRole = await Role.findOne({ name: "teacher" });

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
});


/**
 * @function updateUserRole
 * Update a user's role in a course
 *
 * @param {string} req.params.courseId id of the course
 * @param {string} req.body.user_id id of the user
 * @param {string} req.body.role Role to assign ( 'co_teacher' || 'non_editing_teacher')
 */
export const updateUserRole = catchAsync(async (req, res, next) => {
  const { user_id, role } = req.body;
  const courseId = req.params.courseId;

  if (!ObjectId.isValid(user_id) || !ObjectId.isValid(courseId)) {
    return res.status(400).send({ error: "Invalid course or user ID!" });
  }

  const foundCourse = await Course.findById(courseId);
  if (!foundCourse) {
    return res.status(404).send({ error: "Course not found!" });
  }

  const foundUser = await User.findById(user_id);
  if (!foundUser) {
    return res.status(404).send({ error: "User not found!" });
  }

  if (!["co_teacher", "non_editing_teacher", "user"].includes(role)) {
    return res.status(400).send({ error: "Invalid role!" });
  }

  const userRole = await Role.findOne({ name: role });
  if (!userRole) {
    return res.status(400).send({ error: "Invalid role!" });
  }

  const existingUserInCourse = foundCourse.users.find((user) => user.userId.toString() === user_id.toString());
  const existingUserInUserCourses = foundUser.courses.find((course) => course.courseId.toString() === courseId.toString());

  if (existingUserInCourse && existingUserInUserCourses) {
    if (existingUserInCourse.role.toString() !== userRole._id.toString()) {
      // Update the role
      existingUserInCourse.role = userRole._id;
      existingUserInUserCourses.role = userRole._id;
    } else {
      return res.status(403).send({ error: `User has already assigned the role of ${role} for this course!` });
    }
  } else {
    foundCourse.users.push({
      userId: user_id,
      role: userRole._id,
    });

    foundUser.courses.push({
      courseId: foundCourse._id,
      role: userRole._id,
    });
  }

  await Promise.all([foundCourse.save(), foundUser.save()]);

  await helpers.initialiseNotificationSettings(foundCourse, foundUser);

  const response = {
    success: `User '${foundUser.username}' added as a ${role} to course '${foundCourse.name}'`,
    course: foundCourse,
  };

  req.locals = {
    course: foundCourse,
    user: foundUser,
    response: response,
    role
  };

  const notificationSettings = await notifications.getNotificationSettingsWithFollowingAnnotations(
    foundCourse._id,
    req.userId
  );

  req.locals.response.updatedNotificationSettings = notificationSettings[0];
  return next();
});


/**
 * @function updateUserPermissions
 * Delete a course controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.body.user_id id of the user
 */

export const updateUserPermissions = catchAsync(async (req, res) => {
  const { permissions, role } = req.body;
  const courseId = req.params.courseId;

  if (!ObjectId.isValid(courseId)) {
    return res.status(400).send({ error: "Invalid course!" });
  }

  if (typeof permissions !== 'object') {
    return res.status(400).send({ error: "Invalid permissions format!" });
  }

  if (!["co_teacher", "non_editing_teacher"].includes(role)) {
    return res.status(400).send({ error: "Invalid role!" });
  }

  const foundCourse = await Course.findById(courseId);
  if (!foundCourse) {
    return res.status(404).send({ error: "Course not found!" });
  }

  // Update the permissions
  if (role === "co_teacher") {
    foundCourse.co_teacher_permissions = permissions;
  } else if (role === "non_editing_teacher") {
    foundCourse.non_editing_teacher_permissions = permissions;
  }

  await foundCourse.save();

  // Send response
  return res.status(200).json({
    success: `Permissions updated for course '${foundCourse.name}'`,
    course: foundCourse,
  });

});


/**
 * @function blockUserFromCourse
 * block User from course
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.body.userIdToBlock The id of the user to block
 * @param {string} req.userId The owner of the course
 */
export const updateUserBlockStatus = catchAsync(async (req, res, next) => {
  const { targetUserId, status } = req.body;
  const courseId = req.params.courseId;
  const currentUserId = req.userId;

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).send({ error: "Course not found!" });
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).send({ error: "User not found!" });
  }

  // Verify the roles
  const teacherRole = await Role.findOne({ name: "teacher" });
  const coTeacherRole = await Role.findOne({ name: "co_teacher" });
  const nonEditingTeacherRole = await Role.findOne({ name: "non_editing_teacher" });

  // Checking whether the current user has the role of teacher or co_teacher
  const isModerator = course.users.some(
    (user) =>
      user.userId.toString() === currentUserId.toString() &&
      (user.role.toString() === teacherRole._id.toString() ||
        user.role.toString() === coTeacherRole._id.toString()||
        user.role.toString() === coTeacherRole._id.toString())
  );

  if (isModerator) {
    const isAlreadyBlocked = course.blockedUsers.some(
      (user) => user.toString() === targetUserId.toString()
    );

    if (status) {
      // Block user if not already blocked
      if (isAlreadyBlocked) {
        return res.status(403).send({ error: "User is already blocked from this course!" });
      }
      course.blockedUsers.push(targetUserId);
      await course.save();

      return res.send({
        success: `'${targetUser.username}' has been blocked from accessing the course '${course.name}'.`,
      });
    } else {
      // Unblock user
      if (!isAlreadyBlocked) {
        return res.status(403).send({ error: "User is not blocked from this course!" });
      }
      course.blockedUsers = course.blockedUsers.filter(
        (user) => user.toString() !== targetUserId.toString()
      );
      await course.save();

      return res.send({
        success: `'${targetUser.username}' has been unblocked from accessing the course '${course.name}'.`,
      });
    }
  } else {
    // For users managing their personal block lists
    const isBlockedByCurrentUser = targetUser.blockedByUser.includes(currentUserId);

    if (status) {
      // Block user
      if (isBlockedByCurrentUser) {
        return res.status(403).send({ error: "User is already blocked!" });
      }
      targetUser.blockedByUser.push(currentUserId);
      await targetUser.save();

      await db.user.findByIdAndUpdate(
        currentUserId, { $push: { blockingUsers: targetUser._id } } // Use $push to add to the array
      );

      return res.send({
        success: `'${targetUser.username}' has been blocked.`,
      });
    } else {
      // Unblock user
      if (!isBlockedByCurrentUser) {
        return res.status(403).send({ error: "User is not blocked!" });
      }
      targetUser.blockedByUser = targetUser.blockedByUser.filter(
        (blockedId) => blockedId.toString() !== currentUserId.toString()
      );
      await targetUser.save();

      await db.user.findByIdAndUpdate(
        currentUserId, { $pull: { blockingUsers: targetUser._id } }
      );

      return res.send({
        success: `'${targetUser.username}' has been unblocked.`,
      });
    }
  }
});




/**
 * @function deleteCourse
 * Delete a course controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.userId The owner of the course
 */
export const deleteCourse = catchAsync(async (req, res, next) => {
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
});

/**
 * @function editCourse
 * Delete a course controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.body.name The edited name of the course
 * @param {string} req.body.description The edited description of the course
 */
export const editCourse = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const { name: courseName, description: courseDesc } = req.body;
  const { userId } = req;

  let foundCourse = await Course.findById(courseId);
  const foundUser = await User.findById(userId);

  if (!foundCourse) {
    return res.status(404).send({ error: `Course with id ${courseId} doesn't exist!` });
  };

  req.locals = {
    oldCourse: JSON.parse(JSON.stringify(foundCourse)),
    user: foundUser,
  };

  // Update course name
  if (courseName && utili.permissionsChecker(req, "can_edit_course_name")) {
    foundCourse.shortName = courseName.split(" ").slice(0, 3).map(word => word[0]).join("");
    foundCourse.name = courseName;
    req.locals.response = { success: `${foundCourse.name}'s name has been updated!` };
  } 
  // Update course description
  else if (courseDesc && utili.permissionsChecker(req, "can_edit_course_description")) {
    foundCourse.description = courseDesc;
    req.locals.response = { success: `${foundCourse.name}'s description has been updated!` };
  } 
  // No updates made
  else {
    return res.status(400).json({ error: 'No valid update fields provided or insufficient permissions.' });
  }

  // Save updates and proceed
  foundCourse.updatedAt = Date.now();
  await foundCourse.save();
  req.locals.newCourse = foundCourse;

  return next();
});

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
export const newIndicator = catchAsync(async (req, res, next) => {
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
});

/**
 * @function deleteIndicator
 * delete indicator controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.indicatorId The id of the indicator
 */
export const deleteIndicator = catchAsync(async (req, res, next) => {
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
});

/**
 * @function getIndicators
 * get indicators controller
 *
 * @param {string} req.params.courseId The id of the course
 */
export const getIndicators = catchAsync(async (req, res, next) => {
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
});

/**
 * @function resizeIndicator
 * resize indicator controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.indicatorId The id of the indicator
 * @param {string} req.params.width The width of the indicator
 * @param {string} req.params.height The height of the indicator
 */
export const resizeIndicator = catchAsync(async (req, res, next) => {
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
});

/**
 * @function reorderIndicators
 * reorder indicators controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.newIndex The newIndex of the reordered indicator
 * @param {string} req.params.oldIndex The oldIndex of the reordered indicator
 */
export const reorderIndicators = catchAsync(async (req, res, next) => {
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
});


export const getCourseTest = catchAsync(async (req, res, next) => {
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
});
