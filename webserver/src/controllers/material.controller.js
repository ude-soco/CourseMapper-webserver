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
  let courseId = req.params.courseId;
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
    res.status(500).send({ error: "Error finding material" });
  }
  try {
    await Material.findByIdAndRemove(materialId);
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
  req.locals.isDeletingMaterial = true;

  return next();
};
