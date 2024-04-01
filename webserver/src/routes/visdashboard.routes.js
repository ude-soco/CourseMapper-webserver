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

    app.get(
        "/api/vis-dashboard/concepts/:courseId",
        // [authJwt.verifyToken],
        controller.getConceptsByCourseId
    );

    app.get(
        "/api/vis-dashboard/course-by-category/:courseCategory",
        // [authJwt.verifyToken],
        controller.getCoursesByCourseCategory
    );

    app.get(
        "/api/vis-dashboard/teachers-by-popularity/:platformName",
        // [authJwt.verifyToken],
        controller.getPopularTeachers
    );

    app.get(
        "/api/vis-dashboard/teacher/:teacherId",
        // [authJwt.verifyToken],
        controller.getTeacherById
    );

    app.get(
        "/api/vis-dashboard/concept-by-platform/:platform",
        // [authJwt.verifyToken],
        controller.getConceptsByPlatform
    );


    app.get(
        "/api/vis-dashboard/courses-for-explore/:platform/:concept",
        // [authJwt.verifyToken],
        controller.getCoursesByConceptAndPlatform
    );

    app.get(
        "/api/vis-dashboard/courses-popular-explore/:platform/:datapoints",
        // [authJwt.verifyToken],
        controller.getCoursesByPopularityForVis
    );

    app.get(
        "/api/vis-dashboard/category-popular-explore/:platform/:datapoints",
        // [authJwt.verifyToken],
        controller.getCategoryByPopularityForVis
    );


    app.get(
        "/api/vis-dashboard/active-teachers/:platform/:datapoints",
        // [authJwt.verifyToken],
        controller.getActiveTeachersForVis
    );


    app.get(
        "/api/vis-dashboard/active-institutions/:platform/:datapoints",
        // [authJwt.verifyToken],
        controller.getActiveInstitutionsForVis
    );

    app.post(
        "/api/vis-dashboard/compare-platforms/",
        // [authJwt.verifyToken],
        controller.postTest
    );

    app.post(
        "/api/vis-dashboard/compare-platforms-teachers/",
        // [authJwt.verifyToken],
        controller.getNumberOfTeachersForCompare
    );







}
