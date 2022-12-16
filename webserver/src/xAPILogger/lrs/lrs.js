const { lrs } = require("./lrs.config");
const SEND_STATEMENT_IN_REALTIME =
  process.env.SEND_STATEMENT_IN_REALTIME === "true";

export const sendStatementToLrs = async (statement) => {
  if (SEND_STATEMENT_IN_REALTIME) {
    let response;
    try {
      response = await lrs.put(
        `/statements?statementId=${statement.id}`,
        statement
      );
      if (response.status === 204) {
        console.log(
          `sendStatementToLrs: statement ${statement.id} saved successfully to LRS`
        );
        return true;
      }
      return false;
    } catch (error) {
      // in case there is a problem in connection like the LRS is down. status code 443
      // in case the batch contains a statement with an id, the LRS is having already a statement for and the statements are not matching. status code 409
      console.log(error);
      return false;
    }
  } else {
    return false;
  }
};

export const sendStatementsToLrs = async (statements) => {
  let response;
  try {
    response = await lrs.post(`/statements`, statements);
    if (response.status === 200) {
      console.log(
        `sendStatementsToLrs: ${response.data.length} statemens are saved successfully to LRS`
      );
      return response.data;
    }
  } catch (error) {
    // in case there is a problem in connection like the LRS is down. status code 443
    // in case the batch contains 2 statements with the same id. status code 400
    // in case the batch contains a statement with an id, the LRS is having already a statement for and the statements are not matching. status code 409
    console.log(error);
  }
};
