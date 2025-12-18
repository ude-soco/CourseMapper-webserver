/**
 * Extract Activities Job
 * Scheduled job to extract activities for all users and save to JSON file.
 * This file is part of the daily interest score calculation pipeline.
 * 
 * Usage: 
 *   Manual: node src/jobs/extractActivities.js
 *   Scheduled: Called by interestScoreJob.js (runs daily at 00:00)
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Load environment variables
dotenv.config();

const activityFetcher = require("../services/activityFetcher");
const db = require("../models");
const User = db.user;

// Configuration - Output to centralized data location
const OUTPUT_DIR = path.join(__dirname, "../../../coursemapper-kg/recommendation/level-of-interest/data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "activities_breakdown.json");

async function main() {
  console.log("Starting activity extraction...");
  
  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGO_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }

  try {
    // Fetch all users
    const users = await User.find({});
    console.log(`👥 Found ${users.length} users.`);

    const result = {};
    let processedCount = 0;

    for (const user of users) {
      const fullUsername = `${user.firstname} ${user.lastname}`.trim();
      
      // Skip Admin User
      if (fullUsername === 'Admin User') continue;

      // Use the shared service function to get the exact same output as the endpoint
      const userBreakdown = await activityFetcher.getUserActivityBreakdown(user);
      
      // Merge into result object
      Object.assign(result, userBreakdown);
      
      processedCount++;
      if (processedCount % 10 === 0) {
        process.stdout.write(".");
      }
    }
    console.log("\n");

    // Write to file
    if (!fs.existsSync(OUTPUT_DIR)){
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log(`✅ Successfully wrote activities to ${OUTPUT_FILE}`);
    console.log(`📊 Total users processed: ${processedCount}`);

  } catch (error) {
    console.error("Error during extraction:", error);
    throw error; // Re-throw to signal failure to caller
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Export for use by scheduler, but also allow direct execution
if (require.main === module) {
  // Run directly: node src/jobs/extractActivities.js
  main().then(() => {
    console.log("✅ Activity extraction completed successfully");
    process.exit(0);
  }).catch(error => {
    console.error("❌ Activity extraction failed:", error);
    process.exit(1);
  });
} else {
  // Called by another module (e.g., scheduler)
  module.exports = main;
}
