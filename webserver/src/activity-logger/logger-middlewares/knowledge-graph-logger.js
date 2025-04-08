const recommendedMaterialsActivityGenerator = require("../generator/knowledge-graph/slide-kg/slide-kg-recommended-materials-generator");
const mainConceptsActivityGenerator = require("../generator/knowledge-graph/slide-kg/slide-kg-main-concepts-generator");
const recommendedConceptsActivityGenerator = require("../generator/knowledge-graph/slide-kg/slide-kg-recommended-concepts-generator");
const materialKGActivityGenerator = require("../generator/knowledge-graph/material-kg/material-kg-generator");
const courseKGActivityGenerator = require("../generator/knowledge-graph/course-kg/course-kg-generator");

const activityController = require("../controller/activity-controller");

export const viewFullArticleRecommendedArticleLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      recommendedMaterialsActivityGenerator.generateViewFullWikipediaArticle(
        req
      )
    );
    res.status(200).json({ message: "Activity logged successfully" });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const expandArticleAbstractLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      recommendedMaterialsActivityGenerator.generateExpandArticleAbstract(req)
    );
    res.status(200).json({ message: "Activity logged successfully" });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const collapseArticleAbstractLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      recommendedMaterialsActivityGenerator.generateCollapseArticleAbstract(req)
    );
    res.status(200).json({ message: "Activity logged successfully" });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const markArticleAsHelpfulLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      recommendedMaterialsActivityGenerator.generateMarkArticleAsHelpful(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const markVideoAsHelpfulLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      recommendedMaterialsActivityGenerator.generateMarkVideoAsHelpful(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const markArticleAsUnhelpfulLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      recommendedMaterialsActivityGenerator.generateMarkArticleAsUnhelpful(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const markVideoAsUnhelpfulLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      recommendedMaterialsActivityGenerator.generateMarkVideoAsUnhelpful(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const unmarkArticleAsHelpfulLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      recommendedMaterialsActivityGenerator.generateUnmarkArticleAsHelpful(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const unmarkVideoAsHelpfulLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      recommendedMaterialsActivityGenerator.generateUnmarkVideoAsHelpful(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const unmarkArticleAsUnhelpfulLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      recommendedMaterialsActivityGenerator.generateUnmarkArticleAsUnhelpful(
        req
      )
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const unmarkVideoAsUnhelpfulLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      recommendedMaterialsActivityGenerator.generateUnmarkVideoAsUnhelpful(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const viewAllMainConceptsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      mainConceptsActivityGenerator.generateViewedAllMainConcepts(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const viewMoreConceptsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      mainConceptsActivityGenerator.generateViewedMoreConcepts(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const viewLessConceptsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      mainConceptsActivityGenerator.generateViewedLessConcepts(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const viewConceptLogger = async (req, res) => {
  try {
    if (req.locals.concept.type === "main_concept") {
      await activityController.createActivity(
        mainConceptsActivityGenerator.generateViewedConcept(req)
      );
    } else if (req.locals.concept.type === "recommended_concept") {
      await activityController.createActivity(
        recommendedConceptsActivityGenerator.generateViewedConcept(req)
      );
    } else {
      return res
        .status(400)
        .send({ error: "Concept type is missing or invalid" });
    }

    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const viewConceptCourseKGLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      courseKGActivityGenerator.generateViewedConceptCourseKG(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const viewConceptMaterialKGLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      materialKGActivityGenerator.generateViewedConceptMaterialKG(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const viewExplanationConceptLogger = async (req, res) => {
  try {
    let activity;

    if (req.locals.key === "V") {
      activity =
        recommendedConceptsActivityGenerator.generateViewedVisualExplanationConcept(
          req
        );
    } else if (req.locals.key === "T") {
      activity =
        recommendedConceptsActivityGenerator.generateViewedTextualExplanationConcept(
          req
        );
    } else {
      return res
        .status(400)
        .json({ error: "Invalid explanation type key", key: req.locals.key });
    }

    await activityController.createActivity(activity);
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const viewFullArticleRecommendedConceptLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      recommendedConceptsActivityGenerator.generateViewedFullArticleRecommendedConcept(
        req
      )
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const viewFullArticleMainConceptLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      mainConceptsActivityGenerator.generateViewedFullArticleMainConcept(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const viewFullArticleMaterialKGLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      materialKGActivityGenerator.generateViewedFullArticleMaterialKG(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const viewFullArticleCourseKGLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      courseKGActivityGenerator.generateViewedFullArticleCourseKG(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const viewAllRecommendedVideosLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      recommendedMaterialsActivityGenerator.generateViewedAllRecommendedVideos(
        req
      )
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const viewAllRecommendedArticlesLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      recommendedMaterialsActivityGenerator.generateViewedAllRecommendedArticles(
        req
      )
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const viewAllRecommendedConceptsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      recommendedConceptsActivityGenerator.generateViewedAllRecommendedConcepts(
        req
      )
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const markConceptAsNewLogger = async (req, res) => {
  try {
    if (req.locals.concept.type === "main_concept") {
      await activityController.createActivity(
        mainConceptsActivityGenerator.generateMarkConceptAsNew(req)
      );
    } else if (req.locals.concept.type === "recommended_concept") {
      await activityController.createActivity(
        recommendedConceptsActivityGenerator.generateMarkConceptAsNew(req)
      );
    } else {
      return res
        .status(400)
        .send({ error: "Concept data is missing or invalid" });
    }

    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const markConceptAsUnderstoodLogger = async (req, res) => {
  try {
    if (req.locals.concept.type === "main_concept") {
      await activityController.createActivity(
        mainConceptsActivityGenerator.generateMarkConceptAsUnderstood(req)
      );
    } else if (req.locals.concept.type === "recommended_concept") {
      await activityController.createActivity(
        recommendedConceptsActivityGenerator.generateMarkConceptAsUnderstood(
          req
        )
      );
    } else {
      return res
        .status(400)
        .send({ error: "Concept data is missing or invalid" });
    }

    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const markConceptAsNotUnderstoodLogger = async (req, res) => {
  try {
    if (req.locals.concept.type === "main_concept") {
      await activityController.createActivity(
        mainConceptsActivityGenerator.generateMarkConceptAsNotUnderstood(req)
      );
    } else if (req.locals.concept.type === "recommended_concept") {
      await activityController.createActivity(
        recommendedConceptsActivityGenerator.generateMarkConceptAsNotUnderstood(
          req
        )
      );
    } else {
      return res
        .status(400)
        .send({ error: "Concept data is missing or invalid" });
    }

    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const accessCourseKGLogger = async (req, res) => {
  try {
    if (req.locals.materials.length === 0) {
      return res.status(404).send();
    } else {
      await activityController.createActivity(
        courseKGActivityGenerator.generateAccessCourseKG(req)
      );
      res.status(200).send(req.locals.records);
    }
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const accessMaterialKGLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      materialKGActivityGenerator.generateAccessMaterialKG(req)
    );
    let records = req.locals.records;
    res.status(200).send({ records });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const didNotUnderstandSlideLogger = async (req, res, next) => {
  try {
    await activityController.createActivity(
      mainConceptsActivityGenerator.generateDidNotUnderstandSlide(req)
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const accessSlideKGLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      mainConceptsActivityGenerator.generateAccessSlideKG(req)
    );
    let records = req.locals.records;
    res.status(200).send({ records });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const finalizeMaterialKGLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      materialKGActivityGenerator.generateFinalizeMaterialKG(req)
    );
    res.status(200).send(result);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const hidConceptsMaterialKGLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      materialKGActivityGenerator.generateHidConcepts(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const unhidConceptsMaterialKGLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      materialKGActivityGenerator.generateUnhidConcepts(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const addConceptLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      materialKGActivityGenerator.generateAddConcept(req)
    );
    return res.status(200).send(req.locals.finalResult);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const deleteConceptLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      materialKGActivityGenerator.generateDeleteConcept(req)
    );
    return res.status(200).send(req.locals.result);
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
