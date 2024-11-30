import { v4 as uuidV4 } from "uuid";
import config from "./config";

const createMetadata = () => {
  return {
    id: uuidV4(),
    timestamp: new Date(),
  };
};

const createUser = (req) => {
  return {
    objectType: "Agent",
    name: `${req.locals.user.firstname} ${req.locals.user.lastname}`,
    mbox: req.locals.user.mbox,
    mbox_sha1sum: req.locals.user.mbox_sha1sum,
    account: {
      homePage: req.get("origin"),
      name: req.locals.user._id.toString(),
    },
  };
};

const createContext = () => {
  return {
    platform: config.platform,
    language: config.language,
  };
};

const createVerb = (verbIRI, verb) => {
  return {
    id: verbIRI,
    display: {
      [config.language]: verb,
    },
  };
};

export { createMetadata, createUser, createContext, createVerb };
