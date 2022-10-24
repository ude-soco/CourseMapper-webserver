const db = require("../models");
const Action = db.action;

export const saveStatementToMongo = async (statement) => {
  let action = new Action({
    sent: false,
    statement: statement,
  });

  let savedStatement;
  try {
    savedStatement = await action.save();
  } catch (err) {
    console.log(err);
  }
};
