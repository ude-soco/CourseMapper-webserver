const fs = require('fs').promises;
const process = require('process');
const socketio = require("../socketio");
const db = require("../models");
const User = db.user;
const Role = db.role;
const Material = db.material;

const neo4j = require("../graph/neo4j");
const redis = require("../graph/redis");
// TODO Issue #640: Use better file names

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

export const deleteMaterial = async (req, res, next) => {
  const materialId = req.params.materialId;

  try {
    await neo4j.deleteMaterial(materialId);
    return next();
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

async function checkIsModerator(userId, courseId) {
  const user = await User.findById(userId);
  const role = await Role.findById(user.role);
  if (role.name === "moderator" || role.name === "admin") {
    return true
  }
  const course = user.courses.find(
    (item) => item.courseId.valueOf() === courseId
  );
  const courseRole = await Role.findOne({ _id: course.role });
  if (courseRole.name === "moderator") {
    return true
  }
}

export const conceptMap = async (req, res) => {
  socketio.getIO().emit(req.userId,   {called:"conceptmap started" } );
  const modelName = req.body.modelName;
  const materialId = req.params.materialId;
  const courseId = req.params.courseId;

  const isModerator = await checkIsModerator(req.userId, courseId);

  const material = await Material.findById(materialId);
  if (!material) {
    return res.status(404).send({ error: "Material not found" });
  }
  const materialName = material.name;

  if (isModerator) {
    const materialPath = process.cwd() + material.url + material._id + '.pdf';
    const materialData = await fs.readFile(materialPath);

    
    const result = await redis.addJob('concept-map', {
        modelName,
        materialId,
        materialName,
      }, async (jobId) => {
        await redis.addFile(jobId, materialData);
      }, (result) => {
        console.log("...result",result)
        socketio.getIO().emit(req.userId,  { result:result } );
 
        if (res.headersSent) {
          return;
        }
        if (result.error) {
          return res.status(500).send({ error: result });
        }
        console.log("result succ",result.result)

        return res.status(200).send(result.result);
      });
      console.log("...result concept",result)
      socketio
      .getIO().emit(req.userId,  { addJob:result, pipeline:'concept-map'});
    // } catch (error) {
    //   console.log("error",error)
    //   socketio
    //   .getIO().emit(req.userId,  { error } );
    // }
 
  } else {
    await redis.trackJob('concept-map', {
      modelName,
      materialId,
      materialName,
    }, (result) => {
      if (res.headersSent) {
        return;
      }
      if (!result) {
        return res.status(404).send();
      }
      return res.status(200).send(result.result);
    });
  }
}

export const getConcepts = async (req, res) => {
  socketio.getIO().emit(req.userId,   {called:"concept recommendation started" } );
  const materialId = req.params.materialId;
  const userId = req.userId;
  const understood = req.body.understoodConcepts;
  const nonUnderstood = req.body.nonUnderstoodConcepts;
  const newConcepts = req.body.newConcepts;

  const result= await redis.addJob('concept-recommendation', {
    materialId,
    userId,
    understood,
    nonUnderstood,
    newConcepts
  }, undefined, (result) => {
    socketio.getIO().emit(req.userId,  { result:result } );
    if (res.headersSent) {
      return;
    }
    if (result.error) {
      return res.status(500).send({ error: result.error });
    }
    return res.status(200).send(result.result);
  });
  socketio
      .getIO().emit(req.userId,  { addJob:result, pipeline:'concept-recommendation'});
}

export const getResources = async (req, res) => {
  socketio.getIO().emit(req.userId,   {called:"recourse recommendation started" } );
  const materialId = req.params.materialId;
  const userId = req.userId;
  const slideId = req.body.slideId;
  const understood = req.body.understoodConcepts;
  const nonUnderstood = req.body.nonUnderstoodConcepts;
  const newConcepts = req.body.newConcepts;

 const result= await redis.addJob('resource-recommendation', {
    materialId,
    userId,
    slideId,
    understood,
    nonUnderstood,
    newConcepts
  }, undefined, (result) => {
    socketio.getIO().emit(req.userId,  { result:result } );
    if (res.headersSent) {
      return;
    }
    if (result.error) {
      return res.status(500).send({ error: result.error });
    }
    return res.status(200).send(result.result);
  });
  socketio
      .getIO().emit(req.userId,  { addJob:result, pipeline:'resourse-recommendation'});
}

export const readSlide = async (req, res, next) => {
  const slideNr = req.params.slideNr;
  const slideId = `${req.params.materialId}_slide_${slideNr}`;

  try {
    await neo4j.readSlide(req.locals.user.id, slideId);
    next();
  } catch (err) {
    next();
  }
};
