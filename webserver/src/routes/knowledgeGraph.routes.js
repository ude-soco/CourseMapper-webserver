const { authJwt } = require("../middlewares");
const controller = require("../controllers/knowledgeGraph.controller");
const recommendationController = require("../controllers/recommendation.controller"); 

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
    controller.getSlide
  );

  app.get(
    "/api/knowledge-graph/check-material/:materialId",
    [authJwt.verifyToken],
    controller.checkMaterial
  );

  app.get(
    "/api/knowledge-graph/get-material/:materialId",
    [authJwt.verifyToken],
    controller.getMaterial
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
    controller.getHigherLevelsNodesAndEdges
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


  /// recommendations
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

  // app.get(
  //   "/api/recommendation/get_resources_by_main_concepts",
  //   [authJwt.verifyToken],
  //   recommendationController.getResourcesByMainConcepts
  // );

  ///

};
