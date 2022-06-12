const { authJwt, authAdmin } = require("../middlewares");
const controller = require("../controllers/reply.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post(
    "/new-reply/:annotationId",
    [authJwt.verifyToken],
    controller.newReply
  );

  app.delete(
    "/delete-reply/:replyId",
    [authJwt.verifyToken, authAdmin],
    controller.deleteReply
  );

  app.post("/edit-reply/:replyId", [authJwt.verifyToken], controller.editReply);

  app.post("/like-reply/:replyId", [authJwt.verifyToken], controller.likeReply);

  app.post(
    "/dislike-reply/:replyId",
    [authJwt.verifyToken],
    controller.dislikeReply
  );
};
