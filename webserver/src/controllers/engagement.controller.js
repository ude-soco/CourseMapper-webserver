const db = require("../models");
const Activity = db.activity;
const Course = db.course;
const Role = db.role;
const Material = db.material;
const { getLevelOfEngagement } = require("../graph/neo4j");
const fs = require("fs");
const path = require("path");

/**
 * Read engagement metrics from CSV file for a specific user and course
 */
function readMetricsFromCSV(userId, courseId) {
  try {
    // Path to the CSV file
    // From dist-server/controllers/ (transpiled) or src/controllers/ (development) 
    // Go up to project root, then to coursemapper-kg/recommendation/activitiesProductionOrig.csv
    const csvPath = path.join(__dirname, "../../../coursemapper-kg/recommendation/activitiesProductionOrig.csv");
    
    if (!fs.existsSync(csvPath)) {
      console.warn(`CSV file not found at ${csvPath}`);
      return null;
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n").filter(line => line.trim());
    
    if (lines.length === 0) {
      return null;
    }

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(",");
      
      // Column indices:
      // 1: stdUsername (userId)
      // 2: course_id
      // 30: courseAccesses
      // 31: topicAccesses
      // 32: channelAccesses
      // 33: pdfAccess
      // 34: videoAccess
      // 36: dashboardCourseAccesses
      // 37: dashboardTopicAccesses
      // 38: dashboardChannelAccesses
      // 39: dashboardMaterialAccesses
      // 51: courseKnowledgeGraphAccesses
      // 52: materialKnowledgeGraphAccesses
      // 53: slideKnowledgeGraphAccesses
      // 56: totalKnowledgeGraphWikiArticleViewed
      // 60: mainConceptViewed
      // 65: totalRecommendedConcept/WikiViewed (recommendation KG access)
      // 68: totalSlideKnowledgeGraphMarkedUnderstood
      // 69: totalSlideKnowledgeGraphMarkedNotUnderstood
      // 70: totalSlideKnowledgeGraphMarkedAsNew
      
      if (columns.length < 71) continue;
      
      const csvUserId = columns[1]?.trim();
      const csvCourseId = columns[2]?.trim();
      
      if (csvUserId === String(userId) && csvCourseId === String(courseId)) {
        return {
          courseAccesses: parseInt(columns[30] || "0", 10),
          topicAccesses: parseInt(columns[31] || "0", 10),
          channelAccesses: parseInt(columns[32] || "0", 10),
          pdfAccess: parseInt(columns[33] || "0", 10),
          videoAccess: parseInt(columns[34] || "0", 10),
          materialAccesses: parseInt(columns[33] || "0", 10) + parseInt(columns[34] || "0", 10),
          dashboardCourseAccesses: parseInt(columns[36] || "0", 10),
          dashboardTopicAccesses: parseInt(columns[37] || "0", 10),
          dashboardChannelAccesses: parseInt(columns[38] || "0", 10),
          dashboardMaterialAccesses: parseInt(columns[39] || "0", 10),
          // KG metrics
          courseKnowledgeGraphAccesses: parseInt(columns[51] || "0", 10),
          materialKnowledgeGraphAccesses: parseInt(columns[52] || "0", 10),
          slideKnowledgeGraphAccesses: parseInt(columns[53] || "0", 10),
          recommendationKnowledgeGraphAccesses: parseInt(columns[65] || "0", 10),
          mainConceptViewed: parseInt(columns[60] || "0", 10),
          totalKnowledgeGraphWikiArticleViewed: parseInt(columns[56] || "0", 10),
          totalSlideKnowledgeGraphMarkedUnderstood: parseInt(columns[68] || "0", 10),
          totalSlideKnowledgeGraphMarkedNotUnderstood: parseInt(columns[69] || "0", 10),
          totalSlideKnowledgeGraphMarkedAsNew: parseInt(columns[70] || "0", 10)
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error reading CSV file:", error);
    return null;
  }
}

/**
 * Extract course ID from activity extensions
 */
function extractCourseIdFromExtensions(extensions) {
  if (!extensions || typeof extensions !== "object") return null;
  
  for (const path in extensions) {
    const data = extensions[path];
    if (typeof data === "object" && data !== null) {
      const courseId = data.course_id || data.courseId || data.id;
      if (courseId) {
        return String(courseId);
      }
    }
  }
  return null;
}

/**
 * Process activities and calculate engagement metrics for a user-course combination
 */
async function processUserCourseActivities(userId, courseId, activities) {
  const metrics = {
    // Annotation metrics
    totalAddedAnnotations: 0,
    totalAnnotationsReplied: 0,
    totalAnnotationsFollowed: 0,
    totalLikesOnAnnotations: 0,
    totalDislikesOnAnnotations: 0,
    totalAddedTags: 0,
    totalTagViewed: 0,
    
    // Material metrics
    videosStarted: 0,
    videosCompleted: 0,
    videosPauses: 0,
    timeSpentOnVideos: 0,
    pdfStarted: 0,
    pdfCompleted: 0,
    slidesViewed: 0,
    slidesNotUnderstood: 0,
    
    // Access metrics
    totalAccesses: 0,
    courseAccesses: 0,
    topicAccesses: 0,
    channelAccesses: 0,
    materialAccesses: 0,
    pdfAccess: 0,
    videoAccess: 0,
    
    // Dashboard access metrics
    totalDashboardAccesses: 0,
    dashboardCourseAccesses: 0,
    dashboardTopicAccesses: 0,
    dashboardChannelAccesses: 0,
    dashboardMaterialAccesses: 0,
    
    // Knowledge Graph metrics
    totalKnowledgeGraphAccesses: 0,
    totalKnowledgeGraphConceptViewed: 0,
    totalSlideKnowledgeGraphMarkedUnderstood: 0,
    totalSlideKnowledgeGraphMarkedNotUnderstood: 0,
    totalSlideKnowledgeGraphMarkedAsNew: 0,
    
    // Recommendation metrics
    totalRecommendedConceptViewed: 0,
    totalRecommendedConceptViewedVisualExplanation: 0,
    totalRecommendedConceptViewedTextualExplanation: 0,
    totalRecommendedMaterialViewed: 0,
    recommendedConceptsMarkedUnderstood: 0,
    recommendedConceptsMarkedNotUnderstood: 0,
    recommendedConceptsMarkedAsNew: 0,
    totalRecommendedMaterialMarkedHelpful: 0,
    totalRecommendedMaterialMarkedNotHelpful: 0,
    
    // User interaction metrics
    totalUserMentionedRepliedActivities: 0,
    
    // Detailed breakdowns
    annotations: {
      note: 0,
      question: 0,
      externalResource: 0,
    },
    likes: {
      note: 0,
      question: 0,
      externalResource: 0,
    },
    dislikes: {
      note: 0,
      question: 0,
      externalResource: 0,
    },
  };

  const startedVideos = new Set();
  const completedVideos = new Set();
  const startedPdfs = new Set();
  const completedPdfs = new Set();
  let playedTimeVidInSeconds = 0;
  let pausedTimeVideoInSeconds = 0;

  activities.forEach((activity) => {
    const verb = activity.statement?.verb?.display?.["en-US"] || "";
    const fullObjectType = activity.statement?.object?.definition?.type || "";
    const objectType = fullObjectType.split("/").pop() || "";
    const objectId = activity.statement?.object?.id || "";
    const extensions = activity.statement?.object?.definition?.extensions || {};
    const result = activity.statement?.result || {};
    
    // Normalize object type for matching (handle both URL format and simple format)
    const normalizedObjectType = objectType.toLowerCase().replace(/_/g, "-");

    const activityString = `${verb} ${objectType}`.toLowerCase();

    // Annotation activities
    if (verb.toLowerCase().includes("added") || verb.toLowerCase().includes("asked")) {
      metrics.totalAddedAnnotations++;
      if (objectType === "note") {
        metrics.annotations.note++;
      } else if (objectType === "question") {
        metrics.annotations.question++;
      } else if (objectType === "external-resource") {
        metrics.annotations.externalResource++;
      }
    }

    // Annotation interactions
    if (verb.toLowerCase().includes("replied") && objectType === "annotation") {
      metrics.totalAnnotationsReplied++;
    }
    if (verb.toLowerCase().includes("followed")) {
      metrics.totalAnnotationsFollowed++;
    }

    // Likes/Dislikes
    if (verb.toLowerCase() === "liked") {
      metrics.totalLikesOnAnnotations++;
      if (objectType === "note") metrics.likes.note++;
      else if (objectType === "question") metrics.likes.question++;
      else if (objectType === "external-resource") metrics.likes.externalResource++;
    } else if (verb.toLowerCase() === "unliked") {
      metrics.totalLikesOnAnnotations = Math.max(0, metrics.totalLikesOnAnnotations - 1);
      if (objectType === "note") metrics.likes.note = Math.max(0, metrics.likes.note - 1);
      else if (objectType === "question") metrics.likes.question = Math.max(0, metrics.likes.question - 1);
      else if (objectType === "external-resource") metrics.likes.externalResource = Math.max(0, metrics.likes.externalResource - 1);
    } else if (verb.toLowerCase() === "disliked") {
      metrics.totalDislikesOnAnnotations++;
      if (objectType === "note") metrics.dislikes.note++;
      else if (objectType === "question") metrics.dislikes.question++;
      else if (objectType === "external-resource") metrics.dislikes.externalResource++;
    } else if (verb.toLowerCase() === "un-disliked") {
      metrics.totalDislikesOnAnnotations = Math.max(0, metrics.totalDislikesOnAnnotations - 1);
      if (objectType === "note") metrics.dislikes.note = Math.max(0, metrics.dislikes.note - 1);
      else if (objectType === "question") metrics.dislikes.question = Math.max(0, metrics.dislikes.question - 1);
      else if (objectType === "external-resource") metrics.dislikes.externalResource = Math.max(0, metrics.dislikes.externalResource - 1);
    }

    // Tag activities
    if (verb.toLowerCase().includes("added") && objectType === "tag") {
      metrics.totalAddedTags++;
    }
    if (verb.toLowerCase().includes("viewed") && objectType.includes("tag")) {
      metrics.totalTagViewed++;
    }

    // Video activities
    if (verb.toLowerCase() === "played" && (objectType === "video" || objectType === "youtube")) {
      const duration = parseInt(result.duration || 0, 10);
      playedTimeVidInSeconds += duration;
      const videoId = extensions[Object.keys(extensions)[0]]?.id;
      if (duration === 0 && videoId) {
        startedVideos.add(videoId);
      }
    }
    if (verb.toLowerCase() === "paused" && (objectType === "video" || objectType === "youtube")) {
      const duration = parseInt(result.duration || 0, 10);
      pausedTimeVideoInSeconds += duration;
      metrics.videosPauses++;
    }
    if (verb.toLowerCase().includes("completed") && (objectType === "video" || objectType === "youtube")) {
      metrics.videosCompleted++;
      const videoId = extensions[Object.keys(extensions)[0]]?.id;
      if (videoId) {
        completedVideos.add(videoId);
      }
    }

    // PDF activities
    if (verb.toLowerCase().includes("viewed") && objectType === "slide") {
      metrics.slidesViewed++;
      const extKey = Object.keys(extensions)[0];
      const pageNr = extensions[extKey]?.material_pageNr;
      const pdfId = extensions[extKey]?.id;
      if (pageNr === 1 && pdfId) {
        metrics.pdfStarted++;
        startedPdfs.add(pdfId);
      }
    }
    if (verb.toLowerCase().includes("completed") && objectType === "pdf") {
      metrics.pdfCompleted++;
      const extKey = Object.keys(extensions)[0];
      const pdfId = extensions[extKey]?.id || activity.statement?.object?.id;
      if (pdfId) {
        completedPdfs.add(pdfId);
      }
    }
    if (verb.toLowerCase().includes("did not understand") && objectType === "slide") {
      metrics.slidesNotUnderstood++;
    }

    // Access activities - check object type and object ID
    if (verb.toLowerCase() === "accessed") {
      metrics.totalAccesses++;
      if (normalizedObjectType === "course" || objectId.includes("/course/") && !objectId.includes("dashboard") && !objectId.includes("knowledge-graph")) {
        metrics.courseAccesses++;
      } else if (normalizedObjectType === "topic" || objectId.includes("/topic/") && !objectId.includes("dashboard") && !objectId.includes("knowledge-graph")) {
        metrics.topicAccesses++;
      } else if (normalizedObjectType === "channel" || objectId.includes("/channel/") && !objectId.includes("dashboard") && !objectId.includes("knowledge-graph")) {
        metrics.channelAccesses++;
      } else if (normalizedObjectType === "pdf" || normalizedObjectType === "video" || normalizedObjectType === "youtube" || 
                 objectId.includes("/material/") && (objectId.includes("/pdf") || objectId.includes("/video"))) {
        metrics.materialAccesses++;
        if (normalizedObjectType === "pdf" || objectId.includes("/pdf")) {
          metrics.pdfAccess++;
        } else if (normalizedObjectType === "video" || normalizedObjectType === "youtube" || objectId.includes("/video")) {
          metrics.videoAccess++;
        }
      }
    }

    // Dashboard access activities
    if (verb.toLowerCase() === "accessed" && (normalizedObjectType.includes("dashboard") || objectId.includes("dashboard"))) {
      metrics.totalDashboardAccesses++;
      if (normalizedObjectType.includes("course-dashboard") || objectId.includes("course-dashboard")) {
        metrics.dashboardCourseAccesses++;
      } else if (normalizedObjectType.includes("topic-dashboard") || objectId.includes("topic-dashboard")) {
        metrics.dashboardTopicAccesses++;
      } else if (normalizedObjectType.includes("channel-dashboard") || objectId.includes("channel-dashboard")) {
        metrics.dashboardChannelAccesses++;
      } else if (normalizedObjectType.includes("material-dashboard") || objectId.includes("material-dashboard")) {
        metrics.dashboardMaterialAccesses++;
      }
    }

    // Knowledge Graph access activities
    if (verb.toLowerCase() === "accessed" && (normalizedObjectType.includes("knowledge-graph") || normalizedObjectType.includes("knowledgegraph") || 
        objectId.includes("knowledge-graph") || objectId.includes("course-knowledge-graph") || 
        objectId.includes("slide-knowledge-graph") || objectId.includes("material-knowledge-graph"))) {
      metrics.totalKnowledgeGraphAccesses++;
    }
    
    // Knowledge Graph concept viewed
    if (verb.toLowerCase() === "viewed" && (normalizedObjectType.includes("concept") || normalizedObjectType.includes("wiki") || 
        objectId.includes("concept") || objectId.includes("wiki"))) {
      if (normalizedObjectType.includes("knowledge-graph") || normalizedObjectType.includes("knowledgegraph") ||
          normalizedObjectType.includes("main-concept") || normalizedObjectType.includes("related-concept") ||
          normalizedObjectType.includes("category") || objectId.includes("knowledge-graph") ||
          objectId.includes("course-kg") || objectId.includes("material-kg") || objectId.includes("slide-kg")) {
        metrics.totalKnowledgeGraphConceptViewed++;
      }
    }

    // Slide Knowledge Graph marked activities
    if (normalizedObjectType.includes("slide-knowledge-graph") || normalizedObjectType.includes("slide-kg") ||
        objectId.includes("slide-knowledge-graph") || objectId.includes("slide-kg")) {
      if (verb.toLowerCase() === "understood" || verb.toLowerCase().includes("understood") || 
          verb.toLowerCase() === "marked as understood") {
        metrics.totalSlideKnowledgeGraphMarkedUnderstood++;
      } else if (verb.toLowerCase() === "did not understand" || verb.toLowerCase().includes("not understood") ||
                 verb.toLowerCase() === "marked as not understood") {
        metrics.totalSlideKnowledgeGraphMarkedNotUnderstood++;
      } else if (verb.toLowerCase().includes("marked as new") || verb.toLowerCase().includes("new") ||
                 verb.toLowerCase() === "marked as new") {
        metrics.totalSlideKnowledgeGraphMarkedAsNew++;
      }
    }

    // Recommendation concept activities
    if (normalizedObjectType.includes("recommended-concept") || normalizedObjectType.includes("slide-kg-recommended-concept") ||
        objectId.includes("recommended-concept") || objectId.includes("slide-kg-recommended-concept")) {
      if (verb.toLowerCase() === "viewed") {
        metrics.totalRecommendedConceptViewed++;
        // Check if it's visual or textual explanation
        const extKey = Object.keys(extensions)[0];
        if (extensions[extKey]?.explanationType === "visual" || normalizedObjectType.includes("visual") ||
            objectId.includes("visual")) {
          metrics.totalRecommendedConceptViewedVisualExplanation++;
        } else if (extensions[extKey]?.explanationType === "textual" || normalizedObjectType.includes("textual") ||
                   objectId.includes("textual")) {
          metrics.totalRecommendedConceptViewedTextualExplanation++;
        }
      } else if (verb.toLowerCase() === "understood" || verb.toLowerCase().includes("understood") ||
                 verb.toLowerCase() === "marked as understood") {
        metrics.recommendedConceptsMarkedUnderstood++;
      } else if (verb.toLowerCase() === "did not understand" || verb.toLowerCase().includes("not understood") ||
                 verb.toLowerCase() === "marked as not understood") {
        metrics.recommendedConceptsMarkedNotUnderstood++;
      } else if (verb.toLowerCase().includes("marked as new") || verb.toLowerCase().includes("new") ||
                 verb.toLowerCase() === "marked as new") {
        metrics.recommendedConceptsMarkedAsNew++;
      }
    }

    // Recommended material activities
    if (normalizedObjectType.includes("recommended") && (normalizedObjectType.includes("article") || 
        normalizedObjectType.includes("video") || normalizedObjectType.includes("material") ||
        objectId.includes("recommended-article") || objectId.includes("recommended-video"))) {
      if (verb.toLowerCase() === "viewed") {
        metrics.totalRecommendedMaterialViewed++;
      } else if (verb.toLowerCase() === "marked as helpful" || verb.toLowerCase().includes("helpful") ||
                 verb.toLowerCase() === "helpful") {
        metrics.totalRecommendedMaterialMarkedHelpful++;
      } else if (verb.toLowerCase() === "marked as not helpful" || verb.toLowerCase().includes("not helpful") ||
                 verb.toLowerCase() === "not helpful" || verb.toLowerCase() === "unhelpful") {
        metrics.totalRecommendedMaterialMarkedNotHelpful++;
      }
    }

    // User mentioned/replied activities
    if (verb.toLowerCase().includes("mentioned") || verb.toLowerCase().includes("replied")) {
      if (normalizedObjectType === "annotation" || normalizedObjectType === "user" ||
          objectId.includes("annotation") || objectId.includes("user")) {
        metrics.totalUserMentionedRepliedActivities++;
      }
    }
  });

  metrics.videosStarted = startedVideos.size;
  metrics.timeSpentOnVideos = Math.max(0, pausedTimeVideoInSeconds - playedTimeVidInSeconds);

  return {
    metrics,
    videoIds: {
      started: Array.from(startedVideos),
      completed: Array.from(completedVideos)
    },
    pdfIds: {
      started: Array.from(startedPdfs),
      completed: Array.from(completedPdfs)
    }
  };
}

/**
 * Get user engagement metrics for a specific course
 */
export const getUserEngagementMetrics = async (req, res) => {
  try {
    const userId = req.params.userId;
    const courseId = req.params.courseId;

    if (!userId || !courseId) {
      return res.status(400).send({ error: "User ID and Course ID are required" });
    }

    // Get user role ID
    const userRole = await Role.findOne({ name: "user" });
    if (!userRole) {
      return res.status(500).send({ error: "User role not found" });
    }

    // Verify user is enrolled in course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).send({ error: "Course not found" });
    }

    const userInCourse = course.users?.find(
      (u) => String(u.userId) === String(userId) && String(u.role) === String(userRole._id)
    );
    if (!userInCourse) {
      return res.status(403).send({ error: "User is not enrolled in this course" });
    }

    // Get all activities for this user
    const activities = await Activity.find({
      "statement.actor.account.name": userId,
    }).sort({ "statement.timestamp": 1 });

    // Filter activities by course
    const courseActivities = activities.filter((activity) => {
      const extensions = activity.statement?.object?.definition?.extensions || {};
      const courseIdFromExt = extractCourseIdFromExtensions(extensions);
      return courseIdFromExt === String(courseId);
    });

    // Process activities to get metrics
    const { metrics, videoIds, pdfIds } = await processUserCourseActivities(userId, courseId, courseActivities);

    // Override metrics with CSV data if available
    const csvMetrics = readMetricsFromCSV(userId, courseId);
    if (csvMetrics) {
      // Access metrics
      metrics.courseAccesses = csvMetrics.courseAccesses;
      metrics.topicAccesses = csvMetrics.topicAccesses;
      metrics.channelAccesses = csvMetrics.channelAccesses;
      metrics.pdfAccess = csvMetrics.pdfAccess;
      metrics.videoAccess = csvMetrics.videoAccess;
      metrics.materialAccesses = csvMetrics.materialAccesses;
      metrics.dashboardCourseAccesses = csvMetrics.dashboardCourseAccesses;
      metrics.dashboardTopicAccesses = csvMetrics.dashboardTopicAccesses;
      metrics.dashboardChannelAccesses = csvMetrics.dashboardChannelAccesses;
      metrics.dashboardMaterialAccesses = csvMetrics.dashboardMaterialAccesses;
      
      // KG metrics
      metrics.courseKnowledgeGraphAccesses = csvMetrics.courseKnowledgeGraphAccesses;
      metrics.materialKnowledgeGraphAccesses = csvMetrics.materialKnowledgeGraphAccesses;
      metrics.slideKnowledgeGraphAccesses = csvMetrics.slideKnowledgeGraphAccesses;
      metrics.recommendationKnowledgeGraphAccesses = csvMetrics.recommendationKnowledgeGraphAccesses;
      metrics.mainConceptViewed = csvMetrics.mainConceptViewed;
      metrics.totalKnowledgeGraphWikiArticleViewed = csvMetrics.totalKnowledgeGraphWikiArticleViewed;
      metrics.totalSlideKnowledgeGraphMarkedUnderstood = csvMetrics.totalSlideKnowledgeGraphMarkedUnderstood;
      metrics.totalSlideKnowledgeGraphMarkedNotUnderstood = csvMetrics.totalSlideKnowledgeGraphMarkedNotUnderstood;
      metrics.totalSlideKnowledgeGraphMarkedAsNew = csvMetrics.totalSlideKnowledgeGraphMarkedAsNew;
    }

    // Fetch material details for videos and PDFs
    const allMaterialIds = [...new Set([...videoIds.started, ...videoIds.completed, ...pdfIds.started, ...pdfIds.completed])];
    const materials = await Material.find({ _id: { $in: allMaterialIds } }).select('_id name channelId courseId type');

    // Create maps for quick lookup
    const materialMap = {};
    materials.forEach(material => {
      materialMap[String(material._id)] = {
        id: String(material._id),
        name: material.name,
        channelId: String(material.channelId),
        courseId: String(material.courseId),
        type: material.type
      };
    });

    // Get engagement level from Neo4j
    let engagementLevel = "medium";
    try {
      const engagementRecords = await getLevelOfEngagement(userId);
      // engagementRecords is already an array, not an object with .records property
      const courseEngagement = engagementRecords?.find(
        (record) => record?.target?.properties?.cid === String(courseId)
      );
      if (courseEngagement?.r?.properties?.level) {
        engagementLevel = courseEngagement.r.properties.level.toLowerCase();
      }
    } catch (neo4jError) {
      console.warn("Could not fetch engagement level from Neo4j:", neo4jError);
    }

    // Map video and PDF IDs to material details
    const videoDetails = {
      started: videoIds.started.map(id => materialMap[id]).filter(Boolean),
      completed: videoIds.completed.map(id => materialMap[id]).filter(Boolean)
    };

    const pdfDetails = {
      started: pdfIds.started.map(id => materialMap[id]).filter(Boolean),
      completed: pdfIds.completed.map(id => materialMap[id]).filter(Boolean)
    };

    res.status(200).send({
      userId,
      courseId,
      engagementLevel,
      metrics,
      materialDetails: {
        videos: videoDetails,
        pdfs: pdfDetails
      }
    });
  } catch (error) {
    console.error("Error getting user engagement metrics:", error);
    res.status(500).send({ error: error.message });
  }
};

/**
 * Get peer activities data from JSON file
 */
export const getPeerActivities = async (req, res) => {
  try {
    // Path to the JSON file
    const jsonPath = path.join(__dirname, "../../../coursemapper-kg/recommendation/activitiesProductionOrig.json");
    
    if (!fs.existsSync(jsonPath)) {
      console.warn(`JSON file not found at ${jsonPath}`);
      return res.status(404).send({ error: "Peer activities data not found" });
    }

    const jsonContent = fs.readFileSync(jsonPath, "utf-8");
    const data = JSON.parse(jsonContent);
    
    res.status(200).send(data);
  } catch (error) {
    console.error("Error reading peer activities JSON file:", error);
    res.status(500).send({ error: error.message });
  }
};

