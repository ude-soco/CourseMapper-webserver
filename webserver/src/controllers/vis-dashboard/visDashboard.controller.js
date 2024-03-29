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


