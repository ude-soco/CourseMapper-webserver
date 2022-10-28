const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Channel = db.channel;
const Material = db.material;
const Notification = db.notification;
const User = db.user;
const Course = db.course;
/**
 * @function getMaterial
 * Get details of a material controller
 *
 * @param {string} req.params.materialId The id of the material
 * @param {string} req.params.courseId The id of the course
 */
export const getMaterial = async (req, res) => {
  const materialId = req.params.materialId;
  const courseId = req.params.courseId;

  let foundMaterial;
  try {
    foundMaterial = await Material.findById({
      _id: ObjectId(materialId),
    }).populate("annotations", "-__v");
    if (!foundMaterial) {
      return res.status(404).send({
        error: `Material with id ${materialId} doesn't exist!`,
      });
    }
    if (foundMaterial.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Material doesn't belong to course with id ${courseId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send(foundMaterial);
};

/**
 * @function newMaterial
 * Add a new material to a channel controller
 *
 * @param {string} req.params.channelId The id of the channel
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.body.type The type of the material, e.g., pdf, video
 * @param {string} req.body.name The name of the material, e.g., Angular lecture
 * @param {string} req.body.url The location/url of the material, e.g., https://www.youtube.com/watch?v=zJxJerQtUdk
 * @param {string} req.body.description The description of the material, e.g., Lecture material of Angular for course Advanced Web Technologies
 * @param {string} req.userId The owner of the material
 */
export const newMaterial = async (req, res) => {
  const courseId = req.params.courseId;
  const channelId = req.params.channelId;
  const materialType = req.body.type;
  const materialName = req.body.name;
  const materialUrl = req.body.url;
  const materialDesc = req.body.description;
  const userId = req.userId;

  let foundChannel;
  try {
    foundChannel = await Channel.findById({ _id: ObjectId(channelId) });
    if (!foundChannel) {
      return res.status(404).send({
        error: `Channel with id ${channelId} doesn't exist!`,
      });
    }
    if (foundChannel.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Channel doesn't belong to course with id ${courseId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let material = new Material({
    type: materialType,
    name: materialName,
    url: materialUrl,
    description: materialDesc,
    courseId: foundChannel.courseId,
    topicId: foundChannel.topicId,
    channelId: channelId,
    userId: userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  let savedMaterial;
  try {
    savedMaterial = await material.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundChannel.materials.push(savedMaterial._id);
  try {
    await foundChannel.save();
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
    return res.status(500).send({ error: err });
  }
  let foundCourse;
  try {
    foundCourse = await Course.findOne({
      _id: ObjectId(foundChannel.courseId),
    });
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course with id ${foundChannel.courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  // lists of userId that subscribed to this course
  let subscribedUserLists = [];
  foundCourse.users.forEach((user) => {
    subscribedUserLists.push(user.userId.toString());
  });
  let foundUserLists = [];
  let temp;

  for (let i = 0; i < subscribedUserLists.length; i++) {
    temp = await User.findById(subscribedUserLists[i]);
    foundUserLists.push(temp);
  }
  let userShortname = (
    foundUser.firstname.charAt(0) + foundUser.lastname.charAt(0)
  ).toUpperCase();

  let notification = new Notification({
    userName: foundUser.username,
    userShortname: userShortname,
    userId: userId,
    courseId: foundChannel.courseId,
    channelId: channelId,
    type: "courseupdates",
    action: "has uploaded new",
    actionObject: "material",
    name: materialName,
    extraMessage: `in ${foundChannel.name}`,
  });
  let notificationSaved;

  try {
    notificationSaved = await notification.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  for (let i = 0; i < foundUserLists.length; i++) {
    // do not push to the user who made trigger this action
    if (foundUserLists[i]._id == userId) {
    } else if (foundUserLists[i].deactivatedUserLists.includes(userId)) {
    } else if (foundUserLists[i].isCourseTurnOff) {
    } else {
      let subscribedUser;
      try {
        subscribedUser = await User.findById(foundUserLists[i]._id);
        if (!subscribedUser) {
          return res.status(404).send({
            error: `User not found!`,
          });
        }
      } catch (err) {
        return res.status(500).send({ error: err });
      }
      subscribedUser.notificationLists.push(notificationSaved._id);

      try {
        await subscribedUser.save();
      } catch (err) {
        return res.status(500).send({ error: err });
      }
    }
  }

  return res.send({
    id: savedMaterial._id,
    success: `New material '${materialName}' added!`,
    notification: `new notification ${notification} has been added`,
  });
};

/**
 * @function deleteMaterial
 * Delete a material controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.materialId The id of the material
 */
export const deleteMaterial = async (req, res) => {
  let materialId = req.params.materialId;
  let courseId = req.params.courseId;
  const userId = req.userId;

  let foundMaterial;
  try {
    foundMaterial = await Material.findById({ _id: ObjectId(materialId) });
    if (!foundMaterial) {
      return res.status(404).send({
        error: `Material with id ${materialId} doesn't exist!`,
      });
    }
    if (foundMaterial.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Material doesn't belong to course with id ${courseId}!`,
      });
    }
  } catch (err) {
    res.status(500).send({ error: err });
  }

  try {
    await Material.findByIdAndRemove({ _id: materialId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundChannel;
  try {
    foundChannel = await Channel.findById({ _id: foundMaterial.channelId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let materialIndex = foundChannel["materials"].indexOf(ObjectId(materialId));
  if (materialIndex >= 0) {
    foundChannel["materials"].splice(materialIndex, 1);
  }

  try {
    await foundChannel.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundCourse;
  try {
    foundCourse = await Course.findById(courseId);
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course not found!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  // lists of userId that subscribed to this course
  let subscribedUserLists = [];
  foundCourse.users.forEach((user) => {
    subscribedUserLists.push(user.userId.toString());
  });
  let foundUserLists = [];
  let temp;

  for (let i = 0; i < subscribedUserLists.length; i++) {
    temp = await User.findById(subscribedUserLists[i]);
    foundUserLists.push(temp);
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
    return res.status(500).send({ error: err });
  }

  let userShortname = (
    foundUser.firstname.charAt(0) + foundUser.lastname.charAt(0)
  ).toUpperCase();

  let notification = new Notification({
    userName: foundUser.username,
    userShortname: userShortname,
    userId: userId,
    courseId: courseId,
    channelId: foundChannel._id,
    type: "courseupdates",
    action: "has deleted",
    actionObject: "material",
    name: foundMaterial.name,
    extraMessage: `in ${foundCourse.name}`,
  });
  let notificationSaved;

  try {
    notificationSaved = await notification.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  for (let i = 0; i < foundUserLists.length; i++) {
    // do not push to the user who made trigger this action
    if (foundUserLists[i]._id == userId) {
    } else if (foundUserLists[i].deactivatedUserLists.includes(userId)) {
    } else if (foundUserLists[i].isCourseTurnOff) {
    } else {
      let subscribedUser;
      try {
        subscribedUser = await User.findById(foundUserLists[i]._id);
        if (!subscribedUser) {
          return res.status(404).send({
            error: `User not found!`,
          });
        }
      } catch (err) {
        return res.status(500).send({ error: err });
      }
      subscribedUser.notificationLists.push(notificationSaved._id);

      try {
        await subscribedUser.save();
      } catch (err) {
        return res.status(500).send({ error: err });
      }
    }
  }
  return res.send({
    success: `Material '${foundMaterial.name}' successfully deleted!`,
    notification: `new notification ${notification} has been added`,
  });
};

/**
 * @function editMaterial
 * Edit a material controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.materialId The id of the material
 * @param {string} req.body.name The new name of the material
 * @param {string} req.body.type The type of the material, e.g., pdf, video
 * @param {string} req.body.description The new description of the material
 * @param {string} req.body.url The new url of the material
 */
export const editMaterial = async (req, res) => {
  const courseId = req.params.courseId;
  const materialId = req.params.materialId;
  const materialName = req.body.name;
  const materialDesc = req.body.description;
  const materialUrl = req.body.url;
  const materialType = req.body.type;
  const userId = req.userId;

  if (!Boolean(materialName)) {
    return res.status(404).send({
      error: `Material requires a name!`,
    });
  }

  let foundMaterial;
  try {
    foundMaterial = await Material.findById({ _id: ObjectId(materialId) });
    if (!foundMaterial) {
      return res.status(404).send({
        error: `Material with id ${materialId} doesn't exist!`,
      });
    }
    if (foundMaterial.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Material doesn't belong to course with id ${courseId}!`,
      });
    }
  } catch (err) {
    return res
      .status(500)
      .send({ error: `Error while searching for material` });
  }

  foundMaterial.name = materialName;
  foundMaterial.url = materialUrl;
  foundMaterial.type = materialType;
  foundMaterial.description = materialDesc;
  foundMaterial.updatedAt = Date.now();

  try {
    await foundMaterial.save();
  } catch (err) {
    return res.status(500).send({ error: `Error saving material!` });
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
    return res.status(500).send({ error: err });
  }

  let foundCourse;
  try {
    foundCourse = await Course.findById(courseId);
    if (!foundCourse) {
      return res.status(404).send({
        error: `Course not found!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  // lists of userId that subscribed to this course
  let subscribedUserLists = [];
  foundCourse.users.forEach((user) => {
    subscribedUserLists.push(user.userId.toString());
  });
  let foundUserLists = [];
  let temp;

  for (let i = 0; i < subscribedUserLists.length; i++) {
    temp = await User.findById(subscribedUserLists[i]);
    foundUserLists.push(temp);
  }
  let userShortname = (
    foundUser.firstname.charAt(0) + foundUser.lastname.charAt(0)
  ).toUpperCase();

  let notification = new Notification({
    userName: foundUser.username,
    userShortname: userShortname,
    userId: userId,
    courseId: courseId,
    channelId: foundMaterial.channelId,
    type: "courseupdates",
    action: "has edited",
    actionObject: "material",
    name: materialName,
    extraMessage: `in ${foundCourse.name}`,
  });
  let notificationSaved;

  try {
    notificationSaved = await notification.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  for (let i = 0; i < foundUserLists.length; i++) {
    // do not push to the user who made trigger this action
    if (foundUserLists[i]._id == userId) {
    } else if (foundUserLists[i].deactivatedUserLists.includes(userId)) {
    } else if (foundUserLists[i].isCourseTurnOff) {
    } else {
      let subscribedUser;
      try {
        subscribedUser = await User.findById(foundUserLists[i]._id);
        if (!subscribedUser) {
          return res.status(404).send({
            error: `User not found!`,
          });
        }
      } catch (err) {
        return res.status(500).send({ error: err });
      }
      subscribedUser.notificationLists.push(notificationSaved._id);

      try {
        await subscribedUser.save();
      } catch (err) {
        return res.status(500).send({ error: err });
      }
    }
  }
  return res.status(200).send({
    id: foundMaterial._id,
    courseId: courseId,
    success: `Material '${materialName}' has been updated successfully!`,
    notification: `new notification ${notification} has been added`,
  });
};
