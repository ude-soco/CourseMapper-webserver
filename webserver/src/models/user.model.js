const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const User = new Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: Schema.Types.ObjectId, ref: "role" },
  createdAt: { type: Date, default: Date.now() },
  //TODO: later remove the below boolean attrbiutes if not being used anywhere in front end later.
  courses: [
    {
      courseId: { type: Schema.Types.ObjectId, ref: "course", required: true },
      role: { type: Schema.Types.ObjectId, ref: "role" },
    },
  ],
  indicators: [
    {
      _id: Schema.Types.ObjectId,
      src: String,
      width: String,
      height: String,
      frameborder: String,
    },
  ],
  blockedByUser: [
    { type: Schema.Types.ObjectId, ref: "user", required: true, default: [] },
  ],
  blockingUsers: [
    { type: Schema.Types.ObjectId, ref: "user", required: true, default: [] },
  ],
  isAnnotationNotificationsEnabled: { type: Boolean, default: true },
  isReplyAndMentionedNotificationsEnabled: { type: Boolean, default: true },
  isCourseUpdateNotificationsEnabled: { type: Boolean, default: true },
});

module.exports = mongoose.model("user", User);
