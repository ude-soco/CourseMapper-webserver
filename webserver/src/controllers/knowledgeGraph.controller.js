const fs = require("fs").promises;
const process = require("process");
const axios = require("axios");
const socketio = require("../socketio");
const db = require("../models");
const User = db.user;
const Role = db.role;
const Material = db.material;

const neo4j = require("../graph/neo4j");
const redis = require("../graph/redis");
// TODO Issue #640: Use better file names

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

export const getSlide = async (req, res) => {
  const slideId = req.params.slideId;

  try {
    const records = await neo4j.getSlide(slideId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
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

export const getMaterial = async (req, res) => {
  const materialId = req.params.materialId;

  try {
    if (!(await isAuthorized(req))) {
      return res.status(403).send({ error: "Unauthorized" });
    }
    const records = await neo4j.getMaterial(materialId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
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

export const getHigherLevelsNodesAndEdges = async (req, res) => {
  let materialIds = req.query.material_ids;
  if (materialIds.constructor !== Array) {
    materialIds = [materialIds];
  }

  try {
    const materials = await neo4j.checkMaterials(materialIds);
    if (materials.length === 0) {
      return res.status(404).send();
    }

    const records = await neo4j.getHigherLevelsNodesAndEdges(materialIds);
    return res.status(200).send(records);
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
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
  const { userId, courseId } = req.params; // Extract parameters from the URL

  try {
    const result = await neo4j.createUserCourseRelationship(
      userId,
      courseId,
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

  await redis.addJob(
    "modify-graph",
    {
      action: "add-concept",
      materialId,
      conceptName,
      slides,
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
    return res.status(200).send({ records });
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

export const getRelatedTo = async (req, res) => {
  const { courseId } = req.params;
  try {
    const records = await neo4j.getRelatedTo(courseId);
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
