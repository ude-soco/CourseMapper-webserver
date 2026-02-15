const fs = require("fs").promises;
const process = require("process");
const axios = require("axios");
const socketio = require("../socketio");
const db = require("../models");
const User = db.user;
const Role = db.role;
const Material = db.material;
const Course = db.course;

const neo4j = require("../graph/neo4j");
const redis = require("../graph/redis");
// TODO Issue #640: Use better file names

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

async function checkIsModerator(req) {
  if (!req.userId || (!req.params.courseId && !req.params.materialId)) {
    return false;
  }
  const user = await User.findById(req.userId);
  if (!user) {
    return false;
  }
  const role = await Role.findById(user.role);
  if (role.name === "moderator" || role.name === "admin") {
    return true;
  }
  let courseId = req.params.courseId;
  if (!courseId) {
    const material = await Material.findById(req.params.materialId);
    if (!material) {
      return false;
    }
    courseId = material["courseId"].toString();
  }
  const course = user.courses.find(
    (item) => item.courseId.valueOf() === courseId
  );
  const courseRole = await Role.findOne({ _id: course.role });
  if (courseRole.name === "moderator") {
    return true;
  }
}

async function isAuthorized(req) {
  const records = await neo4j.checkMaterial(req.params.materialId);
  if (records.length === 0) {
    return true;
  }
  const is_draft = records?.[0]?.["m"]?.properties?.["is_draft"] ?? false;
  if (is_draft && !(await checkIsModerator(req))) {
    return false;
  }
  return true;
}

export const checkSlide = async (req, res) => {
  const slideId = req.params.slideId;

  try {
    const records = await neo4j.checkSlide(slideId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const getSlide = async (req, res, next) => {
  const slideId = req.params.slideId;
  const userId = req.userId;
  const materialId = slideId.split("_slide_")[0]; // Extract materialId
  let materialPage = slideId.split("_slide_")[1]; // Extract materialPage
  let foundUser;
  let foundMaterial;
  let records;

  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }
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

  try {
    records = await neo4j.getSlide(slideId);
    // return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
  req.locals = {
    user: foundUser,
    material: foundMaterial,
    materialPage: materialPage,
    records: records,
  };
  next();
};

export const checkMaterial = async (req, res) => {
  const materialId = req.params.materialId;

  try {
    if (!(await isAuthorized(req))) {
      return res.status(403).send({ error: "Unauthorized" });
    }
    const records = await neo4j.checkMaterial(materialId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const getMaterial = async (req, res, next) => {
  const materialId = req.params.materialId;
  const userId = req.userId;
  let records;
  let foundUser;
  let foundMaterial;

  if (!(await isAuthorized(req))) {
    return res.status(403).send({ error: "Unauthorized" });
  }
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }

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

  try {
    records = await neo4j.getMaterial(materialId);
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }

  req.locals = {
    user: foundUser,
    material: foundMaterial,
    records: records,
  };
  next();
};

export const deleteMaterial = async (req, res, next) => {
  const materialId = req.params.materialId;

  try {
    await neo4j.deleteMaterial(materialId);
    return next();
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const deleteCourse = async (req, res, next) => {
  const courseId = req.params.courseId;

  try {
    await neo4j.deleteCourse(courseId);
    return next();
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const getMaterialSlides = async (req, res) => {
  const materialId = req.params.materialId;

  try {
    const records = await neo4j.getMaterialSlides(materialId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const getMaterialEdges = async (req, res) => {
  const materialId = req.params.materialId;

  try {
    const records = await neo4j.getMaterialEdges(materialId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const getMaterialConceptIds = async (req, res) => {
  const materialId = req.params.materialId;

  try {
    const records = await neo4j.getMaterialConceptIds(materialId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const getHigherLevelsNodesAndEdges = async (req, res, next) => {
  let materialIds = req.query.material_ids;
  const userId = req.userId;
  let materials;
  let records;
  let foundUser;
  let foundCourse;
  let foundMaterial;
  let courseId;

  if (materialIds.constructor !== Array) {
    materialIds = [materialIds];
  }

  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }

  // Material Ids could be an array of materials
  if (materialIds.length !== 0) {
    try {
      foundMaterial = await Material.findById(materialIds[0]); // I just need a material Object to extract the courseId
      if (!foundMaterial) {
        return res.status(404).send({
          error: `Material with id ${materialIds[0]} doesn't exist!`,
        });
      }
    } catch (err) {
      return res.status(500).send({ error: "Error finding material" });
    }
    courseId = foundMaterial.courseId;
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
  }

  try {
    materials = await neo4j.checkMaterials(materialIds);
    records = await neo4j.getHigherLevelsNodesAndEdges(materialIds);
    //return res.status(200).send(records);
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
  req.locals = {
    user: foundUser,
    course: foundCourse,
    materials: materials,
    records: records,
  };

  next();
};

export const setRating = async (req, res) => {
  const resourceId = req.body.resourceId;
  const concepts = req.body.concepts;
  const userId = req.userId;
  const rating = req.body.rating;
  try {
    const result = await neo4j.setRating(resourceId, concepts, userId, rating);
    return res.status(200).send(result);
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const createCourseNeo4j = async (req, res) => {
  const { userId, courseId } = req.params;              // Still extracting from the URL path
  const { courseName } = req.query;                     // Extract from query parameters

  try {
    // Check if the user is a moderator of this specific course
    // Moderators should not have an ENGAGED_IN relationship with their own course
    const moderatorRole = await Role.findOne({ name: "moderator" });
    const user = await User.findById(userId);
    if (user && moderatorRole) {
      const userCourse = user.courses.find(
        (c) => String(c.courseId) === String(courseId)
      );
      if (userCourse && String(userCourse.role) === String(moderatorRole._id)) {
        console.log(`Skipping ENGAGED_IN creation: user ${userId} is a moderator of course ${courseId}`);
        return res.status(200).send({
          success: true,
          skipped: true,
          message: "Moderators do not have an engagement relationship with their own course."
        });
      }
    }

    const result = await neo4j.createUserCourseRelationship(
      userId,
      courseId,
      courseName,
      "low"
    );
    return res.status(200).send({ success: true, data: result });
  } catch (err) {
    console.error("Failed to create user-course relationship:", err);
    return res.status(500).send({ success: false, error: err.message });
  }
};

export const deleteCourseNeo4j = async (req, res) => {
  const { userId, courseId } = req.params; // Extract parameters from the URL

  if (!userId || !courseId) {
    return res
      .status(400)
      .send({ success: false, error: "userId and courseId are required" });
  }

  try {
    const result = await neo4j.deleteUserCourseRelationship(userId, courseId);
    return res.status(200).send({
      success: true,
      message: "Relationship deleted successfully",
      data: result,
    });
  } catch (err) {
    console.error("Failed to delete user-course relationship:", err);
    return res.status(500).send({ success: false, error: err.message });
  }
};

export const conceptMap = async (req, res) => {
  const materialId = req.params.materialId;
  socketio
    .getIO()
    .to("material:" + materialId)
    .emit("log", { called: "conceptmap started" });

  const material = await Material.findById(materialId);
  if (!material) {
    return res.status(404).send({ error: "Material not found" });
  }
  const materialName = material.name;

  const materialPath = process.cwd() + material.url + material._id + ".pdf";
  const materialData = await fs.readFile(materialPath);

  const result = await redis.addJob(
    "concept-map",
    {
      materialId,
      materialName,
    },
    async (jobId) => {
      await redis.addFile(jobId, materialData);
    },
    (result) => {
      socketio
        .getIO()
        .to("material:" + materialId)
        .emit("log", { result: result });

      if (res.headersSent) {
        return;
      }
      if (result.error) {
        return res.status(500).send({ error: result });
      }
      return res.status(200).send(result.result);
    }
  );
  socketio
    .getIO()
    .to("material:" + materialId)
    .emit("log", { addJob: result, pipeline: "concept-map" });
};

export const deleteConcept = async (req, res) => {
  const materialId = req.params.materialId;
  const conceptId = req.params.conceptId;

  await redis.addJob(
    "modify-graph",
    {
      action: "remove-concept",
      materialId,
      conceptId,
    },
    undefined,
    (result) => {
      if (res.headersSent) {
        return;
      }
      if (result.error) {
        return res.status(500).send(result);
      }
      return res.status(200).send(result.result);
    }
  );
};

export const addConcept = async (req, res) => {
  const materialId = req.params.materialId;
  const conceptName = req.body.conceptName;
  const slides = req.body.slides;
  const isNew = req.body.isNew;
  const isEditing = req.body.isEditing;
  const lastEdited = req.body.lastEdited;
  console.log("isNew", isNew);
  console.log("slides", slides);

  await redis.addJob('modify-graph', {
    action: 'add-concept',
    materialId,
    conceptName,
    slides,
    isNew,
    isEditing,
    lastEdited,
  }, undefined, (result) => {
    if (res.headersSent) {
      return;
    }
    if (result.error) {
      return res.status(500).send(result);
    }
    return res.status(200).send(result.result);
    }
  );
};

export const publishConceptMap = async (req, res) => {
  const materialId = req.params.materialId;

  await redis.addJob(
    "expand-material",
    {
      materialId,
    },
    undefined,
    (result) => {
      if (res.headersSent) {
        return;
      }
      if (result.error) {
        return res.status(500).send({ error: result });
      }
      return res.status(200).send(result.result);
    }
  );
};

export const getConcepts = async (req, res) => {
  const materialId = req.params.materialId;
  const userId = req.userId;
  const understood = req.body.understoodConcepts;
  const nonUnderstood = req.body.nonUnderstoodConcepts;
  const newConcepts = req.body.newConcepts;
  socketio
    .getIO()
    .to("material:" + materialId)
    .emit("log", { called: "concept recommendation started" });

  const result = await redis.addJob(
    "concept-recommendation",
    {
      materialId,
      userId,
      understood,
      nonUnderstood,
      newConcepts,
    },
    undefined,
    (result) => {
      socketio
        .getIO()
        .to("material:" + materialId)
        .emit("log", { result: result });
      if (res.headersSent) {
        return;
      }
      if (result.error) {
        return res.status(500).send({ error: result.error });
      }
      return res.status(200).send(result.result);
    }
);
  socketio.getIO().to("material:"+materialId).emit("log", { addJob:result, pipeline:'concept-recommendation'});
}
export const getSequence = async (req, res) => {
  const materialId = req.params.materialId;
  const userId = req.userId;
  const understood = req.body.understoodConcepts;
  const nonUnderstood = req.body.nonUnderstoodConcepts;
  const newConcepts = req.body.newConcepts;
  socketio.getIO().to("material:"+materialId).emit("log", { called:"sequence recommendation started" } );

  const result = await redis.addJob('sequence-recommendation', {
    materialId,
    userId,
    understood,
    nonUnderstood,
    newConcepts
  }, undefined, (result) => {
    socketio.getIO().to("material:"+materialId).emit("log", { result:result } );
    if (res.headersSent) {
      return;
    }
    if (result.error) {
      return res.status(500).send({ error: result.error });
    }
    return res.status(200).send(result.result);
  });
  socketio.getIO().to("material:"+materialId).emit("log", { addJob:result, pipeline:'sequence-recommendation'});
}


export const getResources = async (req, res) => {
  const materialId = req.params.materialId;
  const userId = req.userId;
  const slideId = req.body.slideId;
  const understood = req.body.understoodConcepts;
  const nonUnderstood = req.body.nonUnderstoodConcepts;
  const newConcepts = req.body.newConcepts;
  socketio
    .getIO()
    .to("material:" + materialId)
    .emit("log", { called: "recourse recommendation started" });

  const result = await redis.addJob(
    "resource-recommendation",
    {
      materialId,
      userId,
      slideId,
      understood,
      nonUnderstood,
      newConcepts,
    },
    undefined,
    (result) => {
      socketio
        .getIO()
        .to("material:" + materialId)
        .emit("log", { result: result });
      if (res.headersSent) {
        return;
      }
      if (result.error) {
        return res.status(500).send({ error: result.error });
      }
      return res.status(200).send(result.result);
    }
  );
  socketio
    .getIO()
    .to("material:" + materialId)
    .emit("log", { addJob: result, pipeline: "resourse-recommendation" });
};

export const readSlide = async (req, res, next) => {
  const slideNr = req.params.slideNr;
  const slideId = `${req.params.materialId}_slide_${slideNr}`;

  try {
    await neo4j.readSlide(req.locals.user.id, slideId);
  } catch (err) {
    console.log(err);
  }
  return next();
};

export const searchWikipedia = async (req, res) => {
  const query = req.query.query;

  try {
    const conceptNameEncoded = encodeURIComponent(query);
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${conceptNameEncoded}&utf8=&format=json`;
    const response = await axios.get(url);
    const searchResults = response.data.query.search;
    // Add the Wikipedia URL to each search result
    const resultsWithUrls = searchResults.map((result) => {
      const titleEncoded = encodeURIComponent(result.title);
      return {
        ...result,
        url: `https://en.wikipedia.org/wiki/${titleEncoded}`,
      };
    });
    return res.status(200).send({ searchResults: resultsWithUrls });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const getUser = async (req, res) => {
  const userid = req.params.userId;

  try {
    const records = await neo4j.getUserNode(userid);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
}
export const viewFullWikipediaArticle = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;

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
  req.locals = {
    user: foundUser,
    articleTitle: req.body.title,
    articleId: req.body.resourceId,
    articleDescription: req.body.abstract,
    material: foundMaterial,
    materialPage: req.body.materialPage,
  };

  next();
};
export const expandedArticleAbstract = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
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
  req.locals = {
    user: foundUser,
    articleTitle: req.body.title,
    articleId: req.body.resourceId,
    articleDescription: req.body.abstract,
    material: foundMaterial,
    materialPage: req.body.materialPage,
  };

  next();
};
export const collapsedArticleAbstract = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
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
  req.locals = {
    user: foundUser,
    articleTitle: req.body.title,
    articleId: req.body.resourceId,
    articleDescription: req.body.abstract,
    material: foundMaterial,
    materialPage: req.body.materialPage,
  };
  next();
};

export const rateArticle = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
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
  req.locals = {
    user: foundUser,
    articleId: req.body.resourceId,
    articleTitle: req.body.title,
    articleAbstract: req.body.description,
    concepts: req.body.concepts,
    material: foundMaterial,
    materialPage: req.body.materialPage,
  };

  next();

};

export const getSingleUser = async (req, res) => {
  const userid = req.params.userId;

  try {
    const records = await neo4j.getSingleUserNode(userid);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const getLevelOfEngagement = async (req, res) => {
  const userid = req.params.userId;

  try {
    const records = await neo4j.getLevelOfEngagement(userid);

    // Filter out courses where the user is a moderator
    // Moderators should not have engagement levels for their own courses
    const user = await User.findById(userid);
    const moderatorRole = await Role.findOne({ name: "moderator" });
    let filteredRecords = records;
    if (user && moderatorRole) {
      const moderatorCourseIds = new Set(
        user.courses
          .filter(c => String(c.role) === String(moderatorRole._id))
          .map(c => String(c.courseId))
      );
      if (moderatorCourseIds.size > 0) {
        filteredRecords = records.filter(record => {
          const courseId = record?.target?.properties?.cid;
          return !courseId || !moderatorCourseIds.has(String(courseId));
        });
        console.log(`[getLevelOfEngagement] Filtered out ${records.length - filteredRecords.length} moderator course(s) for user ${userid}`);
      }
    }

    return res.status(200).send({ records: filteredRecords });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const getDNUEngagement = async (req, res) => {
  const userid = req.params.userId;

  try {
    const records = await neo4j.getDNUEngagement(userid);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const updateConceptUDNU = async (req, res) => {
  const { source, target, type } = req.params;
  try {
    const records = await neo4j.changeRelationshipTypeUDNU(
      source,
      target,
      type
    );
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const getConceptSlide = async (req, res) => {
  const { materialId, conceptId } = req.params;
  try {
    const records = await neo4j.getConceptSlide(materialId, conceptId);
    return res.status(200).send({ slideNo: records.slideNo });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const getUserRelationships = async (req, res) => {
  const { userId } = req.params;
  try {
    const records = await neo4j.getUserRelationships(userId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const deleteRelationship = async (req, res) => {
  const { rid } = req.params;
  try {
    const records = await neo4j.deleteRelationship(rid);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const deleteHasConcept = async (req, res) => {
  const { courseId } = req.params;
  try {
    const records = await neo4j.deleteHasConcept(courseId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const renewConcept = async (req, res) => {
  const { conceptId } = req.params;
  try {
    const records = await neo4j.renewConcept(conceptId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const getRelationship = async (req, res) => {
  const { targetId } = req.params;
  try {
    const records = await neo4j.getRelationship(targetId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const getHasConcept = async (req, res) => {
  const { targetId } = req.params;
  try {
    const records = await neo4j.getHasConcept(targetId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const getRelatedTo = async (req, res) => {
  const { courseId } = req.params;
  try {
    const records = await neo4j.getRelatedTo(courseId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const getHasCategory = async (req, res) => {
  const { conceptId } = req.params;
  try {
    const records = await neo4j.getHasCategory(conceptId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const addCourseIdToMaterial = async (req, res) => {
  const { materialId } = req.params;
  try {
    const records = await neo4j.addCourseIdToMaterial(materialId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const createCourseHasConcepts = async (req, res) => {
  const { courseId } = req.params;
  try {
    const records = await neo4j.createCourseHasConcepts(courseId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};
/*
export const getUser = async (req, res) => {
  const userid = req.params.userId;
  console.log("===== getUser STARTED =====");
  console.log("Received userId:", userid);

  try {
    if (!(await isAuthorized(req))) {
      console.log("Authorization failed.");
      return res.status(403).send({ error: "Unauthorized" });
    }

    console.log("Calling getUserNode...");
    
    // Force call check
    const result = await neo4j.getUserNode(userid);
    
    console.log("getUserNode executed. Result:", result);

    if (!result || result.length === 0) {
      console.warn("No user found for:", userid);
      return res.status(404).send({ error: "User not found" });
    }

    return res.status(200).send({ result });
  } catch (err) {
    console.error("Error in getUser:", err);
    return res.status(500).send({ error: err.message });
  }
};*/

export const rateVideo = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
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

  req.locals = {
    user: foundUser,
    videoId: req.body.resourceId,
    videoTitle: req.body.title,
    videoDescription: req.body.description,
    concepts: req.body.concepts,
    material: foundMaterial,
    materialPage: req.body.materialPage,
  };
  next();
};
export const viewedAllMainConcepts = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
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

  req.locals = {
    user: foundUser,
    material: foundMaterial,
    courseId: req.body.courseId,
    materialId: req.body.materialId,
    materialName: req.body.materialName,
    materialPage: req.body.materialPage,
    materialURL: req.body.materialURL,
    newConcepts: req.body.newConcepts,
    nonUnderstoodConcepts: req.body.nonUnderstoodConcepts,
    slideId: req.body.slideId,
    understoodConcepts: req.body.understoodConcepts,
    mainConcepts: req.body.mainConcepts.nodes,
  };

  next();
};
export const viewedMoreConcepts = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
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

  req.locals = {
    user: foundUser,
    material: foundMaterial,
    materialPage: req.body.currentPage,
    mainConcepts: req.body.mainConcepts.nodes,
  };

  next();
};
export const viewedLessConcepts = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
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

  req.locals = {
    user: foundUser,
    material: foundMaterial,
    materialPage: req.body.currentPage,
    mainConcepts: req.body.mainConcepts.nodes,
  };

  next();
};
export const viewedConcept = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
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

  req.locals = {
    user: foundUser,
    material: foundMaterial,
    materialPage: req.body.currentPage,
    concept: req.body.concept,
  };

  next();
};
export const viewedConceptCourseKG = async (req, res, next) => {
  const userId = req.userId;
  const concept = req.body.concept;
  const courseId = req.body.courseId;
  let foundUser;
  let foundCourse;

  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }

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

  req.locals = {
    user: foundUser,
    course: foundCourse,
    concept: concept,
  };

  next();
};
export const viewedConceptMaterialKG = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
  const concept = req.body.concept;
  let foundUser;
  let foundMaterial;

  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }

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

  req.locals = {
    user: foundUser,
    material: foundMaterial,
    concept: concept,
  };

  next();
};
export const viewedExplanationConcept = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
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

  req.locals = {
    user: foundUser,
    material: foundMaterial,
    materialPage: req.body.currentPage,
    key: req.body.key,
    concept_id: req.body.node_id,
    concept_cid: req.body.node_cid,
    concept_name: req.body.node_name,
    concept_type: req.body.node_type,
    concept_abstract: req.body.node_abstract,
    concept_roads: req.body.node_roads,
    concept_reason: req.body.node_reason,
  };

  next();
};
export const viewedFullArticleRecommendedConcept = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
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

  req.locals = {
    user: foundUser,
    material: foundMaterial,
    materialPage: req.body.currentPage,
    concept_id: req.body.node_id,
    concept_cid: req.body.node_cid,
    concept_name: req.body.node_name,
    concept_type: req.body.node_type,
    concept_abstract: req.body.node_abstract,
  };

  next();
};
export const viewedFullArticleMainConcept = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
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

  req.locals = {
    user: foundUser,
    material: foundMaterial,
    materialPage: req.body.currentPage,
    concept_id: req.body.node_id,
    concept_cid: req.body.node_cid,
    concept_name: req.body.node_name,
    concept_type: req.body.node_type,
    concept_abstract: req.body.node_abstract,
    concept_wikipedia: req.body.node_wikipedia,
  };

  next();
};
export const viewedFullArticleMaterialKG = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
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

  req.locals = {
    user: foundUser,
    material: foundMaterial,
    concept_id: req.body.node_id,
    concept_cid: req.body.node_cid,
    concept_name: req.body.node_name,
    concept_type: req.body.node_type,
    concept_abstract: req.body.node_abstract,
    concept_wikipedia: req.body.node_wikipedia,
  };

  next();
};
export const viewedFullArticleCourseKG = async (req, res, next) => {
  const userId = req.userId;
  const courseId = req.body.courseId;
  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }
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

  req.locals = {
    user: foundUser,
    course: foundCourse,
    concept_id: req.body.node_id,
    concept_cid: req.body.node_cid,
    concept_name: req.body.node_name,
    concept_type: req.body.node_type,
    concept_abstract: req.body.node_abstract,
    concept_wikipedia: req.body.node_wikipedia,
  };

  next();
};

export const viewedAllRecommendedVideos = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
  const videos = req.body.videos;

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
  req.locals = {
    user: foundUser,
    material: foundMaterial,
    videos: videos,
    materialPage: req.body.materialPage,
  };

  next();
};

export const viewedAllRecommendedArticles = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
  const articles = req.body.articles;

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
  req.locals = {
    user: foundUser,
    material: foundMaterial,
    articles: articles,
    materialPage: req.body.materialPage,
  };

  next();
};
export const viewedAllRecommendedConcepts = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;

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
  req.locals = {
    user: foundUser,
    material: foundMaterial,
    courseId: req.body.courseId,
    materialId: req.body.materialId,
    materialName: req.body.materialName,
    materialPage: req.body.materialPage,
    materialURL: req.body.materialURL,
    newConcepts: req.body.newConcepts,
    nonUnderstoodConcepts: req.body.nonUnderstoodConcepts,
    slideId: req.body.slideId,
    understoodConcepts: req.body.understoodConcepts,
    recommendedConcepts: req.body.recommendedConcepts.nodes,
  };

  next();
};
export const markConceptAsNew = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
  let foundMaterial;
  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }

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
  req.locals = {
    user: foundUser,
    material: foundMaterial,
    concept: req.body.concept,
    materialPage: req.body.currentPdfPage,
  };

  next();
};
export const markConceptAsUnderstood = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
  let foundMaterial;
  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }

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
  req.locals = {
    user: foundUser,
    material: foundMaterial,
    concept: req.body.concept,
    materialPage: req.body.currentPdfPage,
  };
  next();
};
export const markConceptAsNotUnderstood = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
  let foundMaterial;
  let foundUser;
  try {
    foundUser = await findUserById(userId);
  } catch (err) {
    return handleError(res, err, "Error finding user");
  }

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
  req.locals = {
    user: foundUser,
    material: foundMaterial,
    concept: req.body.concept,
    materialPage: req.body.currentPdfPage,
  };

  next();
};
export const hidConceptsMaterialKG = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
  const key = req.body.key;

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

  req.locals = {
    user: foundUser,
    material: foundMaterial,
    key: key,
  };

  next();
};
export const unhidConceptsMaterialKG = async (req, res, next) => {
  const userId = req.userId;
  const materialId = req.body.materialId;
  const key = req.body.key;

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

  req.locals = {
    user: foundUser,
    material: foundMaterial,
    key: key,
  };

  next();
};




export const getUserPKG = async (req, res) => {
  const userId = req.params.userId;
  const topN = req.query.topN || null; // Optional: limit number of concepts
  
  // Advanced filters - parse from query string (JSON encoded)
  let slideFilter = null;
  if (req.query.slideIds) {
    try {
      slideFilter = JSON.parse(req.query.slideIds);
      if (!Array.isArray(slideFilter)) slideFilter = null;
    } catch (e) {
      console.warn('[Personal KG] Invalid slideIds filter:', e.message);
    }
  }

  try {
    // Get user from MongoDB with understood/not understood concepts and enrolled courses
    const foundUser = await User.findById(userId).populate({
      path: 'courses.courseId',
      select: 'name shortName _id'
    });
    
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist!`,
      });
    }

    // Filter out courses where the user is a moderator
    // Moderators should not have a course relationship in the PKG for courses they moderate
    const moderatorRole = await Role.findOne({ name: "moderator" });
    const nonModeratorCourses = foundUser.courses.filter(c => {
      if (!moderatorRole) return true;
      return String(c.role) !== String(moderatorRole._id);
    });

    // Get concept IDs from MongoDB and build status lookup map
    const understoodConcepts = foundUser.understoodConcepts || [];
    const didNotUnderstandConcepts = foundUser.didNotUnderstandConcepts || [];
    
    // Build a map for O(1) lookup of concept status
    const conceptStatusMap = new Map();
    understoodConcepts.forEach(cid => conceptStatusMap.set(cid, 'u'));
    didNotUnderstandConcepts.forEach(cid => conceptStatusMap.set(cid, 'dnu'));
    
    const allConceptIds = [...conceptStatusMap.keys()];

    console.log(`[Personal KG] Loading graph: ${allConceptIds.length} concepts (${understoodConcepts.length} understood, ${didNotUnderstandConcepts.length} not understood)${slideFilter ? `, filtering by ${slideFilter.length} slides` : ''}`);    console.log(`[Personal KG] Excluded ${foundUser.courses.length - nonModeratorCourses.length} moderator course(s) from PKG`);

    if (allConceptIds.length === 0) {
      return res.status(200).send({ 
        records: [],
        courses: nonModeratorCourses.map(c => ({
          courseId: c.courseId._id,
          courseName: c.courseId.name,
          courseShortName: c.courseId.shortName
        })),
        materials: []
      });
    }

    // Get concept details with relationships from Neo4j (with optional limit and slide filter)
    const records = await neo4j.getUserConceptsWithRelationships(allConceptIds, topN, slideFilter);

    // Get unique material IDs from concepts
    const materialIds = [...new Set(records.map(r => r.mid).filter(Boolean))];

    // Fetch material details from MongoDB
    const materials = await Material.find({ _id: { $in: materialIds } })
      .select('_id name type courseId channelId')
      .populate('courseId', 'name shortName');

    // Create material lookup map
    const materialMap = {};
    materials.forEach(m => {
      materialMap[m._id.toString()] = {
        materialId: m._id,
        materialName: m.name,
        materialType: m.type,
        courseId: m.courseId._id,
        courseName: m.courseId.name,
        courseShortName: m.courseId.shortName,
        channelId: m.channelId
      };
    });

    // Enrich records with material/course info and understanding status
    const enrichedRecords = records.map(record => {
      const materialInfo = materialMap[record.mid] || {};
      
      return {
        ...record,
        ...materialInfo,
        relationshipType: conceptStatusMap.get(record.cid) || 'unknown'
      };
    });
    
    return res.status(200).send({ 
      records: enrichedRecords,
      courses: nonModeratorCourses.map(c => ({
        courseId: c.courseId._id,
        courseName: c.courseId.name,
        courseShortName: c.courseId.shortName
      })),
      materials: Object.values(materialMap)
    });
  } catch (err) {
    console.error('[Personal KG] Error loading user knowledge graph:', err.message);
    return res.status(500).send({ error: err.message });
  }
};

/**
 * Get related concepts for a specific concept (on-demand)
 * GET /api/knowledge-graph/get-related-concepts/:conceptCid
 */
export const getRelatedConcepts = async (req, res) => {
  const { conceptCid } = req.params;
  const userId = req.userId;

  try {
    // Get user's concept status from MongoDB
    const foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).send({ error: 'User not found' });
    }

    // Build concept status map
    const conceptStatusMap = new Map();
    (foundUser.understoodConcepts || []).forEach(cid => conceptStatusMap.set(cid, 'u'));
    (foundUser.didNotUnderstandConcepts || []).forEach(cid => conceptStatusMap.set(cid, 'dnu'));

    // Get related concepts from Neo4j
    const relatedConcepts = await neo4j.getRelatedConceptsForConcept(conceptCid);

    // Enrich with relationship type from MongoDB
    const enrichedConcepts = relatedConcepts.map(rc => ({
      ...rc,
      relationshipType: conceptStatusMap.get(rc.cid) || 'unknown'
    }));

    console.log(`[Personal KG] Fetched ${enrichedConcepts.length} related concepts for ${conceptCid}`);
    
    return res.status(200).send({ relatedConcepts: enrichedConcepts });
  } catch (err) {
    console.error('[Personal KG] Error fetching related concepts:', err.message);
    return res.status(500).send({ error: err.message });
  }
};

/**
 * Get user interest scores from PKG
 * Returns map of concept_id -> {score, updatedAt} for all concepts user is interested in
 * 
 * GET /api/knowledge-graph/user/:userId/interest-scores
 */
export const getUserInterestScores = async (req, res) => {
  const { userId } = req.params;
  const minScore = parseFloat(req.query.minScore) || 0.0;

  try {
    // Get interest scores from Neo4j
    const scoresMap = await neo4j.getUserInterestScores(userId, minScore);
    
    return res.status(200).send({
      userId,
      scores: scoresMap,
      totalConcepts: Object.keys(scoresMap).length
    });
  } catch (err) {
    console.error('[Interest Scores] Error fetching interest scores:', err.message);
    return res.status(500).send({ error: err.message });
  }
};

/**
 * Get interest concepts for Interest Level graph
 * Returns only INTERESTED_IN relationships with concept details
 * 
 * GET /api/pkg/:userId/interests
 */
export const getInterestConcepts = async (req, res) => {
  const { userId } = req.params;
  const topN = req.query.topN ? parseInt(req.query.topN, 10) : null;

  try {
    // Get concepts with INTERESTED_IN relationships from Neo4j
    const concepts = await neo4j.getInterestConcepts(userId, topN);
    
    console.log(`[Interest Concepts] Found ${concepts.length} interest concepts for user ${userId}`);
    
    // Check for duplicates
    const conceptIds = concepts.map(c => c.conceptId);
    const uniqueIds = new Set(conceptIds);
    if (conceptIds.length !== uniqueIds.size) {
      console.warn('[Interest Concepts] WARNING: Duplicates detected in response!');
      const duplicates = conceptIds.filter((id, index) => conceptIds.indexOf(id) !== index);
      console.warn('[Interest Concepts] Duplicate IDs:', [...new Set(duplicates)]);
      
      // Log duplicate concepts
      duplicates.forEach(dupId => {
        const dups = concepts.filter(c => c.conceptId === dupId);
        console.warn(`[Interest Concepts] Concept ${dupId}:`, dups);
      });
    }
    
    return res.status(200).send({
      userId,
      concepts
    });
  } catch (err) {
    console.error('[Interest Concepts] Error fetching interest concepts:', err.message);
    return res.status(500).send({ error: err.message });
  }
};

/**
 * Update (manually adjust) interest score for a user-concept pair
 * Allows users to override calculated scores for better personalization
 * 
 * PUT /api/pkg/:userId/interests/:conceptId
 */
export const updateInterestScore = async (req, res) => {
  const { userId, conceptId } = req.params;
  const { score } = req.body;

  // Validate score
  if (typeof score !== 'number' || score < 0 || score > 1) {
    return res.status(400).send({ 
      error: 'Invalid score. Score must be a number between 0 and 1.' 
    });
  }

  try {
    // Update the interest score in Neo4j
    const result = await neo4j.updateInterestScore(userId, conceptId, score);
    
    console.log(`[Interest Score Update] User ${userId} adjusted score for concept ${conceptId} to ${score}`);
    
    return res.status(200).send({
      success: true,
      userId,
      conceptId,
      score,
      message: 'Interest score updated successfully',
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Interest Score Update] Error updating interest score:', err.message);
    return res.status(500).send({ error: err.message });
  }
};

/**
 * Get course hierarchy for advanced filters
 * Returns user's enrolled courses with their materials and slides
 * 
 * GET /api/knowledge-graph/course-hierarchy
 */
export const getCourseHierarchy = async (req, res) => {
  const userId = req.userId;

  try {
    // Get user with enrolled courses
    const foundUser = await User.findById(userId)
      .populate({
        path: 'courses.courseId',
        select: '_id name shortName'
      });

    if (!foundUser) {
      return res.status(404).send({ error: 'User not found' });
    }

    // Get all enrolled course IDs
    const enrolledCourseIds = foundUser.courses
      .filter(c => c.courseId)
      .map(c => c.courseId._id);

    // Get all materials for enrolled courses
    const materials = await Material.find({
      courseId: { $in: enrolledCourseIds }
    }).select('_id name type courseId');

    // Get slides from Neo4j for each material
    const materialsWithSlides = await Promise.all(
      materials.map(async (material) => {
        try {
          const slides = await neo4j.getMaterialSlides(material._id.toString());
          return {
            _id: material._id.toString(),
            name: material.name,
            type: material.type,
            courseId: material.courseId.toString(),
            slides: slides.map(s => ({
              sid: s.sid,
              cid: s.cid
            }))
          };
        } catch (err) {
          console.warn(`[Course Hierarchy] Failed to get slides for material ${material._id}:`, err.message);
          return {
            _id: material._id.toString(),
            name: material.name,
            type: material.type,
            courseId: material.courseId.toString(),
            slides: []
          };
        }
      })
    );

    // Build hierarchy
    const courses = foundUser.courses
      .filter(c => c.courseId)
      .map(c => ({
        _id: c.courseId._id.toString(),
        name: c.courseId.name,
        shortName: c.courseId.shortName,
        materials: materialsWithSlides.filter(m => m.courseId === c.courseId._id.toString())
      }));

    console.log(`[Course Hierarchy] Fetched ${courses.length} courses for user ${userId}`);
    
    return res.status(200).send({ courses });
  } catch (err) {
    console.error('[Course Hierarchy] Error:', err.message);
    return res.status(500).send({ error: err.message });
  }
};

/**
 * Get all PKG filter profiles for a user
 */
export const getPkgFilterProfiles = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('pkgAdvancedFilterProfiles');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`[PKG Filter Profiles] Fetched ${user.pkgAdvancedFilterProfiles?.length || 0} profiles for user ${userId}`);
    res.json({ profiles: user.pkgAdvancedFilterProfiles || [] });
  } catch (error) {
    console.error('[PKG Filter Profiles] Error getting profiles:', error);
    res.status(500).json({ error: 'Failed to get filter profiles' });
  }
};

/**
 * Create a new PKG filter profile
 */
export const createPkgFilterProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, slideIds } = req.body;
    
    if (!name || !slideIds || !Array.isArray(slideIds)) {
      return res.status(400).json({ error: 'Name and slideIds array are required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if profile name already exists
    const existingProfile = user.pkgAdvancedFilterProfiles.find(p => p.name === name);
    if (existingProfile) {
      return res.status(400).json({ error: 'Profile name already exists' });
    }
    
    // Add new profile
    const newProfile = {
      name,
      slideIds
    };
    
    user.pkgAdvancedFilterProfiles.push(newProfile);
    await user.save();
    
    // Get the created profile with its _id
    const createdProfile = user.pkgAdvancedFilterProfiles[user.pkgAdvancedFilterProfiles.length - 1];
    
    console.log(`[PKG Filter Profiles] Created profile "${name}" for user ${userId}`);
    res.status(201).json({ profile: createdProfile });
  } catch (error) {
    console.error('[PKG Filter Profiles] Error creating profile:', error);
    res.status(500).json({ error: 'Failed to create filter profile' });
  }
};

/**
 * Update an existing PKG filter profile
 */
export const updatePkgFilterProfile = async (req, res) => {
  try {
    const { userId, profileId } = req.params;
    const { name, slideIds } = req.body;
    
    if (!name || !slideIds || !Array.isArray(slideIds)) {
      return res.status(400).json({ error: 'Name and slideIds array are required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const profile = user.pkgAdvancedFilterProfiles.id(profileId);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Check if new name conflicts with another profile
    if (name !== profile.name) {
      const existingProfile = user.pkgAdvancedFilterProfiles.find(
        p => p.name === name && p._id.toString() !== profileId
      );
      if (existingProfile) {
        return res.status(400).json({ error: 'Profile name already exists' });
      }
    }
    
    // Update profile
    profile.name = name;
    profile.slideIds = slideIds;
    
    await user.save();
    
    console.log(`[PKG Filter Profiles] Updated profile "${name}" for user ${userId}`);
    res.json({ profile });
  } catch (error) {
    console.error('[PKG Filter Profiles] Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update filter profile' });
  }
};

/**
 * Delete a PKG filter profile
 */
export const deletePkgFilterProfile = async (req, res) => {
  try {
    const { userId, profileId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const profile = user.pkgAdvancedFilterProfiles.id(profileId);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const profileName = profile.name;
    
    // Remove profile
    profile.remove();
    await user.save();
    
    console.log(`[PKG Filter Profiles] Deleted profile "${profileName}" for user ${userId}`);
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('[PKG Filter Profiles] Error deleting profile:', error);
    res.status(500).json({ error: 'Failed to delete filter profile' });
  }
};
