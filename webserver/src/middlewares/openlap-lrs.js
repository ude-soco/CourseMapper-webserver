const openlapService = require('../services/openlap.service');

/**
 * Middleware to create an LRS store in OpenLAP for each new course
 */
const createLRSStore = async (req, res, next) => {
  try {
    const courseName = req.body.name;
    
    if (!courseName) {
      console.warn('No course name provided, aborting LRS creation');
      return res.status(400).json({
        success: false,
        message: "Course name is required.",
        error: "MISSING_COURSE_NAME"
      });
    }
    
    const lrsStore = await openlapService.createLRSStore(courseName);
    req.lrsStore = lrsStore;
    next();
  } catch (error) {
    console.error('LRS store creation failed:', error.message);
    
    return res.status(503).json({
      success: false,
      message: "Course creation failed: Unable to connect to the learning record service (LRS). Please try again later or contact support.",
      error: "LRS_CREATION_FAILED"
    });
  }
};

module.exports = {
  createLRSStore
};
