const statementFactory = require("../statementsFactory/channel.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");
const ORIGIN = process.env.ORIGIN;

export const newChannel = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getChannelCreationStatement(
    req.locals.user,
    req.locals.channel,
    origin
  );
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.send(req.locals.response);
};

export const deleteChannel = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getChannelDeletionStatement(
    req.locals.user,
    req.locals.channel,
    origin
  );
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.send(req.locals.response);
};

export const getChannel = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getChannelAccessStatement(
    req.locals.user,
    req.locals.channel,
    origin
  );
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
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
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.send(req.locals.response);
};
