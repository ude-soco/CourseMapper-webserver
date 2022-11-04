const statementFactory = require("../statementsFactory/channel.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");
const ORIGIN = process.env.ORIGIN;
const SEND_STATEMENT_IN_REALTIME = (process.env.SEND_STATEMENT_IN_REALTIME === 'true');

export const newChannel = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getChannelCreationStatement(
    req.locals.user,
    req.locals.channel,
    origin
  );
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.send(req.locals.response);
};

export const deleteChannel = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getChannelDeletionStatement(
    req.locals.user,
    req.locals.channel,
    origin
  );
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.send(req.locals.response);
};

export const getChannel = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getChannelAccessStatement(
    req.locals.user,
    req.locals.channel,
    origin
  );
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.status(200).send(req.locals.response);
};

export const editChannel = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getChannelEditStatement(
    req.locals.user,
    req.locals.newChannel,
    req.locals.oldChannel,
    origin
  );
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.send(req.locals.response);
};
