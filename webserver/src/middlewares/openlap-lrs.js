const openlapService = require('../services/openlap.service');

/**
 * Middleware to create an LRS store in OpenLAP for a new course
 * Attaches LRS store information to req.lrsStore for the controller to use
 */
const createLRSStore = async (req, res, next) => {
  try {
    const courseName = req.body.name;
    
    if (!courseName) {
      console.warn('No course name provided, skipping LRS creation');
      req.lrsStore = {
        storeId: null,
        basicAuth: null,
        title: null,
        statementCount: 0,
        uniqueIdentifierType: null,
        createdAt: null,
        status: 'none'
      };
      return next();
    }
    
    const lrsStore = await openlapService.createLRSStore(courseName);
    req.lrsStore = lrsStore;
    next();
  } catch (error) {
    console.error('LRS store creation failed:', error.message);
    console.warn('Continuing with course creation without LRS store');
    
    req.lrsStore = {
      storeId: null,
      basicAuth: null,
      title: req.body.name || null,
      statementCount: 0,
      uniqueIdentifierType: process.env.OPENLAP_UNIQUE_IDENTIFIER_TYPE || 'ACCOUNT_NAME',
      createdAt: null,
      status: 'failed',
      error: error.message
    };
    
    next();
  }
};

module.exports = {
  createLRSStore
};
