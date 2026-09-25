export const pdfFileUploader = async (req, res, _) => {
  try {
    const file = req.file;
    res.status(201).send({ message: `File uploaded successfully!` });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
};

export const imageFileUploader = async (req, res, _) => {
  try {
    console.log("Inside imageFileUploader");
    const file = req.file;
    if (!file) {
      console.error("No file received in request!");
      return res.status(400).send({ error: "No file uploaded" });
    }
    console.log("File received:", file);
    res.status(201).send({ message: 'Image uploaded successfully!' });
  } catch (err) {
    console.error("Error in imageFileUploader:", err);
    return res.status(500).send({ error: err.message });
  }
};

export const videoFileUpload = async (req, res, _) => {
  try {
    const file = req.file;
    res.status(201).send({ message: `File uploaded successfully!` });
  } catch (err) {
    return res.status(500).send({ error: err });
  }
};
