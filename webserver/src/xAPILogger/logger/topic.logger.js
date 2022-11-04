const statementFactory = require("../statementsFactory/topic.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");
const ORIGIN = process.env.ORIGIN;
const SEND_STATEMENT_IN_REALTIME = (process.env.SEND_STATEMENT_IN_REALTIME === 'true');

export const newTopic = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getTopicCreationStatement(
    req.locals.user,
    req.locals.topic,
    origin
  );
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.send(req.locals.response);
};

export const deleteTopic = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getTopicDeletionStatement(
    req.locals.user,
    req.locals.topic,
    origin
  );
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.send(req.locals.response);
};

export const getTopic = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getTopicAccessStatement(
    req.locals.user,
    req.locals.topic,
    origin
  );
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.status(200).send(req.locals.response);
};

export const editTopic = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getTopicEditStatement(
    req.locals.user,
    req.locals.newTopic,
    req.locals.oldTopic,
    origin
  );
  if (SEND_STATEMENT_IN_REALTIME) {
    lrs.sendStatementToLrs(statement);
  }
  controller.saveStatementToMongo(statement, SEND_STATEMENT_IN_REALTIME);
  res.send(req.locals.response);
};
