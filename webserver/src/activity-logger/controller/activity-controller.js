const db = require("../../models");
const Activity = db.activity;
const mongoose = require("mongoose");

export const createActivity = async (statement, notificationInfo) => {
  try {
    // Logic to extract courseId from statement object
    const courseUri = statement?.object?.id;
    
    if (!courseUri) {
      console.warn('createActivity: No object.id in statement, cannot extract courseId');
      console.warn('Statement verb:', statement?.verb?.id);
      console.warn('Statement object type:', statement?.object?.objectType);
    }
    
    let courseIdToTag = null;
    if (courseUri) {
      // Check if this is a course-related activity by looking for "/course/" in the URI
      const isCourseActivity = courseUri.includes('/course/');
      
      if (isCourseActivity) {
        // Extract courseId from URIs like:
        // "http://localhost:4200/activity/course/69135a9dcbf9cd5d2a486479" (direct course access)
        // "http://localhost:4200/activity/course/69135a9dcbf9cd5d2a486479/topic/69135c8b9a4487a54065aaba" (topic in course)
        // "http://localhost:4200/activity/course/69135a9dcbf9cd5d2a486479/channel/..." (channel in course)
        
        // Find the position of "/course/" and extract the next segment
        const courseIndex = courseUri.indexOf('/course/');
        if (courseIndex !== -1) {
          const afterCourse = courseUri.substring(courseIndex + '/course/'.length);
          const courseIdStr = afterCourse.split('/')[0]; // Get first segment after /course/
          
          // Validate it's a valid ObjectId (24 hex characters)
          if (courseIdStr && /^[0-9a-fA-F]{24}$/.test(courseIdStr)) {
            courseIdToTag = new mongoose.Types.ObjectId(courseIdStr);
          }
        }
        
        // Fallback: Check if course_id is in the statement extensions
        if (!courseIdToTag) {
          const extensionCourseId = statement?.object?.definition?.extensions?.['http://www.CourseMapper.de/extensions/topic']?.course_id
            || statement?.object?.definition?.extensions?.['http://www.CourseMapper.de/extensions/channel']?.course_id
            || statement?.object?.definition?.extensions?.['http://www.CourseMapper.de/extensions/post']?.course_id;
          
          if (extensionCourseId && /^[0-9a-fA-F]{24}$/.test(extensionCourseId)) {
            courseIdToTag = new mongoose.Types.ObjectId(extensionCourseId);
          }
        }
      } else {
        // For non-course activities (login, logout, etc.), don't set courseId
        console.log(`Non-course activity detected: ${statement?.verb?.display?.['en-US']} - skipping courseId`);
      }
    }

    const activityData = {
      statement: statement,
      sent: false,
      notificationInfo: notificationInfo,
    };
    
    // Only add courseId if it's valid
    if (courseIdToTag) {
      activityData.courseId = courseIdToTag;
    }

    const activity = await new Activity(activityData).save();
    
    return activity;
  } catch (error) {
    console.error("Error creating activity:", error.message);
    console.error("Statement:", JSON.stringify(statement, null, 2).slice(0, 500));
    throw error;
  }
};

export const GetActivityByCourseId = async () => {
  try {
  const syncJobs = await Activity.aggregate([
      // Stage 1: Filter for unsent statements that have a courseId tag
      { 
        $match: { 
          sent: false, 
          courseId: { $exists: true, $ne: null } 
        } 
      },
      
      // Stage 2: Group statements by courseId (our unique sync key)
      {
        $group: {
          _id: "$courseId",
          // Push the full Activity document (including _id and statement) into an array
          statements: { $push: "$$ROOT" }
        }
      },
      
      // Stage 3: Lookup the Course document using the grouped courseId
      {
        $lookup: {
          from: 'courses', 
          localField: '_id', // The courseId (from the $group stage)
          foreignField: '_id',
          as: 'courseDetails' // Place the matching course document into this array
        }
      },
      
      // Stage 4: Filter out activities for courses that don't exist
      // Only keep documents where courseDetails was found (length > 0)
      { 
        $match: { 
          courseDetails: { $ne: [] } 
        } 
      },
      
      // Stage 5: Unwind the courseDetails array
      { $unwind: '$courseDetails' },

      // Stage 6: Project the final output structure
      {
        $project: {
          _id: 0, // Exclude the temporary group ID
          courseId: '$_id',
          // Extract the required dynamic credentials from the Course document's lrsStore
          lrsStoreId: '$courseDetails.lrsStore.storeId', 
          basicAuth: '$courseDetails.lrsStore.basicAuth',
          
          // Map the statements array to only include the xAPI statement object
          statements: {
            $map: {
              input: '$statements',
              as: 'activity',
              in: '$$activity.statement' // Extract just the nested statement object
            }
          }
        }
      }
    ]);

    // Return the full sync job objects (including courseId, basicAuth, and statements)
    return syncJobs;

  } catch (err) {
    console.error("Error fetching activity groups with credentials:", err);
    // Throw the error so the calling scheduler can handle it
    throw err; 
  }
};

export const getActivitiesWithoutCourseId = async () => {
  try {
    // Get activities without courseId (login, logout, etc.)
    const unsentActivities = await Activity.find(
      { 
        sent: false,
        $or: [
          { courseId: { $exists: false } },
          { courseId: null }
        ]
      },
      { statement: 1, _id: 0 }
    );
    return unsentActivities.map((activity) => activity.statement);
  } catch (err) {
    console.error("Error fetching unsent non-course activities:", err);
    return [];
  }
};

export const updateActivities = async (sentStatementsIds) => {
  try {
    sentStatementsIds = sentStatementsIds ? sentStatementsIds : [];
    
    if (sentStatementsIds.length === 0) {
      return;
    }
    
    const dbRes = await Activity.updateMany(
      {
        "statement.id": { $in: sentStatementsIds },
      },
      { $set: { sent: true } },
    );
    
    // Only log if there's a mismatch (indicates a potential issue)
    if (sentStatementsIds.length > 0 && dbRes.modifiedCount === 0) {
      console.warn(`updateActivities: Expected to update ${sentStatementsIds.length} statements but none were modified`);
    }
  } catch (err) {
    console.error("Error updating sent statements:", err.message);
  }
};
