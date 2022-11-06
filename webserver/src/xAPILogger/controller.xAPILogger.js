const db = require("../models");
const Action = db.action;
const SEND_STATEMENT_IN_REALTIME = (process.env.SEND_STATEMENT_IN_REALTIME === 'true');

export const saveStatementToMongo = async (statement) => {
  let action = new Action({
    sent: SEND_STATEMENT_IN_REALTIME,
    statement: statement,
  });

  let savedStatement;
  try {
    if (!SEND_STATEMENT_IN_REALTIME) {
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
