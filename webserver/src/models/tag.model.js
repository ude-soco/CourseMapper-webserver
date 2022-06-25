const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Tag = new Schema({
  name: {type: String, required: true},
  courseId: {type: Schema.Types.ObjectId, ref: "course", required: true},
  topicId: {type: Schema.Types.ObjectId, ref: "topic", required: true},
  channelId: {
    type: Schema.Types.ObjectId,
    ref: "channel",
    required: true,
  },
  materialId: {
    type: Schema.Types.ObjectId,
    ref: "material",
    required: true,
  },
  annotationId: {
    type: Schema.Types.ObjectId,
    ref: "annotation",
    required: true,
  },
});

module.exports = mongoose.model("tag", Tag);
