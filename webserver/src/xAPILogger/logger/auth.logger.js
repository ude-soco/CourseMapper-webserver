const statementFactory = require("../statementsFactory/auth.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");
const ORIGIN = process.env.ORIGIN;
const SEND_STATEMENT_IN_REALTIME = (process.env.SEND_STATEMENT_IN_REALTIME === 'true');

export const signup = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getSignupStatement(req.locals.user, origin);
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.status(200).send(req.locals.response);
};

export const signin = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN;
  const statement = statementFactory.getLoginStatement(req.locals.user, origin);
  if (SEND_STATEMENT_IN_REALTIME) {
    console.log(SEND_STATEMENT_IN_REALTIME)
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.status(200).send(req.locals.response);
};

export const signout = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN;
  const statement = statementFactory.getLogoutStatement(req.locals.user, origin);
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.status(200).send(req.locals.response);
};
