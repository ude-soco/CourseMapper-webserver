const db = require("../../models");
const Activity = db.activity;

export const createActivity = async (statement, notificationInfo) => {
  try {
    return await new Activity({
      statement: statement,
      sent: false,
      notificationInfo: notificationInfo,
    }).save();
  } catch (error) {
    console.error("Error creating activity:", error);
    throw error;
  }
};

export const getActivities = async () => {
  try {
    const unsentActivities = await Activity.find(
      { sent: false },
      { statement: 1, _id: 0 },
    );
    return unsentActivities.map((activity) => activity.statement);
  } catch (err) {
    console.log("Error in fetching unsent statements");
  }
};

export const updateActivities = async (sentStatementsIds) => {
  try {
    sentStatementsIds = sentStatementsIds ? sentStatementsIds : [];
    
    // DEBUG: Log what we're trying to update
    console.log('updateActivities: received IDs count =', sentStatementsIds.length);
    console.log('updateActivities: IDs to update =', sentStatementsIds);
    
    const dbRes = await Activity.updateMany(
      {
        "statement.id": { $in: sentStatementsIds },
      },
      { $set: { sent: true } },
    );
    console.log(
      `updateSentStatements: ${dbRes.modifiedCount} statements are updated`,
    );
    
    // DEBUG: If no statements were updated but we expected some, investigate
    if (sentStatementsIds.length > 0 && dbRes.modifiedCount === 0) {
      console.log('WARNING: Expected to update statements but none were modified!');
      const existingStatements = await Activity.find(
        { "statement.id": { $in: sentStatementsIds } },
        { "statement.id": 1, sent: 1 }
      ).limit(5);
      console.log('updateActivities: sample of matching statements in DB =', 
        JSON.stringify(existingStatements, null, 2));
    }
  } catch (err) {
    console.log("Error in updating sent statements", err);
  }
};
