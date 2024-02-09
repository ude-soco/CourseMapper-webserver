const fs = require('fs').promises;
const process = require('process');

const neo4j = require("../graph/neo4j");
const redis = require("../graph/redis");
// TODO Issue #640: Use better file names

const db = require("../models");
const Material = db.material;

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
    const records = await neo4j.checkMaterial(materialId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
}

export const getMaterial = async (req, res) => {
  const materialId = req.params.materialId;

  try {
    const records = await neo4j.getMaterial(materialId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
}

export const deleteMaterial = async (req, res) => {
  const materialId = req.params.materialId;

  try {
    const records = await neo4j.deleteMaterial(materialId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
}

export const getMaterialEdges = async (req, res) => {
  const materialId = req.params.materialId;

  try {
    const records = await neo4j.getMaterialEdges(materialId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
}

export const getMaterialConceptIds = async (req, res) => {
  const materialId = req.params.materialId;

  try {
    const records = await neo4j.getMaterialConceptIds(materialId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
}

export const getHigherLevelsNodes = async (req, res) => {
  const materialIds = req.query.material_ids;

  try {
    const records = await neo4j.getHigherLevelsNodes(materialIds);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
}

export const getHigherLevelsEdges = async (req, res) => {
  const materialIds = req.query.material_ids;

  try {
    const records = await neo4j.getHigherLevelsEdges(materialIds);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
}

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
}

export const conceptMap = async (req, res) => {
  const modelName = req.body.modelName;
  const materialId = req.params.materialId;

  const material = await Material.findById(materialId);
  if (!material) {
    return res.status(404).send({ error: "Material not found" });
  }
  const materialName = material.name;
  const materialPath = process.cwd() + material.url + material._id + '.pdf';
  const materialData = await fs.readFile(materialPath);
  await redis.addFile(materialId, materialData);

  await redis.addJob('concept-map', {
    modelName,
    materialId,
    materialName,
  }, (result) => {
    if (result.error) {
      return res.status(500).send({ error: result.error });
    }
    return res.status(200).send(result.result);
  });
}

export const getConcepts = async (req, res) => {
  const materialId = req.params.materialId;
  const userId = req.userId;
  const understood = req.body.understoodConcepts;
  const nonUnderstood = req.body.nonUnderstoodConcepts;
  const newConcepts = req.body.newConcepts;

  await redis.addJob('concept-recommendation', {
    materialId,
    userId,
    understood,
    nonUnderstood,
    newConcepts
  }, (result) => {
    if (result.error) {
      return res.status(500).send({ error: result.error });
    }
    return res.status(200).send(result.result);
  });
}

export const getResources = async (req, res) => {
  const materialId = req.params.materialId;
  const userId = req.userId;
  const slideId = req.body.slideId;
  const understood = req.body.understoodConcepts;
  const nonUnderstood = req.body.nonUnderstoodConcepts;
  const newConcepts = req.body.newConcepts;

  await redis.addJob('resource-recommendation', {
    materialId,
    userId,
    slideId,
    understood,
    nonUnderstood,
    newConcepts
  }, (result) => {
    if (result.error) {
      return res.status(500).send({ error: result.error });
    }
    return res.status(200).send(result.result);
  });
}
