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


