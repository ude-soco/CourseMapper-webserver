const db = require("../../models");
const Activity = db.activity;
const SEND_STATEMENT_IN_REALTIME =
  process.env.SEND_STATEMENT_IN_REALTIME === "true";

export const saveStatementToMongo = async (
  statement,
  sent,
  notificationInfo,
) => {
  let activity = new Activity({
    statement: statement,
    sent: sent,
    notificationInfo: notificationInfo,
  });

  let savedStatement;
  try {
    savedStatement = await activity.save();
    return savedStatement;
  } catch (err) {
    console.log("Error in saving statement to mongo");
    throw err;
  }
};

export const fetchUnsentStatements = async () => {
  try {
    const unsentActivities = await Activity.find(
      { sent: false },
      { statement: 1, _id: 0 },
    );
    const unsentStatements = unsentActivities.map(
      (activity) => activity.statement,
    );
    return unsentStatements;
  } catch (err) {
    console.log("Error in fetching unsent statements");
  }
};

export const updateSentStatements = async (sentStatementsIds) => {
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
