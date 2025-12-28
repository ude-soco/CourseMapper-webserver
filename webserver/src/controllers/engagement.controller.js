const db = require("../models");
const Activity = db.activity;
const Course = db.course;
const Role = db.role;
const Material = db.material;
const { getLevelOfEngagement, getAllUsersWithEngagementLevelForCourse, getUsersWithHigherEngagementLevelForCourse, getMaterialSlides } = require("../graph/neo4j");
const fs = require("fs");
const path = require("path");

// Import shared helpers from course.controller to avoid code duplication
const { findUserById, handleError } = require("./course.controller");

/**
 * Read cluster centroids from the cluster_centroids.json file
 * @returns {Object} Object containing centroids for all courses, keyed by course ID
 */
function readClusterCentroids() {
  try {
    const jsonPath = path.join(__dirname, "../../../cluster_centroids.json");
    
    if (!fs.existsSync(jsonPath)) {
      console.warn(`Cluster centroids file not found at ${jsonPath}`);
      return {};
    }

    const jsonContent = fs.readFileSync(jsonPath, "utf-8");
    const centroids = JSON.parse(jsonContent);
    return centroids || {};
  } catch (error) {
    console.error("Error reading cluster centroids file:", error);
    return {};
  }
}

/**
 * Get centroid values for a specific course and engagement level
 * @param {string} courseId - The course ID
 * @param {string} level - The engagement level ('low', 'medium', 'high')
 * @returns {Object|null} The centroid values for the specified level or null if not found
 */
function getCentroidForLevel(courseId, level) {
  const allCentroids = readClusterCentroids();
  const courseCentroids = allCentroids[String(courseId)];
  
  if (!courseCentroids) {
    console.warn(`No centroids found for course ${courseId}`);
    return null;
  }
  
  return courseCentroids[level] || null;
}

/**
 * Read all user profiles from the activitiesProductionOrig.json file
 * @returns {Array} Array of user activity profiles
 */
function readAllProfilesFromJSON() {
  try {
    const jsonPath = path.join(__dirname, "../../../activitiesProductionOrig.json");
    
    if (!fs.existsSync(jsonPath)) {
      console.warn(`JSON file not found at ${jsonPath}`);
      return [];
    }

    const jsonContent = fs.readFileSync(jsonPath, "utf-8");
    const profiles = JSON.parse(jsonContent);
    return profiles || [];
  } catch (error) {
    console.error("Error reading JSON file:", error);
    return [];
  }
}

/**
 * Read engagement metrics from JSON file for a specific user and course
 * @param {string} userId - The user ID (stdUsername in JSON)
 * @param {string} courseId - The course ID
 * @returns {Object|null} The user's activity profile or null if not found
 */
function readMetricsFromJSON(userId, courseId) {
  try {
    const profiles = readAllProfilesFromJSON();
    
    const userProfile = profiles.find(p => 
      p.stdProfile?.stdUsername === String(userId) && 
      p.stdProfile?.course_id === String(courseId)
    );
    
    if (!userProfile) {
      return null;
    }

    const ap = userProfile.activitiesProfile;
    
    // Map JSON structure to our metrics structure
    return {
      // Annotation metrics
      totalAddedAnnotations: ap.annotations?.totalAddedAnnotations || 0,
      totalAnnotationsReplied: ap.annotations?.totalAnnotationsReplied || 0,
      totalAnnotationsFollowed: ap.annotations?.totalAnnotationsFollowed || 0,
      totalLikesOnAnnotations: ap.likes?.likesOnAnnotations?.totalLikesOnAnnotations || 0,
      totalDislikesOnAnnotations: ap.dislikes?.dislikesOnAnnotations?.totalDislikesOnAnnotations || 0,
      totalAddedTags: ap.tag?.totalAddedTags || 0,
      totalTagViewed: ap.tag?.tagsViewed?.totalTagViewed || 0,
      
      // Material metrics
      videosStarted: ap.materialProfile?.video?.videosStarted || 0,
      videosCompleted: ap.materialProfile?.video?.videosCompleted || 0,
      videosPauses: ap.materialProfile?.video?.videosPauses || 0,
      timeSpentOnVideos: ap.materialProfile?.video?.timeSpentOnVideos || 0,
      pdfStarted: ap.materialProfile?.pdf?.pdfStarted || 0,
      pdfCompleted: ap.materialProfile?.pdf?.pdfCompleted || 0,
      slidesViewed: ap.materialProfile?.pdf?.slidesViewed || 0,
      slidesNotUnderstood: ap.materialProfile?.pdf?.slidesNotUnderstood || 0,
      
      // Access metrics
      totalAccesses: ap.access?.totalAccesses || 0,
      courseAccesses: ap.access?.courseAccesses || 0,
      topicAccesses: ap.access?.topicAccesses || 0,
      channelAccesses: ap.access?.channelAccesses || 0,
      materialAccesses: (ap.access?.materialAccesses?.pdfAccess || 0) + (ap.access?.materialAccesses?.videoAccess || 0),
      pdfAccess: ap.access?.materialAccesses?.pdfAccess || 0,
      videoAccess: ap.access?.materialAccesses?.videoAccess || 0,
      
      // Dashboard access metrics
      totalDashboardAccesses: ap.dashboardAccess?.totalDashboardAccesses || 0,
      dashboardCourseAccesses: ap.dashboardAccess?.courseAccesses || 0,
      dashboardTopicAccesses: ap.dashboardAccess?.topicAccesses || 0,
      dashboardChannelAccesses: ap.dashboardAccess?.channelAccesses || 0,
      dashboardMaterialAccesses: ap.dashboardAccess?.materialAccesses || 0,
      
      // Knowledge Graph metrics
      totalKnowledgeGraphAccesses: ap.knowledgeGraph?.knowledgeGraphAccesses?.totalKnowledgeGraphAccesses || 0,
      courseKnowledgeGraphAccesses: ap.knowledgeGraph?.knowledgeGraphAccesses?.courseKnowledgeGraphAccesses || 0,
      materialKnowledgeGraphAccesses: ap.knowledgeGraph?.knowledgeGraphAccesses?.materialKnowledgeGraphAccesses || 0,
      slideKnowledgeGraphAccesses: ap.knowledgeGraph?.knowledgeGraphAccesses?.slideKnowledgeGraphAccesses || 0,
      totalKnowledgeGraphConceptViewed: ap.knowledgeGraph?.knowledgeGraphViewed?.totalKnowledgeGraphConceptViewed || 0,
      totalKnowledgeGraphWikiArticleViewed: ap.knowledgeGraph?.knowledgeGraphViewed?.totalKnowledgeGraphWikiArticleViewed || 0,
      totalSlideKnowledgeGraphMarkedUnderstood: ap.knowledgeGraph?.slideKnowledgeGraphMarked?.totalSlideKnowledgeGraphMarkedUnderstood || 0,
      totalSlideKnowledgeGraphMarkedNotUnderstood: ap.knowledgeGraph?.slideKnowledgeGraphMarked?.totalSlideKnowledgeGraphMarkedNotUnderstood || 0,
      totalSlideKnowledgeGraphMarkedAsNew: ap.knowledgeGraph?.slideKnowledgeGraphMarked?.totalSlideKnowledgeGraphMarkedAsNew || 0,
      
      // Recommendation metrics
      recommendedConceptsMarkedUnderstood: ap.knowledgeGraph?.slideKnowledgeGraphMarked?.recommendedConceptsMarkedUnderstood || 0,
      recommendedConceptsMarkedNotUnderstood: ap.knowledgeGraph?.slideKnowledgeGraphMarked?.recommendedConceptsMarkedNotUnderstood || 0,
      recommendedConceptsMarkedAsNew: ap.knowledgeGraph?.slideKnowledgeGraphMarked?.recommendedConceptsMarkedMarkedAsNew || 0,
      totalRecommendedMaterialMarkedHelpful: ap.knowledgeGraph?.slideKnowledgeGraphMarked?.recommendedMaterial?.totalRecommendedMaterialMarkedHelpful || 0,
      totalRecommendedMaterialMarkedNotHelpful: ap.knowledgeGraph?.slideKnowledgeGraphMarked?.recommendedMaterial?.totalRecommendedMaterialMarkedNotHelpful || 0
    };
  } catch (error) {
    console.error("Error reading metrics from JSON:", error);
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
    courseKnowledgeGraphAccesses: 0,
    materialKnowledgeGraphAccesses: 0,
    slideKnowledgeGraphAccesses: 0,
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
    totalAnnotationsMentioned: 0,
    totalActivities: 0,
    
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
  
  // Track video play/pause events by video ID for accurate time calculation
  // Key: videoId, Value: { lastPlayedTimestamp: Date }
  const videoPlayEvents = new Map();
  let totalVideoTimeInSeconds = 0;
  
  // Track time spent per video: Map<videoId, { name: string, timeInSeconds: number, lastAccessedTimestamp: Date }>
  const videoTimeDetails = new Map();
  
  // Track slides viewed per PDF: Map<pdfId, { name: string, uniqueSlidesViewed: Set<number>, totalSlidesViewed: number, lastAccessedSlide: number, lastAccessedTimestamp: Date }>
  const pdfSlideDetails = new Map();
  
  // Track unique slides viewed globally (across all PDFs) to avoid counting duplicate views
  // Key: "pdfId:slideNr" to uniquely identify each slide
  const globalUniqueSlides = new Set();

  // Helper function to parse timestamp from various formats (MongoDB date object or string)
  const parseTimestamp = (ts) => {
    if (!ts) return null;
    // Handle MongoDB $date format
    if (ts.$date) {
      return new Date(ts.$date);
    }
    // Handle direct Date object or string
    return new Date(ts);
  };

  // Sort activities by timestamp to ensure correct order for time calculations
  const sortedActivities = [...activities].sort((a, b) => {
    const tsA = parseTimestamp(a.statement?.timestamp);
    const tsB = parseTimestamp(b.statement?.timestamp);
    if (!tsA || !tsB) return 0;
    return tsA - tsB;
  });

  sortedActivities.forEach((activity) => {
    const verb = activity.statement?.verb?.display?.["en-US"] || "";
    const fullObjectType = activity.statement?.object?.definition?.type || "";
    const objectType = fullObjectType.split("/").pop() || "";
    const objectId = activity.statement?.object?.id || "";
    const extensions = activity.statement?.object?.definition?.extensions || {};
    const result = activity.statement?.result || {};
    const timestamp = parseTimestamp(activity.statement?.timestamp);
    
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
    // Guideline 1: Each video appears to be played twice when first played - only consider once per unique video
    // Guideline 2: Time spent = timestamp difference between paused and played (T: paused - T: played)
    if (verb.toLowerCase() === "played" && (objectType === "video" || objectType === "youtube")) {
      const extKey = Object.keys(extensions)[0];
      const videoId = extensions[extKey]?.id;
      const videoName = extensions[extKey]?.name || activity.statement?.object?.definition?.name?.["en-US"] || "Unknown Video";
      // Extract video position timestamp from extensions (stored as 'timestamp' in seconds)
      const videoTimestamp = parseInt(extensions[extKey]?.timestamp) || 0;
      
      if (videoId) {
        const videoIdStr = String(videoId?.$oid || videoId);
        // Track as started only once per unique video
        if (!startedVideos.has(videoIdStr)) {
          startedVideos.add(videoIdStr);
        }
        // Initialize video time tracking if not exists
        if (!videoTimeDetails.has(videoIdStr)) {
          videoTimeDetails.set(videoIdStr, { name: videoName, timeInSeconds: 0, lastAccessedTimestamp: videoTimestamp, lastAccessedActivityTimestamp: timestamp });
        }
        // Update last accessed timestamp
        const videoDetail = videoTimeDetails.get(videoIdStr);
        if (!videoDetail.lastAccessedActivityTimestamp || (timestamp && timestamp > videoDetail.lastAccessedActivityTimestamp)) {
          videoDetail.lastAccessedTimestamp = videoTimestamp;
          videoDetail.lastAccessedActivityTimestamp = timestamp;
        }
        // Store the play timestamp for time calculation
        if (timestamp && !isNaN(timestamp.getTime())) {
          videoPlayEvents.set(videoIdStr, { lastPlayedTimestamp: timestamp });
        }
      }
    }
    if (verb.toLowerCase() === "paused" && (objectType === "video" || objectType === "youtube")) {
      metrics.videosPauses++;
      const extKey = Object.keys(extensions)[0];
      const videoId = extensions[extKey]?.id;
      const videoName = extensions[extKey]?.name || activity.statement?.object?.definition?.name?.["en-US"] || "Unknown Video";
      // Extract video position timestamp from extensions (stored as 'timestamp' in seconds)
      const videoTimestamp = parseInt(extensions[extKey]?.timestamp) || 0;
      
      // Calculate time spent using timestamp difference (T: paused - T: played)
      if (videoId && timestamp && !isNaN(timestamp.getTime())) {
        const videoIdStr = String(videoId?.$oid || videoId);
        const playEvent = videoPlayEvents.get(videoIdStr);
        if (playEvent && playEvent.lastPlayedTimestamp && !isNaN(playEvent.lastPlayedTimestamp.getTime())) {
          const timeDiffSeconds = (timestamp.getTime() - playEvent.lastPlayedTimestamp.getTime()) / 1000;
          if (timeDiffSeconds > 0 && timeDiffSeconds < 3600) { // Sanity check: max 1 hour per segment
            totalVideoTimeInSeconds += timeDiffSeconds;
            // Track time per video
            if (!videoTimeDetails.has(videoIdStr)) {
              videoTimeDetails.set(videoIdStr, { name: videoName, timeInSeconds: 0, lastAccessedTimestamp: videoTimestamp, lastAccessedActivityTimestamp: timestamp });
            }
            const videoDetail = videoTimeDetails.get(videoIdStr);
            videoDetail.timeInSeconds += timeDiffSeconds;
            // Update last accessed timestamp (paused position is more accurate as "last watched" position)
            if (!videoDetail.lastAccessedActivityTimestamp || (timestamp && timestamp > videoDetail.lastAccessedActivityTimestamp)) {
              videoDetail.lastAccessedTimestamp = videoTimestamp;
              videoDetail.lastAccessedActivityTimestamp = timestamp;
            }
          }
          // Clear the play event after calculating
          videoPlayEvents.delete(videoIdStr);
        }
      }
    }
    if (verb.toLowerCase().includes("completed") && (objectType === "video" || objectType === "youtube")) {
      const extKey = Object.keys(extensions)[0];
      const videoId = extensions[extKey]?.id;
      if (videoId) {
        const videoIdStr = String(videoId?.$oid || videoId);
        completedVideos.add(videoIdStr);
        // A completed video should also be counted as started
        if (!startedVideos.has(videoIdStr)) {
          startedVideos.add(videoIdStr);
        }
      }
    }

    // PDF activities
    // Guideline 3: First time a PDF is accessed = PDF started (handled in Access section below)
    // Guideline 4: All completed PDFs are also PDFs started
    // Guideline 5: Completed action for unique PDF only considered first time (using Set)
    if (verb.toLowerCase().includes("viewed") && objectType === "slide") {
      // Also track PDF as started when viewing any slide (backup tracking)
      const extKey = Object.keys(extensions)[0];
      const pdfId = extensions[extKey]?.material_id || extensions[extKey]?.id;
      const pdfName = extensions[extKey]?.material_name || activity.statement?.object?.definition?.name?.["en-US"] || "Unknown PDF";
      const pdfIdStr = String(pdfId?.$oid || pdfId);
      // Ensure slideNr is always a number for consistent Set comparison
      const rawSlideNr = extensions[extKey]?.material_pageNr;
      const slideNr = Number(rawSlideNr) || 1;
      
      // Only count unique slides globally (pdfId + slideNr combination)
      const globalSlideKey = `${pdfIdStr}:${slideNr}`;
      if (!globalUniqueSlides.has(globalSlideKey)) {
        globalUniqueSlides.add(globalSlideKey);
        metrics.slidesViewed++;
      }
      
      if (pdfId && !startedPdfs.has(pdfIdStr)) {
        startedPdfs.add(pdfIdStr);
      }
      
      // Track unique slides viewed per PDF
      if (pdfId) {
        if (!pdfSlideDetails.has(pdfIdStr)) {
          pdfSlideDetails.set(pdfIdStr, { 
            name: pdfName, 
            uniqueSlidesViewed: new Set(), 
            totalSlidesViewed: 0,
            maxSlideViewed: slideNr,
            lastAccessedSlide: slideNr,
            lastAccessedTimestamp: timestamp
          });
        }
        const pdfDetail = pdfSlideDetails.get(pdfIdStr);
        // Only increment totalSlidesViewed if this is a new unique slide
        if (!pdfDetail.uniqueSlidesViewed.has(slideNr)) {
          pdfDetail.uniqueSlidesViewed.add(slideNr);
          pdfDetail.totalSlidesViewed++;
        }
        // Track max slide number to estimate total pages
        if (slideNr > pdfDetail.maxSlideViewed) {
          pdfDetail.maxSlideViewed = slideNr;
        }
        // Update last accessed if this timestamp is more recent
        if (!pdfDetail.lastAccessedTimestamp || (timestamp && timestamp > pdfDetail.lastAccessedTimestamp)) {
          pdfDetail.lastAccessedSlide = slideNr;
          pdfDetail.lastAccessedTimestamp = timestamp;
        }
      }
    }
    if (verb.toLowerCase().includes("completed") && objectType === "pdf") {
      const extKey = Object.keys(extensions)[0];
      const pdfId = extensions[extKey]?.id || activity.statement?.object?.id;
      if (pdfId) {
        const pdfIdStr = String(pdfId?.$oid || pdfId);
        // Guideline 5: Only count first completion per unique PDF
        if (!completedPdfs.has(pdfIdStr)) {
          completedPdfs.add(pdfIdStr);
        }
        // Guideline 4: A completed PDF should also be counted as started
        if (!startedPdfs.has(pdfIdStr)) {
          startedPdfs.add(pdfIdStr);
        }
      }
    }
    if (verb.toLowerCase().includes("did not understand") && objectType === "slide") {
      metrics.slidesNotUnderstood++;
    }

    // Access activities - check object type and object ID
    // Guideline 3: First time a PDF is accessed = PDF started
    // Priority: Use normalizedObjectType from activity definition type (e.g., "http://www.CourseMapper.de/activityType/topic" -> "topic")
    // The objectId contains the full path like "/course/.../topic/.../channel/.../material/..." so we need to be careful
    // to only use objectId as a fallback and check for the most specific path segment
    if (verb.toLowerCase() === "accessed") {
      metrics.totalAccesses++;
      
      // Check for dashboard or knowledge-graph in type or objectId first (handle these separately)
      const isDashboard = normalizedObjectType.includes("dashboard") || objectId.includes("dashboard");
      const isKnowledgeGraph = normalizedObjectType.includes("knowledge-graph") || normalizedObjectType.includes("knowledgegraph") || objectId.includes("knowledge-graph");
      
      if (!isDashboard && !isKnowledgeGraph) {
        // Material accesses (pdf, video, youtube) - check these first as they're most specific
        if (normalizedObjectType === "pdf" || normalizedObjectType === "video" || normalizedObjectType === "youtube") {
          metrics.materialAccesses++;
          if (normalizedObjectType === "pdf") {
            metrics.pdfAccess++;
            // Guideline 3: Track "PDFs started" as the first time a PDF ObjectID has been 'accessed'
            const extKey = Object.keys(extensions)[0];
            const pdfId = extensions[extKey]?.id || activity.statement?.object?.id;
            if (pdfId && !startedPdfs.has(String(pdfId))) {
              startedPdfs.add(String(pdfId));
            }
          } else {
            metrics.videoAccess++;
          }
        } else if (normalizedObjectType === "channel") {
          metrics.channelAccesses++;
        } else if (normalizedObjectType === "topic") {
          metrics.topicAccesses++;
        } else if (normalizedObjectType === "course") {
          metrics.courseAccesses++;
        } else {
          // Fallback: try to determine from objectId structure (most specific path wins)
          // objectId format: /activity/course/{id}/topic/{id}/channel/{id}/material/{id}
          if (objectId.includes("/material/")) {
            metrics.materialAccesses++;
            if (objectId.includes("/pdf") || objectId.toLowerCase().includes("pdf")) {
              metrics.pdfAccess++;
            } else {
              metrics.videoAccess++;
            }
          } else if (objectId.includes("/channel/")) {
            metrics.channelAccesses++;
          } else if (objectId.includes("/topic/")) {
            metrics.topicAccesses++;
          } else if (objectId.includes("/course/")) {
            metrics.courseAccesses++;
          }
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
      
      // Increment specific KG type counters (check objectId path - order matters, most specific first)
      // Note: Slide KG has type course-knowledge-graph but objectId contains /slide-knowledge-graph
      if (objectId.includes('slide-knowledge-graph')) {
        metrics.slideKnowledgeGraphAccesses++;
      } else if (objectId.includes('material-knowledge-graph')) {
        metrics.materialKnowledgeGraphAccesses++;
      } else if (objectId.includes('course-knowledge-graph')) {
        metrics.courseKnowledgeGraphAccesses++;
      }
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
        // Track mentioned and replied separately
        if (verb.toLowerCase().includes("mentioned")) {
          metrics.totalAnnotationsMentioned++;
        }
      }
    }
  });

  // Final metrics calculation
  metrics.totalActivities = activities.length;
  metrics.videosStarted = startedVideos.size;
  metrics.videosCompleted = completedVideos.size;
  // Guideline 2: Time spent on videos in seconds (calculated from timestamp differences)
  metrics.timeSpentOnVideos = Math.max(0, Math.round(totalVideoTimeInSeconds));
  // Guideline 3 & 4: PDFs started includes accessed + viewed slides + completed
  metrics.pdfStarted = startedPdfs.size;
  // Guideline 5: PDF completed only counts unique completions
  metrics.pdfCompleted = completedPdfs.size;

  // Convert Maps to arrays for the response
  const videoTimeDetailsArray = Array.from(videoTimeDetails.entries()).map(([id, details]) => ({
    id,
    name: details.name,
    timeInSeconds: Math.round(details.timeInSeconds),
    timeInMinutes: Math.round(details.timeInSeconds / 60 * 10) / 10, // Round to 1 decimal
    lastAccessedTimestamp: details.lastAccessedTimestamp || 0 // Video position in seconds
  }));

  const pdfSlideDetailsArray = Array.from(pdfSlideDetails.entries()).map(([id, details]) => ({
    id,
    name: details.name,
    uniqueSlidesViewed: details.uniqueSlidesViewed.size,
    totalSlidesViewed: details.totalSlidesViewed,
    maxSlideViewed: details.maxSlideViewed || 1,
    lastAccessedSlide: details.lastAccessedSlide || 1
  }));

  return {
    metrics,
    videoIds: {
      started: Array.from(startedVideos),
      completed: Array.from(completedVideos)
    },
    pdfIds: {
      started: Array.from(startedPdfs),
      completed: Array.from(completedPdfs)
    },
    // New detailed tracking for slides and video time chart
    slideAndVideoDetails: {
      pdfSlides: pdfSlideDetailsArray,
      videoTime: videoTimeDetailsArray
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
    const { metrics, videoIds, pdfIds, slideAndVideoDetails } = await processUserCourseActivities(userId, courseId, courseActivities);

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

    // Enrich pdfSlides with actual total slides count from Neo4j
    if (slideAndVideoDetails?.pdfSlides?.length > 0) {
      const enrichedPdfSlides = await Promise.all(
        slideAndVideoDetails.pdfSlides.map(async (pdf) => {
          try {
            const slides = await getMaterialSlides(pdf.id);
            const totalSlides = slides?.length || pdf.maxSlideViewed || 1;
            return {
              ...pdf,
              totalSlides: totalSlides
            };
          } catch (err) {
            console.warn(`Could not get slides count for material ${pdf.id}:`, err);
            return {
              ...pdf,
              totalSlides: pdf.maxSlideViewed || 1
            };
          }
        })
      );
      slideAndVideoDetails.pdfSlides = enrichedPdfSlides;
    }

    res.status(200).send({
      userId,
      courseId,
      engagementLevel,
      metrics,
      materialDetails: {
        videos: videoDetails,
        pdfs: pdfDetails
      },
      slideAndVideoDetails
    });
  } catch (error) {
    console.error("Error getting user engagement metrics:", error);
    res.status(500).send({ error: error.message });
  }
};

/**
 * Verify activity logging is working
 */
export const verifyActivityLogging = async (req, res) => {
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

    // Check if activities exist for this user
    const activitiesCount = await Activity.countDocuments({
      "statement.actor.account.name": userId,
    });

    // Check JSON data availability
    const jsonMetrics = readMetricsFromJSON(userId, courseId);

    res.status(200).send({
      userId,
      courseId,
      activitiesLogged: activitiesCount > 0,
      totalActivities: activitiesCount,
      jsonDataAvailable: jsonMetrics !== null,
      verificationStatus: activitiesCount > 0 ? "OK" : "NO_ACTIVITIES_FOUND"
    });
  } catch (error) {
    console.error("Error verifying activity logging:", error);
    res.status(500).send({ error: error.message });
  }
};

/**
 * Get same engagement level statistics with average and maximum values for each metric
 * Pipeline:
 * 1. Get current user's engagement level for this specific course from Neo4j
 * 2. Get all users with the same engagement level for the SAME course from Neo4j
 * 3. Fetch activity values from activitiesProductionOrig.json for peer users
 * 4. Fetch current user's LIVE metrics from MongoDB (to ensure current user is always included)
 * 5. Calculate average and maximum statistics (including current user and all peers with same level)
 */
export const getSameEngagementLevelStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    const courseId = req.params.courseId;

    if (!userId || !courseId) {
      return res.status(400).send({ error: "User ID and Course ID are required" });
    }

    // Step 1: Get current user's engagement level for THIS SPECIFIC COURSE from Neo4j
    let currentUserEngagementLevel = "medium";
    try {
      const engagementRecords = await getLevelOfEngagement(userId);
      const courseEngagement = engagementRecords?.find(
        (record) => record?.target?.properties?.cid === String(courseId)
      );
      if (courseEngagement?.r?.properties?.level) {
        currentUserEngagementLevel = courseEngagement.r.properties.level.toLowerCase();
      }
      console.log(`User ${userId} has engagement level: ${currentUserEngagementLevel} for course ${courseId}`);
    } catch (neo4jError) {
      console.warn("Could not fetch engagement level from Neo4j:", neo4jError);
    }

    // Step 2: Get all users with the same engagement level for the SAME COURSE from Neo4j
    let sameLevelUsers = [];
    try {
      sameLevelUsers = await getAllUsersWithEngagementLevelForCourse(courseId, currentUserEngagementLevel);
      console.log(`Found ${sameLevelUsers.length} users with ${currentUserEngagementLevel} engagement level for course ${courseId}`);
    } catch (neo4jError) {
      console.warn("Could not fetch same level users from Neo4j:", neo4jError);
    }

    // Extract user IDs from Neo4j results
    const sameLevelUserIds = sameLevelUsers
      .map(record => record?.u?.properties?.uid)
      .filter(uid => uid != null);

    console.log(`Same level user IDs from Neo4j for course ${courseId}: ${sameLevelUserIds.join(', ')}`);

    // Step 3: Get peer user IDs (excluding current user)
    const peerUserIds = sameLevelUserIds.filter(id => String(id) !== String(userId));
    console.log(`Peer user IDs (excluding current user): ${peerUserIds.join(', ')}`);

    // Step 4: Fetch CURRENT USER's LIVE metrics from MongoDB
    // This ensures the current user is ALWAYS included in statistics
    let currentUserLiveMetrics = null;
    try {
      const activities = await Activity.find({
        "statement.actor.account.name": userId,
      }).sort({ "statement.timestamp": 1 });

      const courseActivities = activities.filter((activity) => {
        const extensions = activity.statement?.object?.definition?.extensions || {};
        const courseIdFromExt = extractCourseIdFromExtensions(extensions);
        return courseIdFromExt === String(courseId);
      });

      const { metrics } = await processUserCourseActivities(userId, courseId, courseActivities);

      currentUserLiveMetrics = {
        // Annotation metrics
        totalAddedAnnotations: metrics.totalAddedAnnotations || 0,
        totalAnnotationsReplied: metrics.totalAnnotationsReplied || 0,
        totalAnnotationsFollowed: metrics.totalAnnotationsFollowed || 0,
        totalAnnotationsMentioned: metrics.totalAnnotationsMentioned || 0,
        totalLikesOnAnnotations: metrics.totalLikesOnAnnotations || 0,
        totalDislikesOnAnnotations: metrics.totalDislikesOnAnnotations || 0,
        totalAddedTags: metrics.totalAddedTags || 0,
        totalTagViewed: metrics.totalTagViewed || 0,
        // Material metrics
        videosStarted: metrics.videosStarted || 0,
        videosCompleted: metrics.videosCompleted || 0,
        videosPauses: metrics.videosPauses || 0,
        timeSpentOnVideos: metrics.timeSpentOnVideos || 0,
        pdfStarted: metrics.pdfStarted || 0,
        pdfCompleted: metrics.pdfCompleted || 0,
        slidesViewed: metrics.slidesViewed || 0,
        slidesNotUnderstood: metrics.slidesNotUnderstood || 0,
        // Access metrics
        totalAccesses: metrics.totalAccesses || 0,
        courseAccesses: metrics.courseAccesses || 0,
        topicAccesses: metrics.topicAccesses || 0,
        channelAccesses: metrics.channelAccesses || 0,
        materialAccesses: metrics.materialAccesses || 0,
        pdfAccess: metrics.pdfAccess || 0,
        videoAccess: metrics.videoAccess || 0,
        // Dashboard access metrics
        totalDashboardAccesses: metrics.totalDashboardAccesses || 0,
        dashboardCourseAccesses: metrics.dashboardCourseAccesses || 0,
        dashboardTopicAccesses: metrics.dashboardTopicAccesses || 0,
        dashboardChannelAccesses: metrics.dashboardChannelAccesses || 0,
        dashboardMaterialAccesses: metrics.dashboardMaterialAccesses || 0,
        // Knowledge Graph metrics
        totalKnowledgeGraphAccesses: metrics.totalKnowledgeGraphAccesses || 0,
        totalKnowledgeGraphConceptViewed: metrics.totalKnowledgeGraphConceptViewed || 0,
        totalSlideKnowledgeGraphMarkedUnderstood: metrics.totalSlideKnowledgeGraphMarkedUnderstood || 0,
        totalSlideKnowledgeGraphMarkedNotUnderstood: metrics.totalSlideKnowledgeGraphMarkedNotUnderstood || 0,
        totalSlideKnowledgeGraphMarkedAsNew: metrics.totalSlideKnowledgeGraphMarkedAsNew || 0,
        courseKnowledgeGraphAccesses: metrics.courseKnowledgeGraphAccesses || 0,
        materialKnowledgeGraphAccesses: metrics.materialKnowledgeGraphAccesses || 0,
        slideKnowledgeGraphAccesses: metrics.slideKnowledgeGraphAccesses || 0,
        totalKnowledgeGraphWikiArticleViewed: metrics.totalKnowledgeGraphWikiArticleViewed || 0,
        // Recommendation metrics
        recommendedConceptsMarkedUnderstood: metrics.recommendedConceptsMarkedUnderstood || 0,
        recommendedConceptsMarkedNotUnderstood: metrics.recommendedConceptsMarkedNotUnderstood || 0,
        recommendedConceptsMarkedAsNew: metrics.recommendedConceptsMarkedAsNew || 0,
        totalRecommendedMaterialMarkedHelpful: metrics.totalRecommendedMaterialMarkedHelpful || 0,
        totalRecommendedMaterialMarkedNotHelpful: metrics.totalRecommendedMaterialMarkedNotHelpful || 0
      };
      console.log(`Fetched live metrics for current user ${userId}`);
    } catch (liveMetricsError) {
      console.warn("Could not fetch live metrics for current user:", liveMetricsError);
    }

    // Step 5: Fetch activity metrics from JSON file for PEER users (not current user)
    const peerMetricsArray = [];
    for (const peerUserId of peerUserIds) {
      const jsonMetrics = readMetricsFromJSON(peerUserId, courseId);
      if (jsonMetrics) {
        peerMetricsArray.push(jsonMetrics);
        console.log(`Found JSON metrics for peer ${peerUserId} in course ${courseId}`);
      } else {
        console.log(`No JSON metrics found for peer ${peerUserId} in course ${courseId}`);
      }
    }

    console.log(`Collected metrics for ${peerMetricsArray.length} peers from JSON file`);

    // Step 6: Combine current user's live metrics with peer metrics for statistics
    // This ensures we calculate based on ALL users with same engagement level
    const allSameLevelMetricsArray = [];
    
    // Always include current user's live metrics
    if (currentUserLiveMetrics) {
      allSameLevelMetricsArray.push(currentUserLiveMetrics);
      console.log(`Added current user's live metrics to statistics`);
    }
    
    // Add peer metrics from JSON
    allSameLevelMetricsArray.push(...peerMetricsArray);
    
    console.log(`Total users included in statistics: ${allSameLevelMetricsArray.length} (1 current user + ${peerMetricsArray.length} peers)`);

    // Calculate statistics
    const usersWithSameLevel = sameLevelUserIds.length;
    const usersWithMetrics = allSameLevelMetricsArray.length;

    // Step 7: Calculate average and maximum for each metric using ALL same-level users
    const statistics = {};
    const metricKeys = [
      // Annotation metrics
      'totalAddedAnnotations', 'totalAnnotationsReplied', 'totalAnnotationsFollowed', 'totalAnnotationsMentioned',
      'totalLikesOnAnnotations', 'totalDislikesOnAnnotations', 'totalAddedTags', 'totalTagViewed',
      // Material metrics
      'videosStarted', 'videosCompleted', 'videosPauses', 'timeSpentOnVideos',
      'pdfStarted', 'pdfCompleted', 'slidesViewed', 'slidesNotUnderstood',
      // Access metrics
      'totalAccesses', 'courseAccesses', 'topicAccesses', 'channelAccesses',
      'materialAccesses', 'pdfAccess', 'videoAccess',
      // Dashboard access metrics
      'totalDashboardAccesses', 'dashboardCourseAccesses', 'dashboardTopicAccesses',
      'dashboardChannelAccesses', 'dashboardMaterialAccesses',
      // Knowledge Graph metrics
      'totalKnowledgeGraphAccesses', 'totalKnowledgeGraphConceptViewed',
      'totalSlideKnowledgeGraphMarkedUnderstood', 'totalSlideKnowledgeGraphMarkedNotUnderstood',
      'totalSlideKnowledgeGraphMarkedAsNew',
      'courseKnowledgeGraphAccesses', 'materialKnowledgeGraphAccesses',
      'slideKnowledgeGraphAccesses', 'totalKnowledgeGraphWikiArticleViewed',
      // Recommendation metrics
      'recommendedConceptsMarkedUnderstood', 'recommendedConceptsMarkedNotUnderstood',
      'recommendedConceptsMarkedAsNew', 'totalRecommendedMaterialMarkedHelpful',
      'totalRecommendedMaterialMarkedNotHelpful'
    ];

    for (const key of metricKeys) {
      const values = allSameLevelMetricsArray.map(m => m[key] || 0);
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const max = Math.max(...values);
        statistics[key] = {
          average: Math.round(avg * 100) / 100, // Round to 2 decimal places
          maximum: max,
          count: values.length
        };
      } else {
        statistics[key] = {
          average: 0,
          maximum: 0,
          count: 0
        };
      }
    }

    res.status(200).send({
      userId,
      courseId,
      currentUserEngagementLevel,
      sameLevelStats: {
        usersWithSameEngagementLevel: usersWithSameLevel,
        usersWithMetrics: usersWithMetrics,
        peerCount: peerMetricsArray.length,
        peerUsers: peerUserIds,
        currentUserIncluded: !!currentUserLiveMetrics
      },
      statistics
    });
  } catch (error) {
    console.error("Error getting same engagement level stats:", error);
    res.status(500).send({ error: error.message });
  }
};

/**
 * Get annotation activity details for a specific user and course
 * Returns detailed information about annotations created, interactions, likes/dislikes, and tags
 */
export const getAnnotationActivityDetails = async (req, res) => {
  try {
    const userId = req.params.userId;
    const courseId = req.params.courseId;
    const category = req.query.category || 'all'; // 'added', 'interactions', 'likesdislikes', 'tags', 'all'

    if (!userId || !courseId) {
      return res.status(400).send({ error: "User ID and Course ID are required" });
    }

    // Get all activities for this user
    const activities = await Activity.find({
      "statement.actor.account.name": userId,
    }).sort({ "statement.timestamp": -1 }); // Most recent first

    // Filter activities by course
    const courseActivities = activities.filter((activity) => {
      const extensions = activity.statement?.object?.definition?.extensions || {};
      const courseIdFromExt = extractCourseIdFromExtensions(extensions);
      return courseIdFromExt === String(courseId);
    });

    const result = {
      addedAnnotations: [],
      annotationInteractions: [],
      likesAndDislikes: [],
      tagActivities: []
    };

    courseActivities.forEach((activity) => {
      const verb = activity.statement?.verb?.display?.["en-US"] || "";
      const fullObjectType = activity.statement?.object?.definition?.type || "";
      const objectType = fullObjectType.split("/").pop() || "";
      const objectId = activity.statement?.object?.id || "";
      const extensions = activity.statement?.object?.definition?.extensions || {};
      const timestamp = activity.statement?.timestamp || activity.createdAt;
      
      // Get annotation/object details from extensions
      const extKey = Object.keys(extensions)[0];
      const extData = extensions[extKey] || {};
      
      const activityDetail = {
        id: activity._id,
        verb: verb,
        type: objectType,
        objectId: objectId,
        timestamp: timestamp,
        materialId: extData.id || extData.material_id || null,
        materialName: extData.material_name || extData.name || null,
        channelId: extData.channel_id || extData.channelId || null,
        content: extData.content || extData.text || null,
        annotationType: extData.type || objectType
      };

      // Categorize activities
      // 1. Added Annotations (note, question, external resource)
      if ((category === 'all' || category === 'added') && 
          (verb.toLowerCase().includes("added") || verb.toLowerCase().includes("asked")) &&
          (objectType === "note" || objectType === "question" || objectType === "external-resource")) {
        result.addedAnnotations.push(activityDetail);
      }

      // 2. Annotation Interactions (followed, mentioned, replied)
      if ((category === 'all' || category === 'interactions')) {
        if (verb.toLowerCase().includes("followed")) {
          result.annotationInteractions.push({ ...activityDetail, interactionType: 'followed' });
        }
        if (verb.toLowerCase().includes("mentioned")) {
          result.annotationInteractions.push({ ...activityDetail, interactionType: 'mentioned' });
        }
        if (verb.toLowerCase().includes("replied")) {
          result.annotationInteractions.push({ ...activityDetail, interactionType: 'replied' });
        }
      }

      // 3. Likes and Dislikes on annotations
      if ((category === 'all' || category === 'likesdislikes') &&
          (verb.toLowerCase() === "liked" || verb.toLowerCase() === "disliked") &&
          (objectType === "note" || objectType === "question" || objectType === "external-resource" || objectType === "annotation")) {
        result.likesAndDislikes.push({ 
          ...activityDetail, 
          action: verb.toLowerCase() === "liked" ? 'like' : 'dislike'
        });
      }

      // 4. Tag Activities (added or viewed)
      if ((category === 'all' || category === 'tags') &&
          (objectType === "tag" || objectType.includes("tag"))) {
        if (verb.toLowerCase().includes("added")) {
          result.tagActivities.push({ ...activityDetail, tagAction: 'added' });
        }
        if (verb.toLowerCase().includes("viewed")) {
          result.tagActivities.push({ ...activityDetail, tagAction: 'viewed' });
        }
      }
    });

    res.status(200).send({
      userId,
      courseId,
      category,
      activities: result
    });
  } catch (error) {
    console.error("Error getting annotation activity details:", error);
    res.status(500).send({ error: error.message });
  }
};

/**
 * Get knowledge graph activity details for a specific user and course
 * Returns detailed information about KG accesses, concept views, and marked concepts
 * @param {string} userId - The user ID
 * @param {string} courseId - The course ID
 * @param {string} category - 'summary' (accesses & views), 'marked' (U/DNU/new), or 'all'
 */
export const getKGActivityDetails = async (req, res) => {
  try {
    const userId = req.params.userId;
    const courseId = req.params.courseId;
    const category = req.query.category || 'all'; // 'summary', 'marked', 'all'

    if (!userId || !courseId) {
      return res.status(400).send({ error: "User ID and Course ID are required" });
    }

    // Get all activities for this user
    const activities = await Activity.find({
      "statement.actor.account.name": userId,
    }).sort({ "statement.timestamp": -1 }); // Most recent first

    // Filter activities by course
    const courseActivities = activities.filter((activity) => {
      const extensions = activity.statement?.object?.definition?.extensions || {};
      const courseIdFromExt = extractCourseIdFromExtensions(extensions);
      return courseIdFromExt === String(courseId);
    });

    const result = {
      kgAccesses: [],      // KG access events (course, material, slide KG accesses)
      conceptsViewed: [],  // Concepts and wiki articles viewed
      markedConcepts: []   // Concepts marked as U/DNU/new
    };

    courseActivities.forEach((activity) => {
      const verb = activity.statement?.verb?.display?.["en-US"] || "";
      const verbLower = verb.toLowerCase();
      const fullObjectType = activity.statement?.object?.definition?.type || "";
      const objectType = fullObjectType.split("/").pop() || "";
      const objectId = activity.statement?.object?.id || "";
      const objectName = activity.statement?.object?.definition?.name?.["en-US"] || "";
      const extensions = activity.statement?.object?.definition?.extensions || {};
      const timestamp = activity.statement?.timestamp || activity.createdAt;
      
      // Get details from extensions
      const extKey = Object.keys(extensions)[0];
      const extData = extensions[extKey] || {};
      
      const activityDetail = {
        id: activity._id,
        verb: verb,
        type: objectType,
        objectId: objectId,
        objectName: objectName,
        timestamp: timestamp,
        conceptId: extData.conceptId || extData.concept_id || extData.id || null,
        conceptName: extData.concept_name || extData.name || null,
        conceptType: extData.conceptType || extData.concept_type || null,
        materialId: extData.materialId || extData.material_id || null,
        materialName: extData.materialName || extData.material_name || null,
        materialPage: extData.materialPage || null,
        courseId: extData.courseId || extData.course_id || courseId,
        wikiUrl: extData.concept_wiki_url || extData.concept_wikipedia || null
      };

      // Check if this is a KG-related activity
      const isKGActivity = objectType.includes('knowledge-graph') || 
                           objectType.includes('kg-') ||
                           objectType.includes('course-kg') ||
                           objectType.includes('material-kg') ||
                           objectType.includes('slide-kg') ||
                           fullObjectType.includes('knowledge-graph') ||
                           fullObjectType.includes('concept');

      if (!isKGActivity) return;

      // 1. KG Accesses (course, material, slide KG accessed)
      // Include 'accesses' category for kgActivities3 chart which shows only KG access locations
      if ((category === 'all' || category === 'summary' || category === 'accesses') && verbLower === 'accessed') {
        let kgType = 'Unknown';
        // Check objectId path to determine KG type (order matters - most specific first)
        // Note: Slide KG has type course-knowledge-graph but objectId contains /slide-knowledge-graph
        if (objectId.includes('slide-knowledge-graph')) {
          kgType = 'Slide KG';
        } else if (objectId.includes('material-knowledge-graph')) {
          kgType = 'Material KG';
        } else if (objectId.includes('course-knowledge-graph')) {
          kgType = 'Course KG';
        } else if (objectId.includes('recommendation-knowledge-graph')) {
          kgType = 'Recommendation KG';
        }
        result.kgAccesses.push({ ...activityDetail, kgType: kgType });
      }

      // 2. Concepts/Wiki Viewed
      if ((category === 'all' || category === 'summary') && 
          (verbLower === 'viewed' || verbLower.includes('viewed'))) {
        let viewType = 'Concept';
        if (verbLower.includes('full article') || verbLower.includes('wiki')) {
          viewType = 'Wiki Article';
        } else if (verbLower.includes('visual explanation')) {
          viewType = 'Visual Explanation';
        } else if (verbLower.includes('textual explanation')) {
          viewType = 'Textual Explanation';
        }
        
        // Extract concept name from object name if not in extensions
        let conceptName = activityDetail.conceptName;
        if (!conceptName && objectName) {
          const conceptMatch = objectName.match(/Concept[:\s]*['"]?([^'"-]+)['"]?/i);
          if (conceptMatch) {
            conceptName = conceptMatch[1].trim();
          }
        }
        
        result.conceptsViewed.push({ 
          ...activityDetail, 
          viewType: viewType,
          conceptName: conceptName || 'Unknown Concept'
        });
      }

      // 3. Marked Concepts (Understood, Not Understood, New)
      if ((category === 'all' || category === 'marked') && 
          (verbLower.includes('marked') || verbLower.includes('understand'))) {
        let markType = 'Unknown';
        if (verbLower.includes('understood') && !verbLower.includes('not')) {
          markType = 'Understood';
        } else if (verbLower.includes('not understood') || verbLower.includes('did not understand')) {
          markType = 'Did Not Understand';
        } else if (verbLower.includes('new')) {
          markType = 'New';
        }
        
        // Extract concept name from object name if not in extensions
        let conceptName = activityDetail.conceptName;
        if (!conceptName && objectName) {
          const conceptMatch = objectName.match(/[Cc]oncept[:\s]*['"]?([^'"-]+)['"]?/i);
          if (conceptMatch) {
            conceptName = conceptMatch[1].trim();
          }
        }
        
        result.markedConcepts.push({ 
          ...activityDetail, 
          markType: markType,
          conceptName: conceptName || 'Unknown Concept'
        });
      }
    });

    res.status(200).send({
      userId,
      courseId,
      category,
      activities: result
    });
  } catch (error) {
    console.error("Error getting KG activity details:", error);
    res.status(500).send({ error: error.message });
  }
};

/**
 * Get recommendation activity details for a specific user and course
 * Returns detailed information about recommended materials and concepts marked
 * @param {string} userId - The user ID
 * @param {string} courseId - The course ID
 * @param {string} category - 'materials' (helpful/not helpful), 'concepts' (U/DNU/new), or 'all'
 */
export const getRecommendationActivityDetails = async (req, res) => {
  try {
    const userId = req.params.userId;
    const courseId = req.params.courseId;
    const category = req.query.category || 'all'; // 'materials', 'concepts', 'all'

    if (!userId || !courseId) {
      return res.status(400).send({ error: "User ID and Course ID are required" });
    }

    // Get all activities for this user
    const activities = await Activity.find({
      "statement.actor.account.name": userId,
    }).sort({ "statement.timestamp": -1 }); // Most recent first

    // Filter activities by course
    const courseActivities = activities.filter((activity) => {
      const extensions = activity.statement?.object?.definition?.extensions || {};
      const courseIdFromExt = extractCourseIdFromExtensions(extensions);
      return courseIdFromExt === String(courseId);
    });

    const result = {
      materialActivities: [],   // Recommended materials marked helpful/not helpful
      conceptActivities: []     // Recommended concepts marked U/DNU/new
    };

    courseActivities.forEach((activity) => {
      const verb = activity.statement?.verb?.display?.["en-US"] || "";
      const verbLower = verb.toLowerCase();
      const fullObjectType = activity.statement?.object?.definition?.type || "";
      const objectType = fullObjectType.split("/").pop() || "";
      const objectId = activity.statement?.object?.id || "";
      const objectName = activity.statement?.object?.definition?.name?.["en-US"] || "";
      const extensions = activity.statement?.object?.definition?.extensions || {};
      const timestamp = activity.statement?.timestamp || activity.createdAt;
      
      // Get details from extensions
      const extKey = Object.keys(extensions)[0];
      const extData = extensions[extKey] || {};
      
      const activityDetail = {
        id: activity._id,
        verb: verb,
        type: objectType,
        objectId: objectId,
        objectName: objectName,
        timestamp: timestamp,
        materialId: extData.materialId || extData.material_id || null,
        materialName: extData.materialName || extData.material_name || null,
        materialPage: extData.materialPage || null,
        courseId: extData.courseId || extData.course_id || courseId
      };

      // Check if this is a recommendation-related activity
      const isRecommendedMaterial = objectType.includes('recommended-article') || 
                                     objectType.includes('recommended-video') ||
                                     objectId.includes('recommended-article') ||
                                     objectId.includes('recommended-video');
      
      const isRecommendedConcept = objectType.includes('recommended-concept') ||
                                    objectId.includes('recommended-concept');

      // 1. Recommended Materials marked helpful/not helpful
      if ((category === 'all' || category === 'materials') && isRecommendedMaterial) {
        if (verbLower.includes('marked') && (verbLower.includes('helpful') || verbLower.includes('not helpful'))) {
          let markType = 'Unknown';
          let resourceType = 'Unknown';
          let resourceName = '';
          
          if (verbLower.includes('not helpful')) {
            markType = 'Not Helpful';
          } else if (verbLower.includes('helpful')) {
            markType = 'Helpful';
          }
          
          // Determine if it's an article or video
          if (objectType.includes('article') || objectId.includes('article')) {
            resourceType = 'Article';
            // Extract article name from object name
            const articleMatch = objectName.match(/article\s*['"]?([^'"]+)['"]?/i);
            resourceName = articleMatch ? articleMatch[1].trim() : extData.articleId || 'Unknown Article';
          } else if (objectType.includes('video') || objectId.includes('video')) {
            resourceType = 'Video';
            // Extract video title from object name
            const videoMatch = objectName.match(/video\s*['"]?([^'"]+)['"]?/i);
            resourceName = videoMatch ? videoMatch[1].trim() : extData.videoTitle || extData.videoId || 'Unknown Video';
          }
          
          result.materialActivities.push({ 
            ...activityDetail, 
            markType: markType,
            resourceType: resourceType,
            resourceName: resourceName
          });
        }
      }

      // 2. Recommended Concepts marked U/DNU/new
      if ((category === 'all' || category === 'concepts') && isRecommendedConcept) {
        if (verbLower.includes('marked') || verbLower.includes('understand')) {
          let markType = 'Unknown';
          let conceptName = '';
          
          if (verbLower.includes('understood') && !verbLower.includes('not')) {
            markType = 'Understood';
          } else if (verbLower.includes('not understood')) {
            markType = 'Did Not Understand';
          } else if (verbLower.includes('new')) {
            markType = 'New';
          }
          
          // Extract concept name from object name
          const conceptMatch = objectName.match(/concept\s*['"]?([^'"]+)['"]?\s*-/i);
          conceptName = conceptMatch ? conceptMatch[1].trim() : extData.conceptId || extData.id || 'Unknown Concept';
          
          result.conceptActivities.push({ 
            ...activityDetail, 
            markType: markType,
            conceptName: conceptName,
            conceptId: extData.conceptId || extData.id || null
          });
        }
      }
    });

    res.status(200).send({
      userId,
      courseId,
      category,
      activities: result
    });
  } catch (error) {
    console.error("Error getting recommendation activity details:", error);
    res.status(500).send({ error: error.message });
  }
};

/**
 * Get access activity details for a specific user and course
 * Returns detailed information about access activities (course, topic, channel, material)
 * @param {string} userId - The user ID
 * @param {string} courseId - The course ID
 * @param {string} category - 'course', 'topic', 'channel', 'material', or 'all'
 */
export const getAccessActivityDetails = async (req, res) => {
  try {
    const userId = req.params.userId;
    const courseId = req.params.courseId;
    const category = req.query.category || 'all'; // 'course', 'topic', 'channel', 'material', 'all'

    if (!userId || !courseId) {
      return res.status(400).send({ error: "User ID and Course ID are required" });
    }

    // Get all activities for this user
    const activities = await Activity.find({
      "statement.actor.account.name": userId,
    }).sort({ "statement.timestamp": -1 }); // Most recent first

    // Filter activities by course
    const courseActivities = activities.filter((activity) => {
      const extensions = activity.statement?.object?.definition?.extensions || {};
      const courseIdFromExt = extractCourseIdFromExtensions(extensions);
      return courseIdFromExt === String(courseId);
    });

    const result = {
      courseAccesses: [],
      topicAccesses: [],
      channelAccesses: [],
      materialAccesses: []
    };

    // Count frequencies by name for summary
    const courseFrequency = new Map();
    const topicFrequency = new Map();
    const channelFrequency = new Map();
    const materialFrequency = new Map();

    courseActivities.forEach((activity) => {
      const verb = activity.statement?.verb?.display?.["en-US"] || "";
      const verbLower = verb.toLowerCase();
      const fullObjectType = activity.statement?.object?.definition?.type || "";
      const objectType = fullObjectType.split("/").pop() || "";
      const normalizedObjectType = objectType.toLowerCase().replace(/_/g, "-");
      const objectId = activity.statement?.object?.id || "";
      const objectName = activity.statement?.object?.definition?.name?.["en-US"] || "";
      const extensions = activity.statement?.object?.definition?.extensions || {};
      const timestamp = activity.statement?.timestamp || activity.createdAt;
      
      // Get details from extensions
      const extKey = Object.keys(extensions)[0];
      const extData = extensions[extKey] || {};
      
      // Only process access activities
      if (verbLower !== "accessed") return;
      
      // Skip dashboard and knowledge-graph accesses
      const isDashboard = normalizedObjectType.includes("dashboard") || objectId.includes("dashboard");
      const isKnowledgeGraph = normalizedObjectType.includes("knowledge-graph") || normalizedObjectType.includes("knowledgegraph") || objectId.includes("knowledge-graph");
      if (isDashboard || isKnowledgeGraph) return;

      const activityDetail = {
        id: activity._id,
        verb: verb,
        type: objectType,
        objectId: objectId,
        objectName: objectName,
        timestamp: timestamp
      };

      // Categorize by type - use same logic as metrics calculation
      if (normalizedObjectType === "pdf" || normalizedObjectType === "video" || normalizedObjectType === "youtube") {
        if (category === 'all' || category === 'material') {
          const materialName = extData.name || objectName || 'Unknown Material';
          const materialType = normalizedObjectType === "pdf" ? "PDF" : "Video";
          result.materialAccesses.push({
            ...activityDetail,
            materialId: extData.id || null,
            materialName: materialName,
            materialType: materialType,
            channelId: extData.channel_id || null,
            topicId: extData.topic_id || null
          });
          
          // Track frequency
          const key = materialName;
          materialFrequency.set(key, (materialFrequency.get(key) || 0) + 1);
        }
      } else if (normalizedObjectType === "channel") {
        if (category === 'all' || category === 'channel') {
          const channelName = extData.name || objectName || 'Unknown Channel';
          result.channelAccesses.push({
            ...activityDetail,
            channelId: extData.id || null,
            channelName: channelName,
            topicId: extData.topic_id || null
          });
          
          // Track frequency
          const key = channelName;
          channelFrequency.set(key, (channelFrequency.get(key) || 0) + 1);
        }
      } else if (normalizedObjectType === "topic") {
        if (category === 'all' || category === 'topic') {
          const topicName = extData.name || objectName || 'Unknown Topic';
          result.topicAccesses.push({
            ...activityDetail,
            topicId: extData.id || null,
            topicName: topicName
          });
          
          // Track frequency
          const key = topicName;
          topicFrequency.set(key, (topicFrequency.get(key) || 0) + 1);
        }
      } else if (normalizedObjectType === "course") {
        if (category === 'all' || category === 'course') {
          const courseName = extData.name || objectName || 'Unknown Course';
          result.courseAccesses.push({
            ...activityDetail,
            accessedCourseId: extData.id || null,
            courseName: courseName
          });
          
          // Track frequency
          const key = courseName;
          courseFrequency.set(key, (courseFrequency.get(key) || 0) + 1);
        }
      } else {
        // Fallback: try to determine from objectId structure (most specific path wins)
        if (objectId.includes("/material/")) {
          if (category === 'all' || category === 'material') {
            const materialName = extData.name || objectName || 'Unknown Material';
            result.materialAccesses.push({
              ...activityDetail,
              materialId: extData.id || null,
              materialName: materialName,
              materialType: 'Unknown'
            });
            materialFrequency.set(materialName, (materialFrequency.get(materialName) || 0) + 1);
          }
        } else if (objectId.includes("/channel/")) {
          if (category === 'all' || category === 'channel') {
            const channelName = extData.name || objectName || 'Unknown Channel';
            result.channelAccesses.push({
              ...activityDetail,
              channelId: extData.id || null,
              channelName: channelName
            });
            channelFrequency.set(channelName, (channelFrequency.get(channelName) || 0) + 1);
          }
        } else if (objectId.includes("/topic/")) {
          if (category === 'all' || category === 'topic') {
            const topicName = extData.name || objectName || 'Unknown Topic';
            result.topicAccesses.push({
              ...activityDetail,
              topicId: extData.id || null,
              topicName: topicName
            });
            topicFrequency.set(topicName, (topicFrequency.get(topicName) || 0) + 1);
          }
        } else if (objectId.includes("/course/")) {
          if (category === 'all' || category === 'course') {
            const courseName = extData.name || objectName || 'Unknown Course';
            result.courseAccesses.push({
              ...activityDetail,
              accessedCourseId: extData.id || null,
              courseName: courseName
            });
            courseFrequency.set(courseName, (courseFrequency.get(courseName) || 0) + 1);
          }
        }
      }
    });

    // Convert frequency maps to sorted arrays
    const sortByFrequency = (map) => {
      return Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    const summary = {
      courseFrequency: sortByFrequency(courseFrequency),
      topicFrequency: sortByFrequency(topicFrequency),
      channelFrequency: sortByFrequency(channelFrequency),
      materialFrequency: sortByFrequency(materialFrequency),
      totals: {
        course: result.courseAccesses.length,
        topic: result.topicAccesses.length,
        channel: result.channelAccesses.length,
        material: result.materialAccesses.length
      }
    };

    res.status(200).send({
      userId,
      courseId,
      category,
      activities: result,
      summary
    });
  } catch (error) {
    console.error("Error getting access activity details:", error);
    res.status(500).send({ error: error.message });
  }
};

/**
 * Get peer activities data from JSON file for a specific course
 * Filters users enrolled in the course and returns their activity metrics
 * @param {string} courseId - The course ID to filter peers by
 */
export const getPeerActivities = async (req, res) => {
  try {
    const courseId = req.query.courseId;
    
    if (!courseId) {
      return res.status(400).send({ error: "Course ID is required" });
    }
    
    // Read from JSON file
    const jsonPath = path.join(__dirname, "../../../activitiesProductionOrig.json");
    
    // Check if JSON file exists and use it preferentially
    if (fs.existsSync(jsonPath)) {
      try {
        const jsonContent = fs.readFileSync(jsonPath, "utf-8");
        const allProfiles = JSON.parse(jsonContent);
        
        // Filter by course ID and transform to flat structure for frontend
        const peerActivities = allProfiles
          .filter(profile => profile.stdProfile?.course_id === String(courseId))
          .map(profile => {
            const ap = profile.activitiesProfile;
            return {
              stdUsername: profile.stdProfile?.stdUsername,
              course_id: profile.stdProfile?.course_id,
              // Annotation metrics
              totalAddedAnnotations: ap?.annotations?.totalAddedAnnotations || 0,
              totalAnnotationsFollowed: ap?.annotations?.totalAnnotationsFollowed || 0,
              totalAnnotationsReplied: ap?.annotations?.totalAnnotationsReplied || 0,
              totalNoteTypeAnnotations: ap?.annotations?.totalNoteTypeAnnotations || 0,
              totalQuestionTypeAnnotations: ap?.annotations?.totalQuestionTypeAnnotations || 0,
              totalExternalResourceTypeAnnotations: ap?.annotations?.totalExternalResourceTypeAnnotations || 0,
              // Likes metrics
              totalLikesOnAnnotations: ap?.likes?.likesOnAnnotations?.totalLikesOnAnnotations || 0,
              likesOnNoteTypeAnnotations: ap?.likes?.likesOnAnnotations?.likesOnNoteTypeAnnotations || 0,
              likesOnQuestionTypeAnnotations: ap?.likes?.likesOnAnnotations?.likesOnQuestionTypeAnnotations || 0,
              likesOnExternalResourceTypeAnnotations: ap?.likes?.likesOnAnnotations?.likesOnExternalResourceTypeAnnotations || 0,
              // Dislikes metrics
              totalDislikesOnAnnotations: ap?.dislikes?.dislikesOnAnnotations?.totalDislikesOnAnnotations || 0,
              dislikesOnNoteTypeAnnotations: ap?.dislikes?.dislikesOnAnnotations?.dislikesOnNoteTypeAnnotations || 0,
              dislikesOnQuestionTypeAnnotations: ap?.dislikes?.dislikesOnAnnotations?.dislikesOnQuestionTypeAnnotations || 0,
              dislikesOnExternalResourceTypeAnnotations: ap?.dislikes?.dislikesOnAnnotations?.dislikesOnExternalResourceTypeAnnotations || 0,
              // Access metrics
              totalAccesses: ap?.access?.totalAccesses || 0,
              courseAccesses: ap?.access?.courseAccesses || 0,
              topicAccesses: ap?.access?.topicAccesses || 0,
              channelAccesses: ap?.access?.channelAccesses || 0,
              pdfAccess: ap?.access?.materialAccesses?.pdfAccess || 0,
              videoAccess: ap?.access?.materialAccesses?.videoAccess || 0,
              // Dashboard metrics
              totalDashboardAccesses: ap?.dashboardAccess?.totalDashboardAccesses || 0,
              dashboardCourseAccesses: ap?.dashboardAccess?.courseAccesses || 0,
              dashboardTopicAccesses: ap?.dashboardAccess?.topicAccesses || 0,
              dashboardChannelAccesses: ap?.dashboardAccess?.channelAccesses || 0,
              dashboardMaterialAccesses: ap?.dashboardAccess?.materialAccesses || 0,
              // Video metrics
              videosStarted: ap?.materialProfile?.video?.videosStarted || 0,
              videosCompleted: ap?.materialProfile?.video?.videosCompleted || 0,
              videosPlayed: ap?.materialProfile?.video?.videosPlayed || 0,
              videosPauses: ap?.materialProfile?.video?.videosPauses || 0,
              timeSpentOnVideos: ap?.materialProfile?.video?.timeSpentOnVideos || 0,
              // PDF metrics
              pdfStarted: ap?.materialProfile?.pdf?.pdfStarted || 0,
              pdfCompleted: ap?.materialProfile?.pdf?.pdfCompleted || 0,
              slidesViewed: ap?.materialProfile?.pdf?.slidesViewed || 0,
              slidesNotUnderstood: ap?.materialProfile?.pdf?.slidesNotUnderstood || 0,
              // Tag metrics
              totalAddedTags: ap?.tag?.totalAddedTags || 0,
              totalTagViewed: ap?.tag?.tagsViewed?.totalTagViewed || 0,
              // Knowledge Graph metrics
              totalKnowledgeGraphAccesses: ap?.knowledgeGraph?.knowledgeGraphAccesses?.totalKnowledgeGraphAccesses || 0,
              courseKnowledgeGraphAccesses: ap?.knowledgeGraph?.knowledgeGraphAccesses?.courseKnowledgeGraphAccesses || 0,
              materialKnowledgeGraphAccesses: ap?.knowledgeGraph?.knowledgeGraphAccesses?.materialKnowledgeGraphAccesses || 0,
              slideKnowledgeGraphAccesses: ap?.knowledgeGraph?.knowledgeGraphAccesses?.slideKnowledgeGraphAccesses || 0,
              totalKnowledgeGraphConceptViewed: ap?.knowledgeGraph?.knowledgeGraphViewed?.totalKnowledgeGraphConceptViewed || 0,
              totalSlideKnowledgeGraphMarkedUnderstood: ap?.knowledgeGraph?.slideKnowledgeGraphMarked?.totalSlideKnowledgeGraphMarkedUnderstood || 0,
              totalSlideKnowledgeGraphMarkedNotUnderstood: ap?.knowledgeGraph?.slideKnowledgeGraphMarked?.totalSlideKnowledgeGraphMarkedNotUnderstood || 0,
              totalSlideKnowledgeGraphMarkedAsNew: ap?.knowledgeGraph?.slideKnowledgeGraphMarked?.totalSlideKnowledgeGraphMarkedAsNew || 0,
              // Recommendation metrics
              totalRecommendedMaterialViewed: ap?.knowledgeGraph?.knowledgeGraphViewed?.slideKnowledgeGraphViewed?.recommendedMaterial?.totalRecommendedMaterialViewed || 0,
              totalRecommendedMaterialMarkedHelpful: ap?.knowledgeGraph?.slideKnowledgeGraphMarked?.recommendedMaterial?.totalRecommendedMaterialMarkedHelpful || 0,
              totalRecommendedMaterialMarkedNotHelpful: ap?.knowledgeGraph?.slideKnowledgeGraphMarked?.recommendedMaterial?.totalRecommendedMaterialMarkedNotHelpful || 0,
              recommendedConceptsMarkedUnderstood: ap?.knowledgeGraph?.slideKnowledgeGraphMarked?.recommendedConceptsMarkedUnderstood || 0,
              recommendedConceptsMarkedNotUnderstood: ap?.knowledgeGraph?.slideKnowledgeGraphMarked?.recommendedConceptsMarkedNotUnderstood || 0
            };
          });
        
        console.log(`Loaded ${peerActivities.length} peer activities from JSON for course ${courseId}`);
        return res.status(200).send(peerActivities);
      } catch (jsonError) {
        console.error(`Error reading JSON file: ${jsonError.message}`);
        return res.status(500).send({ error: "Failed to read activity data" });
      }
    }
    
    console.warn(`JSON file not found at ${jsonPath}`);
    return res.status(404).send({ error: "Activity data file not found" });
  } catch (error) {
    console.error("Error reading peer activities file:", error);
    res.status(500).send({ error: error.message });
  }
};

/**
 * Get higher engagement level boundaries for a specific user and course
 * Returns the minimum values from users in the next higher engagement level
 * This helps users understand what thresholds they need to reach to move to the next level
 * 
 * Pipeline:
 * 1. Get current user's engagement level from Neo4j
 * 2. If user is already at 'high', return indicator that no higher level exists
 * 3. Get all users with the next higher engagement level for this course from Neo4j
 * 4. Fetch activity values from activitiesProductionOrig.json for matching userId and courseId
 * 5. Calculate minimum boundary values for each metric (the lowest threshold to reach next level)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getHigherEngagementLevelBoundaries = async (req, res) => {
  try {
    const userId = req.params.userId;
    const courseId = req.params.courseId;

    if (!userId || !courseId) {
      return res.status(400).send({ error: "User ID and Course ID are required" });
    }

    // Step 1: Get current user's engagement level from Neo4j
    let currentUserEngagementLevel = "low";
    try {
      const engagementRecords = await getLevelOfEngagement(userId);
      const courseEngagement = engagementRecords?.find(
        (record) => record?.target?.properties?.cid === String(courseId)
      );
      if (courseEngagement?.r?.properties?.level) {
        currentUserEngagementLevel = courseEngagement.r.properties.level.toLowerCase();
      }
      console.log(`User ${userId} has engagement level: ${currentUserEngagementLevel} for course ${courseId}`);
    } catch (neo4jError) {
      console.warn("Could not fetch engagement level from Neo4j:", neo4jError);
    }

    // Step 2: Check if user is already at the highest level
    if (currentUserEngagementLevel === "high") {
      return res.status(200).send({
        userId,
        courseId,
        currentUserEngagementLevel,
        isHighestLevel: true,
        message: "User is already at the highest engagement level. No higher level boundaries available.",
        higherLevelStats: null,
        boundaries: null
      });
    }

    // Determine the next higher level
    const levelHierarchy = { 'low': 'medium', 'medium': 'high' };
    const higherLevel = levelHierarchy[currentUserEngagementLevel];

    // Step 3: Get centroid values for the higher engagement level (these are the thresholds)
    const higherLevelCentroid = getCentroidForLevel(courseId, higherLevel);
    
    if (!higherLevelCentroid) {
      console.warn(`No centroid found for course ${courseId} at ${higherLevel} level`);
      return res.status(200).send({
        userId,
        courseId,
        currentUserEngagementLevel,
        higherLevel,
        isHighestLevel: false,
        higherLevelStats: {
          usersInHigherLevel: 0
        },
        boundaries: null,
        message: `No centroid data available for ${higherLevel} engagement level. Please run the clustering script.`
      });
    }

    console.log(`Retrieved centroid for course ${courseId} at ${higherLevel} level`);

    // Step 4: Build boundaries from centroid values
    // Map centroid keys to the expected metric keys used by the frontend
    const centroidKeyMapping = {
      // Direct mappings (same key names)
      'totalActivities': 'totalActivities',
      'totalAddedAnnotations': 'totalAddedAnnotations',
      'totalAnnotationsReplied': 'totalAnnotationsReplied',
      'totalAnnotationsFollowed': 'totalAnnotationsFollowed',
      'totalLikesOnAnnotations': 'totalLikesOnAnnotations',
      'totalDislikesOnAnnotations': 'totalDislikesOnAnnotations',
      'totalAccesses': 'totalAccesses',
      'totalDashboardAccesses': 'totalDashboardAccesses',
      'totalUserMentionedRepliedActivities': 'totalUserMentionedRepliedActivities',
      'videosStarted': 'videosStarted',
      'videosCompleted': 'videosCompleted',
      'videosPauses': 'videosPauses',
      'timeSpentOnVideos': 'timeSpentOnVideos',
      'pdfStarted': 'pdfStarted',
      'pdfCompleted': 'pdfCompleted',
      'slidesViewed': 'slidesViewed',
      'slidesNotUnderstood': 'slidesNotUnderstood',
      'totalAddedTags': 'totalAddedTags',
      'totalTagViewed': 'totalTagViewed',
      'totalKnowledgeGraphAccesses': 'totalKnowledgeGraphAccesses',
      'totalKnowledgeGraphConcept/WikiViewed': 'totalKnowledgeGraphConceptViewed',
      'totalRecommendedConcept/WikiViewed': 'totalRecommendedConceptViewed',
      'totalRecommendedConceptViewedVisualExplanation': 'totalRecommendedConceptViewedVisualExplanation',
      'totalRecommendedConceptViewedTextualExplanation': 'totalRecommendedConceptViewedTextualExplanation',
      'totalRecommendedMaterialViewed': 'totalRecommendedMaterialViewed',
      'totalSlideKnowledgeGraphMarkedUnderstood': 'totalSlideKnowledgeGraphMarkedUnderstood',
      'totalSlideKnowledgeGraphMarkedNotUnderstood': 'totalSlideKnowledgeGraphMarkedNotUnderstood',
      'totalSlideKnowledgeGraphMarkedAsNew': 'totalSlideKnowledgeGraphMarkedAsNew',
      'recommendedConceptsMarkedUnderstood': 'recommendedConceptsMarkedUnderstood',
      'recommendedConceptsMarkedNotUnderstood': 'recommendedConceptsMarkedNotUnderstood',
      'recommendedConceptsMarkedMarkedAsNew': 'recommendedConceptsMarkedAsNew',
      'totalRecommendedMaterialMarkedHelpful': 'totalRecommendedMaterialMarkedHelpful',
      'totalRecommendedMaterialMarkedNotHelpful': 'totalRecommendedMaterialMarkedNotHelpful'
    };

    const boundaries = {};
    
    // Build boundaries from centroid values
    for (const [centroidKey, metricKey] of Object.entries(centroidKeyMapping)) {
      const centroidValue = higherLevelCentroid[centroidKey];
      if (centroidValue !== undefined) {
        boundaries[metricKey] = {
          minimum: Math.round(centroidValue * 100) / 100, // Round to 2 decimal places
          usersCount: 1, // Centroid represents the cluster average
          isCentroid: true
        };
      } else {
        boundaries[metricKey] = {
          minimum: 0,
          usersCount: 0,
          isCentroid: true
        };
      }
    }

    // Also add common access metric keys that may be expected
    const additionalMetricKeys = [
      'courseAccesses', 'topicAccesses', 'channelAccesses', 'materialAccesses',
      'pdfAccess', 'videoAccess', 'dashboardCourseAccesses', 'dashboardTopicAccesses',
      'dashboardChannelAccesses', 'dashboardMaterialAccesses', 'courseKnowledgeGraphAccesses',
      'materialKnowledgeGraphAccesses', 'slideKnowledgeGraphAccesses', 'totalKnowledgeGraphWikiArticleViewed'
    ];
    
    for (const key of additionalMetricKeys) {
      if (!boundaries[key]) {
        boundaries[key] = {
          minimum: 0,
          usersCount: 0,
          isCentroid: true
        };
      }
    }

    res.status(200).send({
      userId,
      courseId,
      currentUserEngagementLevel,
      higherLevel,
      isHighestLevel: false,
      higherLevelStats: {
        usersInHigherLevel: 1 // Centroid-based
      },
      boundaries,
      boundaryType: 'centroid',
      message: 'Boundaries are based on cluster centroid values (average activity for this engagement level)'
    });
  } catch (error) {
    console.error("Error getting higher engagement level boundaries:", error);
    res.status(500).send({ error: error.message });
  }
};