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
    [authJwt.verifyToken],
    controller.conceptMap
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
};
