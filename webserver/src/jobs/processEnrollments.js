#!/usr/bin/env node

/**
 * Process Course Enrollment Activities (G10)
 * 
 * Processes G10 activities from MongoDB and initializes INTERESTED_IN relationships
 * in Neo4j for all main concepts in the enrolled course.
 * 
 * This runs as part of the daily interest score pipeline to ensure new enrollments
 * are captured before calculating interest scores.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { spawn } = require('child_process');
const path = require('path');

// Load environment variables
dotenv.config();

const db = require("../models");
const Activity = db.activity;
const Material = db.material;

/**
 * Execute Python script to handle enrollment
 */
function handleEnrollment(userId, courseId, materialIds) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../../../coursemapper-kg/recommendation/level-of-interest/scripts/handle_enrollment.py');
    
    // Use the same Python path as other scripts
    const pythonCmd = process.platform === 'win32' 
      ? 'C:/Users/Belal Elbehairy/AppData/Local/Programs/Python/Python311/python.exe'
      : 'python';
    
    // Pass material IDs as comma-separated string
    const materialIdsStr = materialIds.join(',');
    const proc = spawn(pythonCmd, [scriptPath, userId, courseId, materialIdsStr], {
      stdio: 'pipe',
      shell: false
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Process all enrollment activities
 */
async function processEnrollments() {
  console.log('═'.repeat(80));
  console.log('PROCESSING COURSE ENROLLMENTS (G10)');
  console.log('═'.repeat(80));
  console.log();

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
    console.log();

    // Query for G10 enrollment activities
    const enrollmentActivities = await Activity.find({
      'statement.verb.id': 'http://www.tincanapi.co.uk/verbs/enrolled_onto_learning_plan'
    });

    console.log(`Found ${enrollmentActivities.length} enrollment activities`);
    console.log();

    if (enrollmentActivities.length === 0) {
      console.log('No enrollments to process.');
      return;
    }

    // Process unique user-course pairs
    const enrollments = new Map();
    
    for (const activity of enrollmentActivities) {
      const userId = activity.statement.actor.account.name;
      const courseId = activity.statement.object.id.split('/').pop();
      const username = activity.statement.actor.name;
      
      const key = `${userId}:${courseId}`;
      if (!enrollments.has(key)) {
        enrollments.set(key, { userId, courseId, username });
      }
    }

    console.log(`Processing ${enrollments.size} unique user-course enrollments`);
    console.log();

    let successCount = 0;
    let failCount = 0;

    for (const [key, { userId, courseId, username }] of enrollments) {
      console.log(`Processing: ${username} enrolled in course ${courseId}`);
      
      try {
        // Query MongoDB to get all material IDs for this course
        const materials = await Material.find({ courseId: courseId }).select('_id').lean();
        const materialIds = materials.map(m => m._id.toString());
        
        if (materialIds.length === 0) {
          console.log(`Warning: No materials found for course ${courseId}`);
          continue;
        }
        
        console.log(`Found ${materialIds.length} materials for course ${courseId}`);
        
        const result = await handleEnrollment(userId, courseId, materialIds);
        
        // Parse result to get concept count
        const match = result.match(/Initialized interest for (\d+) main concepts/);
        const conceptCount = match ? parseInt(match[1]) : 0;
        
        console.log(`Success: ${conceptCount} concepts initialized`);
        successCount++;
      } catch (error) {
        console.error(`Failed: ${error.message}`);
        failCount++;
      }
      console.log();
    }

    console.log('═'.repeat(80));
    console.log('ENROLLMENT PROCESSING COMPLETE');
    console.log('═'.repeat(80));
    console.log();
    console.log(`Total enrollments: ${enrollments.size}`);
    console.log(`Successful:        ${successCount}`);
    console.log(`Failed:            ${failCount}`);
    console.log();

  } catch (error) {
    console.error('Error processing enrollments:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Export for use in pipeline
if (require.main === module) {
  // Run directly
  processEnrollments()
    .then(() => {
      console.log('Enrollment processing completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Enrollment processing failed:', error);
      process.exit(1);
    });
} else {
  module.exports = processEnrollments;
}
