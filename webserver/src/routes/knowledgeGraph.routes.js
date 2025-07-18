const { authJwt } = require("../middlewares");
const controller = require("../controllers/knowledgeGraph.controller");
const recommendationController = require("../controllers/recommendation.controller"); 
const logger = require("../activity-logger/logger-middlewares/knowledge-graph-logger");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.get(
    "/api/knowledge-graph/check-slide/:slideId",
    [authJwt.verifyToken],
    controller.checkSlide
  );

  app.get(
    "/api/knowledge-graph/get-slide/:slideId",
    [authJwt.verifyToken],
    controller.getSlide,
    logger.didNotUnderstandSlideLogger,
    logger.accessSlideKGLogger
  );

  app.get(
    "/api/knowledge-graph/check-material/:materialId",
    [authJwt.verifyToken],
    controller.checkMaterial
  );

  app.get(
    "/api/knowledge-graph/get-material/:materialId",
    [authJwt.verifyToken],
    controller.getMaterial,
    logger.accessMaterialKGLogger
  );

  app.get(
    "/api/knowledge-graph/get-material-slides/:materialId",
    [authJwt.verifyToken],
    controller.getMaterialSlides
  );

  app.get(
    "/api/knowledge-graph/get-material-edges/:materialId",
    [authJwt.verifyToken],
    controller.getMaterialEdges
  );

  app.get(
    "/api/knowledge-graph/get-material-concept-ids/:materialId",
    [authJwt.verifyToken],
    controller.getMaterialConceptIds
  );

  app.get(
    "/api/knowledge-graph/get-higher-levels-nodes-and-edges",
    [authJwt.verifyToken],
    controller.getHigherLevelsNodesAndEdges,
    logger.accessCourseKGLogger
  );

  app.post(
    "/api/knowledge-graph/rating",
    [authJwt.verifyToken],
    controller.setRating
  );

  app.post(
    "/api/courses/:courseId/materials/:materialId/concept-map",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.conceptMap
  );

  app.delete(
    "/api/courses/:courseId/materials/:materialId/concept-map/concepts/:conceptId",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.deleteConcept
    // logger.deleteConceptLogger
  );

  app.post(
    "/api/courses/:courseId/materials/:materialId/concept-map/concepts",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.addConcept
  );

  app.post(
    "/api/courses/:courseId/materials/:materialId/concept-map/publish",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.publishConceptMap
  );

  // app.post(
  //   "/api/courses/:courseId/materials/:materialId/concept-recommendation",
  //   [authJwt.verifyToken, authJwt.isEnrolled],
  //   controller.getConcepts
  // );

  // app.post(
  //   "/api/courses/:courseId/materials/:materialId/resource-recommendation",
  //   [authJwt.verifyToken, authJwt.isEnrolled],
  //   controller.getResources
  // );

  app.get(
    "/api/wikipedia/search",
    [authJwt.verifyToken],
    controller.searchWikipedia
  );
  app.post(
    "/api/courses/:courseId/materials/:materialId/concept-recommendation/log",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.viewedAllRecommendedConcepts,
    logger.viewAllRecommendedConceptsLogger
  );
  app.post(
    "/api/courses/:courseId/materials/:materialId/concepts/:conceptId/mark-new",
    [authJwt.verifyToken],
    controller.markConceptAsNew,
    logger.markConceptAsNewLogger
  );

  // Mark a concept as understood
  app.post(
    "/api/courses/:courseId/materials/:materialId/concepts/:conceptId/mark-understood",
    [authJwt.verifyToken],
    controller.markConceptAsUnderstood,
    logger.markConceptAsUnderstoodLogger
  );
  app.post(
    "/api/courses/:courseId/materials/:materialId/concepts/:conceptId/mark-not-understood",
    [authJwt.verifyToken],
    controller.markConceptAsNotUnderstood,
    logger.markConceptAsNotUnderstoodLogger
  );
  app.post(
    "/api/recommendation/user_resources/filter",
    [authJwt.verifyToken],
    recommendationController.filterUserResourcesSavedBy
  );

  app.get(
    "/api/recommendation/user_resources/get_rids_from_user_saves",
    [authJwt.verifyToken],
    recommendationController.getRidsFromUserResourcesSaved
  );

  app.get(
    "/api/recommendation/setting/get_concepts_by_cids",
    [authJwt.verifyToken],
    recommendationController.getConceptsByCids
  );

  app.get(
    "/api/recommendation/setting/get_concepts_modified_by_user_id",
    [authJwt.verifyToken],
    recommendationController.getConceptsModifiedByUserId
  );

  app.get(
    "/api/recommendation/setting/get_concepts_modified_by_user_id_and_mid",
    [authJwt.verifyToken],
    recommendationController.getConceptsModifiedByUserIdAndMid
  );

  app.get(
    "/api/recommendation/setting/get_concepts_modified_by_user_id_and_slide_id",
    [authJwt.verifyToken],
    recommendationController.getConceptsModifiedByUserIdAndSlideId
  );

  app.get(
    "/api/recommendation/setting/get_concepts_modified_by_user_from_saves",
    [authJwt.verifyToken],
    recommendationController.getConceptsModifiedByUserFromSaves
  );

  app.post(
    "/api/recommendation/save_or_remove_resources",
    [authJwt.verifyToken],
    recommendationController.SaveOrRemveUserResources
  );

  app.post(
    "/api/recommendation/rating_resource",
    [authJwt.verifyToken],
    recommendationController.ratingResource
  );

  app.post(
    "/api/recommendation/get_concepts",
    [authJwt.verifyToken],
    recommendationController.getConcepts
  );

  app.post(
    "/api/recommendation/get_resources",
    [authJwt.verifyToken],
    recommendationController.getResources
  );

  app.post(
    "/api/courses/:courseId/materials/:materialId/main-concepts/log",
    [authJwt.verifyToken],
    controller.viewedAllMainConcepts,
    logger.viewAllMainConceptsLogger
  );
  app.post(
    "/api/courses/:courseId/materials/:materialId/main-concepts/log-view-more",
    [authJwt.verifyToken],
    controller.viewedMoreConcepts,
    logger.viewMoreConceptsLogger
  );
  app.post(
    "/api/courses/:courseId/materials/:materialId/main-concepts/log-view-less",
    [authJwt.verifyToken],
    controller.viewedLessConcepts,
    logger.viewLessConceptsLogger
  );
  app.post(
    "/api/courses/:courseId/materials/:materialId/concepts/:conceptId/log-view",
    [authJwt.verifyToken],
    controller.viewedConcept,
    logger.viewConceptLogger
  );
  app.post(
    "/api/courses/:courseId/CKG/concepts/:conceptId/log-view",
    [authJwt.verifyToken],
    controller.viewedConceptCourseKG,
    logger.viewConceptCourseKGLogger
  );
  app.post(
    "/api/courses/:courseId/materials/:materialId/MKG/concepts/:conceptId/log-view",
    [authJwt.verifyToken],
    controller.viewedConceptMaterialKG,
    logger.viewConceptMaterialKGLogger
  );

  app.post(
    "/api/courses/:courseId/materials/:materialId/concepts/:conceptId/view-explanation",
    [authJwt.verifyToken],
    controller.viewedExplanationConcept,
    logger.viewExplanationConceptLogger
  );
  // This endpoint is for logging the activity from the recommended concepts part
  app.post(
    "/api/courses/:courseId/materials/:materialId/recommended-concepts/:conceptId/view-full-wiki",
    [authJwt.verifyToken],
    controller.viewedFullArticleRecommendedConcept,
    logger.viewFullArticleRecommendedConceptLogger
  );
  // This endpoint is for logging the activity from the main concepts part
  app.post(
    "/api/courses/:courseId/materials/:materialId/main-concepts/:conceptId/view-full-wiki",
    [authJwt.verifyToken],
    controller.viewedFullArticleMainConcept,
    logger.viewFullArticleMainConceptLogger
  );
  // This endpoint is for logging the activity from the Material Kg
  app.post(
    "/api/courses/:courseId/materials/:materialId/concepts/:conceptId/MKG/view-full-wiki",
    [authJwt.verifyToken],
    controller.viewedFullArticleMaterialKG,
    logger.viewFullArticleMaterialKGLogger
  );
  // This endpoint is for logging the activity from the Course Kg
  app.post(
    "/api/courses/:courseId/concepts/:conceptId/CKG/view-full-wiki",
    [authJwt.verifyToken],
    controller.viewedFullArticleCourseKG,
    logger.viewFullArticleCourseKGLogger
  );

  app.post(
    "/api/materials/:materialId/recommended-videos/view-all",
    [authJwt.verifyToken],
    controller.viewedAllRecommendedVideos,
    logger.viewAllRecommendedVideosLogger
  );

  app.post(
    "/api/materials/:materialId/recommended-articles/view-all",
    [authJwt.verifyToken],
    controller.viewedAllRecommendedArticles,
    logger.viewAllRecommendedArticlesLogger
  );
  app.post(
    "/api/materials/:materialId/recommended-article/mark-helpful",
    [authJwt.verifyToken],
    controller.rateArticle,
    logger.markArticleAsHelpfulLogger
  );
  app.post(
    "/api/materials/:materialId/recommended-article/mark-not-helpful",
    [authJwt.verifyToken],
    controller.rateArticle,
    logger.markArticleAsUnhelpfulLogger
  );
  app.post(
    "/api/materials/:materialId/recommended-video/:resourceId/mark-helpful",
    [authJwt.verifyToken],
    controller.rateVideo,
    logger.markVideoAsHelpfulLogger
  );
  app.post(
    "/api/materials/:materialId/recommended-video/:resourceId/mark-not-helpful",
    [authJwt.verifyToken],
    controller.rateVideo,
    logger.markVideoAsUnhelpfulLogger
  );

  app.post(
    "/api/materials/:materialId/recommended-article/un-mark-helpful",
    [authJwt.verifyToken],
    controller.rateArticle,
    logger.unmarkArticleAsHelpfulLogger
  );
  app.post(
    "/api/materials/:materialId/recommended-article/un-mark-not-helpful",
    [authJwt.verifyToken],
    controller.rateArticle,
    logger.unmarkArticleAsUnhelpfulLogger
  );
  app.post(
    "/api/materials/:materialId/recommended-video/:resourceId/un-mark-helpful",
    [authJwt.verifyToken],
    controller.rateVideo,
    logger.unmarkVideoAsHelpfulLogger
  );
  app.post(
    "/api/materials/:materialId/recommended-video/:resourceId/un-mark-not-helpful",
    [authJwt.verifyToken],
    controller.rateVideo,
    logger.unmarkVideoAsUnhelpfulLogger
  );
  app.post(
    "/api/materials/:materialId/recommended-article/abstract/log-expand",
    [authJwt.verifyToken],
    controller.expandedArticleAbstract,
    logger.expandArticleAbstractLogger
  );
  app.post(
    "/api/materials/:materialId/recommended-article/abstract/log-collapse",
    [authJwt.verifyToken],
    controller.collapsedArticleAbstract,
    logger.collapseArticleAbstractLogger
  );

  // This endpoint is for the recommended Articles part.
  app.post(
    "/api/materials/:materialId/recommended-articles/log",
    [authJwt.verifyToken],
    controller.viewFullWikipediaArticle,
    logger.viewFullArticleRecommendedArticleLogger
  );
  app.post(
    "/api/courses/:courseId/materials/:materialId/MKG/log-hide",
    [authJwt.verifyToken],
    controller.hidConceptsMaterialKG,
    logger.hidConceptsMaterialKGLogger
  );
  app.post(
    "/api/courses/:courseId/materials/:materialId/MKG/log-unhide",
    [authJwt.verifyToken],
    controller.unhidConceptsMaterialKG,
    logger.unhidConceptsMaterialKGLogger
  );
};
