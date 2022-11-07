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
      }
    } catch (error) {
      console.log(error);
    }
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
    } else if (response.status === 400) {
      console.log("sendStatementsToLrs: you are sending multiple Statements with the same id");
    } else if (response.status === 409) {
      console.log("sendStatementsToLrs: you are sending a Statement with an id that the LRS already has a Statement for");
    }
  } catch (error) {
    console.log(error);
  }
};
