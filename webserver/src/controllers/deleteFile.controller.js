const fs = require("fs");

const remove = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = "public/uploads/pdfs/" ;

  fs.unlink(directoryPath + fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not delete the file. " + err,
      });
    }

    res.status(200).send({
      message: "File is deleted.",
    });
  });
};

const removeSync = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = "public/uploads/pdfs/" ;

  try {
    fs.unlinkSync(directoryPath + fileName);

    res.status(200).send({
      message: "File is deleted.",
    });
  } catch (err) {
    res.status(500).send({
      message: "Could not delete the file. " + err,
    });
  }
};
const removeVideo = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = "public/uploads/videos/";

  fs.unlink(directoryPath + fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not delete the video. " + err,
      });
    }

    res.status(200).send({
      message: "Video is deleted.",
    });
  });
};
const removeSyncVideo = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = "public/uploads/videos/";

  try {
    fs.unlinkSync(directoryPath + fileName);

    res.status(200).send({
      message: "Video is deleted.",
    });
  } catch (err) {
    res.status(500).send({
      message: "Could not delete the Video. " + err,
    });
  }
};
module.exports = {
  remove,
  removeSync,
  removeVideo,
  removeSyncVideo
};