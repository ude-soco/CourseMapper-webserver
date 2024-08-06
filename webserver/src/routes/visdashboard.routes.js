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

    app.post(
        "/api/vis-dashboard/course-by-category/:courseCategory",
         //[authJwt.verifyToken],
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


    // Endpoint to get concepts for a platform
    app.get(
        "/api/vis-dashboard/concept-by-platform/:platform",
         [authJwt.verifyToken],
        controller.getConceptsByPlatform
    );


    // Get courses for explore
    app.get(
        "/api/vis-dashboard/courses-for-explore/:platform/:concept",
         [authJwt.verifyToken],
        controller.getCoursesByConceptAndPlatform
    );

    // Get popular courses for explore: endpoint
    app.get(
        "/api/vis-dashboard/courses-popular-explore/:platform/:datapoints",
         [authJwt.verifyToken],
        controller.getCoursesByPopularityForVis
    );

    // Get popular course categories :endpoint
    app.get(
        "/api/vis-dashboard/category-popular-explore/:platform/:datapoints",
         [authJwt.verifyToken],
        controller.getCategoryByPopularityForVis
    );

    // Get the most active teachers :endpoint
    app.get(
        "/api/vis-dashboard/active-teachers/:platform/:datapoints",
         [authJwt.verifyToken],
        controller.getActiveTeachersForVis
    );


    // Get most active institutions : endpoint
    app.get(
        "/api/vis-dashboard/active-institutions/:platform/:datapoints",
         [authJwt.verifyToken],
        controller.getActiveInstitutionsForVis
    );

    app.post(
        "/api/vis-dashboard/compare-platforms/",
        // [authJwt.verifyToken],testing
        controller.postTest
    );

    // Get platforms by teacher count in compare :endpoint
    app.post(
        "/api/vis-dashboard/compare-platforms-teachers/",
         [authJwt.verifyToken],
        controller.getNumberOfTeachersForCompare
    );


   // Get platform by institution count in compare: endpoint
    app.post(
        "/api/vis-dashboard/compare-platforms-institutions/",
         [authJwt.verifyToken],
        controller.getNumberOfInstitutionsForCompare
    );



    // Get platforms by number of participants: endpoint
    app.post(
        "/api/vis-dashboard/compare-platforms-participants/",
         [authJwt.verifyToken],
        controller.getNumberOfParticipantsForCompare
    );



    // Get courses by selected concept : endpoint
    app.post(
        "/api/vis-dashboard/courses-concept-compare/:concept",
         [authJwt.verifyToken],
        controller.getCoursesByConceptForCompare
    );


    // Get concepts by selected platforms: endpoint
    app.post(
        "/api/vis-dashboard/courses-concept-platforms",
         [authJwt.verifyToken],
        controller.getConceptsByPlatforms
    );



    app.post(
        "/api/vis-dashboard/add-langauge-platform",
        // [authJwt.verifyToken],
        controller.addLangaugeToPlatform
    );


    // Get courses by conceptin Find: endpoint
    app.post(
        "/api/vis-dashboard/courses-concept-find",
        // [authJwt.verifyToken],
        controller.getCoursesByConceptFind
    );



    app.get(
        "/api/vis-dashboard/courses-ratings-prices/:platform/:datapoints",
        // [authJwt.verifyToken],
        controller.getCourseRatingsPricesForVis
    );

    app.get(
        "/api/vis-dashboard/concept-categories/:courseCategory",
        // [authJwt.verifyToken],
        controller.getTopicsByCategory
    );






}
