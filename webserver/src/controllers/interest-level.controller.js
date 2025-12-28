const fs = require('fs').promises;
const path = require('path');

// Path to interest scores JSON file
const INTEREST_SCORES_PATH = path.join(
  __dirname,
  '../../../coursemapper-kg/recommendation/level-of-interest/data/interest_scores.json'
);

/**
 * Get interest level data for a specific user and concept
 * Reads from the JSON file which now contains manually adjusted scores as well
 */
exports.getUserConceptInterest = async (req, res) => {
  try {
    const { userId, conceptName } = req.params;
    
    // Read interest_scores.json file
    const fileContent = await fs.readFile(INTEREST_SCORES_PATH, 'utf8');
    const interestScoresData = JSON.parse(fileContent);
    
    // Get user data
    const userData = interestScoresData[userId];
    
    if (!userData) {
      return res.status(404).json({
        message: `No interest score data found for user ${userId}`
      });
    }
    
    // Get concept data
    const conceptData = userData.concepts[conceptName];
    
    if (!conceptData) {
      return res.status(404).json({
        message: `No interest score data found for concept "${conceptName}"`
      });
    }
    
    // Return concept data (already includes manually_adjusted flag if set)
    res.status(200).json(conceptData);
    
  } catch (error) {
    console.error('Error fetching user concept interest:', error);
    res.status(500).json({
      message: 'Error fetching interest level data',
      error: error.message
    });
  }
};

/**
 * Get all interest level data for a user
 */
exports.getAllUserInterests = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Read interest_scores.json file
    const fileContent = await fs.readFile(INTEREST_SCORES_PATH, 'utf8');
    const interestScoresData = JSON.parse(fileContent);
    
    // Get user data
    const userData = interestScoresData[userId];
    
    if (!userData) {
      return res.status(404).json({
        message: `No interest score data found for user ${userId}`
      });
    }
    
    // Return all user interest data
    res.status(200).json(userData);
    
  } catch (error) {
    console.error('Error fetching user interests:', error);
    res.status(500).json({
      message: 'Error fetching interest level data',
      error: error.message
    });
  }
};

/**
 * Get top concepts by interest score for a user
 * Reads from the JSON file which now contains manually adjusted scores
 */
exports.getTopConceptsByInterest = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    // Read interest_scores.json file
    const fileContent = await fs.readFile(INTEREST_SCORES_PATH, 'utf8');
    const interestScoresData = JSON.parse(fileContent);
    
    // Get user data
    const userData = interestScoresData[userId];
    
    if (!userData) {
      return res.status(404).json({
        message: `No interest score data found for user ${userId}`
      });
    }
    
    // Extract concepts and their scores (JSON file already has correct scores including manual adjustments)
    const concepts = Object.entries(userData.concepts).map(([name, data]) => ({
      name: name,
      score: data.normalized_scores?.min_max_interpolation || 0,
      course: data.course_name || 'N/A'
    }));
    
    // Sort by score (descending) and take top N
    const topConcepts = concepts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    res.status(200).json(topConcepts);
    
  } catch (error) {
    console.error('Error fetching top concepts:', error);
    res.status(500).json({
      message: 'Error fetching top concepts',
      error: error.message
    });
  }
};

/**
 * Get all activities used by a user across all concepts
 */
exports.getAllUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Read interest_scores.json file
    const fileContent = await fs.readFile(INTEREST_SCORES_PATH, 'utf8');
    const interestScoresData = JSON.parse(fileContent);
    
    // Get user data
    const userData = interestScoresData[userId];
    
    if (!userData) {
      return res.status(404).json({
        message: `No interest score data found for user ${userId}`
      });
    }
    
    // Aggregate all activities across all concepts
    const activityMap = new Map();
    
    Object.values(userData.concepts).forEach(conceptData => {
      if (conceptData.activities_breakdown) {
        conceptData.activities_breakdown.forEach(activity => {
          const key = activity.activity_id;
          if (activityMap.has(key)) {
            const existing = activityMap.get(key);
            existing.count += activity.count;
            existing.contribution += activity.contribution;
          } else {
            activityMap.set(key, {
              activity_id: activity.activity_id,
              activity_name: activity.activity_name,
              count: activity.count,
              weight: activity.weight,
              contribution: activity.contribution
            });
          }
        });
      }
    });
    
    // Convert map to array and sort by count
    const activities = Array.from(activityMap.values())
      .sort((a, b) => b.count - a.count);
    
    res.status(200).json(activities);
    
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({
      message: 'Error fetching user activities',
      error: error.message
    });
  }
};
