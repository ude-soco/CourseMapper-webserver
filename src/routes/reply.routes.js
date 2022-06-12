const { authJwt, authAdmin } = require("../middlewares");
const controller = require("../controllers/reply.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // TODO:  Later, isAdmin middleware needs to be removed.
  //        A new middleware will be required to check whether a user is the creator of the course.
  //        Only authorized creator can update the courses. Maybe update the isModerator middleware
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
