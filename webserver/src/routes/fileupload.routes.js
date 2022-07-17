const { uploadPDFFile, uploadVideoFile } = require("../middlewares/fileUploader");
const { pdfFileUploader, videoFileUpload} = require("../controllers/fileUpload.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Upload PDF file
  app.post("/upload/pdf", uploadPDFFile.single("file"), pdfFileUploader);

  // Upload video file
  app.post("/upload/video", uploadVideoFile.single("file"), videoFileUpload);
};