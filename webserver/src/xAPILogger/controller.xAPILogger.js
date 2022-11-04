const db = require("../models");
const Action = db.action;

export const saveStatementToMongo = async (statement, sent) => {
  let action = new Action({
    sent: sent,
    statement: statement,
  });

  let savedStatement;
  try {
    if (!sent) {
      savedStatement = await action.save();
    }
  } catch (err) {
    console.log(err);
  }
};

export const fetchUnsentStatements = async () => {
  try {
    const unsentActions = await Action.find(
      { sent: false },
      { statement: 1, _id: 0 }
    );
    const unsentStatements = unsentActions.map((action) => action.statement);
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
    const dbRes = await Action.deleteMany({
      "statement.id": { $in: sentStatementsIds },
    });
    console.log(
      `deleteSentStatements: ${dbRes.deletedCount} statements are deleted`
    );
  } catch (err) {
    console.log(err);
  }
};
