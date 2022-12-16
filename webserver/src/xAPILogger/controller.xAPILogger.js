const db = require("../models");
const Activity = db.activity;
const SEND_STATEMENT_IN_REALTIME = (process.env.SEND_STATEMENT_IN_REALTIME === 'true');

export const saveStatementToMongo = async (statement, sent) => {
  let activity = new Activity({
    statement: statement,
    sent: sent
  });

  let savedStatement;
  try {
    savedStatement = await activity.save();
  } catch (err) {
    console.log(err);
  }
};

export const fetchUnsentStatements = async () => {
  try {
    const unsentActivities = await Activity.find(
      { sent: false },
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

export const updateSentStatements = async (sentStatementsIds) => {
  try {
    sentStatementsIds = sentStatementsIds ? sentStatementsIds : [];
    const dbRes = await Activity.updateMany({
      "statement.id": { $in: sentStatementsIds },
    },{ $set: { sent: true } });
    console.log(
      `updateSentStatements: ${dbRes.modifiedCount} statements are updated`
    );
  } catch (err) {
    console.log(err);
  }
};
