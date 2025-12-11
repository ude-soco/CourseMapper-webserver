const db = require("../models");
const activityFetcher = require("../services/activityFetcher");
const ConceptScore = db.concept;
const Activity = db.activity;
const User = db.user;


/**
 * Get detailed activity breakdown for a user
 */
export const getUserActivityBreakdown = async (req, res) => {
  const { userId } = req.params;
  console.log(`[API] Getting activity breakdown for user: ${userId}`);

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`[API] User not found: ${userId}`);
      return res.status(404).send({ error: "User not found" });
    }

    console.log(`[API] User found: ${user.username}. Fetching breakdown...`);
    const breakdown = await activityFetcher.getUserActivityBreakdown(user);
    console.log(`[API] Breakdown calculated. Sending response.`);
    
    return res.status(200).send(breakdown);
  } catch (err) {
    console.error("Error getting activity breakdown:", err);
    return res.status(500).send({
      error: "Failed to get activity breakdown",
      details: err.message,
    });
  }
};



