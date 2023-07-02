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
  courses: [
    {
      courseId: { type: Schema.Types.ObjectId, ref: "course", required: true },
      role: { type: Schema.Types.ObjectId, ref: "role" },
      isAnnotationNotificationsEnabled: { type: Boolean, default: true },
      isReplyAndMentionedNotificationsEnabled: { type: Boolean, default: true },
      isCourseUpdateNotificationsEnabled: { type: Boolean, default: true },
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
});

module.exports = mongoose.model("user", User);
