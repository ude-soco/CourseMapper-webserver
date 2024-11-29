const neo4j = require("../graph/recommendation.neo4j");
const redis = require("../graph/redis");
const socketio = require("../socketio");


export const SaveOrRemveUserResources = async (req, res, next) => {
    const data = req.body;
    try {
      const result = await neo4j.userSavesOrRemovesResource(data);
      return res.status(200).send(result);
    } catch (err) {
      console.error('Error saving or removing resource:', err);
      return res.status(500).send({ error: err.message });
    }
}

export const ratingResource = async (req, res, next) => {
    const data = req.body;
    try {
      const result = await neo4j.userRatesResource(data);
      return res.status(200).send(result);
    } catch (err) {
      console.error('Error in userRatesResource:', err);
      return res.status(500).send({ error: err.message });
    }
}


// recs user_resources

export const filterUserResourcesSavedBy = async (req, res, next) => {
    const data = req.body;
    try {
      const result = await neo4j.filterUserResourcesSavedBy(data);
      return res.status(200).send(result);
    } catch (err) {
      console.error('Error filtering resources:', err);
      return res.status(500).send({ error: err.message });
    }
}
  
export const getRidsFromUserResourcesSaved = async (req, res, next) => {
    const userId = req.query.user_id;
    try {
        const result = await neo4j.getRidsFromUserResourcesSaved(userId);
        return res.status(200).send(result);
    } catch (err) {
        console.error('Error retrieving data:', err);
        return res.status(500).send({ error: err.message });
    }
}
  

// recs helper_service

export async function updateConceptModifiedNode(result, userId = null) {
    let resultFinal = [];
    if (result && result.length > 0) {
        let conceptsModified = [];
        if (userId) {
            conceptsModified = await neo4j.getConceptsModifiedByUserId(userId);
        }

        result.forEach(node => {
            node.status = false;

            // Update concept weight modified by the user
            conceptsModified.forEach(conceptModified => {
                if (node.cid === conceptModified.cid) {
                    node.weight = conceptModified.weight;
                }
            });

            resultFinal.push(node);
        });

        // Sort result by the 'name' property
        resultFinal.sort((a, b) => a.name.localeCompare(b.name));
    }
    return resultFinal;
}


export const getConceptsByCids = async (req, res, next) => {
    const userId = req.query.user_id;
    let cids = req.query.cids;
    if ((userId && userId.length > 0) && (cids && cids.length > 0)) {
        cids = String(cids).split(",");
        try {
            const result = await neo4j.getConceptsByCids(userId, cids);
            return res.status(200).send({ "records": result });
        } catch (err) {
            console.error('Error retrieving data:', err);
            return res.status(500).send({ error: err.message });
        }
    } else {
        return res.status(200).send({ "records": [] });
    }
}

export const getConceptsModifiedByUserId = async (req, res, next) => {
    const userId = req.query.user_id;
    try {
        const result = await neo4j.getConceptsModifiedByUserId(userId);
        return res.status(200).send(result);
    } catch (err) {
        console.error('Error retrieving data:', err);
        return res.status(500).send({ error: err.message });
    }
}

export const getConceptsModifiedByUserIdAndMid = async (req, res, next) => {
    const mid = req.query.mid;
    const userId = req.query.user_id;
    try {
        let result = await neo4j.getConceptsModifiedByMid(mid);
        result = await updateConceptModifiedNode(result, userId);
        return res.status(200).send({ "records": result });
    } catch (err) {
        console.error('Error retrieving data:', err);
        return res.status(500).send({ error: err.message });
    }
}

export const getConceptsModifiedByUserIdAndSlideId = async (req, res, next) => {
    const slideId = req.query.slide_id;
    const userId = req.query.user_id;
    try {
        let result = await neo4j.getConceptsModifiedBySlideId(slideId);
        result = await updateConceptModifiedNode(result, userId);
        return res.status(200).send({ "records": result });
    } catch (err) {
        console.error('Error retrieving data:', err);
        return res.status(500).send({ error: err.message });
    }
}

export const getConceptsModifiedByUserFromSaves = async (req, res, next) => {
    const userId = req.query.user_id;
    try {
        const result = await neo4j.getConceptsModifiedByUserFromSaves(userId);
        return res.status(200).send({ "records": result });
    } catch (err) {
        console.error('Error retrieving data:', err);
        return res.status(500).send({ error: err.message });
    }
}



// set jobs

export const getConcepts = async (req, res) => {
    const body = req.body;
    await redis.addJob("recs_get_concepts", {"data": body}, undefined, (result) => {
        // socketio.getIO().to("recs :").emit("log", result );
        if (res.headersSent) {
        return;
        }
        if (result.error) {
        return res.status(500).send({ error: result.error });
        }
        return res.status(200).send(result.result);
    });
    // socketio.getIO().to("recs :").emit("log", { addJob:result, pipeline:'recs_get_concepts'});
}

export const getResources = async (req, res) => {
    const body = req.body;
    await redis.addJob("recs_get_resources", {"data": body}, undefined, (result) => {
        if (res.headersSent) {
        return;
        }
        if (result.error) {
        return res.status(500).send({ error: result.error });
        }
        return res.status(200).send(result.result);
    });
}

export const getResourcesByMainConcepts = async (req, res) => {
    const mid = req.query.mid;
    await redis.addJob("get_resources_by_main_concepts", {"mid": mid}, undefined, (result) => {
        if (res.headersSent) {
        return;
        }
        if (result.error) {
        return res.status(500).send({ error: result.error });
        }
        return res.status(200).send(result.result);
    });
}

