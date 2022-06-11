const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Topic = new Schema({
  name: { type: String, required: true },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "course",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  channels: [
    {
      type: Schema.Types.ObjectId,
      ref: "channel",
      default: [],
    },
  ],
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date },
});

module.exports = mongoose.model("topic", Topic);
