const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Course = new Schema({
  name: { type: String, required: true },
  shortName: { type: String },
  // userId: { type: Schema.Types.ObjectId, required: true },
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
  indicators: [
    {
      _id: Schema.Types.ObjectId,
      src: String,
      width: String,
      height: String,
      frameborder: String,
    },
  ],
  url: { type: String },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  users: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
      role: { type: Schema.Types.ObjectId, ref: "role" },
    },
  ],
  // LRS Store information from OpenLAP
  lrsStore: {
    storeId: { type: String, default: null },
    basicAuth: { type: String, default: null },
    title: { type: String, default: null },
    statementCount: { type: Number, default: 0 },
    uniqueIdentifierType: { 
      type: String, 
      enum: ['OPENID', 'ACCOUNT_NAME', 'MBOX', 'MBOX_SHA1SUM'], 
      default: 'ACCOUNT_NAME' 
    },
    createdAt: { type: Date, default: null },
    status: { 
      type: String, 
      enum: ['pending', 'active', 'failed', 'none'], 
      default: 'none' 
    },
    error: { type: String, default: null }
  }
});

module.exports = mongoose.model("course", Course);
