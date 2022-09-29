const mongoose = require("mongoose");

const schema = mongoose.Schema;

const Notification = new schema({
  username: { type: String, required: true },
  shortname: { type: String, required: true },
  message: NotificationMessage,
  time: { type: Date, default: Date.now() },
  read: { type: Boolean, default: false },
  isStar: { type: Boolean, default: false },
});

const NotificationMessage = new schema({
  messageType: { type: String, required: true },
  action: { type: String, required: true },
  actionobject: { type: String, required: true },
  coursename: { type: String, required: true },
  topicname: { type: String, required: true },
  channelname: { type: Sting, required: true },
  message: { type: String, required: true },
});

module.exports = mongoose.model("notification", Notification);

// export interface NotificationItem {
//   id: string;
//   userName: string;
//   shortName: string;
//   message: NotificationMessage;
//   time: string;
//   read: boolean;
//   isStar: boolean;
// }

// export interface NotificationMessage {
//   messageType: string;
//   action: string;
//   courseName: string;
//   topicName: string;
//   channelName: string;
//   message?: string;
// }
