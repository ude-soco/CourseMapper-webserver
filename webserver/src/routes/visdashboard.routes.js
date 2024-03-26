const { authJwt } = require("../middlewares");
const controller = require("../controllers/vis-dashboard/visDashboard.controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
        next();
    });


    app.get(
        "/api/vis-dashboard/platforms/",
       // [authJwt.verifyToken],
        controller.getPlatform
    );

    app.get(
        "/api/vis-dashboard/course-categories/",
        // [authJwt.verifyToken],
        controller.getCourseCategories
    );

    app.get(
        "/api/vis-dashboard/popular-courses/:platformName",
        // [authJwt.verifyToken],
        controller.getCoursesByPopularity
    );

    app.get(
        "/api/vis-dashboard/rating-courses/:pn",
        // [authJwt.verifyToken],
        controller.getCoursesByRating
    );

    app.get(
        "/api/vis-dashboard/course/:id",
        // [authJwt.verifyToken],
        controller.getCourseById
    );

}
