const { authJwt } = require("../middlewares");
const controller = require("../controllers/knowledgeGraph.controller");

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

  app.post(
    "/api/knowledge-graph/user/:userId/course/:courseId/create-relationship",
    [authJwt.verifyToken],
    controller.createCourseNeo4j
  );

  app.delete(
    "/api/knowledge-graph/user/:userId/course/:courseId/remove-relationship",
    [authJwt.verifyToken],
    controller.deleteCourseNeo4j
  );

  app.post(
    "/api/courses/:courseId/materials/:materialId/concept-recommendation",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getConcepts
  );

  app.post(
    "/api/courses/:courseId/materials/:materialId/resource-recommendation",
    [authJwt.verifyToken, authJwt.isEnrolled],
    controller.getResources
  );

  app.get(
    "/api/wikipedia/search",
    [authJwt.verifyToken],
    controller.searchWikipedia
  );

  app.get(
    "/api/knowledge-graph/get-user/:userId",
    [authJwt.verifyToken],
    controller.getUser
  );

  app.get(
    "/api/knowledge-graph/get-single-user/:userId",
    [authJwt.verifyToken],
    controller.getSingleUser
  );

  app.get(
    "/api/knowledge-graph/get-level-of-engagement/:userId",
    [authJwt.verifyToken],
    controller.getLevelOfEngagement
  );

  app.get(
    "/api/knowledge-graph/get-DNU-engagement/:userId",
    [authJwt.verifyToken],
    controller.getDNUEngagement
  );

  app.put(
    "/api/knowledge-graph/update-relationship-u-dnu/:source/:target/:type",
    [authJwt.verifyToken],
    controller.updateConceptUDNU
  );

  app.get(
    "/api/knowledge-graph/get-concept-slide/:materialId/:conceptId",
    [authJwt.verifyToken],
    controller.getConceptSlide
  );

  app.get(
    "/api/knowledge-graph/get-user-relationships/:userId",
    [authJwt.verifyToken],
    controller.getUserRelationships
  );

  app.delete(
    "/api/knowledge-graph/delete-relationship/:rid",
    [authJwt.verifyToken],
    controller.deleteRelationship
  );

  app.get(
    "/api/knowledge-graph/get-relationship/:targetId",
    [authJwt.verifyToken],
    controller.getRelationship
  );

  app.get(
    "/api/knowledge-graph/get-related-to/:courseId",
    [authJwt.verifyToken],
    controller.getRelatedTo
  );

  app.post(
    "/api/knowledge-graph/renew-concept/:conceptId",
    [authJwt.verifyToken],
    controller.renewConcept
  );

  app.put(
    "/api/knowledge-graph/add-courseId-to-material/:materialId",
    [authJwt.verifyToken],
    controller.addCourseIdToMaterial
  );

  app.post(
    "/api/knowledge-graph/create-course-concept-relationship/:courseId",
    [authJwt.verifyToken],
    controller.createCourseHasConcepts
  );
};
