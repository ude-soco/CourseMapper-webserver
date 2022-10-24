const statementFactory = require("../statementsFactory/auth.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");

export const signup = (req, res) => {
  const statement = statementFactory.getSignupStatement(req.locals.user);
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const signin = (req, res) => {
  const statement = statementFactory.getLoginStatement(req.locals.user);
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const signout = (req, res) => {
  const statement = statementFactory.getLogoutStatement(req.locals.user);
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};
