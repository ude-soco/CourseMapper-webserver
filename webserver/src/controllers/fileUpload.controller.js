const fs = require('fs/promises');
const path = require('path');
import { fileURLToPath } from 'url';
import { deleteExistingCourseImages } from '../middlewares/fileUploader';




export const pdfFileUploader = async (req, res, next) => {
  try {
    const file = req.file;
    res.status(201).send({ message: `File uploaded successfully!` });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
};

// export const imageFileUploader = async (req, res, next) => {
//   try {
//     const file = req.file;
//     res.status(201).send({ message: `Image uploaded successfully!` });
//   } catch (err) {
//     return res.status(500).send({ error: err });
//   }
// };
export const imageFileUploader = async (req, res, next) => {
  try {
    const file = req.file;
    console.log('file:', file.originalname);
    
    res.status(201).send({ message: 'Image uploaded successfully!' });
  } catch (err) {
    console.error('Error in imageFileUploader:', err);
    return res.status(500).send({ error: err.message });
  }
};
export const videoFileUpload = async (req, res, next) => {
  try {
    const file = req.file;
    res.status(201).send({ message: `File uploaded successfully!` });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
};
// export const getRandomImage = async (req, res, next) => {
//   try {
//     const imagesDir = path.join(__dirname, '..','..', 'public/uploads/randomImgs');
//     console.log('imagesDir:', imagesDir);

//     const files = await fs.readdir(imagesDir);
//     console.log('Files:', files);

//     const imageFiles = files.filter(file => /\.(jpe?g|png|gif)$/i.test(file));
//     console.log('Image Files:', imageFiles);

//     if (imageFiles.length === 0) {
//       return res.status(404).json({ error: 'No images found' });
//     }

//     const randomIndex = Math.floor(Math.random() * imageFiles.length);
//     const randomImage = imageFiles[randomIndex];
//     const imageUrl = `${req.protocol}://${req.get('host')}/api/public/uploads/randomImgs/${randomImage}`;
//     console.log('Random Image URL:', imageUrl);

//     return res.status(200).json({ imageUrl });
//   } catch (error) {
//     console.error('Error in getRandomImage:', error);
//     return res.status(500).json({ error: error.message });
//   }
// };