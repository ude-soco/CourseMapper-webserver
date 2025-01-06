const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Channel = db.channel;
const Material = db.material;
const User = db.user;
const Annotation = db.annotation;
const Reply = db.reply;
const Tag = db.tag;
const Course = db.course;

/**
 * @function getMaterial
 * Get details of a material controller
 *
 * @param {string} req.params.materialId The id of the material
 * @param {string} req.params.courseId The id of the course
 */

// User identification for the logging system
const findUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found!");
  return user;
};
const handleError = (res, error, message) => {
  console.error(error);
  return res.status(500).send({ error: message });
};

export const getMaterial = async (req, res, next) => {
  const materialId = req.params.materialId;
  const courseId = req.params.courseId;
  const userId = req.userId;

  let user;
  try {
    user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding user" });
  }
  let foundMaterial;
  try {
    foundMaterial = await Material.findById(materialId).populate(
      "annotations",
      "-__v"
    );
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
    return res.status(500).send({ error: "Error finding material" });
  }
  req.locals = {
    response: foundMaterial,
    material: foundMaterial,
    user: user,
  };
  return next();
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
export const newMaterial = async (req, res, next) => {
  const courseId = req.params.courseId;
  const channelId = req.params.channelId;
  const materialType = req.body.type;
  const materialName = req.body.name;
  const materialUrl = req.body.url;
  const materialDesc = req.body.description;
  const userId = req.userId;

  let course;
  try {
    course = await Course.findById(courseId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding course" });
  }

  let user;
  try {
    user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding user" });
  }

  let foundChannel;
  try {
    foundChannel = await Channel.findById(channelId);
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
    return res.status(500).send({ error: "Error finding channel" });
  }

  let material = new Material({
    type: materialType,
    name: materialName,
    url: materialUrl,
    description: materialDesc,
    courseId: foundChannel.courseId,
    topicId: foundChannel.topicId,
    channelId: channelId,
    userId: req.userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  let savedMaterial;
  try {
    savedMaterial = await material.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving material" });
  }

  foundChannel.materials.push(savedMaterial._id);
  try {
    await foundChannel.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving channel" });
  }

  req.locals = {
    material: savedMaterial,
    user,
    response: { savedMaterial: savedMaterial },
    category: "courseupdates",
    materialType,
    course,
    channel: foundChannel,
  };
  next();
};

/**
 * @function deleteMaterial
 * Delete a material controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.materialId The id of the material
 */
export const deleteMaterial = async (req, res, next) => {
  let materialId = req.params.materialId;
  console.log("materialId", materialId);
  let courseId = req.params.courseId;
  const userId = req.userId;
  let course;
  try {
    course = await Course.findById(courseId);
    console.log("course", course);
  } catch (err) {
    return res.status(500).send({ error: "Error finding course" });
  }

  let user;
  try {
    user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding user" });
  }

  let foundMaterial;
  try {
    foundMaterial = await Material.findById(materialId);
    console.log("foundMaterial", foundMaterial);
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
    res.status(500).send({ error: "Error finding material" });
  }
  try {
    await Material.findByIdAndDelete(materialId);
  } catch (err) {
    return res
      .status(500)
      .send({ error: "Error finding and removing material" });
  }

  try {
    await Annotation.deleteMany({ materialId: materialId });
  } catch (err) {
    return res.status(500).send({ error: "Error removing annotaion" });
  }

  try {
    await Reply.deleteMany({ materialId: materialId });
  } catch (err) {
    return res.status(500).send({ error: "Error removing reply" });
  }

  try {
    await Tag.deleteMany({ materialId: materialId });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting tag" });
  }

  try {
    const updatedChannel = await Channel.findOneAndUpdate(
      { _id: foundMaterial.channelId },
      { $pull: { materials: materialId } },
      { new: true } // To return the updated document
    );

    if (!updatedChannel) {
      return res.status(404).send({ error: "Channel not found" });
    }
  } catch (error) {
    console.error("Error updating channel:", error);
    return res.status(500).send({ error: "Error updating channel" });
  }

  req.locals = {
    response: {
      success: `Material '${foundMaterial.name}' successfully deleted!`,
    },
    material: foundMaterial,
    user: user,
    category: "courseupdates",
    course: course,
    isDeletingMaterial: true,
  };
  return next();
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
export const editMaterial = async (req, res, next) => {
  const courseId = req.params.courseId;
  const materialId = req.params.materialId;
  const materialName = req.body.name;
  const materialUrl = req.body.url;
  const materialType = req.body.type;
  const userId = req.userId;
  const materialDesc = req.body.description;
  console.log("called");
  let course;
  try {
    course = await Course.findById(courseId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding course" });
  }

  let user;
  try {
    user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: "Error finding user." });
  }
  if (!Boolean(materialName)) {
    return res.status(404).send({
      error: `Material requires a name!`,
    });
  }
  let foundMaterial;
  try {
    foundMaterial = await Material.findById(materialId);
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
  req.locals = {};
  req.locals.oldMaterial = JSON.parse(JSON.stringify(foundMaterial));
  foundMaterial.name = materialName;
  foundMaterial.url = materialUrl;
  foundMaterial.type = materialType;
  if (materialDesc) {
    foundMaterial.description = materialDesc;
  }
  foundMaterial.updatedAt = Date.now();
  foundMaterial = await foundMaterial.save();
  /*  try {
  } catch (err) {
    return res.status(500).send({ error: `Error saving material!`, err });
  } */
  req.locals.response = {
    id: foundMaterial._id,
    courseId: courseId,
    success: `Material '${materialName}' has been updated successfully!`,
  };
  req.locals.newMaterial = foundMaterial;
  req.locals.user = user;
  req.locals.material = foundMaterial;
  req.locals.category = "courseupdates";
  req.locals.course = course;
  req.locals.materialType = materialType;

  return next();
};

/**
 * @function newIndicator
 * add new indicator controller
 *
 * @param {string} req.params.materialId The id of the course
 * @param {string} req.body.src The sourse of the iframe
 * @param {string} req.body.width The width of the iframe
 * @param {string} req.body.height The height of the iframe
 * @param {string} req.body.frameborder The frameborder of the iframe
 */

export const newIndicator = async (req, res, next) => {
  const materialId = req.params.materialId;
  const userId = req.userId;
  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }

  let foundMaterial;
  try {
    foundMaterial = await Material.findById(materialId);
    if (!foundMaterial) {
      return res.status(404).send({
        error: `Material with id ${materialId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding material" });
  }
  const indicator = {
    _id: new ObjectId(),
    src: req.body.src,
    width: req.body.width,
    height: req.body.height,
    frameborder: req.body.frameborder,
  };
  foundMaterial.indicators.push(indicator);

  try {
    foundMaterial.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving material" });
  }

  req.locals = {
    user: foundUser,
    material: foundMaterial,
    indicator: indicator,
    success: `Indicator added successfully!`,
  };
  next();
  // return res.status(200).send({
  //   success: `Indicator added successfully!`,
  //   indicator: indicator,
  // });
};

/**
 * @function deleteIndicator
 * delete indicator controller
 *
 * @param {string} req.params.materialId The id of the course
 * @param {string} req.params.indicatorId The id of the indicator
 */
export const deleteIndicator = async (req, res, next) => {
  const materialId = req.params.materialId;
  const indicatorId = req.params.indicatorId;
  const userId = req.userId;

  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }

  let foundMaterial;
  try {
    foundMaterial = await Material.findOne({ "indicators._id": indicatorId });
    if (!foundMaterial) {
      return res.status(404).send({
        error: `indicator with id ${indicatorId} doesn't exist!`,
      });
    }
    if (foundMaterial._id.toString() !== materialId) {
      return res.status(404).send({
        error: `indicator with id ${indicatorId} doesn't belong to material with id ${materialId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding material" });
  }

  // Find the indicator to delete
  let deletedIndicator;
  deletedIndicator = foundMaterial.indicators.find(
    (indicator) => indicator._id.toString() === indicatorId
  );

  if (!deletedIndicator) {
    return res.status(404).send({
      error: `Indicator with id ${indicatorId} not found in the material!`,
    });
  }

  foundMaterial.indicators = foundMaterial.indicators.filter(
    (indicator) => indicator._id.toString() !== indicatorId
  );

  try {
    foundMaterial.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving material" });
  }

  req.locals = {
    user: foundUser,
    material: foundMaterial,
    indicator: deletedIndicator,
    success: `Indicator deleted successfully!`,
  };
  next();
  // return res.status(200).send({
  //   success: `Indicator deleted successfully!`,
  // });
};

/**
 * @function getIndicators
 * get indicators controller
 *
 * @param {string} req.params.materialId The id of the course
 */
export const getIndicators = async (req, res, next) => {
  const materialId = req.params.materialId;
  const userId = req.userId;

  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }

  let foundMaterial;
  try {
    foundMaterial = await Material.findById(materialId);
    if (!foundMaterial) {
      return res.status(404).send({
        error: `Material with id ${materialId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  const response = foundMaterial.indicators ? foundMaterial.indicators : [];
  req.locals = {
    user: foundUser,
    material: foundMaterial,
    indicators: response,
  };
  next();
  // return res.status(200).send(response);
};

/**
 * @function resizeIndicator
 * resize indicator controller
 *
 * @param {string} req.params.materialId The id of the course
 * @param {string} req.params.indicatorId The id of the indicator
 * @param {string} req.params.width The width of the indicator
 * @param {string} req.params.height The height of the indicator
 */
export const resizeIndicator = async (req, res, next) => {
  const materialId = req.params.materialId;
  const indicatorId = req.params.indicatorId;
  const newWidth = req.params.width;
  const newHeight = req.params.height;
  const userId = req.userId;

  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }
  let foundMaterial;
  try {
    foundMaterial = await Material.findOne({ "indicators._id": indicatorId });
    if (!foundMaterial) {
      return res.status(404).send({
        error: `indicator with id ${indicatorId} doesn't exist!`,
      });
    }

    if (foundMaterial._id.toString() !== materialId) {
      return res.status(404).send({
        error: `indicator with id ${indicatorId} doesn't belong to material with id ${materialId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding material" });
  }
  let resizedIndicator;
  let oldDimensions = {};
  foundMaterial.indicators.forEach((indicator) => {
    if (indicator._id.toString() === indicatorId.toString()) {
      oldDimensions = {
        width: indicator.width,
        height: indicator.height,
      };
      indicator.width = newWidth;
      indicator.height = newHeight;
      resizedIndicator = indicator;
    }
  });

  try {
    foundMaterial.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving material" });
  }

  req.locals = {
    material: foundMaterial,
    indicator: resizedIndicator,
    user: foundUser,
    oldDimensions: oldDimensions,
    newDimentions: { width: newWidth, height: newHeight },
    success: `Indicator resized successfully!`,
  };
  next();
  // return res.status(200).send();
};

/**
 * @function reorderIndicators
 * reorder indicators controller
 *
 * @param {string} req.params.materialId The id of the course
 * @param {string} req.params.newIndex The newIndex of the reordered indicator
 * @param {string} req.params.oldIndex The oldIndex of the reordered indicator
 */
export const reorderIndicators = async (req, res, next) => {
  const materialId = req.params.materialId;
  const newIndex = parseInt(req.params.newIndex);
  const oldIndex = parseInt(req.params.oldIndex);
  const userId = req.userId;

  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }
  let foundMaterial;
  try {
    foundMaterial = await Material.findById(materialId);
    if (!foundMaterial) {
      return res.status(404).send({
        error: `Material with id ${materialId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding material" });
  }

  let indicator = foundMaterial.indicators[oldIndex];
  if (oldIndex < newIndex) {
    for (let i = oldIndex; i < newIndex; i++) {
      foundMaterial.indicators[i] = foundMaterial.indicators[i + 1];
    }
  } else {
    for (let i = oldIndex; i > newIndex; i--) {
      foundMaterial.indicators[i] = foundMaterial.indicators[i - 1];
    }
  }
  foundMaterial.indicators[newIndex] = indicator;
  try {
    foundMaterial.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving material" });
  }
  req.locals = {
    user: foundUser,
    material: foundMaterial,
    indicator: indicator,
    oldIndex: oldIndex,
    newIndex: newIndex,
    indicators: foundMaterial.indicators,
    success: `Indicators updated successfully!`,
  };
  next();
  // return res.status(200).send({
  //   success: `Indicators updated successfully!`,
  //   indicators: foundMaterial.indicators,
  // });
};
