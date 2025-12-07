/**
 * Extract Activities to JSON
 * Extracts activities for all users, groups them, and saves to JSON file.
 * Usage: node test/extractActivitiesToJson.js
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Load environment variables
dotenv.config();

const activityFetcher = require("../src/services/activityFetcher");
const db = require("../src/models");
const User = db.user;

// Configuration
const OUTPUT_DIR = path.join(__dirname, "../activities_json");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "activities_breakdown.json");

async function main() {
  console.log("🚀 Starting activity extraction...");
  
  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGO_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
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
    console.log(`💾 Successfully wrote JSON to ${OUTPUT_FILE}`);

  } catch (error) {
    console.error("❌ Error during extraction:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  }
}

main();
