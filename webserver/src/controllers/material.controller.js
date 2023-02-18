const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Channel = db.channel;
const Material = db.material;
const User = db.user;


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
    user = await User.findOne({_id: userId});

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

  } catch (error) {
    return res.status(500).send({ error: error });
  }

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

  req.locals = {
    response: foundMaterial,
    material: foundMaterial,
    user: user
  }
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

  let user
  try {
    user = await User.findOne({_id: userId});

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

  } catch (error) {
    return res.status(500).send({ error: error });
  }

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
    userId: req.userId,
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
  return res.send({
   // id: savedMaterial._id,
    material: {
      _id:material._id,
      type: material.type,
    name: material.name,
    url: material.url,
    description: material.description,
    courseId: material.courseId,
    topicId: material.topicId,
    channelId:material.channelId,
   // userId: req.userId,
   // createdAt: Date.now(),
    //updatedAt: Date.now(),
    },
    success: `New material '${materialName}' added!`,
  });
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

  let user
  try {
    user = await User.findOne({_id: userId});

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

  } catch (error) {
    return res.status(500).send({ error: error });
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

  req.locals = {
    response: {
      success: `Material '${foundMaterial.name}' successfully deleted!`,
    },
    material: foundMaterial,
    user: user
  }
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
  const materialDesc = req.body.description;
  const materialUrl = req.body.url;
  const materialType = req.body.type;
  const userId = req.userId;

  let user
  try {
    user = await User.findOne({_id: userId});

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

  } catch (error) {
    return res.status(500).send({ error: error });
  }

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

  req.locals = {}
  req.locals.oldMaterial = JSON.parse(JSON.stringify(foundMaterial));

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

  req.locals.response = {
    id: foundMaterial._id,
    courseId: courseId,
    success: `Material '${materialName}' has been updated successfully!`,
  }
  req.locals.newMaterial = foundMaterial;
  req.locals.user = user;

  return next();
};
