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
    const result = await neo4j.createUserCourseRelationship(userId, courseId, courseName, 'low');
    return res.status(200).send({ success: true, data: result });
  } catch (err) {
    console.error("Failed to create user-course relationship:", err);
    return res.status(500).send({ success: false, error: err.message });
  }
};



export const deleteCourseNeo4j = async (req, res) => {
  const { userId, courseId } = req.params; // Extract parameters from the URL

  if (!userId || !courseId) {
    return res.status(400).send({ success: false, error: "userId and courseId are required" });
  }

  try {
    const result = await neo4j.deleteUserCourseRelationship(userId, courseId);
    return res.status(200).send({ success: true, message: "Relationship deleted successfully", data: result });
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
  socketio
    .getIO()
    .to("material:" + materialId)
    .emit("log", { addJob: result, pipeline: "concept-recommendation" });
};

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
     const resultsWithUrls = searchResults.map(result => {
      const titleEncoded = encodeURIComponent(result.title);
      return {
        ...result,
        url: `https://en.wikipedia.org/wiki/${titleEncoded}`
      };
    });
    return res.status(200).send({ searchResults: resultsWithUrls });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

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
