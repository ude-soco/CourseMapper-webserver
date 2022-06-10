const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Topic = new Schema({
  name: { type: String },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "course",
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
  channels: [
    {
      type: Schema.Types.ObjectId,
      ref: "channel",
      default: [],
    },
  ],
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

module.exports = mongoose.model("topic", Topic);
