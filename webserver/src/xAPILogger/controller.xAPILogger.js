const db = require("../models");
const Activity = db.activity;
const SEND_STATEMENT_IN_REALTIME = (process.env.SEND_STATEMENT_IN_REALTIME === 'true');

export const saveStatementToMongo = async (statement) => {
  let activity = new Activity({
    statement: statement,
  });

  let savedStatement;
  try {
    if (!SEND_STATEMENT_IN_REALTIME) {
      savedStatement = await activity.save();
    }
  } catch (err) {
    console.log(err);
  }
};

export const fetchUnsentStatements = async () => {
  try {
    const unsentActivities = await Activity.find(
      { },
      { statement: 1, _id: 0 }
    );
    const unsentStatements = unsentActivities.map((activity) => activity.statement);
    console.log(
      `fetchUnsentStatements: ${unsentStatements.length} statements are found`
    );
    return unsentStatements;
  } catch (err) {
    console.log(err);
  }
};

export const deleteSentStatements = async (sentStatementsIds) => {
  try {
    const dbRes = await Activity.deleteMany({
      "statement.id": { $in: sentStatementsIds },
    });
    console.log(
      `deleteSentStatements: ${dbRes.deletedCount} statements are deleted`
    );
  } catch (err) {
    console.log(err);
  }
};
