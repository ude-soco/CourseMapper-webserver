const express = require("express");
const router = express.Router();
const controller = require("../controllers/deleteFile.controller");

// let routes = (app) => {
//   router.delete("/files/:name", controller.remove);

//   app.use(router);
// };

// module.exports = routes;

module.exports = function (app) {
    app.use(function (req, res, next) {
      res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
      next();
    });
  
    // delete PDF file
    
    app.delete("/videos/:name", controller.removeVideo);
    
  };