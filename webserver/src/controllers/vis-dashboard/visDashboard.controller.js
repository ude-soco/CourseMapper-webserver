const fs = require('fs').promises;
const process = require('process');

const visDashboardServices = require(".././../vis-dashboard/services/vis-dashboard.service");


export const getPlatform = async (req, res) => {
    try {
        const records = await visDashboardServices.getPlatforms()
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({error: err.message});
    }
};


export const getCourseCategories = async (req, res) => {
    //const slideId = req.params.slideId;

    try {
        const records = await visDashboardServices.getCourseCategories()
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({error: err.message});
    }
};

export const getCoursesByPopularity = async (req, res) => {
    const platformName = req.params.platformName;

    try {
        const records = await visDashboardServices.getCoursesByPopularity(platformName)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({error: err.message});
    }
};


export const getCoursesByRating = async (req, res) => {
    const platformName = req.params.pn;

    try {
        const records = await visDashboardServices.getCoursesByRating(platformName)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({error: err.message});
    }
};

export const getCourseById = async (req, res) => {
    const courseId = req.params.id;

    try {
        const records = await visDashboardServices.getCourseById(courseId)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({error: err.message});
    }
};


export const getConceptsByCourseId = async (req, res) => {
    const courseId = req.params.courseId;

    try {
        const records = await visDashboardServices.getConceptsByCourseId(courseId)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({error: err.message});
    }
}

export const getCoursesByCourseCategory = async (req, res) => {
    const courseCategory = req.params.courseCategory;
    const {sortByPopularity} = req.body

    try {
        if (sortByPopularity) {
            const records = await visDashboardServices.getCoursesByCourseCategorySorted(courseCategory)
            return res.status(200).send(records);
        } else {
            const records = await visDashboardServices.getCoursesByCourseCategory(courseCategory)
            return res.status(200).send(records);
        }

    } catch (err) {
        return res.status(500).send({error: err.message});
    }

};


export const getPopularTeachers = async (req, res) => {
    const platformName = req.params.platformName;

    try {
        const records = await visDashboardServices.getPopularTeachers(platformName)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({error: err.message});
    }
};


export const getTeacherById = async (req, res) => {
    const teacherId = req.params.teacherId;

    try {
        const records = await visDashboardServices.getTeacherById(teacherId)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({error: err.message});
    }
};

// Get concepts controller
export const getConceptsByPlatform = async (req, res) => {
    const platform = req.params.platform;

    try {
        const records = await visDashboardServices.getConceptsByPlatform(platform)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({error: err.message});
    }
};

// Get courses by concepts and platform controller
export const getCoursesByConceptAndPlatform = async (req, res) => {
    const platform = req.params.platform;
    const concept = req.params.concept;

    /*try {
        const records = await visDashboardServices.getCoursesByConceptAndPlatform(concept, platform)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({error: err.message});
    }*/
    try {
        const records = await visDashboardServices.getCoursesByConceptAndPlatform(platform, concept);
        return res.status(200).send(records);
    }   catch (err) {
        return res.status(500).send({ error: err.message });
    }
};


// Get popular courses for explore:controller
export const getCoursesByPopularityForVis = async (req, res) => {
    const platform = req.params.platform;
    const datapoints = req.params.datapoints;

    try {
        const records = await visDashboardServices.getCoursesByPopularityForVis(platform, datapoints)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({error: err.message});
    }
};

// Get most popular categories of courses: controller
export const getCategoryByPopularityForVis = async (req, res) => {
    const platform = req.params.platform;
    const datapoints = req.params.datapoints;

    try {
        const records = await visDashboardServices.getCategoryByPopularityForVis(platform, datapoints)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({error: err.message});
    }
};

// Get most active teachers : controller
export const getActiveTeachersForVis = async (req, res) => {
    const platform = req.params.platform;
    const datapoints = req.params.datapoints;

    try {
        const records = await visDashboardServices.getActiveTeachersForVis(platform, datapoints)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({error: err.message});
    }
};


// Get most active institutions : controller
export const getActiveInstitutionsForVis = async (req, res) => {
    const platform = req.params.platform;
    const datapoints = req.params.datapoints;

    try {
        const records = await visDashboardServices.getActiveInstitutionsForVis(platform, datapoints)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({error: err.message});
    }
};


export const postTest = async (req, res) => {
    const platform = req.params.platform;
    const datapoints = req.params.datapoints;
    const {platforms} = req.body
    try {
        const records = await visDashboardServices.postTest(platforms)
        return res.status(200).send(records);
    } catch (e) {
        return res.status(500).send({error: e.message});
    }
};

// Get platforms by number of teachers : controller
export const getNumberOfTeachersForCompare = async (req, res) => {
    const {platforms} = req.body
    try {
        const records = await visDashboardServices.getNumberOfTeachersForCompare(platforms)
        return res.status(200).send(records);
    } catch (e) {
        return res.status(500).send({error: e.message});
    }
};


// Get platforms by institution count for compare: controller
export const getNumberOfInstitutionsForCompare = async (req, res) => {
    const {platforms} = req.body
    try {
        const records = await visDashboardServices.getNumberOfInstitutionsForCompare(platforms)
        return res.status(200).send(records);
    } catch (e) {
        return res.status(500).send({error: e.message});
    }
};


// Get number of participants for compare : controller
export const getNumberOfParticipantsForCompare = async (req, res) => {
    const {platforms} = req.body
    try {
        const records = await visDashboardServices.getNumberOfParticipantsForCompare(platforms)
        return res.status(200).send(records);
    } catch (e) {
        return res.status(500).send({error: e.message});
    }
};

// Get courses by selected concept in compare : controller
export const getCoursesByConceptForCompare = async (req, res) => {
    const {platforms} = req.body
    const concept = req.params.concept;

    try {
        const records = await visDashboardServices.getCoursesByConceptForCompare(concept, platforms)
        return res.status(200).send(records);
    } catch (e) {
        return res.status(500).send({error: e.message});
    }
};


// Get concepts by platforms compare :controller
export const getConceptsByPlatforms = async (req, res) => {
    const {platforms} = req.body
    try {
        const records = await visDashboardServices.getConceptsByPlatforms(platforms)
        return res.status(200).send(records);
    } catch (e) {
        return res.status(500).send({error: e.message});
    }
};

// Get courses by concepts in Find : controller
export const getCoursesByConceptFind = async (req, res) => {
    const {concept} = req.body
    try {
        const records = await visDashboardServices.getCoursesByConceptsFind(concept)
        return res.status(200).send(records);
    } catch (e) {
        return res.status(500).send({error: e.message});
    }
};


export const addLangaugeToPlatform = async (req, res) => {
    try {
        const records = await visDashboardServices.addLanguageToPlatform()
        return res.status(200).send(records);
    } catch (e) {
        return res.status(500).send({error: e.message});
    }
};


export const getCourseRatingsPricesForVis = async (req, res) => {
    const platform = req.params.platform;
    const datapoints = req.params.datapoints;

    try {
        const records = await visDashboardServices.getCourseRatingsPricesForVis(platform, datapoints)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({error: err.message});
    }
};


export const getTopicsByCategory = async (req, res) => {
    const courseCategory = req.params.courseCategory;

    try {
        const records = await visDashboardServices.getTopicsByCategory(courseCategory)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({error: err.message});
    }

};

// Get courses by teacher for vis by ID? They receive path params and pass them to the service
export const getCoursesByTeacherForVisById = async (req, res) => {
  const { teacherId, platform } = req.params;
  try {
    const records = await visDashboardServices.getCoursesByTeacherForVis(
      platform,                                   // 1st arg: platformName
      { teacherId: Number(teacherId) }            // 2nd arg: options
    );
    return res.status(200).send(records);
  } catch (err) {
    console.error('[getCoursesByTeacherForVisById]', err);
    return res.status(500).send({ error: err.message });
  }
};

// by teacher NAME
export const getCoursesByTeacherForVisByName = async (req, res) => {
  const { teacherName, platform } = req.params;
  try {
    const records = await visDashboardServices.getCoursesByTeacherForVis(
      platform,                                   // 1st arg: platformName
      { teacherName }                             // 2nd arg: options
    );
    return res.status(200).send(records);
  } catch (err) {
    console.error('[getCoursesByTeacherForVisByName]', err);
    return res.status(500).send({ error: err.message });
  }
};

// by institution ID
export const getCoursesByInstitutionForVisById = async (req, res) => {
  const { institutionId, platform } = req.params;
  try {
    const records = await visDashboardServices.getCoursesByInstitutionForVis(
      platform,
      { institutionId: Number(institutionId) }
    );
    return res.status(200).send(records);
  } catch (err) {
    console.error('[getCoursesByInstitutionForVisById]', err);
    return res.status(500).send({ error: err.message });
  }
};

// by institution NAME
export const getCoursesByInstitutionForVisByName = async (req, res) => {
  const { institutionName, platform } = req.params;
  try {
    const records = await visDashboardServices.getCoursesByInstitutionForVis(
      platform,
      { institutionName }
    );
    return res.status(200).send(records);
  } catch (err) {
    console.error('[getCoursesByInstitutionForVisByName]', err);
    return res.status(500).send({ error: err.message });
  }
};
// Teachers list with course counts (paginated)
export const getTeachersByPlatform = async (req, res) => {
  const platform = req.params.platform;
  const page      = Math.max(parseInt(req.query.page ?? '1', 10), 1);
  const pageSize  = Math.max(parseInt(req.query.pageSize ?? '10', 10), 1);
  const q         = (req.query.q ?? '').toString();

  try {
    const data = await visDashboardServices.getTeachersByPlatform(platform, { page, pageSize, q });
    return res.status(200).send(data); // { total, items: [...] }
  } catch (err) {
    console.error('[getTeachersByPlatform]', err);
    return res.status(500).send({ error: err.message });
  }
};

// Institutions list with course counts (paginated)
export const getInstitutionsByPlatform = async (req, res) => {
  const platform = req.params.platform;
  const page      = Math.max(parseInt(req.query.page ?? '1', 10), 1);
  const pageSize  = Math.max(parseInt(req.query.pageSize ?? '10', 10), 1);
  const q         = (req.query.q ?? '').toString();

  try {
    const data = await visDashboardServices.getInstitutionsByPlatform(platform, { page, pageSize, q });
    return res.status(200).send(data); // { total, items: [...] }
  } catch (err) {
    console.error('[getInstitutionsByPlatform]', err);
    return res.status(500).send({ error: err.message });
  }
};

export const getCoursesLite = async (req, res) => {
  try {
    const platform   = (req.query.platform || '').trim();           // single platform
    const platformsQ = (req.query.platforms || '').trim();          // CSV for multi
    const limit      = Math.max(1, Math.min(200, parseInt(req.query.limit || '50', 10)));

    const platforms = platformsQ
      ? platformsQ.split(',').map(s => s.trim()).filter(Boolean)
      : null;

    const rows = await visDashboardServices.getCoursesLite({ platform, platforms, limit });
    return res.status(200).send(rows);
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

export const getPlatformCourses = async (req, res) => {
  try {
    const platform   = (req.query.platform || '').trim();
    const platformsQ = (req.query.platforms || '').trim();
    const platforms  = platformsQ ? platformsQ.split(',').map(s => s.trim()).filter(Boolean) : null;

    const page     = Math.max(parseInt(req.query.page ?? '1', 10), 1);
    const pageSize = Math.max(parseInt(req.query.pageSize ?? '20', 10), 1);
    const q        = (req.query.q ?? '').toString();
    const sort     = ['enrolled','rating','name'].includes(req.query.sort) ? req.query.sort : 'enrolled';
    const order    = (req.query.order === 'asc') ? 'asc' : 'desc';
    const minRating = Number(req.query.minRating ?? 0) || 0;

    const data = await visDashboardServices.getPlatformCourses({
      platform, platforms, page, pageSize, q, sort, order, minRating
    });
    return res.status(200).send(data); // { total, items: [...] }
  } catch (err) {
    console.error('[getPlatformCourses]', err);
    return res.status(500).send({ error: err.message });
  }
};