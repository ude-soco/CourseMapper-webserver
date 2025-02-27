const multer = require("multer");
const fileExtension = require("file-extension");
const fs = require("fs");
const path = require("path");



// Function to ensure directory exists
const ensureDirectoryExistence = (dirPath) => {

  if (fs.existsSync(dirPath)) {
    return true;
  }
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  } catch (err) {
    return false;
  }
};

const fileName = (req, file, cb) => {
  cb(
    null,
    `${file.originalname}`
  );
};

const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "public/uploads/pdfs";
    ensureDirectoryExistence(dir);
    cb(null, dir);
  },
  filename: fileName,
});



const imgStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/pdfs");
  },
  filename: fileName,
});

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "public/uploads/videos";
    ensureDirectoryExistence(dir);
    cb(null, dir);
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
