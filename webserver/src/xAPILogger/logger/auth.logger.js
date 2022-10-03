const statementFactory = require('../statementsFactory/auth.statementsFactory');
const lrs = require('../lrs/lrs');
const controller = require('../controller.xAPILogger');

export const logUserSignup = (req, res) => {
    const statement = statementFactory
     .getSignupStatement( req.locals.user );
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.status(200).send(req.locals.response);
}

export const logUserLogin = (req, res) => {
    const statement = statementFactory
     .getLoginStatement( req.locals.user );
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.status(200).send(req.locals.response);
}

export const logUserLogout = (req, res) => {
    const statement = statementFactory
     .getLogoutStatement( req.locals.user );
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.status(200).send(req.locals.response);
}