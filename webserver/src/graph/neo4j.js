const neo4j = require("neo4j-driver");

const graphDb = {};

export async function connect(url, user, password) {
  try {
    graphDb.driver = neo4j.driver(url, neo4j.auth.basic(user, password), {
      disableLosslessIntegers: true,
    });
    await graphDb.driver.verifyConnectivity();
    console.log(`Connected to Neo4j`);
  } catch (error) {
    console.error("Failed to connect to Neo4j", error);
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
    "MATCH(s:Slide) WHERE s.sid = $sid RETURN s",
    { sid: slideId }
  );
  return recordsToObjects(records);
}

export async function getSlide(slideId) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    "MATCH p=(s: Slide)-[r]->(c: Concept) WHERE s.sid = $sid RETURN LABELS(c) as labels,ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract",
    { sid: slideId }
  );
  return recordsToObjects(records);
}

export async function readSlide(userId, slideId) {
  // Create user node if not exists
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    "MATCH (u:User) WHERE u.uid = $uid RETURN u",
    { uid: userId }
  );
  if (records.length === 0) {
    await graphDb.driver.executeQuery(
      'MERGE (u:User {uid: $uid, type: "user", embedding: ""}) RETURN u',
      { uid: userId }
    );
  }

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
    "MATCH (m:LearningMaterial) WHERE m.mid = $mid RETURN m",
    { mid: materialId }
  );
  return recordsToObjects(records);
}

export async function checkMaterials(materialIds) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    "MATCH (m:LearningMaterial) WHERE m.mid IN $mids RETURN m",
    { mids: materialIds }
  );
  return recordsToObjects(records);
}

// export async function getMaterial(materialId) {
//   const { records, summary, keys } = await graphDb.driver.executeQuery(
//     'MATCH (c:Concept) WHERE c.mid = $mid RETURN LABELS(c) as labels,ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract, c.rank as rank, c.isNew as isNew, c.isEditing as isEditing', 'c.lastEdited as lastEdited',
//     { mid: materialId }
//   );
//   return recordsToObjects(records);
// }
export async function getMaterial(materialId) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    `MATCH (c:Concept) 
     WHERE c.mid = $mid 
     RETURN LABELS(c) as labels, 
            ID(c) as id, 
            c.cid as cid, 
            c.name as name, 
            c.uri as uri, 
            c.type as type, 
            c.weight as weight, 
            c.wikipedia as wikipedia, 
            c.abstract as abstract, 
            c.rank as rank, 
            c.isNew as isNew, 
            c.isEditing as isEditing,
            c.lastEdited as lastEdited`,
    { mid: materialId }
  );
  return recordsToObjects(records);
}


export async function getMaterialSlides(materialId) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    "MATCH (c:Slide) WHERE c.mid = $mid RETURN LABELS(c) as labels,ID(c) AS id, c.cid as cid, c.sid as sid",
    { mid: materialId }
  );
  return recordsToObjects(records);
}

export async function deleteMaterial(materialId) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    "MATCH (m:LearningMaterial) WHERE m.mid = $mid DETACH DELETE m",
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
  const query = `
    MATCH (c:Concept)
    WHERE c.mid = $mid
    FOREACH(ignoreMe IN CASE WHEN c.isEditing IS NULL THEN [1] ELSE [] END |
      SET c.isEditing = false
    )
    FOREACH(ignoreMe IN CASE WHEN c.lastEdited IS NULL THEN [1] ELSE [] END |
      SET c.lastEdited = false
    )
      FOREACH(ignoreMe IN CASE WHEN c.isNew IS NULL THEN [1] ELSE [] END |
      SET c.isNew = false
    )
    RETURN c.cid AS id, c.name AS name, c.isNew AS isNew, c.isEditing AS isEditing, c.lastEdited AS lastEdited, c.type as type
  `;
  const { records, summary, keys } = await graphDb.driver.executeQuery(query, { mid: materialId });
  return recordsToObjects(records);
}

export async function getHigherLevelsNodesAndEdges(materialIds) {
  const { records } = await graphDb.driver.executeQuery(
    `MATCH (c:Concept) WHERE (c.mid IN $mids) and c.type="main_concept" RETURN LABELS(c) as labels,ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract, c.rank as rank, c.isNew as isNew,c.isEditing as isEditing, c.lastEdited as lastEdited, c.mid as mid order by c.weight limit 50`,
    { mids: materialIds }
  );
  const nodes = recordsToObjects(records);

  const nodeIds = nodes.map((node) => node.id);
  const { records: records2 } = await graphDb.driver.executeQuery(
    `MATCH p=(a)-[r]->(b) WHERE TYPE(r) <> "CONTAINS" and a.mid = b.mid AND a.mid IN $mids AND a.id IN $nids AND b.id IN $nids RETURN TYPE(r) as type, ID(a) as source, ID(b) as target, r.weight as weight`,
    { mids: materialIds, nids: nodeIds }
  );
  const edges = recordsToObjects(records2);

  return { nodes, edges };
}

export async function setRating(resourceId, concepts, userId, rating) {
  const session = graphDb.driver.session();
  try {
    const result = await session.executeWrite(async (tx) => {
      const rTypesRes = await tx.run(
        `MATCH p=(a:User)-[r:HELPFUL|NOT_HELPFUL]->(b:Resource)
        WHERE a.uid = $uid
        AND b.rid = $rid
        WITH r, type(r) AS r_type
        DELETE r
        RETURN r_type`,
        { uid: userId, rid: resourceId }
      );
      const rTypes = rTypesRes.records.map((record) => record.get("r_type"));

      if (
        !rTypes.includes(rating) &&
        ["HELPFUL", "NOT_HELPFUL"].includes(rating)
      ) {
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
        throw new Error("Resource not found");
      }

      return {
        helpful_count: result.records[0].get("helpful_count"),
        not_helpful_count: result.records[0].get("not_helpful_count"),
        voted: rTypes.includes(rating) ? null : rating,
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


export async function createUserCourseRelationship(userId, courseId,courseName, engagementLevel) {
  const session = graphDb.driver.session();
  try {
    const result = await session.executeWrite(async (tx) => {
      const response = await tx.run(
        `
        MERGE (u:User {uid: $userId, type: 'user'})
        MERGE (c:Course {cid: $courseId, name: $courseName})
        MERGE (u)-[loe:ENGAGED_IN]->(c)
        ON CREATE SET loe.level = $engagementLevel, loe.status = 'enrolled', loe.timestamp = timestamp()
        ON MATCH SET loe.level = $engagementLevel, loe.status = 'enrolled', loe.timestamp = timestamp()
        RETURN u, c, loe
        `,
        { userId, courseId,courseName, engagementLevel }
      );
      return recordsToObjects(response.records);
    });
    return result;
  } catch (error) {
    console.error("Error creating or updating user-course relationship:", error);
    throw error;
  } finally {
    await session.close();
  }
}


export async function deleteUserCourseRelationship(userId, courseId) {
  const session = graphDb.driver.session();
  try {
    const result = await session.executeWrite(async (tx) => {
      const response = await tx.run(
        `
        MATCH (u:User {uid: $userId})-[loe:ENGAGED_IN]->(c:Course {cid: $courseId})
        DELETE loe
        RETURN u, c
        `,
        { userId, courseId }
      );
      return recordsToObjects(response.records);
    });
    return result;
  } catch (error) {
    console.error("Error removing user-course relationship:", error);
    throw error;
  } finally {
    await session.close();
  }
}





/*
  export async function createCourseMaterialRelationship(courseId, materialId, materialName) {
    const session = graphDb.driver.session();
    try {
      const result = await session.executeWrite(async (tx) => {
        const response = await tx.run(
          `
          MERGE (course:Course {cid: $courseId})
          MERGE (material:LearningMaterial {mid: $materialId})
          ON CREATE SET material.name = $materialName
          ON MATCH SET material.name = COALESCE(material.name, $materialName)
          MERGE (course)-[r:HAS_MATERIAL]->(material)
          RETURN course, material, r
          `,
          { courseId, materialId, materialName }
        );
        return recordsToObjects(response.records);
      });
      return result;
    } catch (error) {
      console.error("Error creating course-material relationship:", error);
      throw error;
    } finally {
      await session.close();
    }
  }
*/



