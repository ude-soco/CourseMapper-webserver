const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const User = new Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  mbox: { type: String, required: true },
  mbox_sha1sum: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: Schema.Types.ObjectId, ref: "role" },
  createdAt: { type: Date, default: Date.now() },
  verified: {
    type: Boolean,
    default: false, // Set default value to false
  },
  //TODO: later remove the below boolean attrbiutes if not being used anywhere in front end later.
  courses: [
    {
      courseId: { type: Schema.Types.ObjectId, ref: "course", required: true },
      role: { type: Schema.Types.ObjectId, ref: "role" },
    },
  ],
  understoodConcepts: [], //saves ids for concepts that user understand
  didNotUnderstandConcepts: [], //saves ids for concepts that user did not understand
  
  // Map to store concept IDs and their respective timestamps
  conceptTimestamps: {
    type: Map,
    of: Date,
    default: {}
  },

  indicators: [
    {
      _id: Schema.Types.ObjectId,
      src: String,
      width: String,
      height: String,
      frameborder: String,
    },
  ], //holds a list of the indicators created in this collection
  blockedByUser: [
    { type: Schema.Types.ObjectId, ref: "user", required: true, default: [] },
  ],
  blockingUsers: [
    { type: Schema.Types.ObjectId, ref: "user", required: true, default: [] },
  ],
  isAnnotationNotificationsEnabled: { type: Boolean, default: true },
  isReplyAndMentionedNotificationsEnabled: { type: Boolean, default: true },
  isCourseUpdateNotificationsEnabled: { type: Boolean, default: true },
  lastTimeCourseMapperOpened: { type: Date, default: Date.now() },
});

module.exports = mongoose.model("user", User);
