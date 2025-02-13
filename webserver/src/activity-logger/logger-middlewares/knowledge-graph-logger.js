const recommendedMaterialsActivityGenerator = require("../generator/knowledge-graph/slide-kg/slide-kg-recommended-materials-generator");
const mainConceptsActivityGenerator = require("../generator/knowledge-graph/slide-kg/slide-kg-main-concepts-generator");
const recommendedConceptsActivityGenerator = require("../generator/knowledge-graph/slide-kg/slide-kg-recommended-concepts-generator");
const activityController = require("../controller/activity-controller");

export const viewFullWikipediaArticleLogger = async (req, res) => {
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
export const expandedArticleAbstractLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      recommendedMaterialsActivityGenerator.generateExpandArticleAbstract(req)
    );
    res.status(200).json({ message: "Activity logged successfully" });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const collapsedArticleAbstractLogger = async (req, res) => {
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
export const viewedAllMainConceptsLogger = async (req, res) => {
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
export const viewedMoreConceptsLogger = async (req, res) => {
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
export const viewedLessConceptsLogger = async (req, res) => {
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
export const viewedConceptLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      mainConceptsActivityGenerator.generateViewedConcept(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const viewedAllRecommendedVideosLogger = async (req, res) => {
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

export const viewedAllRecommendedArticlesLogger = async (req, res) => {
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
export const viewedAllRecommendedConceptsLogger = async (req, res) => {
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
