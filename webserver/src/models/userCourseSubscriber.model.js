const mongoose = require("mongoose");

const Schema = mongoose.Schema;
//Any user that has subscribed to a course, will have a row here with his userId and subscribed courseId
const UserCourseSubscriber = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "course",
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
    index: true,
  },
});

module.exports = mongoose.model("userCourseSubscriber", UserCourseSubscriber);
