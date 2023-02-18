const statementFactory = require("../statementsFactory/auth.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");
const ORIGIN = process.env.ORIGIN;

export const signup = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getSignupStatement(req.locals.user, origin);
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.status(200).send(req.locals.response);
};

export const signin = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN;
  const statement = statementFactory.getLoginStatement(req.locals.user, origin);
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.status(200).send(req.locals.response);
};

export const signout = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN;
  const statement = statementFactory.getLogoutStatement(req.locals.user, origin);
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.status(200).send(req.locals.response);
};
