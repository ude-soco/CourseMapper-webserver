const axios = require('axios');

const OPENLAP_BASE_URL = process.env.OPENLAP_API_URL || 'http://localhost:8090';
let OPENLAP_JWT_TOKEN = process.env.OPENLAP_JWT_TOKEN;
const OPENLAP_TIMEOUT = parseInt(process.env.OPENLAP_TIMEOUT) || 30000;
const UNIQUE_IDENTIFIER_TYPE = process.env.OPENLAP_UNIQUE_IDENTIFIER_TYPE || 'ACCOUNT_NAME';
const OPENLAP_USERNAME = process.env.OPENLAP_USERNAME;
const OPENLAP_PASSWORD = process.env.OPENLAP_PASSWORD;

// Create axios client for OpenLAP API
const openlapClient = axios.create({
  baseURL: OPENLAP_BASE_URL,
  timeout: OPENLAP_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include fresh token
openlapClient.interceptors.request.use(
  (config) => {
    config.headers.Authorization = `Bearer ${OPENLAP_JWT_TOKEN}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle 401 errors and retry with new token
openlapClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 Unauthorized and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry && OPENLAP_USERNAME && OPENLAP_PASSWORD) {
      originalRequest._retry = true;
      
      console.log('OpenLAP token expired, attempting to refresh...');
      
      try {
        const newToken = await loginToOpenLAP();
        OPENLAP_JWT_TOKEN = newToken;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return openlapClient(originalRequest);
      } catch (refreshError) {
        console.error('Failed to refresh OpenLAP token:', refreshError.message);
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Login to OpenLAP and get a fresh JWT token
 * @returns {Promise<string>} JWT token
 * @throws {Error} If login fails
 */
async function loginToOpenLAP() {
  try {
    if (!OPENLAP_USERNAME || !OPENLAP_PASSWORD) {
      throw new Error('OpenLAP credentials not configured. Set OPENLAP_USERNAME and OPENLAP_PASSWORD in .env');
    }
    
    console.log('Logging in to OpenLAP...');
    
    const response = await axios.post(`${OPENLAP_BASE_URL}/api/login`, {
      email: OPENLAP_USERNAME,
      password: OPENLAP_PASSWORD
    }, {
      timeout: OPENLAP_TIMEOUT
    });
    
    const token = response.data?.jwttoken || response.data?.token || response.data;
    
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid login response: no token received');
    }
    
    console.log('Successfully logged in to OpenLAP and obtained new token');
    
    return token;
  } catch (error) {
    console.error('OpenLAP login failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    throw new Error(`Failed to login to OpenLAP: ${error.message}`);
  }
}

/**
 * Creates a new LRS store in Learning Locker via OpenLAP
 * @param {string} courseName - The name/title of the course
 * @returns {Promise<Object>} LRS store data with credentials
 * @throws {Error} If LRS creation fails
 */
async function createLRSStore(courseName) {
  try {
    const response = await openlapClient.post('/api/v1/lrs/create', {
      title: courseName,
      uniqueIdentifierType: UNIQUE_IDENTIFIER_TYPE
    });
    
    const lrsData = response.data.data;
    
    if (!lrsData.lrsId) {
      throw new Error('Invalid response from OpenLAP: missing store ID');
    }
    
    console.log(`LRS store created: ${lrsData.lrsTitle} (ID: ${lrsData.lrsId})`);
    
    return {
      storeId: lrsData.lrsId,
      basicAuth: lrsData.basicAuth,
      title: lrsData.lrsTitle,
      statementCount: lrsData.statementCount || 0,
      uniqueIdentifierType: lrsData.uniqueIdentifierType,
      createdAt: lrsData.createdAt,
      status: 'active'
    };
  } catch (error) {
    console.error('Error creating LRS store:', error.message);
    throw new Error(`Failed to create LRS store: ${error.message}`);
  }
}

module.exports = {
  createLRSStore,
  loginToOpenLAP
};
