const db = require("../models");
const socketio = require("../socketio");
const Annotation = db.annotation;
const Material = db.material;
const Reply = db.reply;
const Tag = db.tag;
const User = db.user;
const Role = db.role;

/**
 * @function newAnnotation
 * Add a new annotation to a material controller.
 * If hashtag(s) exists in the content, it adds to Tag collection
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.materialId The id of the material
 * @param {string} req.body.type The type of the annotation
 * @param {string} req.body.content The content of the annotation
 * @param {string} req.body.location The location of the annotfindByIdation
 * @param {string} req.body.tool The annotation tool used
 * @param {string} req.userId The author of the annotation. Anyone can create an annotation
 */
export const newAnnotation = async (req, res, next) => {
  const courseId = req.params.courseId;
  const materialId = req.params.materialId;
  const annotationContent = req.body.content;
  const annotationType = req.body.type;
  const annotationLocation = req.body.location;
  const annotationTool = req.body.tool;

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

  let foundUser;
  try {
    foundUser = await User.findById(req.userId);
  } catch (err) {
    res.status(500).send({ error: "Error finding user" });
  }

  let authorName = `${foundUser.firstname} ${foundUser.lastname}`;
  let foundCourse = foundUser.courses.find(
    (course) => course.courseId.toString() == courseId
  );
  let foundRole;
  try {
    foundRole = await Role.findById(foundCourse.role);
  } catch (err) {
    res.status(500).send({ error: "Error finding role" });
  }
  let annotation = new Annotation({
    type: annotationType,
    content: annotationContent,
    author: {
      userId: req.userId,
      name: authorName,
      role: foundRole,
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
    res.status(500).send({ error: "Error saving annotation" });
  }
  foundMaterial.annotations.push(newAnnotation._id);
  try {
    await foundMaterial.save();
  } catch (err) {
    res.status(500).send({ error: "Error saving material" });
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
      return res.status(500).send({ error: "Error saving tags" });
    }
  }
  req.locals = {
    response: newAnnotation,
    material: foundMaterial,
    user: foundUser,
    annotation: newAnnotation,
  };
  socketio.getIO().emit(materialId, {
    eventType: "annotationCreated",
    annotation: newAnnotation,
    reply: null,
  });

  return next();
};

/**
 * @function deleteAnnotation
 * Delete an annotation from a material controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.annotationId The id of the annotation
 * @param {string} req.userId The id of the user. Only author of the annotation can delete
 */
export const deleteAnnotation = async (req, res, next) => {
  const courseId = req.params.courseId;
  const annotationId = req.params.annotationId;
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
  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findById(annotationId);
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
    return res.status(500).send({ error: "Error finding annotation" });
  }
  try {
    // TODO: Should not delete if there are replies
    await foundAnnotation.deleteOne({ _id: annotationId });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting reply" });
  }
  let foundMaterial;
  try {
    foundMaterial = await Material.findById(foundAnnotation.materialId);
  } catch (err) {
    return res.status(500).send({ error: "Error finding material" });
  }
  foundMaterial.annotations = foundMaterial.annotations.filter(
    (annotation) => annotation.valueOf() !== annotationId
  );
  try {
    await foundMaterial.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving material" });
  }
  try {
    await Reply.deleteMany({ annotationId: annotationId });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting reply" });
  }
  try {
    await Tag.deleteMany({ annotationId: annotationId });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting tag" });
  }
  socketio.getIO().emit(foundMaterial._id, {
    eventType: "annotationDeleted",
    annotation: foundAnnotation,
    reply: null,
  });
  req.locals = {
    response: { success: "Annotation successfully deleted" },
    annotation: foundAnnotation,
    user: user,
  };

  return next();
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
export const editAnnotation = async (req, res, next) => {
  const courseId = req.params.courseId;
  const annotationId = req.params.annotationId;
  const annotationType = req.body.type;
  const annotationContent = req.body.content;
  const annotationLocation = req.body.location;
  const annotationTool = req.body.tool;
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
  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findById(annotationId);
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
    res.status(500).send({ error: "Error finding annotation" });
  }
  req.locals = {
    oldAnnotation: JSON.parse(JSON.stringify(foundAnnotation)),
  };
  foundAnnotation.type = annotationType;
  foundAnnotation.content = annotationContent;
  foundAnnotation.location = annotationLocation;
  foundAnnotation.tool = annotationTool;
  foundAnnotation.updatedAt = Date.now();
  try {
    // TODO: Check if the tag has changed and/or new tag(s) is added
    await foundAnnotation.save();
  } catch (err) {
    return res.status(500).send({ error: "Error saving annotation" });
  }
  try {
    await Tag.deleteMany({ annotationId: annotationId });
  } catch (err) {
    return res.status(500).send({ error: "Error deleting tag" });
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
      return res.status(500).send({ error: "Error inserting tag" });
    }
  }
  req.locals.response = { success: "Annotation successfully updated" };
  req.locals.newAnnotation = foundAnnotation;
  req.locals.user = user;
  socketio.getIO().emit(foundAnnotation.materialId, {
    eventType: "annotationEdited",
    annotation: foundAnnotation,
    reply: null,
  });

  return next();
};

/**
 * @function likeAnnotation
 * Like and unlike an annotation controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.annotationId The id of the annotation
 * @param {string} req.userId The id of the user
 */
export const likeAnnotation = async (req, res, next) => {
  const courseId = req.params.courseId;
  const annotationId = req.params.annotationId;
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

  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findById(annotationId);
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
    return res.status(500).send({ error: "Error finding annotation" });
  }

  req.locals = {
    annotation: foundAnnotation,
    user: user,
  };

  if (foundAnnotation.likes.includes(req.userId)) {
    foundAnnotation.likes = foundAnnotation.likes.filter(
      (user) => user.valueOf() !== req.userId
    );
    let savedAnnotation;
    try {
      savedAnnotation = await foundAnnotation.save();
    } catch (err) {
      return res.status(500).send({ error: "Error saving annotation" });
    }
    let countLikes = savedAnnotation.likes.length;

    req.locals.response = {
      count: countLikes,
      success: "Annotation successfully unliked!",
    };
    req.locals.like = false;
    socketio.getIO().emit(annotationId, {
      eventType: "annotationUnliked",
      annotation: savedAnnotation,
      reply: null,
    });
    return next();
  } else if (foundAnnotation.dislikes.includes(req.userId)) {
    return res
      .status(404)
      .send({ error: "Cannot like! Annotation already disliked by user!" });
  } else {
    foundAnnotation.likes.push(req.userId);
    let savedAnnotation;
    try {
      savedAnnotation = await foundAnnotation.save();
    } catch (err) {
      return res.status(500).send({ error: "Error saving annotation" });
    }
    let countLikes = savedAnnotation.likes.length;

    req.locals.response = {
      count: countLikes,
      success: "Annotation successfully liked!",
    };

    req.locals.like = true;
    socketio.getIO().emit(annotationId, {
      eventType: "annotationLiked",
      annotation: savedAnnotation,
      reply: null,
    });
    return next();
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
export const dislikeAnnotation = async (req, res, next) => {
  const courseId = req.params.courseId;
  const annotationId = req.params.annotationId;
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

  let foundAnnotation;
  try {
    foundAnnotation = await Annotation.findById(annotationId);
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
    return res.status(500).send({ error: "Error finding annotation" });
  }

  req.locals = {
    annotation: foundAnnotation,
    user: user,
  };

  if (foundAnnotation.dislikes.includes(req.userId)) {
    foundAnnotation.dislikes = foundAnnotation.dislikes.filter(
      (user) => user.valueOf() !== req.userId
    );
    let savedAnnotation;
    try {
      savedAnnotation = await foundAnnotation.save();
    } catch (err) {
      res.status(500).send({ error: "Error saving annotation" });
    }
    let countDislikes = savedAnnotation.dislikes.length
      ? savedAnnotation.dislikes.length
      : 0;

    req.locals.response = {
      count: countDislikes,
      success: "Annotation successfully un-disliked!",
    };
    req.locals.dislike = false;
    socketio.getIO().emit(annotationId, {
      eventType: "annotationUndisliked",
      annotation: savedAnnotation,
      reply: null,
    });
    return next();
  } else if (foundAnnotation.likes.includes(req.userId)) {
    return res
      .status(404)
      .send({ error: "Cannot dislike! Annotation already liked by user!" });
  } else {
    foundAnnotation.dislikes.push(req.userId);
    let savedAnnotation;
    try {
      savedAnnotation = await foundAnnotation.save();
    } catch (err) {
      return res.status(500).send({ error: "Error saving annotation" });
    }
    let countDislikes = savedAnnotation.dislikes.length
      ? savedAnnotation.dislikes.length
      : 0;

    req.locals.response = {
      count: countDislikes,
      success: "Annotation successfully disliked!",
    };
    req.locals.dislike = true;
    socketio.getIO().emit(annotationId, {
      eventType: "annotationDisliked",
      annotation: savedAnnotation,
      reply: null,
    });
    return next();
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

  let foundAnnotations;
  try {
    foundAnnotations = await Annotation.find({
      materialId: materialId,
      courseId: courseId,
    });
    if (!foundAnnotations) {
      return res.status(404).send({
        error: `Annotations with materialId ${materialId} doesn't exist!`,
      });
    }
    foundAnnotations.forEach((annotation) => {
      if (annotation.courseId.valueOf() !== courseId) {
        return res.status(404).send({
          error: `Annotation doesn't belong to course with id ${courseId}!`,
        });
      }
    });
  } catch (err) {
    return res.status(500).send({ error: "Error finding annotation" });
  }
  foundAnnotations.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return res.status(200).send(foundAnnotations);
};

/**
 * @function getAllAnnotationsForSpecificTag
 * Retrieve annotations controller
 *
 * @param {string} req.params.courseId The id of the course
 * @param {string} req.params.tagName The name of the tag
 * @param {string} req.userId The id of the user requested all annotations for this tag
 */
export const getAllAnnotationsForSpecificTag = async (req, res) => {
  const courseId = req.params.courseId;
  const tagName = decodeURIComponent(req.params.tagName);

  let foundTags;
  try {
    foundTags = await Tag.find({ courseId: courseId, name: tagName});
    if (!foundTags) {
      return res.status(404).send({
        error: `Course with id ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding tags" });
  }

  let foundAnnotations = []; // initialize the variable
  try {
    for (const tag of foundTags) {
      const annotation = await Annotation.findById(tag.annotationId);
      if (annotation) {
        foundAnnotations.push(annotation);
      }
    }

    if (!foundAnnotations.length) { // check if the array is empty
      return res.status(404).send({
        error: `Annotations with courseId ${courseId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding annotation" });
  }
  foundAnnotations.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return res.status(200).send(foundAnnotations);
};

