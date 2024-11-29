import catchAsync from "../helpers/catchAsync";

export const pdfFileUploader = catchAsync(async (req, res, next) => {
  try {
    const file = req.file;
    res.status(201).send({ message: `File uploaded successfully!` });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
});

export const videoFileUpload = catchAsync(async (req, res, next) => {
  try {
    const file = req.file;
    res.status(201).send({ message: `File uploaded successfully!` });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
});

export const imageUpload = catchAsync(async (req, res, next) => {
  try {
    const file = req.file;
    res.status(201).send({ message: `Image uploaded successfully!`, url: `public/uploads/images/${file.filename}` });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
});
