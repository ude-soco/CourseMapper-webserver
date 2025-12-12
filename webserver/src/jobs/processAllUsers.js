#!/usr/bin/env node

/**
 * Process All Users Interest Scores
 * 
 * Reads all users from activities_breakdown.json and processes their interest scores.
 * Saves results in activities_json folder.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function processAllUsers() {
  const webserverDir = path.join(__dirname, '..');
  const activitiesPath = path.join(__dirname, '../../coursemapper-kg/recommendation/level-of-interest/data/activities_breakdown.json');

  console.log('═'.repeat(80));
  console.log('PROCESSING ALL USERS - INTEREST SCORES');
  console.log('═'.repeat(80));
  console.log();

  // Load activities breakdown
  const activitiesData = JSON.parse(await fs.readFile(activitiesPath, 'utf8'));
  
  // Get all user IDs and usernames
  const users = Object.entries(activitiesData).map(([userId, data]) => ({
    userId,
    username: data.username || 'Unknown'
  }));

  console.log(`Found ${users.length} users to process`);
  console.log();

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    console.log(`[${ i + 1}/${users.length}] Processing: ${user.username} (${user.userId})`);
    console.log('-'.repeat(80));

    try {
      // Run the pipeline for this user
      await runCommand(
        'node',
        ['src/jobs/processUserInterestScores.js', `"${user.username}"`],
        webserverDir
      );

      // Calculate scores
      const usernameSafe = user.username.toLowerCase().replace(/\s+/g, '_');
      await runCommand(
        'python',
        ['../coursemapper-kg/recommendation/level-of-interest/scripts/calculate_interest_scores.py', usernameSafe],
        webserverDir
      );

      successCount++;
      console.log(`✅ Success: ${user.username}`);
      console.log();

    } catch (error) {
      failCount++;
      console.error(`❌ Failed: ${user.username}`);
      console.error(`   Error: ${error.message}`);
      console.log();
    }
  }

  console.log('═'.repeat(80));
  console.log('COMBINING ALL USER SCORES');
  console.log('═'.repeat(80));
  console.log();

  // Combine all scores into single file (centralized location)
  const combined = {};
  const tempJsonDir = path.join(webserverDir, 'src', 'jobs', 'jsonFiles');
  const files = await fs.readdir(tempJsonDir);
  const scoreFiles = files.filter(f => f.startsWith('interest_scores_') && f.endsWith('.json'));

  for (const file of scoreFiles) {
    const filePath = path.join(tempJsonDir, file);
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    const userId = data.metadata.user_id;
    const username = data.metadata.username;
    
    combined[userId] = {
      username: username,
      concepts: data.concepts
    };
    
    console.log(`✓ Added: ${username}`);
    
    // Delete individual file
    await fs.unlink(filePath);
  }

  // Save combined file to centralized data location
  const outputPath = path.join(__dirname, '../../coursemapper-kg/recommendation/level-of-interest/data/interest_scores.json');
  await fs.writeFile(outputPath, JSON.stringify(combined, null, 2));

  console.log();
  console.log('═'.repeat(80));
  console.log('PROCESSING COMPLETE');
  console.log('═'.repeat(80));
  console.log();
  console.log(`Total users:      ${users.length}`);
  console.log(`Successful:       ${successCount} ✅`);
  console.log(`Failed:           ${failCount} ❌`);
  console.log();
  console.log(`Output: coursemapper-kg/recommendation/level-of-interest/data/interest_scores.json`);
  console.log();
}

processAllUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
