const recommendedMaterialsActivityGenerator = require("../generator/knowledge-graph/slide-kg/slide-kg-recommended-materials-generator");
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
