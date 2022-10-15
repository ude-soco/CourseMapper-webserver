const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const NotificationMessage = new Schema({
  type: { type: String },
  action: { type: String },
  actionObject: { type: String },
  courseName: { type: String },
  topicName: { type: String },
  channelName: { type: String },
  message: { type: String },
});

module.exports = mongoose.model("notificationMessage", NotificationMessage);

// export interface NotificationMessage {
//   messageType: string;
//   action: string;
//   courseName: string;
//   topicName: string;
//   channelName: string;
//   message?: string;
// }

// create new course "baohui has created new course AWT one minute ago"
// create new topic "baohui has created new topic topic 1 one minute ago"
// create new channel

// {
//   userName:'baohui',
//   createdAt:"one minute ago",
//   read:false,
//   isStar:false,
//   message:{
//     type:'course update',
//     action:'has created new',
//     actionObject:'course',
//     courseName:"AWT",
//     topicName:'topic 1',
//     channelName:'channel 1',
//     message:''
//   }
// }
