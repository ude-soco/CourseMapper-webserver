const { Readable } = require("stream");
const db = require("../models");
const Activity = db.activity;

/**
 * @function collectActivities
 * Collect all the activities performed in an array
 *
 */
export const collectActivities = async (req, res) => {
  let since = req.query.since;
  let until = req.query.until;
  let activities;
  let jsonStream;
  let filters = {};

  // Validate since and until dates
  if (since && until) {
    const sinceDate = new Date(since);
    const untilDate = new Date(until);

    if (sinceDate > untilDate) {
      // If sinceDate is greater than untilDate, return an error response
      return res
        .status(400)
        .send({ message: "'since' date must not be later than 'until' date." });
    }
  }

  if (since) {
    filters["statement.timestamp"] = { $gte: new Date(since) };
  }
  if (until) {
    if (filters["statement.timestamp"]) {
      filters["statement.timestamp"].$lte = new Date(until);
    } else {
      filters["statement.timestamp"] = { $lte: new Date(until) };
    }
  }

  try {
    activities = await Activity.find(filters);
    jsonStream = new Readable({
      objectMode: true,
      read() {
        this.push(JSON.stringify(activities));
        this.push(null);
      },
    });
  } catch (err) {
    return res.status(500).send({ message: err });
  }
  return jsonStream.pipe(res.status(200));
};
