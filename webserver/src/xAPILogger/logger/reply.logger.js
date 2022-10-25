const statementFactory = require("../statementsFactory/reply.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");

export const newReply = (req, res) => {
    const statement = statementFactory.getReplyCreationStatement(
      req.locals.user,
      req.locals.annotation,
      req.locals.reply
    );
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.status(200).send(req.locals.response);
  };

  export const deleteReply = (req, res) => {
    const statement = statementFactory.getReplyDeletionStatement(
      req.locals.user,
      req.locals.reply
    );
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    console.log('log something');
    res.status(200).send(req.locals.response);
  };