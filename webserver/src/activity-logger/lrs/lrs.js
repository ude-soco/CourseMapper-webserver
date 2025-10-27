const { lrs } = require("./lrs-config");
const SEND_STATEMENT_IN_REALTIME =
  process.env.SEND_STATEMENT_IN_REALTIME === "true";

export const sendStatementToLrs = async (statement) => {
  if (SEND_STATEMENT_IN_REALTIME) {
    let response;
    try {
      response = await lrs.put(
        `/statements?statementId=${statement.id}`,
        statement,
      );
      if (response.status === 204) {
        console.log(
          `sendStatementToLrs: statement ${statement.id} saved successfully to LRS`,
        );
        return true;
      }
      return false;
    } catch (error) {
      // in case there is a problem in connection like the LRS is down. status code 443
      // in case you send a statement with an id, the LRS is having already a statement for and the both statements are not matching. status code 409
      // console.log(error.response.data);
      // console.log(error.response.status);
      // console.log(error.response.headers);
      console.log("sendStatementToLrs: error in sending statement to LRS");
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
    console.log('sendStatementsToLrs: LRS responded', response.status);
    
    // DEBUG: Log response data structure
    console.log('sendStatementsToLrs: response.data type =', typeof response.data);
    console.log('sendStatementsToLrs: response.data is array?', Array.isArray(response.data));
    console.log('sendStatementsToLrs: response.data =', JSON.stringify(response.data).slice(0, 500));
    
    if (response && response.status === 200) {
      // Check if LRS returned HTML (misconfiguration)
      if (typeof response.data === 'string' && response.data.includes('<!doctype')) {
        console.warn('⚠️  WARNING: LRS returned HTML instead of JSON. This indicates LRS misconfiguration.');
        console.warn('⚠️  Using statement IDs from request as workaround.');
        // WORKAROUND: Extract IDs from statements we sent
        const sentIds = statements.map(s => s.id).filter(Boolean);
        console.log('sendStatementsToLrs: extracted', sentIds.length, 'IDs from sent statements');
        return sentIds;
      }
      
      // Normal case: LRS returned array of IDs
      if (Array.isArray(response.data)) {
        const len = response.data.length;
        console.log(`sendStatementsToLrs: ${len} statement IDs returned from LRS`);
        return response.data;
      }
      
      // Unexpected format
      console.warn('⚠️  WARNING: LRS returned unexpected format:', typeof response.data);
      return [];
    }
  } catch (error) {
    // in case there is a problem in connection like the LRS is down. status code 443
    // in case the batch contains 2 statements with the same id. status code 400
    // in case the batch contains a statement with an id, the LRS is having already a statement for and the statements are not matching. status code 409
    if (error.response) {
      console.log('sendStatementsToLrs: LRS error status=', error.response.status);
      try { console.log('sendStatementsToLrs: response body sample=', JSON.stringify(error.response.data).slice(0,1000)); } catch(e){}
    } else {
      console.log('sendStatementsToLrs: error sending statements to LRS:', error.message);
    }
  }
  return [];
};
