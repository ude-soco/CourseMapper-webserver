const statementFactory = require("../statementsFactory/material.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");

export const newMaterial = (req, res) => {
  const statement = statementFactory.getMaterialUploadStatement(
    req.locals.user,
    req.locals.material
  );
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.send(req.locals.response);
};

export const deleteMaterial = (req, res) => {
  const statement = statementFactory.getMaterialDeletionStatement(
    req.locals.user,
    req.locals.material
  );
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.send(req.locals.response);
};

export const getMaterial = (req, res) => {
  const statement = statementFactory.getMaterialAccessStatement(
    req.locals.user,
    req.locals.material
  );
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const editMaterial = (req, res) => {
  const statement = statementFactory.getMaterialEditStatement(
    req.locals.user,
    req.locals.newMaterial,
    req.locals.oldMaterial
  );
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const playVideo = (req, res) => {
  if (req.locals.material.type === "video") {
    const statement = statementFactory.getVideoPlayStatement(
      req.locals.user,
      req.locals.material
    );
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    return res.status(204).send();
  }

  return res.status(406).send({
    error: `Material with id ${req.locals.material._id} is not a Video`,
  });
};

export const pauseVideo = (req, res) => {
  if (req.locals.material.type === "video") {
    const statement = statementFactory.getVideoPauseStatement(
      req.locals.user,
      req.locals.material
    );
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    return res.status(204).send();
  }

  return res.status(406).send({
    error: `Material with id ${req.locals.material._id} is not a Video`,
  });
};

export const completeVideo = (req, res) => {
  if (req.locals.material.type === "video") {
    const statement = statementFactory.getVideoEndStatement(
      req.locals.user,
      req.locals.material
    );
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    return res.status(204).send();
  }

  return res.status(406).send({
    error: `Material with id ${req.locals.material._id} is not a Video`,
  });
};

export const viewSlide = (req, res) => {
  const slideNr = req.params.slideNr;
  if (req.locals.material.type === "pdf") {
    const statement = statementFactory.getSlideViewStatement(
      req.locals.user,
      req.locals.material,
      slideNr
    );
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    return res.status(204).send();
  }

  return res.status(406).send({
    error: `Material with id ${req.locals.material._id} is not a pdf`,
  });
};
