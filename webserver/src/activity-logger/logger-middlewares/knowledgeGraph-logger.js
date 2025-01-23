const knowledgeGraphActivityGenerator = require("../generator/KnowledgeGraph/Slide-KnowledgeGraph/recommendedMaterials-generator");
const activityController = require("../controller/activity-controller");

export const viewFullWikipediaArticleLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      knowledgeGraphActivityGenerator.generateViewFullWikipediaArticle(req)
    );
    res
      .status(200)
      .json({ message: "Article view Activity logged successfully" });
  } catch (error) {
    console.error("Error logging article view:", error);
    res.status(400).send("Failed to log article view");
  }
};
