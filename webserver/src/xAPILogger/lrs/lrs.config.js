const axios = require("axios");
const https = require("https");
const xAPI_Version = "1.0.2";

const headers = {
  "Content-Type": "application/json",
  Authorization: process.env.LRS_Authorization,
  "X-Experience-API-Version": xAPI_Version,
};

const agent = new https.Agent({
  rejectUnauthorized: false,
});

let lrs = axios.create({
  baseURL: process.env.LRS_endpoint,
  headers: headers,
  httpsAgent: agent,
  timeout: 10000,
});


lrs.interceptors.request.use( x => {
  // to avoid overwriting if another interceptor
  // already defined the same object (meta)
  x.meta = x.meta || {}
  x.meta.requestStartedAt = new Date().getTime();
  return x;
});

lrs.interceptors.response.use(x => {
  console.log(`Execution time for: ${x.config.url} - ${new Date().getTime() - x.config.meta.requestStartedAt} ms`)
  return x;
})

module.exports.lrs = lrs;