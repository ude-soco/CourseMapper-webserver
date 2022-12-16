const statementFactory = require("../statementsFactory/material.statementsFactory");
const lrs = require("../lrs/lrs");
const controller = require("../controller.xAPILogger");
const ORIGIN = process.env.ORIGIN;

export const newMaterial = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getMaterialUploadStatement(
    req.locals.user,
    req.locals.material,
    origin
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.send(req.locals.response);
};

export const deleteMaterial = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getMaterialDeletionStatement(
    req.locals.user,
    req.locals.material,
    origin
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.send(req.locals.response);
};

export const getMaterial = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getMaterialAccessStatement(
    req.locals.user,
    req.locals.material,
    origin
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.status(200).send(req.locals.response);
};

export const editMaterial = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const statement = statementFactory.getMaterialEditStatement(
    req.locals.user,
    req.locals.newMaterial,
    req.locals.oldMaterial,
    origin
  );
  const sent = await lrs.sendStatementToLrs(statement);
  controller.saveStatementToMongo(statement, sent);
  res.status(200).send(req.locals.response);
};

export const playVideo = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const hours = req.params.hours;
  const minutes = req.params.minutes;
  const seconds = req.params.seconds;
  if (req.locals.material.type === "video") {
    const statement = statementFactory.getVideoPlayStatement(
      req.locals.user,
      req.locals.material,
      hours,
      minutes,
      seconds,
      origin
    );
    const sent = await lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement, sent);
    return res.status(204).send();
  }

  return res.status(406).send({
    error: `Material with id ${req.locals.material._id} is not a Video`,
  });
};

export const pauseVideo = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const hours = req.params.hours;
  const minutes = req.params.minutes;
  const seconds = req.params.seconds;
  if (req.locals.material.type === "video") {
    const statement = statementFactory.getVideoPauseStatement(
      req.locals.user,
      req.locals.material,
      hours,
      minutes,
      seconds,
      origin
    );
    const sent = await lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement, sent);
    return res.status(204).send();
  }

  return res.status(406).send({
    error: `Material with id ${req.locals.material._id} is not a Video`,
  });
};

export const completeVideo = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  if (req.locals.material.type === "video") {
    const statement = statementFactory.getVideoEndStatement(
      req.locals.user,
      req.locals.material,
      origin
    );
    const sent = await lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement, sent);
    return res.status(204).send();
  }

  return res.status(406).send({
    error: `Material with id ${req.locals.material._id} is not a Video`,
  });
};

export const viewSlide = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  const slideNr = req.params.slideNr;
  if (req.locals.material.type === "pdf") {
    const statement = statementFactory.getSlideViewStatement(
      req.locals.user,
      req.locals.material,
      slideNr,
      origin
    );
    const sent = await lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement, sent);
    return res.status(204).send();
  }

  return res.status(406).send({
    error: `Material with id ${req.locals.material._id} is not a pdf`,
  });
};

export const completePDF = async (req, res) => {
  const origin = req.get('origin') ? req.get('origin') : ORIGIN ;
  if (req.locals.material.type === "pdf") {
    const statement = statementFactory.getPdfCompleteStatement(
      req.locals.user,
      req.locals.material,
      origin
    );
    const sent = await lrs.sendStatementToLrs(statement);
    controller.saveStatementToMongo(statement, sent);
    return res.status(204).send();
  }

  return res.status(406).send({
    error: `Material with id ${req.locals.material._id} is not a pdf`,
  });
};
