export const pdfFileUploader = async (req, res, next) => {
  try {
    const file = req.file;
    res.status(201).send({ message: `File uploaded successfully!` });
  } catch (err) {
    return res.status(500).send({ error: err });
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
