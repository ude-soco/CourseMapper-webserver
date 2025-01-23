const {
  uploadPDFFile,
  uploadVideoFile,
  uploadImageFile,
} = require("../middlewares/fileUploader");
const {
  pdfFileUploader,
  videoFileUpload,
  imageUpload,
  
} = require("../controllers/fileUpload.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Upload PDF file
  app.post("/api/upload/pdf", uploadPDFFile.single("file"), pdfFileUploader);

  // Upload Image
  app.post("/api/upload/image", uploadImageFile.single("file"), imageUpload);
   
  // Upload video file
  app.post(
    "/api/upload/video",
    uploadVideoFile.single("file"),
    videoFileUpload
  );
};
