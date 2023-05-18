const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserNotification = new Schema({
  activityId: { type: Schema.Types.ObjectId, required: true, ref: "activity" },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,

    index: true,
  },
  isStar: { type: Boolean, required: true, default: false },
  isRead: { type: Boolean, required: true, default: false },
});

module.exports = mongoose.model("userNotification", UserNotification);
