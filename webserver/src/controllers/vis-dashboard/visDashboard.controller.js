const fs = require('fs').promises;
const process = require('process');

const visDashboardServices = require(".././../vis-dashboard/services/vis-dashboard.service");



export const getPlatform = async (req, res) => {
    //const slideId = req.params.slideId;

    try {
        const records = await visDashboardServices.getPlatforms()
        return res.status(200).send(records );
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
};


export const getCourseCategories = async (req, res) => {
    //const slideId = req.params.slideId;

    try {
        const records = await visDashboardServices.getCourseCategories()
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
};

export const getCoursesByPopularity = async (req, res) => {
    const platformName = req.params.platformName;

    try {
        const records = await visDashboardServices.getCoursesByPopularity(platformName)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
};


export const getCoursesByRating = async (req, res) => {
    const platformName = req.params.pn;

    try {
        const records = await visDashboardServices.getCoursesByRating(platformName)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
};

export const getCourseById = async (req, res) => {
    const courseId = req.params.id;

    try {
        const records = await visDashboardServices.getCourseById(courseId)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({ error: err.message });
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

        try {
            const records = await visDashboardServices.getCoursesByCourseCategory(courseCategory)
            return res.status(200).send(records);
        } catch (err) {
            return res.status(500).send({ error: err.message });
        }

};



export const getPopularTeachers = async (req, res) => {
    const platformName = req.params.platformName;

    try {
        const records = await visDashboardServices.getPopularTeachers(platformName)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
};


export const getTeacherById= async (req, res) => {
    const teacherId= req.params.teacherId;

    try {
        const records = await visDashboardServices.getTeacherById(teacherId)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
};


export const getConceptsByPlatform= async (req, res) => {
    const platform= req.params.platform;

    try {
        const records = await visDashboardServices.getConceptsByPlatform(platform)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
};

export const getCoursesByConceptAndPlatform= async (req, res) => {
    const platform= req.params.platform;
    const concept= req.params.concept;

    try {
        const records = await visDashboardServices.getCoursesByConceptAndPlatform(concept,platform)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
};


export const getCoursesByPopularityForVis = async (req, res) => {
    const platform= req.params.platform;
    const datapoints = req.params.datapoints;

    try {
        const records = await visDashboardServices.getCoursesByPopularityForVis(platform,datapoints)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
};


export const getCategoryByPopularityForVis = async (req, res) => {
    const platform= req.params.platform;
    const datapoints = req.params.datapoints;

    try {
        const records = await visDashboardServices.getCategoryByPopularityForVis(platform,datapoints)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
};


export const getActiveTeachersForVis = async (req, res) => {
    const platform= req.params.platform;
    const datapoints = req.params.datapoints;

    try {
        const records = await visDashboardServices.getActiveTeachersForVis(platform,datapoints)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
};

export const getActiveInstitutionsForVis = async (req, res) => {
    const platform= req.params.platform;
    const datapoints = req.params.datapoints;

    try {
        const records = await visDashboardServices.getActiveInstitutionsForVis(platform,datapoints)
        return res.status(200).send(records);
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
};



export const postTest= async (req, res) => {
    const platform= req.params.platform;
    const datapoints = req.params.datapoints;
    const {platforms} = req.body
    try{
      console.log(platforms)
        const records = await visDashboardServices.postTest(platforms)
        const comparisonData = records.map(record=>({
           // platform: record.get('PlatformName'),
           // course: record.get('CourseName')
        }))
        return res.status(200).send(records);
    }catch (e) {
        return res.status(500).send({ error: e.message });
    }
};

export const getNumberOfTeachersForCompare= async (req, res) => {
    const {platforms} = req.body
    try{
        const records = await visDashboardServices.getNumberOfTeachersForCompare(platforms)
        return res.status(200).send(records);
    }catch (e) {
        return res.status(500).send({ error: e.message });
    }
};

