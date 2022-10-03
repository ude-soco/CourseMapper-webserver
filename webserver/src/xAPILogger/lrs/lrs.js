const {lrs} = require('./lrs.config');

export const sendStatementToLrs = async ( statement ) => {
    let response;
    try {
        response = await lrs.put( `/statements?statementId=${statement.id}`, statement);
        if (response.status === 204){
            console.log(`statement ${statement.id} saved successfully`);
        }
    } catch (error) {
        if (error){
            console.log(error);
        }
    }
}