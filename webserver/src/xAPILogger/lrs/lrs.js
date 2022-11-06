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
    } else {
      console.log("sendStatementsToLrs: error in connection");
    }
  } catch (error) {
    console.log(error);
  }
};
