const neo4j = require("../graph/neo4j");

export const checkSlide = async (req, res, next) => {
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

  try {
    const records = await neo4j.getSlide(slideId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const checkMaterial = async (req, res, next) => {
  const materialId = req.params.materialId;

  try {
    const records = await neo4j.checkMaterial(materialId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
}

export const getMaterial = async (req, res, next) => {
  const materialId = req.params.materialId;

  try {
    const records = await neo4j.getMaterial(materialId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
}

export const deleteMaterial = async (req, res, next) => {
  const materialId = req.params.materialId;

  try {
    const records = await neo4j.deleteMaterial(materialId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
}

export const getMaterialEdges = async (req, res, next) => {
  const materialId = req.params.materialId;

  try {
    const records = await neo4j.getMaterialEdges(materialId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
}

export const getMaterialConceptIds = async (req, res, next) => {
  const materialId = req.params.materialId;

  try {
    const records = await neo4j.getMaterialConceptIds(materialId);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
}

export const getHigherLevelsNodes = async (req, res, next) => {
  const materialIds = req.query.material_ids;

  try {
    const records = await neo4j.getHigherLevelsNodes(materialIds);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
}

export const getHigherLevelsEdges = async (req, res, next) => {
  const materialIds = req.query.material_ids;

  try {
    const records = await neo4j.getHigherLevelsEdges(materialIds);
    return res.status(200).send({ records });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
}
