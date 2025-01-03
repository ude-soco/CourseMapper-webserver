const multer = require("multer");
const fileExtension = require("file-extension");

const fileName = (req, file, cb) => {
  cb(
    null,
    `${
      file.originalname
      /* .split(".")
      .slice(0, -1)
    .join(".")}-${Date.now()}.${fileExtension(file.originalname)*/
    }`
  );
};

const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/pdfs");
  },
  filename: fileName,
});

const imgStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/images");
  },
  filename: fileName,
});

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/videos");
  },
  filename: fileName,
});

const pdfFileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(pdf)$/)) {
    cb(new Error("Please upload pdf files only!"));
  }
  cb(undefined, true);
};

const imgFileFilter = (req, file, cb) => {
  // Regex to match image file extensions: .jpg, .jpeg, .png, .gif, .bmp
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|bmp)$/i)) {
    return cb(new Error("Please upload image files only with the extensions .jpg, .jpeg, .png, .gif, or .bmp!"));
  }
  cb(null, true); // Accept the file
};




const videoFileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(mp4)$/)) {
    cb(new Error("Please upload mp4 files only!"));
  }
  cb(undefined, true);
};

const uploadPDFFile = multer({
  storage: pdfStorage,
  fileFilter: pdfFileFilter,
});

const uploadImageFile = multer({
  storage: imgStorage,
  fileFilter: imgFileFilter,
});
const uploadVideoFile = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
});

module.exports = { uploadPDFFile, uploadVideoFile, uploadImageFile };
