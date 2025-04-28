const neo4j = require("neo4j-driver");
const db = require("../models");
const Course = db.course;
const Material = db.material;

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
    "MATCH p=(s: Slide)-[r]->(c: Concept) WHERE s.sid = $sid RETURN LABELS(c) as labels,ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract, c.isDeleted as isDeleted",
    { sid: slideId }
  );
  return recordsToObjects(records);
}

export async function getConceptSlide(materialId, conceptId) {
  const { records } = await graphDb.driver.executeQuery(
    `MATCH (s:Slide)-[:CONSISTS_OF]->(c:Concept)
WHERE s.mid = $mid AND c.cid = $cid
RETURN s.sid as slideId`,
    { mid: materialId, cid: conceptId }
  );
  let record = recordsToObjects(records);
  const slideId = record[0].slideId;
  const slideNo = slideId.split("_").pop();
  return { slideNo: parseInt(slideNo) };
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

export async function getMaterial(materialId) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    "MATCH (c:Concept) WHERE c.mid = $mid RETURN LABELS(c) as labels,ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract, c.rank as rank",
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

export async function deleteCourse(courseId) {
  const { records, summary, keys } = await graphDb.driver.executeQuery(
    "MATCH (c:Course) WHERE c.cid = $cid DETACH DELETE c",
    { cid: courseId }
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
    "MATCH (c:Concept) WHERE c.mid = $mid RETURN c.cid AS id, c.name as name",
    { mid: materialId }
  );
  return recordsToObjects(records);
}

export async function getHigherLevelsNodesAndEdges(materialIds) {
  const { records } = await graphDb.driver.executeQuery(
    `MATCH (c:Concept) WHERE (c.mid IN $mids) and c.type="main_concept" RETURN LABELS(c) as labels,ID(c) AS id, c.cid as cid, c.name AS name, c.uri as uri, c.type as type, c.weight as weight, c.wikipedia as wikipedia, c.abstract as abstract, c.rank as rank, c.mid as mid order by c.weight limit 50`,
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

export async function getUserNode(userId) {
  try {
    const { records, summary, keys } = await graphDb.driver.executeQuery(
      `MATCH (u:User)-[r:dnu|u]->(c:Concept) where u.uid = $uid RETURN u, c, r`,
      { uid: userId }
    );
    console.log("Neo4j records:", records);
    return recordsToObjects(records);
  } catch (error) {
    console.error("Neo4j query error:", error);
    return [];
  }
}

export async function getSingleUserNode(userId) {
  try {
    const { records, summary, keys } = await graphDb.driver.executeQuery(
      `MATCH (u:User) where u.uid = $uid RETURN u`,
      { uid: userId }
    );
    console.log("Neo4j records:", records);
    return recordsToObjects(records);
  } catch (error) {
    console.error("Neo4j query error:", error);
    return [];
  }
}

export async function getLevelOfEngagement(userId) {
  try {
    const { records, summary, keys } = await graphDb.driver.executeQuery(
      `MATCH (u:User)-[r:ENGAGED_IN]->(target) WHERE u.uid = $uid RETURN u, r, target`,
      { uid: userId }
    );
    console.log("Neo4j records:", records);
    return recordsToObjects(records);
  } catch (error) {
    console.error("Neo4j query error:", error);
    return [];
  }
}

export async function getDNUEngagement(userId) {
  try {
    const { records, summary, keys } = await graphDb.driver.executeQuery(
      `MATCH (u:User)-[r:dnu|u|ENGAGED_IN]->(target) where u.uid = $uid RETURN u, target, r`,
      { uid: userId }
    );
    console.log("Neo4j records:", records);
    return recordsToObjects(records);
  } catch (error) {
    console.error("Neo4j query error:", error);
    return [];
  }
}

export async function changeRelationshipTypeUDNU(source, target, newType) {
  try {
    await graphDb.driver.executeQuery(
      `MATCH (s)-[r]->(t)
       WHERE ID(s) = toInteger($source) AND ID(t) = toInteger($target)
       DELETE r`,
      { source, target }
    );

    const { records } = await graphDb.driver.executeQuery(
      `MATCH (s), (t)
       WHERE ID(s) = toInteger($source) AND ID(t) = toInteger($target)
       CREATE (s)-[r:${newType}]->(t)
       RETURN r`,
      { source, target }
    );
    console.log("Neo4j records:", records);
    return recordsToObjects(records);
  } catch (error) {
    console.error("Neo4j query error:", error);
    return [];
  }
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

const getCourseNameById = async (courseId) => {
  try {
    const course = await Course.findById(courseId);
    return course ? course.name : "Unknown Course";
  } catch (err) {
    console.error("Error finding course:", err);
    return "Unknown Course";
  }
};

export async function createUserCourseRelationship(
  userId,
  courseId,
  engagementLevel
) {
  const session = graphDb.driver.session();
  try {
    // Get the course name first
    const courseName = await getCourseNameById(courseId);

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
        { userId, courseId, engagementLevel, courseName }
      );
      return recordsToObjects(response.records);
    });
    return result;
  } catch (error) {
    console.error(
      "Error creating or updating user-course relationship:",
      error
    );
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

export async function getUserRelationships(userId) {
  try {
    const { records, summary, keys } = await graphDb.driver.executeQuery(
      `MATCH (source)-[r]->(target)
WHERE ID(source) = $id
RETURN ID(source) AS source, ID(target) AS target, type(r) AS type, ID(r) AS id`,
      { id: parseInt(userId, 10) }
    );
    console.log("Neo4j records:", records);
    return recordsToObjects(records);
  } catch (error) {
    console.error("Neo4j query error:", error);
    return [];
  }
}

export async function deleteRelationship(rid) {
  try {
    const { records, summary, keys } = await graphDb.driver.executeQuery(
      `MATCH ()-[r]->() 
       WHERE ID(r) = $id
       DELETE r`,
      { id: parseInt(rid, 10) }
    );
    console.log("Neo4j records:", records);
    return recordsToObjects(records);
  } catch (error) {
    console.error("Neo4j query error:", error);
    return [];
  }
}

export async function deleteHasConcept(courseId) {
  try {
    const { records, summary, keys } = await graphDb.driver.executeQuery(
      `MATCH (course:Course {cid: $courseId})-[r:HAS_CONCEPT]->()
      DELETE r`,
      { courseId }
    );
    console.log("Neo4j records:", records);
    return recordsToObjects(records);
  } catch (error) {
    console.error("Neo4j query error:", error);
    return [];
  }
}

export async function renewConcept(conceptId) {
  try {
    const { records, summary, keys } = await graphDb.driver.executeQuery(
      `MATCH (c:Concept) WHERE ID(c) = toInteger($id)
       SET c.isDeleted = true
       RETURN c`,
      { id: conceptId }
    );
    console.log("Neo4j records:", records);
    return recordsToObjects(records);
  } catch (error) {
    console.error("Neo4j query error:", error);
    return [];
  }
}

export async function getRelationship(targetId) {
  try {
    const { records, summary, keys } = await graphDb.driver.executeQuery(
      `MATCH (source)-[r]->(target)
WHERE ID(target) = $id AND (type(r) = 'u' OR type(r) = 'dnu')
RETURN source, r, target`,
      { id: parseInt(targetId, 10) }
    );
    console.log("Neo4j records:", records);
    return recordsToObjects(records);
  } catch (error) {
    console.error("Neo4j query error:", error);
    return [];
  }
}

export async function getRelatedTo(courseId) {
  try {
    const { records, summary, keys } = await graphDb.driver.executeQuery(
      `MATCH (c:Concept)-[r:RELATED_TO]->(target) WHERE c.cid = $cid  RETURN c, r, target`,
      { cid: courseId }
    );
    console.log("Neo4j records:", records);
    return recordsToObjects(records);
  } catch (error) {
    console.error("Neo4j query error:", error);
    return [];
  }
}

export async function getHasCategory(conceptId) {
  try {
    const { records, summary, keys } = await graphDb.driver.executeQuery(
      `MATCH (c:Concept)-[r:HAS_CATEGORY]->(target) WHERE c.cid = $cid  RETURN c, r, target`,
      { cid: conceptId }
    );
    console.log("Neo4j records:", records);
    return recordsToObjects(records);
  } catch (error) {
    console.error("Neo4j query error:", error);
    return [];
  }
}

export async function addCourseIdToMaterial(materialId) {
  const session = graphDb.driver.session();
  try {
    const material = await Material.findById(materialId);
    const courseId = material.courseId.toString();

    const result = await session.executeWrite(async (tx) => {
      const response = await tx.run(
        `
        MATCH (m:LearningMaterial {mid: $materialId})
        SET m.course_id = $courseId
        RETURN m
        `,
        { materialId, courseId }
      );
      return recordsToObjects(response.records);
    });
    return result;
  } catch (error) {
    console.error("Error adding course ID to material:", error);
    throw error;
  } finally {
    await session.close();
  }
}

export async function createCourseHasConcepts(courseId) {
  const session = graphDb.driver.session();
  try {
    const result = await session.executeWrite(async (tx) => {
      const response = await tx.run(
        `
         MATCH (c:Course {cid: $courseId})
        MATCH (m:LearningMaterial {course_id: $courseId})
        MATCH (m)-[:LM_CONSISTS_OF]->(concept:Concept)
        MERGE (c)-[r:HAS_CONCEPT]->(concept)
        RETURN c, concept, r
        `,
        { courseId }
      );
      return recordsToObjects(response.records);
    });
    console.log(
      `Created ${result.length} Course-Concept relationships for course ${courseId}`
    );
    return result;
  } catch (error) {
    console.error("Error creating course-concept relationships:", error);
    throw error;
  } finally {
    await session.close();
  }
}

export async function getHasConcept(targetId) {
  try {
    const { records, summary, keys } = await graphDb.driver.executeQuery(
      `MATCH (source)-[r:HAS_CONCEPT]->(target)
      WHERE ID(target) = $targetId
      RETURN source, r, target`,
      { targetId: parseInt(targetId, 10) }
    );
    console.log("Neo4j records:", records);
    return recordsToObjects(records);
  } catch (error) {
    console.error("Neo4j query error:", error);
    return [];
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
