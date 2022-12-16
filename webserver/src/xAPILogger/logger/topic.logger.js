const statementFactory = require("../statementsFactory/topic.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");
const ORIGIN = process.env.ORIGIN;

export const newTopic = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getTopicCreationStatement(
    req.locals.user,
    req.locals.topic,
    origin
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.send(req.locals.response);
};

export const deleteTopic = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getTopicDeletionStatement(
    req.locals.user,
    req.locals.topic,
    origin
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.send(req.locals.response);
};

export const getTopic = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getTopicAccessStatement(
    req.locals.user,
    req.locals.topic,
    origin
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.status(200).send(req.locals.response);
};

export const editTopic = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getTopicEditStatement(
    req.locals.user,
    req.locals.newTopic,
    req.locals.oldTopic,
    origin
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.send(req.locals.response);
};
