/**
 * Interest Score Daily Job Scheduler
 * 
 * Runs the complete interest score pipeline daily at midnight (00:00).
 * This scheduler orchestrates the entire workflow:
 * 0. Process course enrollments (G10 activities) - Initialize INTERESTED_IN relationships
 * 1. Extract activities from MongoDB
 * 2. Map activities to concepts and calculate scores
 * 3. Update Neo4j with INTERESTED_IN relationships (set scores)
 * 
 * Usage:
 *   - Import and register in Express app during server startup
 *   - Runs automatically every day at 00:00
 */

const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Execute a Node.js script and return a promise
 */
function runNodeScript(scriptPath, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`\n Running: ${scriptPath}`);
    
    const proc = spawn('node', [scriptPath], {
      cwd,
      stdio: 'inherit',
      shell: false  // Don't use shell to avoid space issues in paths
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Script failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Execute a Python script and return a promise
 */
function runPythonScript(scriptPath, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`\n Running Python script: ${scriptPath}`);
    
    const proc = spawn('python', [scriptPath], {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Check if activity-weights.json exists, generate if missing
 */
async function ensureActivityWeights() {
  const weightsPath = path.join(__dirname, '../../../coursemapper-kg/recommendation/level-of-interest/data/activity-weights.json');
  
  // Check if file exists
  if (fs.existsSync(weightsPath)) {
    console.log('✓ activity-weights.json found');
    return;
  }
  
  console.log('⚠ activity-weights.json not found. Generating...');
  console.log();
  
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(weightsPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Run Python script to generate weights
    const scriptPath = path.join(__dirname, '../../../coursemapper-kg/recommendation/level-of-interest/scripts/calculate_activity_weights.py');
    const scriptDir = path.dirname(scriptPath);
    
    await runPythonScript(scriptPath, scriptDir);
    
    // Move generated file to data directory if needed
    const generatedPath = path.join(scriptDir, 'activity-weights.json');
    if (fs.existsSync(generatedPath) && generatedPath !== weightsPath) {
      fs.renameSync(generatedPath, weightsPath);
      console.log(`✓ Moved activity-weights.json to data directory`);
    }
    
    console.log('✓ activity-weights.json generated successfully');
    console.log();
  } catch (error) {
    console.error('✗ Failed to generate activity-weights.json');
    throw new Error(`Cannot generate activity-weights.json: ${error.message}. Please run 'python coursemapper-kg/recommendation/level-of-interest/scripts/calculate_activity_weights.py' manually.`);
  }
}

/**
 * Run the complete interest score pipeline
 */
async function runInterestScorePipeline() {
  const startTime = new Date();
  console.log('\n' + '═'.repeat(80));
  console.log('INTEREST SCORE PIPELINE - DAILY RUN');
  console.log('═'.repeat(80));
  console.log(`Started at: ${startTime.toISOString()}`);
  console.log('═'.repeat(80));

  try {
    const webserverDir = path.join(__dirname, '..', '..');
    
    // Pre-check: Ensure activity-weights.json exists
    console.log('\n🔍 PRE-CHECK: Verifying required files...');
    await ensureActivityWeights();
    
    // Step 0: Process course enrollments (G10 activities)
    console.log('\n📚 STEP 0: Processing course enrollments...');
    await runNodeScript(path.join(__dirname, 'processEnrollments.js'), webserverDir);
    
    // Step 1: Extract activities from MongoDB
    console.log('\n📦 STEP 1: Extracting activities from MongoDB...');
    await runNodeScript(path.join(__dirname, 'extractActivities.js'), webserverDir);
    
    // Step 2: Process all users (maps to concepts, calculates scores, updates Neo4j)
    console.log('\n🔢 STEP 2-3: Processing users and updating Neo4j...');
    await runNodeScript(path.join(__dirname, 'processAllUsers.js'), webserverDir);
    
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);
    
    console.log('\n' + '═'.repeat(80));
    console.log(' PIPELINE COMPLETED SUCCESSFULLY');
    console.log('═'.repeat(80));
    console.log(`Finished at: ${endTime.toISOString()}`);
    console.log(`Duration: ${duration} minutes`);
    console.log('═'.repeat(80) + '\n');
    
  } catch (error) {
    const endTime = new Date();
    console.error('\n' + '═'.repeat(80));
    console.error(' PIPELINE FAILED');
    console.error('═'.repeat(80));
    console.error(`Failed at: ${endTime.toISOString()}`);
    console.error(`Error: ${error.message}`);
    console.error('═'.repeat(80) + '\n');
    throw error;
  }
}

/**
 * Initialize the cron job
 * Schedule: Daily at 00:00 (midnight)
 */
function initializeInterestScoreJob() {
  // Cron pattern: '0 0 * * *' = every day at 00:00
  const cronPattern = '0 0 * * *';
  
  console.log('\n Interest Score Job Scheduler initialized');
  console.log(`   Schedule: Daily at 00:00 (midnight)`);
  console.log(`   Cron pattern: ${cronPattern}`);
  
  const job = cron.schedule(cronPattern, async () => {
    try {
      await runInterestScorePipeline();
    } catch (error) {
      console.error('Interest score pipeline failed:', error);
      // Log to monitoring system here if needed
    }
  }, {
    scheduled: true,
    timezone: "Europe/Berlin" // Adjust to your timezone
  });

  console.log('   Status: Active  \n');
  
  return job;
}

/**
 * Run the pipeline immediately (for testing)
 */
async function runNow() {
  console.log('\n Running interest score pipeline immediately (manual trigger)...\n');
  try {
    await runInterestScorePipeline();
    process.exit(0);
  } catch (error) {
    console.error('Pipeline failed:', error);
    process.exit(1);
  }
}

// Allow manual execution: node src/jobs/interestScoreJob.js --run-now
if (require.main === module) {
  if (process.argv.includes('--run-now')) {
    runNow();
  } else {
    console.log('\n This is a scheduler module. To use it:');
    console.log('   1. Import and call initializeInterestScoreJob() in your Express app');
    console.log('   2. Or run manually: node src/jobs/interestScoreJob.js --run-now\n');
  }
} else {
  // Export for use in Express app
  module.exports = {
    initializeInterestScoreJob,
    runInterestScorePipeline
  };
}
