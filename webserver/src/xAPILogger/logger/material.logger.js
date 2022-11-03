const statementFactory = require("../statementsFactory/material.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");
const ORIGIN = process.env.ORIGIN;

export const newMaterial = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getMaterialUploadStatement(
    req.locals.user,
    req.locals.material,
    origin
  );
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.send(req.locals.response);
};

export const deleteMaterial = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getMaterialDeletionStatement(
    req.locals.user,
    req.locals.material,
    origin
  );
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.send(req.locals.response);
};

export const getMaterial = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getMaterialAccessStatement(
    req.locals.user,
    req.locals.material,
    origin
  );
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const editMaterial = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getMaterialEditStatement(
    req.locals.user,
    req.locals.newMaterial,
    req.locals.oldMaterial,
    origin
  );
  lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement);
  res.status(200).send(req.locals.response);
};

export const playVideo = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  if (req.locals.material.type === "video") {
    const statement = statementFactory.getVideoPlayStatement(
      req.locals.user,
      req.locals.material,
      origin
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
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  if (req.locals.material.type === "video") {
    const statement = statementFactory.getVideoPauseStatement(
      req.locals.user,
      req.locals.material,
      origin
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
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  if (req.locals.material.type === "video") {
    const statement = statementFactory.getVideoEndStatement(
      req.locals.user,
      req.locals.material,
      origin
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
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const slideNr = req.params.slideNr;
  if (req.locals.material.type === "pdf") {
    const statement = statementFactory.getSlideViewStatement(
      req.locals.user,
      req.locals.material,
      slideNr,
      origin
    );
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    return res.status(204).send();
  }

  return res.status(406).send({
    error: `Material with id ${req.locals.material._id} is not a pdf`,
  });
};

export const completePDF = (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  if (req.locals.material.type === "pdf") {
    const statement = statementFactory.getPdfCompleteStatement(
      req.locals.user,
      req.locals.material,
      origin
    );
    lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement);
    return res.status(204).send();
  }

  return res.status(406).send({
    error: `Material with id ${req.locals.material._id} is not a pdf`,
  });
};
