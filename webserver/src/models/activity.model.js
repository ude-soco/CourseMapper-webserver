const mongoose = require("mongoose");

const Schema = mongoose.Schema;

//TODO, add stricter types on notificationInfo for MongooseValidation
const Activity = new Schema({
  statement: mongoose.Mixed,
  sent: Boolean,
  notificationInfo: mongoose.Mixed,
  courseId: { type: Schema.Types.ObjectId, ref: "course", required: false, default: null }, // added courseId reference to dynamically link activities to courses
});

module.exports = mongoose.model("activity", Activity);
