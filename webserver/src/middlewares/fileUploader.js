const multer = require("multer");
const fileExtension = require("file-extension");
const fs = require("fs");
const path = require("path");
const util = require('util');

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
// const imageFileName = (req, file, cb) => {
//   // Expect courseId to be provided in req.body
//   const courseId = req.body.courseId;
//   // Build a new file name using only the course id and the file extension
//   cb(null, `${courseId}.${fileExtension(file.originalname)}`);
// };
function getAllDirectories(dirPath, arrayOfDirs = []) {
  try {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      // Skip the "node_modules" directory (you can add more conditions if needed)
      if (file === 'node_modules') return;
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        arrayOfDirs.push(fullPath);
        // Recursively search subdirectories
        getAllDirectories(fullPath, arrayOfDirs);
      }
    });
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err.message);
  }
  return arrayOfDirs;
}
const imgStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectRoot = process.cwd();
    const allDirs = getAllDirectories(projectRoot);
    console.log(util.inspect(allDirs, { maxArrayLength: null, depth: null }));
//     const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images');
// console.log('Uploads directory absolute path:', uploadsDir);
    try {
      const dest = "public/uploads/images";
      console.log("Saving file to:", dest);
      // Optionally check if the folder exists
      // if (!fs.existsSync(dest)) { console.warn("Directory does not exist!"); }
      cb(null, dest);
    } catch (error) {
      console.error("Error in destination callback:", error);
      console.log("error1", error);
    }
  },
  filename:   fileName,
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


// function deleteExistingCourseImages(courseId, callback) {

//   const targetDir = path.join(__dirname, '..', 'public/uploads/images');
//   const baseName = courseId.replace(/\.[^/.]+$/, ''); // "67d4ee24ca379ed004babcc7"
//   const regex = new RegExp(`^${baseName}\\.(jpg|jpeg|png|gif|bmp)$`, 'i');

//   fs.readdir(targetDir, (err, files) => {
//     if (err) {
//       return callback(err);
//     }
  
//     console.log('regex:', regex);
//     const filesToDelete = files.filter(file => regex.test(file));
// console.log('filesToDelete:', filesToDelete);
//     if (filesToDelete.length === 0) {
//       return callback(err);
//     }

//     let pending = filesToDelete.length;
//     filesToDelete.forEach(file => {
//       fs.unlink(path.join(targetDir, file), (err) => {
//         if (err) {
//           return callback(err);
//         }
//         pending--;
//         if (pending === 0) {
//           callback(null);
//         }
//       });
//     });
//   });
// }

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
