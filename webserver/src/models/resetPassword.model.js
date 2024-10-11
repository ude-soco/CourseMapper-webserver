const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const RestPassSchema = new Schema({

 userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  token: { type: String, required: true },
  email: { type: String, required: true },
 
  createdAt: { type: Date, default: Date.now(), expires: 500 },
});

module.exports = mongoose.model("Token", RestPassSchema);
