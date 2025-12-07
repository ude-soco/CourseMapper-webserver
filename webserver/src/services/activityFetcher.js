/**
 * Activity Fetcher Service
 * Fetches and classifies xAPI statements from MongoDB into activity groups G1-G10
 * Based on verb and object type combinations as specified in the thesis requirements
 */

const db = require("../models");
const Activity = db.activity;

/**
 * Activity Group Classifiers
 * Each function checks if an xAPI statement matches a specific activity pattern
 */

const ActivityClassifiers = {
  /**
   * G1: Recommended Material (7 votes)
   * A1: User marks as helpful on recommended Video
   * A2: User views recommended material
   * A3: User views Recommended Videos
   */
  G1_A1_MarkedHelpfulRecommendedVideo: (statement) => {
    const verb = statement.verb?.id;
    const type = statement.object?.definition?.type;
    return (
      verb === "http://www.CourseMapper.de/verb/marked-helpful" &&
      type === "http://www.CourseMapper.de/activityType/recommended-article"
    );
  },

  G1_A2_ViewedRecommendedMaterial: (statement) => {
    const verb = statement.verb?.id;
    const type = statement.object?.definition?.type;
    return (
      verb === "http://www.CourseMapper.de/verb/viewed-all" &&
      type === "http://www.CourseMapper.de/activityType/recommended-article"
    );
  },

  G1_A3_ViewedRecommendedVideos: (statement) => {
    const verb = statement.verb?.id;
    const type = statement.object?.definition?.type;
    return (
      verb === "http://www.CourseMapper.de/verb/viewed-all" &&
      type === "http://www.CourseMapper.de/activityType/recommended-video"
    );
  },

  /**
   * G2: Concepts & Articles (7 votes)
   * A1: User views related Concepts in Material KG
   * A2: User Views full article of main concept in Material KG
   * A3: User views the full article of related Concept in Material KG
   */
  G2_A1_ViewedRelatedConceptsMaterialKG: (statement) => {
    const verb = statement.verb?.id;
    const type = statement.object?.definition?.type;
    return (
      verb === "http://id.tincanapi.com/verb/viewed" &&
      type === "http://www.CourseMapper.de/activityType/material-kg-main-concept"
    );
  },

  G2_A2_ViewedFullArticleMainConceptMaterialKG: (statement) => {
    const verb = statement.verb?.id;
    const type = statement.object?.definition?.type;
    return (
      verb === "http://www.CourseMapper.de/verb/viewed-full-article" &&
      type === "http://www.CourseMapper.de/activityType/material-kg-main-concept"
    );
  },

  G2_A3_ViewedFullArticleRelatedConceptMaterialKG: (statement) => {
    const verb = statement.verb?.id;
    const type = statement.object?.definition?.type;
    return (
      verb === "http://www.CourseMapper.de/verb/viewed-full-article" &&
      type === "http://www.CourseMapper.de/activityType/material-kg-related-concept"
    );
  },

  /**
   * G3: Mark U/DNU (6 votes)
   * User Marks Did not Understand main Concept
   */
  G3_A1_MarkedNotUnderstoodMainConcept: (statement) => {
    const verb = statement.verb?.id;
    const type = statement.object?.definition?.type;
    return (
      verb === "http://www.CourseMapper.de/verb/mark-not-understood" &&
      type === "http://www.CourseMapper.de/activityType/slide-kg-main-concept"
    );
  },

  /**
   * G4: Full Article (5 votes)
   * View the full article of the main concept in slide KG
   */
  G4_A1_ViewedFullArticleSlideKG: (statement) => {
    const verb = statement.verb?.id;
    const type = statement.object?.definition?.type;
    return (
      verb === "http://www.CourseMapper.de/verb/viewed-full-article" &&
      type === "http://www.CourseMapper.de/activityType/slide-kg-main-concept"
    );
  },

  /**
   * G5: Explanation (4 votes)
   * A1: View Textual Explanation
   * A2: View Visual Explanation
   */
  G5_A1_ViewedTextualExplanation: (statement) => {
    const verb = statement.verb?.id;
    const objectId = statement.object?.id || "";
    return (
      verb === "http://id.tincanapi.com/verb/viewed" &&
      objectId.includes("/textual-explanation")
    );
  },

  G5_A2_ViewedVisualExplanation: (statement) => {
    const verb = statement.verb?.id;
    const objectId = statement.object?.id || "";
    return (
      verb === "http://id.tincanapi.com/verb/viewed" &&
      objectId.includes("/visual-explanation")
    );
  },

  /**
   * G6: Follow Annotation (2 votes)
   * User follows annotation
   */
  G6_A1_FollowedAnnotation: (statement) => {
    const verb = statement.verb?.id;
    const type = statement.object?.definition?.type;
    return (
      verb === "http://activitystrea.ms/schema/1.0/follow" &&
      (type === "http://www.CourseMapper.de/activityType/note" ||
       type === "http://www.CourseMapper.de/activityType/question" ||
       type === "http://www.CourseMapper.de/activityType/external-resource")
    );
  },

  /**
   * G7: Recommended Concepts (2 votes)
   * View Recommended Concepts
   */
  G7_A1_ViewedRecommendedConcepts: (statement) => {
    const verb = statement.verb?.id;
    const type = statement.object?.definition?.type;
    return (
      verb === "http://www.CourseMapper.de/verb/viewed-all" &&
      type === "http://www.CourseMapper.de/activityType/slide-kg-recommended-concept"
    );
  },

  /**
   * G8: View Slide/s related to Concept (1 vote)
   * User views a slide in Learning Material
   */
  G8_A1_ViewedSlide: (statement) => {
    const verb = statement.verb?.id;
    const type = statement.object?.definition?.type;
    return (
      verb === "http://id.tincanapi.com/verb/viewed" &&
      type === "http://id.tincanapi.com/activitytype/slide"
    );
  },

  /**
   * G9: Mark Recommended DNU (1 vote)
   * User marks a recommended Concept as DNU
   */
  G9_A1_MarkedRecommendedDNU: (statement) => {
    const verb = statement.verb?.id;
    const type = statement.object?.definition?.type;
    return (
      verb === "http://www.CourseMapper.de/verb/mark-not-understood" &&
      type === "http://www.CourseMapper.de/activityType/slide-kg-recommended-concept"
    );
  },

  /**
   * G10: Course Access (1 vote)
   * User enrols in a course
   */
  G10_A1_EnrolledInCourse: (statement) => {
    const verb = statement.verb?.id;
    const type = statement.object?.definition?.type;
    return (
      verb === "http://www.tincanapi.co.uk/verbs/enrolled_onto_learning_plan" &&
      type === "http://adlnet.gov/expapi/activities/course"
    );
  },
};

/**
 * Activity Group Mapping
 * Maps activity classifiers to their group, name, and weight
 */
const ACTIVITY_GROUPS = {
  G1: {
    name: "Recommended Material",
    votes: 7,
    activities: {
      A1: {
        name: "User marks as helpful on recommended Video",
        classifier: ActivityClassifiers.G1_A1_MarkedHelpfulRecommendedVideo,
        needsMapping: true, // Needs Neo4j mapping
      },
      A2: {
        name: "User views recommended article",
        classifier: ActivityClassifiers.G1_A2_ViewedRecommendedMaterial,
        needsMapping: true,
      },
      A3: {
        name: "User views recommended Videos",
        classifier: ActivityClassifiers.G1_A3_ViewedRecommendedVideos,
        needsMapping: true,
      },
    },
  },
  G2: {
    name: "Concepts & Article",
    votes: 7,
    activities: {
      A1: {
        name: "User views related Concepts in Material KG",
        classifier: ActivityClassifiers.G2_A1_ViewedRelatedConceptsMaterialKG,
        needsMapping: false, // Has explicit concept_id
      },
      A2: {
        name: "User Views full article of main concept in Material KG",
        classifier: ActivityClassifiers.G2_A2_ViewedFullArticleMainConceptMaterialKG,
        needsMapping: false,
      },
      A3: {
        name: "User views the full article of related Concept in Material KG",
        classifier: ActivityClassifiers.G2_A3_ViewedFullArticleRelatedConceptMaterialKG,
        needsMapping: true, // Has related concept, needs main concept mapping
      },
    },
  },
  G3: {
    name: "Mark U/DNU",
    votes: 6,
    activities: {
      A1: {
        name: "User Marks Did not Understand main Concept",
        classifier: ActivityClassifiers.G3_A1_MarkedNotUnderstoodMainConcept,
        needsMapping: false, // Has explicit concept_id
      },
    },
  },
  G4: {
    name: "Full Article",
    votes: 5,
    activities: {
      A1: {
        name: "View the full article of the main concept in slide KG",
        classifier: ActivityClassifiers.G4_A1_ViewedFullArticleSlideKG,
        needsMapping: false, // Has explicit concept_id
      },
    },
  },
  G5: {
    name: "Explanation",
    votes: 4,
    activities: {
      A1: {
        name: "View Textual Explanation of why a concept is recommended",
        classifier: ActivityClassifiers.G5_A1_ViewedTextualExplanation,
        needsMapping: true, /* Lines 273-274 omitted */
      },
      A2: {
        name: "View Visual Explanation of why a concept is recommended",
        classifier: ActivityClassifiers.G5_A2_ViewedVisualExplanation,
        needsMapping: true,
      },
    },
  },
  G6: {
    name: "Follow Annotation",
    votes: 2,
    activities: {
      A1: {
        name: "User follows annotation",
        classifier: ActivityClassifiers.G6_A1_FollowedAnnotation,
        needsMapping: true, // Needs annotation lookup + material mapping
      },
    },
  },
  G7: {
    name: "Recommended Concepts",
    votes: 2,
    activities: {
      A1: {
        name: "View Recommended Concepts",
        classifier: ActivityClassifiers.G7_A1_ViewedRecommendedConcepts,
        needsMapping: true, // Needs material + page mapping
      },
    },
  },
  G8: {
    name: "View Slide/s related to Concept",
    votes: 1,
    activities: {
      A1: {
        name: "User views a slide in LM",
        classifier: ActivityClassifiers.G8_A1_ViewedSlide,
        needsMapping: true, // Needs material + page mapping
      },
    },
  },
  G9: {
    name: "Mark Recommended DNU",
    votes: 1,
    activities: {
      A1: {
        name: "User marks a recommended Concept as DNU",
        classifier: ActivityClassifiers.G9_A1_MarkedRecommendedDNU,
        needsMapping: true, // Needs material + page mapping for main concepts
      },
    },
  },
  G10: {
    name: "Course Access",
    votes: 1,
    activities: {
      A1: {
        name: "User enrols in a course",
        classifier: ActivityClassifiers.G10_A1_EnrolledInCourse,
        needsMapping: true, // Needs course → concepts mapping
      },
    },
  },
};

/**
 * Classifies a statement into its activity group and activity type per user 
 * @param {Object} statement - xAPI statement object
 * @returns {Object|null} - {group, activity, needsMapping} or null if no match 
 * needsMapping is boolean indicating if further concept mapping is needed
 */
function classifyActivity(statement) {
  for (const [groupKey, groupData] of Object.entries(ACTIVITY_GROUPS)) {
    for (const [activityKey, activityData] of Object.entries(
      groupData.activities
    )) {
      if (activityData.classifier(statement)) {
        return {
          group: groupKey,
          activity: activityKey,
          groupName: groupData.name,
          activityName: activityData.name,
          votes: groupData.votes,
          needsMapping: activityData.needsMapping,
        };
      }
    }
  }
  return null;
}

/**
 * Extracts concept information from xAPI statement
 * @param {Object} statement - xAPI statement object
 * @returns {Object} - {conceptId, conceptCid, conceptName, materialId, materialPage, courseId}
 */
function extractConceptInfo(statement) {
  const extensions = statement.object?.definition?.extensions || {};
  
  // Try different extension patterns
  const extensionData =
    extensions["http://www.CourseMapper.de/extensions/slide-kg-main-concept"] ||
    extensions["http://www.CourseMapper.de/extensions/material-kg-main-concept"] ||
    extensions["http://www.CourseMapper.de/extensions/material-kg-related-concept"] ||
    extensions["http://www.CourseMapper.de/extensions/slide-kg-recommended-concept"] ||
    extensions["http://www.CourseMapper.de/extensions/recommended-article"] ||
    extensions["http://www.CourseMapper.de/extensions/recommended-video"] ||
    extensions["http://www.CourseMapper.de/extensions/slide"] ||
    extensions["http://localhost:4200/extensions/note"] ||
    extensions["http://localhost:4200/extensions/question"] ||
    extensions["http://localhost:4200/extensions/external-resource"] ||
    extensions["http://localhost:4200/extensions/course"] ||
    extensions["http://localhost:4200/extensions/textual-explanation"] ||
    extensions["http://localhost:4200/extensions/visual-explanation"] ||
    {};

  // Extract material ID (different field names in different activities)
  let materialId = 
    extensionData.materialId?.$oid || 
    extensionData.materialId || 
    extensionData.material_id?.$oid || 
    extensionData.material_id ||
    null;

  // Extract material page (could be named differently)
  let materialPage = 
    extensionData.materialPage || 
    extensionData.slide_num || 
    extensionData.Material_pageNr ||
    extensionData.material_pageNr ||
    null;

  // If materialPage is a string, convert to number
  if (materialPage && typeof materialPage === 'string') {
    materialPage = parseInt(materialPage, 10);
  }

  // Extract course ID
  let courseId = 
    extensionData.courseId?.$oid || 
    extensionData.courseId || 
    extensionData.course_id?.$oid ||
    extensionData.course_id ||
    null;

  // Extract course Name
  let courseName = 
    extensionData.courseName || 
    extensionData.course_name || 
    null;

  // Extract channel ID
  let channelId = 
    extensionData.channelId?.$oid || 
    extensionData.channelId || 
    extensionData.channel_id?.$oid ||
    extensionData.channel_id ||
    null;

  // Extract topic ID
  let topicId = 
    extensionData.topicId?.$oid || 
    extensionData.topicId || 
    extensionData.topic_id?.$oid ||
    extensionData.topic_id ||
    null;

  let conceptId = extensionData.concept_id || extensionData.conceptId || extensionData.id || null;
  if (conceptId && conceptId.$oid) {
    conceptId = conceptId.$oid;
  }

  let conceptType = extensionData.concept_type || extensionData.conceptType || null;

  let conceptName = 
    extensionData.concept_name || 
    statement.object?.definition?.name?.["en-US"] || 
    null;

  // Clean up concept name and extract type if missing
  if (conceptName && typeof conceptName === 'string') {
    const match = conceptName.match(/^(main concept|related concept|recommended concept)[:\s]*'([^']+)'/i);
    if (match) {
      if (!conceptType) {
        conceptType = match[1].toLowerCase();
      }
      conceptName = match[2];
    }
  }

  // Extract annotation ID from annotation extensions (note, question, external-resource)
  const noteExtension = extensions["http://localhost:4200/extensions/note"] || {};
  const questionExtension = extensions["http://localhost:4200/extensions/question"] || {};
  const externalResourceExtension = extensions["http://localhost:4200/extensions/external-resource"] || {};
  
  let annotationId = noteExtension.id || questionExtension.id || externalResourceExtension.id || extensionData.annotationId || null;
  if (annotationId && annotationId.$oid) {
    annotationId = annotationId.$oid;
  }
  
  // Determine annotation type based on which extension has data
  let annotationType = null;
  if (noteExtension.id) {
    annotationType = "Note";
  } else if (questionExtension.id) {
    annotationType = "Question";
  } else if (externalResourceExtension.id) {
    annotationType = "External Resource";
  } else {
    annotationType = extensionData.annotationType || extensionData.annotation_type || null;
  }

  // For G5 (textual/visual explanations), extract main concept
  let mainConceptId = null;
  let mainConceptCid = null;
  let mainConceptName = null;
  
  // For visual explanation: extract from concept_roads
  if (extensionData.concept_roads && Array.isArray(extensionData.concept_roads)) {
    // concept_roads is an array like: [[user_obj, "dnu", main_concept_obj]]
    // Find the main_concept object (type === "main_concept")
    for (const road of extensionData.concept_roads) {
      if (Array.isArray(road)) {
        for (const item of road) {
          if (item && typeof item === 'object' && item.type === 'main_concept') {
            mainConceptId = item.id || null;
            mainConceptCid = item.id || null; // Using id as cid
            mainConceptName = item.name || null;
            break;
          }
        }
        if (mainConceptId) break;
      }
    }
  }
  
  // For textual explanation: extract from concept_reason
  if (!mainConceptName && extensionData.concept_reason && Array.isArray(extensionData.concept_reason)) {
    // concept_reason is an array like: [{dnu: ["Vertex (graph theory)"]}, {name: "Vertex", type: "Related", dnu: [...]}]
    // Extract the main concept name from the dnu array
    for (const reason of extensionData.concept_reason) {
      if (reason && reason.dnu && Array.isArray(reason.dnu) && reason.dnu.length > 0) {
        mainConceptName = reason.dnu[0]; // First item in dnu array is the main concept
        // For textual explanation, we don't have the ID, it will need to be fetched from Neo4j
        break;
      }
    }
  }

  return {
    conceptId: conceptId,
    conceptCid: extensionData.concept_cid || extensionData.conceptCid || extensionData.cid || null,
    conceptType: conceptType,
    conceptName: conceptName,
    materialId: materialId,
    materialPage: materialPage,
    courseId: courseId,
    courseName: courseName,
    channelId: channelId,
    topicId: topicId,
    annotationId: annotationId,
    annotationType: annotationType,
    relatedConceptId: extensionData.related_concept_id || null,
    mainConceptId: mainConceptId,
    mainConceptCid: mainConceptCid,
    mainConceptName: mainConceptName,
  };
}

/**
 * Fetches activities for a specific user from MongoDB
 * @param {String} userId - User ID or email
 * @param {Object} options - Filter options {startDate, endDate, courseId}
 * @returns {Promise<Array>} - Array of classified activities
 */
async function fetchUserActivities(userId, options = {}) {
  try {
    const query = {
      $or: [
        { "statement.actor.account.name": userId },
        // { "statement.actor.mbox": `mailto:${userId}` },
      ],
    };

    //################################
    // Add date filter if provided // can be deleted ((check)) 
    if (options.startDate || options.endDate) {
      query["statement.timestamp"] = {};
      if (options.startDate) {
        query["statement.timestamp"].$gte = new Date(options.startDate);
      }
      if (options.endDate) {
        query["statement.timestamp"].$lte = new Date(options.endDate);
      }
    }
    // ####################################

    const activities = await Activity.find(query).lean();

    const classifiedActivities = [];

    for (const activity of activities) {
      const statement = activity.statement;
      //per user 
      const classification = classifyActivity(statement);
    
      if (classification) {
        const conceptInfo = extractConceptInfo(statement);

        // Apply course filter if specified
        if (options.courseId && conceptInfo.courseId !== options.courseId) {
          continue;
        }

        classifiedActivities.push({
          _id: activity._id,
          timestamp: statement.timestamp,
          classification,
          conceptInfo,
          statement: statement,
        });
      }
    }

    return classifiedActivities;
  } catch (error) {
    console.error("Error fetching user activities:", error);
    throw error;
  }
}

/**
 * Counts activities by group for a user
 * @param {String} userId - User ID
 * @param {Object} options - Filter options
 * @returns {Promise<Object>} - Activity counts per group
 */
async function countActivitiesByGroup(userId, options = {}) {
  const activities = await fetchUserActivities(userId, options);

  const counts = {};

  // Initialize counts for all groups
  Object.keys(ACTIVITY_GROUPS).forEach((group) => {
    counts[group] = {
      groupName: ACTIVITY_GROUPS[group].name,
      votes: ACTIVITY_GROUPS[group].votes,
      total: 0,
      activities: {},
    };
  });

  // Count activities
  activities.forEach((activity) => {
    const { group, activity: activityKey } = activity.classification;
    if (!counts[group].activities[activityKey]) {
      counts[group].activities[activityKey] = {
        name: activity.classification.activityName,
        count: 0,
        needsMapping: activity.classification.needsMapping,
      };
    }
    counts[group].activities[activityKey].count++;
    counts[group].total++;
  });

  return counts;
}

/**
 * Gets activities that need concept mapping from Neo4j
 * @param {String} userId - User ID
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} - Activities needing mapping
 */
async function getActivitiesNeedingMapping(userId, options = {}) {
  const activities = await fetchUserActivities(userId, options);
  
  return activities.filter(
    (activity) => 
      activity.classification.needsMapping && 
      !activity.conceptInfo.conceptId // No explicit concept ID
  );
}

/**
 * Get detailed activity breakdown for a user in the specific JSON format required
 * @param {Object} user - User object (must contain _id, firstname, lastname)
 * @returns {Promise<Object>} - Formatted activity breakdown
 */
async function getUserActivityBreakdown(user) {
  const userId = user._id.toString();
  const activities = await fetchUserActivities(userId);
  
  // Collect all course IDs to fetch names
  const courseIds = new Set();
  // Collect all annotation IDs for G6 activities
  const annotationIds = new Set();
  
  activities.forEach(a => {
      if (a.conceptInfo) {
          if (a.conceptInfo.courseId) {
              courseIds.add(a.conceptInfo.courseId);
          }
          // For G10, conceptId is actually courseId
          if (a.classification.group === 'G10' && a.conceptInfo.conceptId) {
              courseIds.add(a.conceptInfo.conceptId);
          }
          // For G6, collect annotation IDs
          if (a.classification.group === 'G6' && a.conceptInfo.annotationId) {
              annotationIds.add(a.conceptInfo.annotationId);
          }
      }
  });

  // Fetch course names from DB
  const Course = db.course;
  const courses = await Course.find({ _id: { $in: Array.from(courseIds) } }).select('name').lean();
  const courseMap = {};
  courses.forEach(c => {
      courseMap[c._id.toString()] = c.name;
  });

  // Fetch annotation data from DB for G6
  const Annotation = db.annotation;
  const annotations = await Annotation.find({ _id: { $in: Array.from(annotationIds) } }).select('location').lean();
  const annotationMap = {};
  annotations.forEach(ann => {
      annotationMap[ann._id.toString()] = {
          startPage: ann.location?.startPage || null
      };
  });

  const userActivitiesList = [];
  const targetGroups = Object.keys(ACTIVITY_GROUPS);

  for (const groupId of targetGroups) {
    const groupObj = {};
    groupObj[groupId] = {};

    const groupDef = ACTIVITY_GROUPS[groupId];
    
    // Initialize counts
    Object.keys(groupDef.activities).forEach(activityCode => {
        const activityName = groupDef.activities[activityCode].name;
        groupObj[groupId][activityCode] = {
            activity_code: activityCode,
            instances: [],
            activity_name: activityName,
            count: 0
        };
    });

    // Filter and count
    // rename a in filter(a=> to groupActivities) to be more descriptive
    const groupActivities = activities.filter(a => a.classification.group === groupId);
    groupActivities.forEach(a => {
        const code = a.classification.activity;  // A1 , A2 , rename to activity code 
        if (groupObj[groupId][code]) {
            groupObj[groupId][code].count++;
            
            const detail = {
                activity_id: a._id.toString()
            };

            if (a.conceptInfo) {
                if (groupId === 'G10') {
                    // G10 attributes: course_id, course_name
                    detail.course_id = a.conceptInfo.conceptId || null;
                    // Use DB course name if available, otherwise fallback to statement name
                    if (detail.course_id && courseMap[detail.course_id]) {
                        detail.course_name = courseMap[detail.course_id];
                    } else if (a.conceptInfo.conceptName) {
                        detail.course_name = a.conceptInfo.conceptName;
                    } else {
                        detail.course_name = null;
                    }
                } else if (groupId === 'G6') {
                    // G6 attributes: annotation_id, annotation_type, material_id, material_page, course_id, course_name
                    detail.annotation_id = a.conceptInfo.annotationId || null;
                    detail.annotation_type = a.conceptInfo.annotationType || null;
                    detail.material_id = a.conceptInfo.materialId || null;
                    
                    // For G6, get material_page from annotation collection
                    if (detail.annotation_id && annotationMap[detail.annotation_id]) {
                        detail.material_page = annotationMap[detail.annotation_id].startPage;
                    } else {
                        detail.material_page = null;
                    }
                    
                    detail.course_id = a.conceptInfo.courseId || null;
                    if (detail.course_id && courseMap[detail.course_id]) {
                        detail.course_name = courseMap[detail.course_id];
                    } else {
                        detail.course_name = null;
                    }
                } else if (groupId === 'G5') {
                    // G5 attributes: concept_id, concept_cid, concept_name, concept_type, material_id, material_page, course_id, course_name
                    // For G5 (textual/visual explanation), use main concept from concept_roads instead of recommended concept
                    detail.concept_id = a.conceptInfo.mainConceptId || null;
                    detail.concept_cid = a.conceptInfo.mainConceptCid || null;
                    detail.concept_name = a.conceptInfo.mainConceptName || null;
                    detail.concept_type = "main_concept";
                    detail.material_id = a.conceptInfo.materialId || null;
                    detail.material_page = a.conceptInfo.materialPage || null;
                    detail.course_id = a.conceptInfo.courseId || null;
                    if (detail.course_id && courseMap[detail.course_id]) {
                        detail.course_name = courseMap[detail.course_id];
                    } else {
                        detail.course_name = null;
                    }
                } else if (groupId === 'G7' || groupId === 'G8') {
                    // G7 and G8 attributes: material_id, material_page, course_id, course_name (no concept info)
                    detail.material_id = a.conceptInfo.materialId || null;
                    detail.material_page = a.conceptInfo.materialPage || null;
                    detail.course_id = a.conceptInfo.courseId || null;
                    if (detail.course_id && courseMap[detail.course_id]) {
                        detail.course_name = courseMap[detail.course_id];
                    } else {
                        detail.course_name = null;
                    }
                } else if (groupId === 'G1') {
                    // G1 attributes: material_id, material_page, course_id, course_name (no concept_name)
                    detail.material_id = a.conceptInfo.materialId || null;
                    detail.material_page = a.conceptInfo.materialPage || null;
                    detail.course_id = a.conceptInfo.courseId || null;
                    if (detail.course_id && courseMap[detail.course_id]) {
                        detail.course_name = courseMap[detail.course_id];
                    } else {
                        detail.course_name = null;
                    }
                } else if (groupId === 'G2') {
                    // G2 attributes: concept_id, concept_cid, concept_type, concept_name, material_id, course_id, course_name (no material_page)
                    detail.concept_id = a.conceptInfo.conceptId || null;
                    detail.concept_cid = a.conceptInfo.conceptCid || null;
                    detail.concept_type = a.conceptInfo.conceptType || null;
                    
                    if (a.conceptInfo.conceptName) {
                        let cName = a.conceptInfo.conceptName;
                        // Extract concept name if it follows the pattern "main concept: 'Name'"
                        const match = cName.match(/main concept[:\s]*'([^']+)'/i);
                        if (match && match[1]) {
                            cName = match[1];
                        }
                        detail.concept_name = cName;
                    } else {
                        detail.concept_name = null;
                    }
                    
                    detail.material_id = a.conceptInfo.materialId || null;
                    detail.course_id = a.conceptInfo.courseId || null;
                    if (detail.course_id && courseMap[detail.course_id]) {
                        detail.course_name = courseMap[detail.course_id];
                    } else {
                        detail.course_name = null;
                    }
                } else {
                    // G3, G4, G9 attributes: concept_id, concept_cid, concept_type, concept_name, material_id, material_page, course_id, course_name
                    detail.concept_id = a.conceptInfo.conceptId || null;
                    detail.concept_cid = a.conceptInfo.conceptCid || null;
                    detail.concept_type = a.conceptInfo.conceptType || null;
                    
                    if (a.conceptInfo.conceptName) {
                        let cName = a.conceptInfo.conceptName;
                        // Extract concept name if it follows the pattern "main concept: 'Name'"
                        const match = cName.match(/main concept[:\s]*'([^']+)'/i);
                        if (match && match[1]) {
                            cName = match[1];
                        }
                        detail.concept_name = cName;
                    } else {
                        detail.concept_name = null;
                    }
                    
                    detail.material_id = a.conceptInfo.materialId || null;
                    detail.material_page = a.conceptInfo.materialPage || null;
                    detail.course_id = a.conceptInfo.courseId || null;
                    if (detail.course_id && courseMap[detail.course_id]) {
                        detail.course_name = courseMap[detail.course_id];
                    } else {
                        detail.course_name = null;
                    }
                }
            } else {
                // If no conceptInfo at all, set all expected fields to null based on group
                if (groupId === 'G10') {
                    detail.course_id = null;
                    detail.course_name = null;
                } else if (groupId === 'G6') {
                    detail.annotation_id = null;
                    detail.annotation_type = null;
                    detail.material_id = null;
                    detail.material_page = null;
                    detail.course_id = null;
                    detail.course_name = null;
                } else if (groupId === 'G5') {
                    detail.concept_id = null;
                    detail.concept_cid = null;
                    detail.concept_name = null;
                    detail.concept_type = null;
                    detail.material_id = null;
                    detail.material_page = null;
                    detail.course_id = null;
                    detail.course_name = null;
                } else if (groupId === 'G7' || groupId === 'G8' || groupId === 'G1') {
                    detail.material_id = null;
                    detail.material_page = null;
                    detail.course_id = null;
                    detail.course_name = null;
                } else if (groupId === 'G2') {
                    detail.concept_id = null;
                    detail.concept_cid = null;
                    detail.concept_type = null;
                    detail.concept_name = null;
                    detail.material_id = null;
                    detail.course_id = null;
                    detail.course_name = null;
                } else {
                    // G3, G4, G9
                    detail.concept_id = null;
                    detail.concept_cid = null;
                    detail.concept_type = null;
                    detail.concept_name = null;
                    detail.material_id = null;
                    detail.material_page = null;
                    detail.course_id = null;
                    detail.course_name = null;
                }
            }

            groupObj[groupId][code].instances.push(detail);
        }
    });

    // Add message if count is 0
    Object.values(groupObj[groupId]).forEach(activity => {
        if (activity.count === 0) {
            activity.message = "the user has not made this activity yet";
        }
    });

    userActivitiesList.push(groupObj);
  }

  const fullUsername = `${user.firstname} ${user.lastname}`.trim();
  
  return {
    [userId]: {
      username: fullUsername,
      activities: userActivitiesList
    }
  };
}

module.exports = {
  fetchUserActivities,
  countActivitiesByGroup,
  classifyActivity,
  extractConceptInfo,
  getActivitiesNeedingMapping,
  getUserActivityBreakdown,
  ACTIVITY_GROUPS,
  ActivityClassifiers,
};
