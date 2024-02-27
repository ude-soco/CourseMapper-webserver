const neo4j = require('neo4j-driver');

const graphDb = {};

export async function connect(url, user, password) {
  try {
    graphDb.driver = neo4j.driver(url, neo4j.auth.basic(user, password), { disableLosslessIntegers: true });
    await graphDb.driver.verifyConnectivity();
    console.log(`Connected to Neo4j`);
  } catch (error) {
    console.error('Failed to connect to Neo4j', error);
  }
}

function recordsToObjects(records) {
  return records.map((record) => {
    const obj = {};
    record.keys.forEach((key, i) => {
      obj[key] = record.get(i);
    });
    return obj;
  });
}

export async function checkSlide(slideId) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    'MATCH(s:Slide) WHERE s.sid = $sid RETURN s',
    { sid: slideId }
  );
  return recordsToObjects(records);
}

export async function getSlide(slideId) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    'MATCH p=(s: Slide)-[r]->(c: Concept) WHERE s.sid = $sid RETURN LABELS(c) as labels,ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract',
    { sid: slideId }
  );
  return recordsToObjects(records);
}

export async function readSlide(userId, slideId) {
  // Create user node if not exists
  await graphDb.driver.executeQuery(
    'MERGE (u:User {uid: $uid, type: "user", embedding: ""}) RETURN u',
    { uid: userId }
  );

  // Create user HAS_READ slide relationship
  await graphDb.driver.executeQuery(
    `MATCH (u:User) WHERE u.uid = $uid
    OPTIONAL MATCH(s:Slide) WHERE s.sid = $sid
    MERGE (u)-[r:HAS_READ]->(s)`,
    { uid: userId, sid: slideId }
  );
}

export async function checkMaterial(materialId) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    'MATCH (m:LearningMaterial) WHERE m.mid = $mid RETURN m',
    { mid: materialId }
  );
  return recordsToObjects(records);
}

export async function checkMaterials(materialIds) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    'MATCH (m:LearningMaterial) WHERE m.mid IN $mids RETURN m',
    { mids: materialIds }
  );
  return recordsToObjects(records);
}

export async function getMaterial(materialId) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    'MATCH (c:Concept) WHERE c.mid = $mid RETURN LABELS(c) as labels,ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract, c.rank as rank',
    { mid: materialId }
  );
  return recordsToObjects(records);
}

export function deleteMaterial(materialId) {
  const { records, summary, keys } = graphDb.driver.executeQuery(
    'MATCH (m:LearningMaterial) WHERE m.mid = $mid DETACH DELETE m',
    { mid: materialId }
  );
  return recordsToObjects(records);
}

export async function getMaterialEdges(materialId) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    "MATCH p=(a)-[r]->(b) WHERE TYPE(r) <> 'CONTAINS' AND a.mid = $mid AND b.mid = $mid RETURN TYPE(r) as type, ID(a) as source, ID(b) as target, r.weight as weight",
    { mid: materialId }
  );
  return recordsToObjects(records);
}

export async function getMaterialConceptIds(materialId) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    'MATCH (c:Concept) WHERE c.mid = $mid RETURN c.cid AS id, c.name as name',
    { mid: materialId }
  );
  return recordsToObjects(records);
}

export async function getHigherLevelsNodes(materialIds) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    `MATCH (c:Concept) WHERE (c.mid IN $mids) and c.rank<51 and c.type="main_concept" RETURN LABELS(c) as labels,ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract, c.rank as rank, c.mid as mid`,
    { mids: materialIds }
  );
  return recordsToObjects(records);
}

export async function getHigherLevelsEdges(materialIds) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    `MATCH p=(a)-[r]->(b) WHERE TYPE(r) <> "CONTAINS" and a.mid = b.mid AND a.min IN $mids and a.rank<51 and b.rank<51 RETURN TYPE(r) as type, ID(a) as source, ID(b) as target, r.weight as weight`,
    { mids: materialIds }
  );
  return recordsToObjects(records);
}

export async function setRating(resourceId, concepts, userId, rating) {
  const session = graphDb.driver.session();
  try {
    const result = await session.executeWrite(async tx => {
      const rTypesRes = await tx.run(
        `MATCH p=(a:User)-[r:HELPFUL|NOT_HELPFUL]->(b:Resource)
        WHERE a.uid = $uid
        AND b.rid = $rid
        WITH r, type(r) AS r_type
        DELETE r
        RETURN r_type`,
        { uid: userId, rid: resourceId }
      );
      const rTypes = rTypesRes.records.map(record => record.get('r_type'));

      if (!rTypes.includes(rating) && ['HELPFUL', 'NOT_HELPFUL'].includes(rating)) {
        await tx.run(
          `MATCH (u:User) WHERE u.uid = $uid
          OPTIONAL MATCH(b:Resource) WHERE b.rid = $rid
          MERGE (u)-[r: ${rating} {concepts: $concepts}]->(b)
          RETURN r`,
          { uid: userId, rid: resourceId, concepts }
        );
      }

      const result = await tx.run(
        `MATCH (b1:Resource) WHERE b1.rid = $rid
        OPTIONAL MATCH ()-[r_helpful:HELPFUL]->(b2:Resource) WHERE b2.rid = $rid
        OPTIONAL MATCH ()-[r_not_helpful:NOT_HELPFUL]->(b3:Resource) WHERE b3.rid = $rid
        WITH b1, count(r_helpful) AS helpful_count, count(r_not_helpful) AS not_helpful_count
        SET b1.helpful_count = helpful_count
        SET b1.not_helpful_count = not_helpful_count
        RETURN helpful_count, not_helpful_count`,
        { rid: resourceId }
      );

      if (result.records.length === 0) {
        throw new Error('Resource not found');
      }

      return {
        helpful_count: result.records[0].get('helpful_count'),
        not_helpful_count: result.records[0].get('not_helpful_count'),
        voted: rTypes.includes(rating) ? null : rating
      };
    });
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await session.close();
  }
}
