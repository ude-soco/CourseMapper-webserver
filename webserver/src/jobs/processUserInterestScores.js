const fs = require('fs');
const neo4j = require('neo4j-driver');
const path = require('path');
const os = require('os');
const dotenv = require('dotenv');

// Use OS temp directory for intermediate files
function getTempDir() {
  const tmpDir = path.join(os.tmpdir(), 'coursemapper-interest-scores');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  return tmpDir;
}

// Load environment variables from webserver root
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Neo4j connection
const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://127.0.0.1:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || ''
  )
);

// Helper function to map activities using material_id + material_page
async function mapUsingMaterialInfo(session, activities, groupName) {
  const results = [];
  
  for (const activity of activities) {
    const result = {
      activity_id: `${groupName}_${activity.activity_code}`,
      activity_name: activity.activity_name,
      count: activity.count,
      group: groupName,
      main_concepts: []
    };

    if (activity.instances && activity.instances.length > 0) {
      const conceptsSet = new Set();
      const conceptCourseMap = new Map(); // Track course info for each concept
      
      for (const instance of activity.instances) {
        const materialId = instance.material_id;
        const materialPage = instance.material_page;
        const courseId = instance.course_id;
        const courseName = instance.course_name;

        if (materialId && materialPage !== undefined && materialPage !== null) {
          const cypher = `
            MATCH (s:Slide)-[:CONSISTS_OF]->(c:Concept)
            WHERE (s.name = $slideName OR s.sid = $slideSid)
              AND c.type = 'main_concept'
            RETURN DISTINCT c.name as concept_name, c.cid as concept_id
          `;

          const params = {
            slideName: `slide_${materialPage}`,
            slideSid: `${materialId}_slide_${materialPage}`
          };

          try {
            const queryResult = await session.run(cypher, params);
            
            queryResult.records.forEach(record => {
              const conceptName = record.get('concept_name');
              const conceptId = record.get('concept_id');
              
              if (conceptName && conceptId) {
                const conceptKey = `${conceptName}|||${conceptId}`;
                conceptsSet.add(conceptKey);
                // Track course for this concept
                if (!conceptCourseMap.has(conceptKey)) {
                  conceptCourseMap.set(conceptKey, new Set());
                }
                if (courseId) {
                  conceptCourseMap.get(conceptKey).add(JSON.stringify({ course_id: courseId, course_name: courseName }));
                }
              }
            });
          } catch (error) {
            console.error(`Error querying Neo4j for ${materialId}_slide_${materialPage}:`, error.message);
          }
        }
      }

      result.main_concepts = Array.from(conceptsSet).map(key => {
        const [name, id] = key.split('|||');
        const courses = conceptCourseMap.get(key) || new Set();
        const coursesArray = Array.from(courses).map(c => JSON.parse(c));
        
        return { 
          concept_name: name, 
          concept_id: id,
          course_id: coursesArray.length > 0 ? coursesArray[0].course_id : null,
          course_name: coursesArray.length > 0 ? coursesArray[0].course_name : null
        };
      });
    }

    results.push(result);
  }

  return results;
}

// Helper function to map G2.A3 using related concept_id -> main concept
async function mapUsingRelatedConcept(session, activities, groupName) {
  const results = [];
  
  for (const activity of activities) {
    const result = {
      activity_id: `${groupName}_${activity.activity_code}`,
      activity_name: activity.activity_name,
      count: activity.count,
      group: groupName,
      main_concepts: []
    };

    if (activity.instances && activity.instances.length > 0) {
      const conceptsSet = new Set();
      const conceptCourseMap = new Map();
      
      for (const instance of activity.instances) {
        const relatedConceptId = instance.concept_id;
        const courseId = instance.course_id;
        const courseName = instance.course_name;

        if (relatedConceptId) {
          const cypher = `
            MATCH (related:Concept {cid: $relatedConceptId})<-[:RELATES_TO]-(main:Concept)
            WHERE main.type = 'main_concept'
            RETURN DISTINCT main.name as concept_name, main.cid as concept_id
          `;

          const params = {
            relatedConceptId: relatedConceptId
          };

          try {
            const queryResult = await session.run(cypher, params);
            
            queryResult.records.forEach(record => {
              const conceptName = record.get('concept_name');
              const conceptId = record.get('concept_id');
              
              if (conceptName && conceptId) {
                const conceptKey = `${conceptName}|||${conceptId}`;
                conceptsSet.add(conceptKey);
                if (!conceptCourseMap.has(conceptKey)) {
                  conceptCourseMap.set(conceptKey, new Set());
                }
                if (courseId) {
                  conceptCourseMap.get(conceptKey).add(JSON.stringify({ course_id: courseId, course_name: courseName }));
                }
              }
            });
          } catch (error) {
            console.error(`Error querying related concept ${relatedConceptId}:`, error.message);
          }
        }
      }

      result.main_concepts = Array.from(conceptsSet).map(key => {
        const [name, id] = key.split('|||');
        const courses = conceptCourseMap.get(key) || new Set();
        const coursesArray = Array.from(courses).map(c => JSON.parse(c));
        
        return { 
          concept_name: name, 
          concept_id: id,
          course_id: coursesArray.length > 0 ? coursesArray[0].course_id : null,
          course_name: coursesArray.length > 0 ? coursesArray[0].course_name : null
        };
      });
    }

    results.push(result);
  }

  return results;
}

// Generic function to map a group's activities
async function mapGroupActivities(session, groupActivities, groupName, mapperFunction) {
  const activities = Object.values(groupActivities).filter(a => a.count > 0);
  console.log(`\nMapping ${groupName}: ${activities.length} activities with count > 0`);
  
  const mappedActivities = await mapperFunction(session, activities, groupName);
  
  const totalActivities = mappedActivities.length;
  const activitiesWithConcepts = mappedActivities.filter(a => a.main_concepts.length > 0).length;
  console.log(`${groupName}: ${activitiesWithConcepts}/${totalActivities} activities mapped to concepts`);
  
  return mappedActivities;
}

// Special handler for G9 (try concept_id first, fallback to material_id + material_page)
async function mapG9Activities(session, activities, groupName) {
  const results = [];
  
  for (const activity of activities) {
    const result = {
      activity_id: `${groupName}_${activity.activity_code}`,
      activity_name: activity.activity_name,
      count: activity.count,
      group: groupName,
      main_concepts: []
    };

    if (activity.instances && activity.instances.length > 0) {
      const conceptsSet = new Set();
      const conceptCourseMap = new Map();
      
      for (const instance of activity.instances) {
        const conceptId = instance.concept_id;
        const materialId = instance.material_id;
        const materialPage = instance.material_page;
        const courseId = instance.course_id;
        const courseName = instance.course_name;

        if (conceptId) {
          const cypher = `
            MATCH (c:Concept {cid: $conceptId})
            WHERE c.type = 'main_concept'
            RETURN c.name as concept_name, c.cid as concept_id
          `;

          try {
            const queryResult = await session.run(cypher, { conceptId });
            
            if (queryResult.records.length > 0) {
              queryResult.records.forEach(record => {
                const conceptName = record.get('concept_name');
                const conceptId = record.get('concept_id');
                
                if (conceptName && conceptId) {
                  const conceptKey = `${conceptName}|||${conceptId}`;
                  conceptsSet.add(conceptKey);
                  if (!conceptCourseMap.has(conceptKey)) {
                    conceptCourseMap.set(conceptKey, new Set());
                  }
                  if (courseId) {
                    conceptCourseMap.get(conceptKey).add(JSON.stringify({ course_id: courseId, course_name: courseName }));
                  }
                }
              });
              continue;
            }
          } catch (error) {
            console.error(`Error querying concept_id ${conceptId}:`, error.message);
          }
        }

        if (materialId && materialPage !== undefined && materialPage !== null) {
          const cypher = `
            MATCH (s:Slide)-[:CONSISTS_OF]->(c:Concept)
            WHERE (s.name = $slideName OR s.sid = $slideSid)
              AND c.type = 'main_concept'
            RETURN DISTINCT c.name as concept_name, c.cid as concept_id
          `;

          const params = {
            slideName: `slide_${materialPage}`,
            slideSid: `${materialId}_slide_${materialPage}`
          };

          try {
            const queryResult = await session.run(cypher, params);
            
            queryResult.records.forEach(record => {
              const conceptName = record.get('concept_name');
              const conceptId = record.get('concept_id');
              
              if (conceptName && conceptId) {
                const conceptKey = `${conceptName}|||${conceptId}`;
                conceptsSet.add(conceptKey);
                if (!conceptCourseMap.has(conceptKey)) {
                  conceptCourseMap.set(conceptKey, new Set());
                }
                if (courseId) {
                  conceptCourseMap.get(conceptKey).add(JSON.stringify({ course_id: courseId, course_name: courseName }));
                }
              }
            });
          } catch (error) {
            console.error(`Error querying slide ${materialId}_slide_${materialPage}:`, error.message);
          }
        }
      }

      result.main_concepts = Array.from(conceptsSet).map(key => {
        const [name, id] = key.split('|||');
        const courses = conceptCourseMap.get(key) || new Set();
        const coursesArray = Array.from(courses).map(c => JSON.parse(c));
        
        return { 
          concept_name: name, 
          concept_id: id,
          course_id: coursesArray.length > 0 ? coursesArray[0].course_id : null,
          course_name: coursesArray.length > 0 ? coursesArray[0].course_name : null
        };
      });
    }

    results.push(result);
  }

  return results;
}

function transformToConceptBased(mappingData, activityWeights) {
  const conceptBased = {};
  conceptBased[mappingData.user_id] = {
    username: mappingData.username
  };

  // Track concepts by both name and ID to detect duplicates
  const conceptsByNameAndId = new Map();
  const conceptIdMapping = new Map(); // Maps concept_id -> canonical concept key
  const conceptCourses = new Map(); // Track courses for each concept

  for (const activity of mappingData.mapped_activities) {
    if (!activity.main_concepts || activity.main_concepts.length === 0) {
      continue;
    }

    for (const concept of activity.main_concepts) {
      const conceptName = concept.concept_name;
      const conceptId = concept.concept_id;
      const courseId = concept.course_id;
      const courseName = concept.course_name;

      // Create a canonical key for this concept (use name as primary key)
      let canonicalKey = conceptName;

      // Check if we've seen this concept_id before with a different name
      if (conceptIdMapping.has(conceptId)) {
        canonicalKey = conceptIdMapping.get(conceptId);
      } else {
        // Check if we've seen this name before
        if (conceptsByNameAndId.has(conceptName)) {
          const existingIds = conceptsByNameAndId.get(conceptName);
          // Add this ID to the set of IDs for this concept name
          existingIds.add(conceptId);
        } else {
          // First time seeing this concept name
          conceptsByNameAndId.set(conceptName, new Set([conceptId]));
        }
        // Map this concept_id to the canonical key (concept name)
        conceptIdMapping.set(conceptId, conceptName);
      }

      // Initialize concept entry if it doesn't exist
      if (!conceptBased[mappingData.user_id][canonicalKey]) {
        conceptBased[mappingData.user_id][canonicalKey] = {
          concept_id: conceptId,
          concept_name: canonicalKey,
          concept_ids: [conceptId], // Track all IDs for this concept
          courses: new Set(), // Track courses
          activities: []
        };
        conceptCourses.set(canonicalKey, new Set());
      } else {
        // Add this concept_id if not already tracked
        if (!conceptBased[mappingData.user_id][canonicalKey].concept_ids.includes(conceptId)) {
          conceptBased[mappingData.user_id][canonicalKey].concept_ids.push(conceptId);
        }
      }

      // Track course for this concept
      if (courseId && courseName) {
        conceptBased[mappingData.user_id][canonicalKey].courses.add(JSON.stringify({ course_id: courseId, course_name: courseName }));
        conceptCourses.get(canonicalKey).add(JSON.stringify({ course_id: courseId, course_name: courseName }));
      }

      // Find or create activity entry
      const existingActivity = conceptBased[mappingData.user_id][canonicalKey].activities.find(
        a => a.activity_id === activity.activity_id
      );

      const weight = activityWeights[activity.activity_id] || 0;

      if (existingActivity) {
        // Aggregate: sum the counts
        existingActivity.count += activity.count;
      } else {
        // New activity for this concept
        conceptBased[mappingData.user_id][canonicalKey].activities.push({
          activity_id: activity.activity_id,
          activity_name: activity.activity_name,
          weight: weight,
          count: activity.count
        });
      }
    }
  }

  // Clean up and add enrollment activity for multi-course concepts
  const enrollmentWeight = activityWeights['G10_A1'] || 0.027777777777777776;
  
  for (const conceptKey in conceptBased[mappingData.user_id]) {
    if (conceptKey === 'username') continue;
    
    const concept = conceptBased[mappingData.user_id][conceptKey];
    
    // Convert courses Set to array
    const coursesArray = Array.from(concept.courses || new Set()).map(c => JSON.parse(c));
    
    // Add course information
    if (coursesArray.length === 1) {
      concept.course_id = coursesArray[0].course_id;
      concept.course_name = coursesArray[0].course_name;
    } else if (coursesArray.length > 1) {
      concept.course_ids = coursesArray.map(c => c.course_id);
      concept.course_names = coursesArray.map(c => c.course_name);
    }
    
    // Add enrollment activity for ALL concepts
    // Student must enroll before doing any activities with the concept
    // Count = total number of courses teaching this concept (1 or more)
    const enrollmentCount = coursesArray.length;
    
    concept.activities.push({
      activity_id: 'G10_A1',
      activity_name: coursesArray.length > 1 
        ? 'User enrolled in multiple courses teaching this concept'
        : 'User enrolled in course teaching this concept',
      weight: enrollmentWeight,
      count: enrollmentCount
    });
    
    // Remove the temporary courses Set
    delete concept.courses;
    
    // Always keep concept_ids array (even with 1 ID) for Python script aggregation
    // Python script needs this to properly aggregate duplicates across concepts
    if (!concept.concept_ids) {
      concept.concept_ids = [concept.concept_id];
    }
    // Ensure concept_id is always set (for backwards compatibility)
    if (!concept.concept_id && concept.concept_ids && concept.concept_ids.length > 0) {
      concept.concept_id = concept.concept_ids[0];
    }
  }

  return conceptBased;
}

async function processUserActivities(username) {
  const session = driver.session();

  try {
    console.log('='.repeat(80));
    console.log(`PROCESSING USER: ${username}`);
    console.log('='.repeat(80));
    console.log();

    // Load activities breakdown (centralized data location)
    const activitiesPath = path.join(__dirname, '../../../coursemapper-kg/recommendation/level-of-interest/data/activities_breakdown.json');
    const activitiesData = JSON.parse(await fs.promises.readFile(activitiesPath, 'utf8'));

    // Find user by username (case-insensitive)
    const userEntry = Object.entries(activitiesData).find(
      ([_, data]) => data.username.toLowerCase() === username.toLowerCase()
    );

    if (!userEntry) {
      console.error(`User "${username}" not found in activities breakdown`);
      console.log('\nAvailable users:');
      Object.values(activitiesData).forEach(user => {
        let totalActivities = 0;
        user.activities.forEach(group => {
          Object.keys(group).forEach(gKey => {
            Object.keys(group[gKey]).forEach(aKey => {
              if (group[gKey][aKey].count > 0) totalActivities += group[gKey][aKey].count;
            });
          });
        });
        if (totalActivities > 0) {
          console.log(`  - ${user.username} (${totalActivities} activities)`);
        }
      });
      process.exit(1);
    }

    const [userId, userActivities] = userEntry;
    const usernameSafe = userActivities.username.toLowerCase().replace(/\s+/g, '_');

    console.log(`Found user: ${userActivities.username} (${userId})`);
    console.log();

    // STEP 1: Map activities to concepts
    console.log('='.repeat(80));
    console.log('STEP 1: MAPPING ACTIVITIES TO CONCEPTS');
    console.log('='.repeat(80));

    const allMappedActivities = [];

    for (const activityGroup of userActivities.activities) {
      if (activityGroup.G1) {
        const mapped = await mapGroupActivities(session, activityGroup.G1, 'G1', mapUsingMaterialInfo);
        allMappedActivities.push(...mapped);
      }

      if (activityGroup.G2 && activityGroup.G2.A3) {
        const mapped = await mapUsingRelatedConcept(session, [activityGroup.G2.A3], 'G2');
        allMappedActivities.push(...mapped);
      }

      if (activityGroup.G6) {
        const mapped = await mapGroupActivities(session, activityGroup.G6, 'G6', mapUsingMaterialInfo);
        allMappedActivities.push(...mapped);
      }

      if (activityGroup.G7) {
        const mapped = await mapGroupActivities(session, activityGroup.G7, 'G7', mapUsingMaterialInfo);
        allMappedActivities.push(...mapped);
      }

      if (activityGroup.G8) {
        const mapped = await mapGroupActivities(session, activityGroup.G8, 'G8', mapUsingMaterialInfo);
        allMappedActivities.push(...mapped);
      }

      if (activityGroup.G9) {
        const activities = Object.values(activityGroup.G9).filter(a => a.count > 0);
        console.log(`\nMapping G9: ${activities.length} activities with count > 0`);
        const mapped = await mapG9Activities(session, activities, 'G9');
        const activitiesWithConcepts = mapped.filter(a => a.main_concepts.length > 0).length;
        console.log(`G9: ${activitiesWithConcepts}/${mapped.length} activities mapped to concepts`);
        allMappedActivities.push(...mapped);
      }
    }

    const mappingOutput = {
      user_id: userId,
      username: userActivities.username,
      total_activities_mapped: allMappedActivities.length,
      activities_with_concepts: allMappedActivities.filter(a => a.main_concepts.length > 0).length,
      mapped_activities: allMappedActivities
    };

    console.log(`\n Mapping complete!`);
    console.log(`Total activities: ${mappingOutput.total_activities_mapped}`);
    console.log(`Activities with concepts: ${mappingOutput.activities_with_concepts}`);
    console.log(`Success rate: ${((mappingOutput.activities_with_concepts / mappingOutput.total_activities_mapped) * 100).toFixed(2)}%`);
    console.log();

    // STEP 2: Transform to concept-based format
    console.log('='.repeat(80));
    console.log('STEP 2: TRANSFORMING TO CONCEPT-BASED FORMAT');
    console.log('='.repeat(80));
    console.log();

    // Load activity weights
    const weightsPath = path.join(__dirname, '../../../coursemapper-kg/recommendation/level-of-interest/data/activity-weights.json');
    const weightsData = JSON.parse(await fs.promises.readFile(weightsPath, 'utf8'));
    
    // Create activity_id -> weight mapping
    const activityWeights = {};
    for (const activity of weightsData.activities) {
      activityWeights[activity.activity_id] = activity.normalized_weight;
    }

    const conceptBased = transformToConceptBased(mappingOutput, activityWeights);
    const totalConcepts = Object.keys(conceptBased[userId]).length - 1; // -1 for username field

    console.log(`Transformation complete!`);
    console.log(`Total unique concepts: ${totalConcepts}`);
    
    // Check for aggregated duplicates
    const aggregatedConcepts = Object.values(conceptBased[userId])
      .filter(c => c.concept_ids && c.concept_ids.length > 1);
    
    if (aggregatedConcepts.length > 0) {
      console.log(`Found ${aggregatedConcepts.length} concepts with multiple IDs (aggregated duplicates):`);
      aggregatedConcepts.slice(0, 5).forEach(c => {
        console.log(`  - "${c.concept_name}": ${c.concept_ids.length} IDs merged`);
      });
    }
    console.log();

    // Save intermediate files to OS temp directory
    const tempDir = getTempDir();
    const mappedConceptsPath = path.join(tempDir, `mapped_concepts_${usernameSafe}.json`);
    const conceptBasedPath = path.join(tempDir, `concept_based_activities_${usernameSafe}.json`);

    await fs.promises.writeFile(mappedConceptsPath, JSON.stringify(mappingOutput, null, 2));
    await fs.promises.writeFile(conceptBasedPath, JSON.stringify(conceptBased, null, 2));

    console.log(`Saved: ${mappedConceptsPath}`);
    console.log(`Saved: ${conceptBasedPath}`);
    console.log();

    return usernameSafe;

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
}

async function main() {
  const username = process.argv[2];

  if (!username) {
    console.error('Usage: node processUserInterestScores.js <username>');
    console.error('Example: node processUserInterestScores.js "John Doe"');
    process.exit(1);
  }

  try {
    const usernameSafe = await processUserActivities(username);
    
    console.log('='.repeat(80));
    console.log('STEP 3: CALCULATING INTEREST SCORES');
    console.log('='.repeat(80));
    console.log();
    console.log('Run the Python script to calculate scores:');
    console.log(`  python ../coursemapper-kg/recommendation/level-of-interest/scripts/calculate_interest_scores.py ${usernameSafe}`);
    console.log();

  } catch (error) {
    console.error('Failed to process user:', error.message);
    process.exit(1);
  }
}

main();
