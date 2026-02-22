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

export async function deleteCourse(courseId) {
  const session = graphDb.driver.session();
  try {
    const result = await session.executeWrite(async (tx) => {
      // Step 1: Find and delete concepts that only belong to this course's slides
      // A concept should be deleted only if ALL slides it belongs to are from materials of this course
      await tx.run(
        `
        MATCH (lm:LearningMaterial {course_id: $courseId})-[:CONTAINS]->(s:Slide)-[:CONSISTS_OF]->(concept:Concept)
        WITH concept
        // Check if this concept is connected to ANY slides from OTHER courses
        OPTIONAL MATCH (otherLm:LearningMaterial)-[:CONTAINS]->(otherSlide:Slide)-[:CONSISTS_OF]->(concept)
        WHERE otherLm.course_id <> $courseId
        WITH concept, COUNT(DISTINCT otherSlide) as otherSlideCount
        WHERE otherSlideCount = 0
        DETACH DELETE concept
        `,
        { courseId }
      );
      
      // Step 2: Delete all slides that belong to this course's materials
      await tx.run(
        `
        MATCH (lm:LearningMaterial {course_id: $courseId})-[:CONTAINS]->(s:Slide)
        DETACH DELETE s
        `,
        { courseId }
      );
      
      // Step 3: Delete all learning materials that belong to this course
      await tx.run(
        `
        MATCH (lm:LearningMaterial {course_id: $courseId})
        DETACH DELETE lm
        `,
        { courseId }
      );
      
      // Step 4: Delete the course itself with all its relationships
      const response = await tx.run(
        "MATCH (c:Course {cid: $cid}) DETACH DELETE c",
        { cid: courseId }
      );
      
      return recordsToObjects(response.records);
    });
    console.log(`Deleted course ${courseId} with its materials, slides, and exclusive concepts`);
    return result;
  } catch (error) {
    console.error("Error deleting course and related nodes:", error);
    throw error;
  } finally {
    await session.close();
  }
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
  const { records, summary, keys } = await graphDb.driver.executeQuery(query, {
    mid: materialId,
  });
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

/**
 * Get all users with a specific engagement level for a specific course
 * @param {string} courseId - The course ID
 * @param {string} engagementLevel - The engagement level to filter by (e.g., 'low', 'medium', 'high')
 * @returns {Array} Array of user records with matching engagement level for the course
 */
export async function getAllUsersWithEngagementLevelForCourse(courseId, engagementLevel) {
  try {
    const { records, summary, keys } = await graphDb.driver.executeQuery(
      `MATCH (u:User)-[r:ENGAGED_IN]->(target) 
       WHERE target.cid = $courseId AND toLower(r.level) = toLower($level)
       RETURN u, r, target`,
      { courseId: String(courseId), level: String(engagementLevel) }
    );
    console.log(`Neo4j: Found ${records.length} users with ${engagementLevel} engagement level for course ${courseId}`);
    return recordsToObjects(records);
  } catch (error) {
    console.error("Neo4j query error:", error);
    return [];
  }
}

/**
 * Get all users with the next higher engagement level for a specific course
 * Used for "My Activities vs. Higher Engagement Level Boundaries" tab
 * @param {string} courseId - The course ID
 * @param {string} currentEngagementLevel - The current user's engagement level (e.g., 'low', 'medium')
 * @returns {Array} Array of user records with the next higher engagement level for the course
 */
export async function getUsersWithHigherEngagementLevelForCourse(courseId, currentEngagementLevel) {
  try {
    // Determine the next higher level
    const levelHierarchy = { 'low': 'medium', 'medium': 'high' };
    const higherLevel = levelHierarchy[currentEngagementLevel.toLowerCase()];
    
    // If already at 'high', there's no higher level - return empty array
    if (!higherLevel) {
      console.log(`Neo4j: User already at highest engagement level (${currentEngagementLevel}) for course ${courseId}`);
      return [];
    }
    
    const { records, summary, keys } = await graphDb.driver.executeQuery(
      `MATCH (u:User)-[r:ENGAGED_IN]->(target) 
       WHERE target.cid = $courseId AND toLower(r.level) = toLower($level)
       RETURN u, r, target`,
      { courseId: String(courseId), level: String(higherLevel) }
    );
    console.log(`Neo4j: Found ${records.length} users with ${higherLevel} engagement level (next higher from ${currentEngagementLevel}) for course ${courseId}`);
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
  courseName,
  engagementLevel
) {
  const session = graphDb.driver.session();
  try {
    // Get the course name first
    // const courseName = await getCourseNameById(courseId);

    const result = await session.executeWrite(async (tx) => {
      const response = await tx.run(
        `
        MERGE (u:User {uid: $userId, type: 'user'})
        MERGE (c:Course {cid: $courseId, name: $courseName})
        MERGE (u)-[loe:ENGAGED_IN]->(c)
        ON CREATE SET loe.level = $engagementLevel, loe.status = 'enrolled', loe.timestamp = datetime()
        ON MATCH SET loe.level = $engagementLevel, loe.status = 'enrolled', loe.timestamp = datetime()
        RETURN u, c, loe
        `,
        { userId, courseId, courseName, engagementLevel }
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

// get relationship of concept to change state to new
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



export async function getUserConceptsWithRelationships(conceptIds, topN = null, slideFilter = null) {
  if (conceptIds.length === 0) {
    return [];
  }

  // Query to get MAIN concepts only.
  // TopN is applied to main concepts in the query.
  // Related concepts are fetched on-demand via separate endpoint.
  // slideFilter: optional array of slide IDs to filter concepts by
  
  const limitClause = (topN && topN !== 'All') ? `LIMIT ${parseInt(topN)}` : '';
  
  // Build the query based on whether we have a slide filter
  let query;
  let params = { conceptIds };
  
  if (slideFilter && slideFilter.length > 0) {
    // Filter concepts that belong to selected slides
    params.slideIds = slideFilter;
    query = `
      MATCH (c:Concept)
      WHERE c.cid IN $conceptIds
        AND (c.type = 'main_concept' OR c.type IS NULL)
      OPTIONAL MATCH (s:Slide)-[]->(c)
      WITH c,
           COLLECT(DISTINCT {sid: s.sid, name: s.name}) as slides
      WHERE ANY(slide IN slides WHERE slide.sid IN $slideIds)
      RETURN c.cid as cid, 
             c.name as name, 
             c.type as type,
             c.wikipedia as wikipedia, 
             c.abstract as abstract,
             c.weight as weight,
             c.mid as mid,
             c.initial_embedding as initial_embedding,
             slides
      ORDER BY c.weight DESC
      ${limitClause}`;
  } else {
    // No slide filter - return all concepts
    query = `
      MATCH (c:Concept)
      WHERE c.cid IN $conceptIds
        AND (c.type = 'main_concept' OR c.type IS NULL)
      OPTIONAL MATCH (s:Slide)-[]->(c)
      WITH c,
           COLLECT(DISTINCT {sid: s.sid, name: s.name}) as slides
      RETURN c.cid as cid, 
             c.name as name, 
             c.type as type,
             c.wikipedia as wikipedia, 
             c.abstract as abstract,
             c.weight as weight,
             c.mid as mid,
             c.initial_embedding as initial_embedding,
             slides
      ORDER BY c.weight DESC
      ${limitClause}`;
  }
  
  const { records } = await graphDb.driver.executeQuery(
    query,
    params
  );
  
  const result = recordsToObjects(records);
  console.log(`[Personal KG] Neo4j query returned ${result.length} main concepts${slideFilter ? ` (filtered by ${slideFilter.length} slides)` : ''}`);
  
  return result;
}

/**
 * Get related concepts for a specific concept (on-demand fetch)
 * Returns concepts that have RELATED_TO relationship from the given concept
 */
export async function getRelatedConceptsForConcept(conceptCid) {
  const query = `
    MATCH (c:Concept {cid: $conceptCid})-[:RELATED_TO]->(related:Concept)
    RETURN related.cid as cid,
           related.name as name,
           related.type as type,
           related.wikipedia as wikipedia,
           related.abstract as abstract,
           related.weight as weight
    ORDER BY related.weight DESC`;
  
  const { records } = await graphDb.driver.executeQuery(
    query,
    { conceptCid }
  );
  
  return recordsToObjects(records);
}

/**
 * Get user interest scores from INTERESTED_IN relationships
 * Returns a map of concept_id -> score for all concepts the user is interested in
 * @param {string} userId - User ID (uid property)
 * @param {number|null} minScore - Minimum score threshold (optional)
 * @returns {Promise<Object>} Map of concept_id -> {score, updatedAt}
 */
export async function getUserInterestScores(userId, minScore = 0.0) {
  const query = `
    MATCH (u:User {uid: $userId})-[r:INTERESTED_IN]->(c:Concept)
    WHERE r.interestScore >= $minScore AND c.type = 'main_concept'
    RETURN c.cid as concept_id,
           r.interestScore as score,
           r.updatedAt as updated_at
    ORDER BY r.interestScore DESC`;
  
  const { records } = await graphDb.driver.executeQuery(
    query,
    { userId, minScore }
  );
  
  // Convert to a map for easy lookup: concept_id -> {score, updatedAt}
  const scoresMap = {};
  records.forEach(record => {
    const conceptId = record.get('concept_id');
    const score = record.get('score');
    const updatedAt = record.get('updated_at');
    
    scoresMap[conceptId] = {
      score: score,
      updatedAt: updatedAt
    };
  });
  
  console.log(`[Interest Scores] Found ${Object.keys(scoresMap).length} interest scores for user ${userId}`);
  
  return scoresMap;
}

/**
 * Get interest concepts for Interest Level graph
 * Returns concepts with INTERESTED_IN relationships (including NULL scores)
 * Deduplicates by concept name to avoid showing multiple nodes with same name
 * Returns ALL concept IDs with same name from database (not just user's relationships)
 * @param {string} userId - User ID (uid property)
 * @param {number|null} topN - Number of top concepts to return (null for all)
 * @returns {Promise<Array>} Array of concept objects with interest scores
 */
export async function getInterestConcepts(userId, topN = null) {
  const query = `
    MATCH (u:User {uid: $userId})-[r:INTERESTED_IN]->(c:Concept)
    WHERE c.type = 'main_concept'
    WITH c.name as conceptName,
         MAX(r.interestScore) as maxScore,
         COLLECT(DISTINCT c.cid)[0] as representativeCid,
         COLLECT(DISTINCT c.wikipedia)[0] as wikipedia,
         COLLECT(DISTINCT c.abstract)[0] as abstract,
         CASE 
           WHEN MAX(r.interestScore) IS NULL THEN -1
           ELSE MAX(r.interestScore)
         END as sortScore
    ORDER BY sortScore DESC, conceptName ASC
    ${topN ? 'LIMIT $topN' : ''}
    WITH conceptName, maxScore, representativeCid, wikipedia, abstract
    
    // Find ALL concept IDs with this name across the database
    MATCH (allConcepts:Concept {name: conceptName})
    WHERE allConcepts.type = 'main_concept'
    WITH conceptName, maxScore, representativeCid, wikipedia, abstract,
         COLLECT(DISTINCT allConcepts.cid) as allConceptIds
    
    RETURN representativeCid as conceptId,
           conceptName,
           maxScore as interestScore,
           wikipedia,
           abstract,
           allConceptIds`;
  
  const params = { userId };
  if (topN) {
    // Convert to Neo4j integer to avoid validation errors
    params.topN = neo4j.int(topN);
  }
  
  const { records } = await graphDb.driver.executeQuery(query, params);
  
  // Load interest scores data to get activity counts
  const fs = await import('fs');
  const path = await import('path');
  const interestScoresPath = path.join(process.cwd(), '../coursemapper-kg/recommendation/level-of-interest/data/interest_scores.json');
  let interestScoresData = {};
  
  try {
    if (fs.existsSync(interestScoresPath)) {
      const fileContent = fs.readFileSync(interestScoresPath, 'utf8');
      interestScoresData = JSON.parse(fileContent);
    }
  } catch (err) {
    console.warn('[Interest Concepts] Could not load interest_scores.json:', err.message);
  }
  
  // Get user's interest data
  const userInterestData = interestScoresData[userId];
  
  console.log(`[Interest Concepts] User data found:`, userInterestData ? 'YES' : 'NO');
  if (userInterestData) {
    console.log(`[Interest Concepts] Number of concepts in JSON:`, Object.keys(userInterestData.concepts || {}).length);
  }
  
  // Convert to array of concept objects
  const concepts = records.map(record => {
    const conceptName = record.get('conceptName');
    let activityCount = 0;
    
    // Sum activity counts across all courses for this concept and user
    if (userInterestData && userInterestData.concepts) {
      // The JSON structure has concept names as keys, but a concept might appear in multiple courses
      // We need to sum up all activity counts for this specific concept name
      const conceptData = userInterestData.concepts[conceptName];
      if (conceptData) {
        // Check if this is a single course entry or we need to handle multiple courses
        if (conceptData.total_activity_count !== undefined) {
          // Single entry for this concept
          activityCount = conceptData.total_activity_count;
          console.log(`[Interest Concepts] ${conceptName}: ${activityCount} activities (from course: ${conceptData.course_name})`);
        } else if (Array.isArray(conceptData)) {
          // Multiple entries (one per course) - sum them up
          activityCount = conceptData.reduce((sum, entry) => sum + (entry.total_activity_count || 0), 0);
          console.log(`[Interest Concepts] ${conceptName}: ${activityCount} activities (summed from ${conceptData.length} courses)`);
        }
      } else {
        console.log(`[Interest Concepts] ${conceptName}: No data found in interest_scores.json`);
      }
    }
    
    return {
      conceptId: record.get('conceptId'),
      conceptName: conceptName,
      interestScore: record.get('interestScore'),
      wikipedia: record.get('wikipedia'),
      abstract: record.get('abstract'),
      allConceptIds: record.get('allConceptIds'), // All concept IDs with this name in database
      activityCount: activityCount // Total activities from interest_scores.json for this user and concept
    };
  });
  
  console.log(`[Interest Concepts] Found ${concepts.length} unique concepts (deduplicated by name) for user ${userId}`);
  
  return concepts;
}

/**
 * Update (manually adjust) interest score for a user-concept pair
 * This allows users to override calculated scores
 */
export async function updateInterestScore(userId, conceptId, score) {
  const query = `
    MATCH (u:User {uid: $userId})-[r:INTERESTED_IN]->(c:Concept {cid: $conceptId})
    SET r.interestScore = $score,
        r.manuallyAdjusted = true,
        r.adjustedAt = datetime()
    RETURN r.interestScore as updatedScore, r.adjustedAt as adjustedAt
  `;
  
  const params = { userId, conceptId, score };
  
  const { records } = await graphDb.driver.executeQuery(query, params);
  
  if (records.length === 0) {
    throw new Error(`No INTERESTED_IN relationship found for user ${userId} and concept ${conceptId}`);
  }
  
  return {
    score: records[0].get('updatedScore'),
    adjustedAt: records[0].get('adjustedAt')
  };
}

/**
 * Batch update interest scores for multiple concept IDs
 * Used when updating all duplicate concepts with the same name
 */
export async function updateInterestScoreBatch(userId, conceptIds, score) {
  const query = `
    UNWIND $conceptIds as conceptId
    MATCH (u:User {uid: $userId})-[r:INTERESTED_IN]->(c:Concept {cid: conceptId})
    SET r.interestScore = $score,
        r.manuallyAdjusted = true,
        r.adjustedAt = datetime()
    RETURN count(r) as updatedCount
  `;
  
  const params = { userId, conceptIds, score };
  
  const { records } = await graphDb.driver.executeQuery(query, params);
  
  const updatedCount = records[0]?.get('updatedCount') || 0;
  
  console.log(`[Neo4j] Batch updated ${updatedCount} INTERESTED_IN relationships for user ${userId}`);
  
  return {
    updatedCount: updatedCount.toNumber ? updatedCount.toNumber() : updatedCount
  };
}

