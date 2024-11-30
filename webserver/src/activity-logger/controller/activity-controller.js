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
    const dbRes = await Activity.updateMany(
      {
        "statement.id": { $in: sentStatementsIds },
      },
      { $set: { sent: true } },
    );
    console.log(
      `updateSentStatements: ${dbRes.modifiedCount} statements are updated`,
    );
  } catch (err) {
    console.log("Error in updating sent statements");
  }
};
