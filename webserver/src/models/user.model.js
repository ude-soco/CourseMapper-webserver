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
    },
  ],
  isCourseTurnOff: { type: Boolean, default: false },
  isReplyTurnOff: { type: Boolean, default: false },
  isAnnotationTurnOff: { type: Boolean, default: false },
  subscribedCourses: [
    { courseId: { type: Schema.Types.ObjectId, ref: "course" } },
  ],
  notificationLists: [],
  deactivatedUserLists: [],
});

module.exports = mongoose.model("user", User);
