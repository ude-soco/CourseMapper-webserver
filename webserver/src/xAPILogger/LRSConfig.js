const axios = require('axios');
const https = require('https');


const headers = {
    'Content-Type': 'application/json',
    'Authorization': process.env.LRS_Authorization,
    'X-Experience-API-Version': process.env.xAPI_Version
}

const agent = new https.Agent({
    rejectUnauthorized: false
});

export const lrs = axios.create({
    baseURL: process.env.LRS_endpoint,
    headers: headers,
    httpsAgent: agent,
    timeout: 1000,
});