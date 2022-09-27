const {lrs} = require('./LRSConfig');
const statementFactory = require('./statementsFactory');




export const logCourseCreation = (req, res, next) => {
    const statement = statementFactory
    .getCourseCreationStatement(
        `${req.locals.user.firstname} ${req.locals.user.lastname}`
        , req.locals.user.username
        , req.locals.response.courseSaved);
    saveStatement(statement);
    res.send(req.locals.response);
}

function saveStatement( statement ) {
    lrs.put( `/statements?statementId=${statement.id}`, statement)
    .then((response) => {
            if (response.status === 204){
                console.log(`statement ${statement.id} saved successfully`);
            }
        })
        .catch(function (error) {
            if (error){
                console.log(error);
            }
        });
}