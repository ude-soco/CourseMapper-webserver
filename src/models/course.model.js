const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Course = new Schema({
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
  description: { type: String, default: "" },
  topics: [
    {
      type: Schema.Types.ObjectId,
      ref: "topic",
      default: [],
    },
  ],
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

module.exports = mongoose.model("course", Course);
