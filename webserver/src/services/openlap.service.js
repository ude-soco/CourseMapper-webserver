const axios = require('axios');

const OPENLAP_BASE_URL = process.env.OPENLAP_API_URL || 'http://localhost:8090';
let OPENLAP_JWT_TOKEN = process.env.OPENLAP_JWT_TOKEN;
const OPENLAP_TIMEOUT = parseInt(process.env.OPENLAP_TIMEOUT) || 30000;
const UNIQUE_IDENTIFIER_TYPE = process.env.OPENLAP_UNIQUE_IDENTIFIER_TYPE || 'ACCOUNT_NAME';
const OPENLAP_USERNAME = process.env.OPENLAP_USERNAME;
const OPENLAP_PASSWORD = process.env.OPENLAP_PASSWORD;

// Rate limiting: Prevent excessive login attempts
let lastLoginAttempt = 0;
const LOGIN_COOLDOWN_MS = 5000; // 5 seconds between login attempts

/**
 * Check if JWT token is expired or will expire soon
 */
function isTokenExpired(token) {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    return expirationTime < (currentTime + fiveMinutes);
  } catch (error) {
    console.error('Error parsing JWT token:', error.message);
    return true;
  }
}

// Create axios client for OpenLAP API
const openlapClient = axios.create({
  baseURL: OPENLAP_BASE_URL,
  timeout: OPENLAP_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include token
openlapClient.interceptors.request.use(
  async (config) => {
    // Enable auto-refresh by setting OPENLAP_AUTO_REFRESH=true in .env
    const autoRefreshEnabled = process.env.OPENLAP_AUTO_REFRESH === 'true';
    
    if (autoRefreshEnabled && isTokenExpired(OPENLAP_JWT_TOKEN) && OPENLAP_USERNAME && OPENLAP_PASSWORD) {
      console.log('OpenLAP token expired or expiring soon, refreshing...');
      try {
        OPENLAP_JWT_TOKEN = await loginToOpenLAP();
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Failed to refresh token:', error.message);
        console.error('Please update OPENLAP_JWT_TOKEN in .env manually');
      }
    }
    
    // Check if token is expired and warn user
    if (isTokenExpired(OPENLAP_JWT_TOKEN)) {
      console.warn('OpenLAP token has expired. Please update OPENLAP_JWT_TOKEN in .env');
    }
    
    config.headers.Authorization = `Bearer ${OPENLAP_JWT_TOKEN}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
openlapClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401/403 errors
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Only attempt auto-refresh if explicitly enabled
      const autoRefreshEnabled = process.env.OPENLAP_AUTO_REFRESH === 'true';
      
      if (autoRefreshEnabled && OPENLAP_USERNAME && OPENLAP_PASSWORD) {
        console.log('OpenLAP authentication failed, attempting token refresh...');
        try {
          OPENLAP_JWT_TOKEN = await loginToOpenLAP();
          originalRequest.headers.Authorization = `Bearer ${OPENLAP_JWT_TOKEN}`;
          return openlapClient(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError.message);
        }
      }
      
      console.error('OpenLAP authentication failed. Token may be expired.');
      console.error('Please update OPENLAP_JWT_TOKEN in .env with a fresh token.');
      console.error('Get a new token by logging into OpenLAP web interface.');
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
      throw new Error('OpenLAP credentials not configured');
    }
    
    //Prevent excessive login attempts
    const now = Date.now();
    if (now - lastLoginAttempt < LOGIN_COOLDOWN_MS) {
      const waitTime = Math.ceil((LOGIN_COOLDOWN_MS - (now - lastLoginAttempt)) / 1000);
      throw new Error(`Login rate limit: please wait ${waitTime} seconds before retrying`);
    }
    lastLoginAttempt = now;
    
    console.log('Attempting OpenLAP login...');
    
    const params = new URLSearchParams();
    params.append('userEmail', OPENLAP_USERNAME);
    params.append('password', OPENLAP_PASSWORD);
    
    const response = await axios.post(`${OPENLAP_BASE_URL}/api/login`, params, {
      timeout: OPENLAP_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    // OpenLAP returns access_token
    const token = response.data?.access_token;
    
    if (!token || typeof token !== 'string') {
      console.error('Invalid login response structure:', JSON.stringify(response.data));
      throw new Error('Invalid login response: no token received');
    }
    
    console.log('Login successful, token received');
    return token;
  } catch (error) {
    if (error.response) {
      console.error('OpenLAP login failed');
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data));
    } else {
      console.error('OpenLAP login failed:', error.message);
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
  // Validate input
  if (!courseName || typeof courseName !== 'string' || courseName.trim().length === 0) {
    throw new Error('Course name is required and must be a non-empty string');
  }
  
  try {
    const response = await openlapClient.post('/api/v1/lrs/create', {
      title: courseName.trim(),
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
