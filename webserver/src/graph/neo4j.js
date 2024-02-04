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

export async function checkMaterial(materialId) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    'MATCH (m:LearningMaterial) WHERE m.mid = $mid RETURN m',
    { mid: materialId }
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
