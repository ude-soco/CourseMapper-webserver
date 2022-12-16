const statementFactory = require("../statementsFactory/channel.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");
const ORIGIN = process.env.ORIGIN;

export const newChannel = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getChannelCreationStatement(
    req.locals.user,
    req.locals.channel,
    origin
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.send(req.locals.response);
};

export const deleteChannel = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getChannelDeletionStatement(
    req.locals.user,
    req.locals.channel,
    origin
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.send(req.locals.response);
};

export const getChannel = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getChannelAccessStatement(
    req.locals.user,
    req.locals.channel,
    origin
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.status(200).send(req.locals.response);
};

export const editChannel = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getChannelEditStatement(
    req.locals.user,
    req.locals.newChannel,
    req.locals.oldChannel,
    origin
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.send(req.locals.response);
};
