const { lrs } = require("./lrs-config");

export const sendStatementsToLrs = async (statements, basicAuth = null) => {
  let response;
  try {
    // Prepare headers - use dynamic basicAuth if provided, otherwise use default from env
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': basicAuth || process.env.LRS_Authorization,
      'X-Experience-API-Version': '1.0.2'
    };
    
    response = await lrs.post(`/statements`, statements, { headers });
    console.log('sendStatementsToLrs: LRS responded', response.status);
    
    if (response && response.status === 200) {
      // LRS should return array of statement IDs
      if (Array.isArray(response.data)) {
        console.log(`sendStatementsToLrs: ${response.data.length} statement IDs returned from LRS`);
        return response.data;
      }
    }
  } catch (error) {
    if (error.response) {
      console.log('sendStatementsToLrs: LRS error status=', error.response.status);
      try { console.log('sendStatementsToLrs: response body sample=', JSON.stringify(error.response.data).slice(0,1000)); } catch(e){}
    } else {
      console.log('sendStatementsToLrs: error sending statements to LRS:', error.message);
    }
  }
  return [];
};
