const { Readable } = require("stream");
const db = require("../models");
const Activity = db.activity;
const User = db.user;

/**
 * @function collectActivities
 * Collect all the activities performed in an array
 *
 */
export const collectActivities = async (req, res) => {
  try {
    let from = req.query.from;
    let to = req.query.to;
    let filters = {};
    if (from) {
      filters['statement.timestamp'] = { $gte: new Date(from) };
    }
    if (to) {
      if (filters['statement.timestamp']) {
        filters['statement.timestamp'].$lte = new Date(to);
      } else {
        filters['statement.timestamp'] = { $lte: new Date(to) };
      }
    }
    let activities = await Activity.find(filters);
    return res.status(200).send(activities);
  } catch (err) {
    return res.status(500).send({ message: err });
  }
};
