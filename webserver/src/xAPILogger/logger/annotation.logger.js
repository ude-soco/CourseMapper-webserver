const statementFactory = require('../statementsFactory/annotation.statementsFactory');
const lrs = require('../lrs/lrs');
const controller = require('../controller.xAPILogger');


export const newAnnotation = (req, res) => {
    const statement = statementFactory
    .getAnnotationCreationStatement(
        req.locals.user
        , req.locals.annotation
        , req.locals.material);
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    res.status(200).send(req.locals.response);
}

