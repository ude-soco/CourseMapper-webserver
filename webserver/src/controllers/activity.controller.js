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
  let activities;
  let jsonStream;
  console.log("Admin collecting activities");
  try {
    activities = await Activity.find({});
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
