const statementFactory = require('../statementsFactory/channel.statementsFactory');
const lrs = require('../lrs/lrs');
const controller = require('../controller.xAPILogger');


export const newChannel = (req, res) => {
    const statement = statementFactory
    .getChannelCreationStatement(
        req.locals.user
        , req.locals.channel);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.send(req.locals.response);
}

export const deleteChannel = (req, res) => {
    const statement = statementFactory
    .getChannelDeletionStatement(
        req.locals.user
        , req.locals.channel);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.send(req.locals.response);
}

export const getChannel = (req, res) => {
    const statement = statementFactory
    .getChannelAccessStatement(
        req.locals.user
        , req.locals.channel);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.status(200).send(req.locals.response);
}

export const editChannel = (req, res) => {
    const statement = statementFactory
    .getChannelEditStatement(
        req.locals.user
        , req.locals.newChannel
        , req.locals.oldChannel);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.send(req.locals.response);
}