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
const Notification = db.notification;

/**
 * @function getAllCourses
 * Get all courses controller
 *
 */
export const getAllCourses = async (req, res) => {
  let courses;
  console.log("get all courses");
  try {
    courses = await Course.find({}).populate("topics", "-__v");
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
    user = await User.findOne({ _id: ObjectId(userId) })
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
    };
    results.push(course);
  });
  return res.status(200).send(results);
};

export const getSubscribedCourses = async (req, res) => {
  let userId = req.userId;
  let user;
  try {
    user = await User.findOne({ _id: ObjectId(userId) });
  } catch (err) {
    return res.status(500).send({ message: err });
  }
  let courseIdLists = [];
  user.subscribedCourses.forEach((item) => {
    courseIdLists.push(item.courseId.toString());
  });
  res.status(200).send(courseIdLists);
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
  console.log("getCourse");
  const userId = req.userId;
  let foundCourse;
  try {
    foundCourse = await Course.findOne({ _id: ObjectId(courseId) })
      .populate("topics", "-__v")
      .populate({ path: "topics", populate: { path: "channels" } });
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ message: err });
  }

  return res.status(200).send(foundCourse.topics);
};

/**
 * @function enrolCourse
 * Enrol in a new course controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.userId The user enrolling in the course
 */
export const enrolCourse = async (req, res) => {
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

    foundUser.subscribedCourses.push({
      courseId: foundCourse._id,
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
    return res.status(200).send({
      success: `User enrolled to course ${foundCourse.name}`,
      subscribedCourseLists: foundUser.subscribedCourses,
    });
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
export const withdrawCourse = async (req, res) => {
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
  const remainLists = foundUser.subscribedCourses.filter(
    (course) => course.courseId.toString() !== courseId
  );
  foundUser.subscribedCourses = [...remainLists];

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

  return res.status(200).send({
    success: `User withdrew from course ${foundCourse.name}`,
    subscribedCourseLists: foundUser.subscribedCourses,
  });
};

/**
 * @function newCourse
 * Create a new course controller
 *
 * @param {string} req.body.name The name of the course, e.g., Advanced Web Technologies
 * @param {string} req.body.description The description of the course, e.g., Teaching students about modern web technologies
 * @param {string} req.userId The owner of the course
 */
export const newCourse = async (req, res) => {
  const courseName = req.body.name;
  const courseDesc = req.body.description;
  const userId = req.userId;

  const shortName = req.body.shortName;
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
    userId: userId,
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
    role: foundRole._id,
  });

  try {
    await foundUser.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  // let userShortname = (
  //   foundUser.firstname.charAt(0) + foundUser.lastname.charAt(0)
  // ).toUpperCase();

  //this is pushing the item to global notification collection
  // let notification = new Notification({
  //   userName: foundUser.username,
  //   userShortname: userShortname,
  //   userId: userId,
  //   courseId: courseSaved._id,
  //   type: "courseupdates",
  //   action: "has created new",
  //   actionObject: "course",
  //   name: courseName,
  // });
  // let notificationSaved;
  // try {
  //   notificationSaved = await notification.save();
  // } catch (err) {
  //   return res.status(500).send({ error: err });
  // }
  return res.send({
    // id: course._id,
    // success: `New course '${courseSaved.name}' added!`,
    // // notification: notification,
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
  });
};

/**
 * @function deleteCourse
 * Delete a course controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.userId The owner of the course
 */
export const deleteCourse = async (req, res) => {
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
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundUser;
  try {
    //TODO uncomment following line & remove static assigned userID
    // foundUser = await User.findOne({ _id: req.userId });
    foundUser = await User.findOne({ _id: userId });
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

  return res.send({
    success: `Course '${foundCourse.name}' successfully deleted!`,
  });
};

/**
 * @function editCourse
 * Delete a course controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.body.name The edited name of the course
 * @param {string} req.body.description The edited description of the course
 */
export const editCourse = async (req, res) => {
  const courseId = req.params.courseId;
  const courseName = req.body.name;
  const courseDesc = req.body.description;

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

  try {
    await foundCourse.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res
    .status(200)
    .send({ success: `Course '${courseName}' has been updated successfully!` });
};

export const checkIfAuthor = async (req, res) => {
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

  let userIds = [];
  let needIndex;

  for (let i = 0; i < foundCourse.users.length; i++) {
    userIds.push(foundCourse.users[i].userId.toString());
    console.log(userIds);
    if (userIds.includes(userId)) {
      needIndex = true;
    } else {
      needIndex = false;
    }
  }
  let role;
  if (needIndex) {
    let foundIndex = foundCourse.users
      .map((user) => user.userId.toString())
      .indexOf(userId);
    let foundRole;
    try {
      foundRole = await Role.findById({
        _id: ObjectId(foundCourse.users[foundIndex].role.toString()),
      });
    } catch (err) {
      return res.status(500).send({ error: err });
    }

    role = foundRole.name;
  } else {
    role = "user not in this course";
  }

  return res.status(200).send({ role: role });
};
