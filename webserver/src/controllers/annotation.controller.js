const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const Annotation = db.annotation;
const Material = db.material;
const Reply = db.reply;
const Tag = db.tag;
const User = db.user;

/**
 * @function newAnnotation
 * Add a new annotation to a material controller.
 * If hashtag(s) exists in the content, it adds to Tag collection
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.materialId The id of the material
 * @param {string} req.body.type The type of the annotation
 * @param {string} req.body.content The content of the annotation
 * @param {string} req.body.location The location of the annotation
 * @param {string} req.body.tool The annotation tool used
 * @param {string} req.userId The author of the annotation. Anyone can create an annotation
 */
export const newAnnotation = async (req, res) => {
  const courseId = req.params.courseId;
  const materialId = req.params.materialId;
  const annotationContent = req.body.content;
  const annotationType = req.body.type;
  const annotationLocation = req.body.location;
  const annotationTool = req.body.tool;

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

  let foundUser;
  try {
    foundUser = await User.findById({ _id: ObjectId(req.userId) });
  } catch (err) {
    res.status(500).send({ error: err });
  }

  let authorName = `${foundUser.firstname} ${foundUser.lastname}`;

  let annotation = new Annotation({
    type: annotationType,
    content: annotationContent,
    author: {
      userId: req.userId,
      name: authorName,
    },
    location: annotationLocation,
    tool: annotationTool,
    courseId: foundMaterial.courseId,
    topicId: foundMaterial.topicId,
    channelId: foundMaterial.channelId,
    materialId: foundMaterial._id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  let newAnnotation;
  try {
    newAnnotation = await annotation.save();
  } catch (err) {
    res.status(500).send({ error: err });
  }

  foundMaterial.annotations.push(newAnnotation._id);

  try {
    await foundMaterial.save();
  } catch (err) {
    res.status(500).send({ error: err });
  }

  // Checks for hashtags in content
  let foundTags = annotationContent.split(" ").filter((v) => v.startsWith("#"));

  if (foundTags.length !== 0) {
    let foundTagsSchema = [];
    foundTags.forEach((tag) => {
      let newTag = new Tag({
        name: tag,
        courseId: foundMaterial.courseId,
        topicId: foundMaterial.topicId,
        channelId: foundMaterial.channelId,
        materialId: foundMaterial._id,
        annotationId: newAnnotation._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      foundTagsSchema.push(newTag);
    });

    try {
      await Tag.insertMany(foundTagsSchema);
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }
  return res
    .status(200)
    .send({ id: newAnnotation._id, success: "Annotation added!" });
};

/**
 * @function deleteAnnotation
 * Delete an annotation from a material controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.annotationId The id of the annotation
 * @param {string} req.userId The id of the user. Only author of the annotation can delete
 */
export const deleteAnnotation = async (req, res) => {
  const courseId = req.params.courseId;
  const annotationId = req.params.annotationId;

  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findById({
      _id: ObjectId(annotationId),
    });
    if (!foundAnnotation) {
      return res.status(404).send({
        error: `Annotation with id ${annotationId} doesn't exist!`,
      });
    }
    if (foundAnnotation.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Annotation doesn't belong to course with id ${courseId}!`,
      });
    }

    if (
      req.userId !== foundAnnotation.author.userId.valueOf() &&
      !req.isAdmin &&
      !req.isModerator
    ) {
      return res.status(404).send({
        error: `User is not the author of this annotation!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  try {
    // TODO: Should not delete if there are replies
    await foundAnnotation.deleteOne({ _id: ObjectId(annotationId) });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  let foundMaterial;
  try {
    foundMaterial = await Material.findById({
      _id: foundAnnotation.materialId,
    });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  foundMaterial.annotations = foundMaterial.annotations.filter(
    (annotation) => annotation.valueOf() !== annotationId
  );

  try {
    await foundMaterial.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  try {
    await Reply.deleteMany({ annotationId: annotationId });
  } catch (err) {
      return res.status(500).send({error: err});
  }

  try {
    await Tag.deleteMany({ annotationId: annotationId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  return res.status(200).send({ success: "Annotation successfully deleted" });
};

/**
 * @function editAnnotation
 * Update an annotation controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.annotationId The id of the annotation
 * @param {string} req.body.type The type of the annotation
 * @param {string} req.body.content The content of the annotation
 * @param {string} req.body.location The location of the annotation
 * @param {string} req.body.tool The annotation tool used
 * @param {string} req.userId The id of the user. Only author of the annotation can edit
 */
export const editAnnotation = async (req, res) => {
  const courseId = req.params.courseId;
  const annotationId = req.params.annotationId;
  const annotationType = req.body.type;
  const annotationContent = req.body.content;
  const annotationLocation = req.body.location;
  const annotationTool = req.body.tool;

  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findById({
      _id: ObjectId(annotationId),
    });
    if (!foundAnnotation) {
      return res.status(404).send({
        error: `Annotation with id ${annotationId} doesn't exist!`,
      });
    }
    if (foundAnnotation.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Annotation doesn't belong to course with id ${courseId}!`,
      });
    }
    if (req.userId !== foundAnnotation.author.userId.valueOf()) {
      return res.status(404).send({
        error: `Cannot update! User is not the author of this annotation!`,
      });
    }
  } catch (err) {
    res.status(500).send({ error: err });
  }

  foundAnnotation.type = annotationType;
  foundAnnotation.content = annotationContent;
  foundAnnotation.location = annotationLocation;
  foundAnnotation.tool = annotationTool;
  foundAnnotation.updatedAt = Date.now();

  try {
    // TODO: Check if the tag has changed and/or new tag(s) is added
    await foundAnnotation.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  try {
    await Tag.deleteMany({ annotationId: annotationId });
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  // Checks for hashtags in content
  let foundTags = annotationContent.split(" ").filter((v) => v.startsWith("#"));

  let foundTagsSchema = [];
  if (foundTags.length !== 0) {
    foundTags.forEach((tag) => {
      let newTag = new Tag({
        name: tag,
        courseId: foundAnnotation.courseId,
        topicId: foundAnnotation.topicId,
        channelId: foundAnnotation.channelId,
        materialId: foundAnnotation.materialId,
        annotationId: foundAnnotation._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      foundTagsSchema.push(newTag);
    });

    try {
      await Tag.insertMany(foundTagsSchema);
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  }

  return res.status(200).send({ success: "Annotation successfully updated" });
};

/**
 * @function likeAnnotation
 * Like and unlike an annotation controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.annotationId The id of the annotation
 * @param {string} req.userId The id of the user
 */
export const likeAnnotation = async (req, res) => {
  const courseId = req.params.courseId;
  const annotationId = req.params.annotationId;

  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findOne({ _id: ObjectId(annotationId) });
    if (!foundAnnotation) {
      return res.status(404).send({
        error: `Annotation with id ${annotationId} doesn't exist!`,
      });
    }
    if (foundAnnotation.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Annotation doesn't belong to course with id ${courseId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  if (foundAnnotation.likes.includes(ObjectId(req.userId))) {
    foundAnnotation.likes = foundAnnotation.likes.filter(
      (user) => user.valueOf() !== req.userId
    );
    let savedAnnotation;
    try {
      savedAnnotation = await foundAnnotation.save();
    } catch (err) {
      return res.status(500).send({ error: err });
    }
    let countLikes = savedAnnotation.likes.length;
    return res.status(200).send({
      count: countLikes,
      success: "Annotation successfully unliked!",
    });
  } else if (foundAnnotation.dislikes.includes(ObjectId(req.userId))) {
    return res
      .status(404)
      .send({ error: "Cannot like! Annotation already disliked by user!" });
  } else {
    foundAnnotation.likes.push(ObjectId(req.userId));
    let savedAnnotation;
    try {
      savedAnnotation = await foundAnnotation.save();
    } catch (err) {
      return res.status(500).send({ error: err });
    }
    let countLikes = savedAnnotation.likes.length;
    return res.status(200).send({
      count: countLikes,
      success: "Annotation successfully liked!",
    });
  }
};

/**
 * @function dislikeAnnotation
 * Dislike and un-dislike an annotation controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.annotationId The id of the annotation
 * @param {string} req.userId The id of the user
 */
export const dislikeAnnotation = async (req, res) => {
  const courseId = req.params.courseId;
  const annotationId = req.params.annotationId;

  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findOne({ _id: ObjectId(annotationId) });
    if (!foundAnnotation) {
      res.status(404).send({
        error: `Annotation with id ${annotationId} doesn't exist!`,
      });
      return;
    }
    if (foundAnnotation.courseId.valueOf() !== courseId) {
      return res.status(404).send({
        error: `Annotation doesn't belong to course with id ${courseId}!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  if (foundAnnotation.dislikes.includes(ObjectId(req.userId))) {
    foundAnnotation.dislikes = foundAnnotation.dislikes.filter(
      (user) => user.valueOf() !== req.userId
    );
    let savedAnnotation;
    try {
      savedAnnotation = await foundAnnotation.save();
    } catch (err) {
      res.status(500).send({ error: err });
    }
    let countDislikes = savedAnnotation.dislikes.length;
    return res.status(200).send({
      count: countDislikes,
      success: "Annotation successfully un-disliked!",
    });
  } else if (foundAnnotation.likes.includes(ObjectId(req.userId))) {
    return res
      .status(404)
      .send({ error: "Cannot dislike! Annotation already liked by user!" });
  } else {
    foundAnnotation.dislikes.push(ObjectId(req.userId));
    let savedAnnotation;
    try {
      savedAnnotation = await foundAnnotation.save();
    } catch (err) {
      return res.status(500).send({ error: err });
    }
    let countDislikes = savedAnnotation.dislikes.length;
    return res.status(200).send({
      count: countDislikes,
      success: "Annotation successfully disliked!",
    });
  }
};

/**
 * @function getAllAnnotations
 * Retrieve annotations controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.materialId The id of the material
 * @param {string} req.userId The id of the user who created all annotations
 */
export const getAllAnnotations = async (req, res) => {
  const courseId = req.params.courseId;
  const materialId = req.params.materialId;
  const channelId = req.params.channelId;

  let foundAnnotations;
  try {
    foundAnnotations = await Annotation.find({
      materialId: ObjectId(materialId),
      courseId: ObjectId(courseId),
    });
    if (!foundAnnotations) {
      return res.status(404).send({
        error: `Annotations with materialId ${materialId} doesn't exist!`,
      });
    }
    foundAnnotations.forEach((annotation) =>{
      if (annotation.courseId.valueOf() !== courseId) {
        return res.status(404).send({
          error: `Annotation doesn't belong to course with id ${courseId}!`,
        });
      }
      if (annotation.channelId.valueOf() !== channelId) {
        return res.status(404).send({
          error: `Annotation doesn't belong to channel with id ${channelId}!`,
        });
      }
    });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send(foundAnnotations);
};
