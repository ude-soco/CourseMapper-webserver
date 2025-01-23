const mongoose = require("mongoose");

const Schema = mongoose.Schema;


const Permissions = {
  create: {
    can_create_channel: true,
    can_create_topic: true,
    can_upload_pdf_material: true,
    can_video_topic: true,
  },
  edit: {
    can_edit_course_name: true,
    can_edit_course_description: true,
    can_rename_topics: true,
    can_rename_channels: true,
    can_rename_materials: true,
    can_rename_pdfs: true,
  },
  delete: {
    can_delete_course: false,
    can_delete_course_description: true,
    can_delete_topics: true,
    can_delete_channels: true,
    can_delete_materials: true,
    can_delete_pdfs: true,
  },
};

// Default co-teacher permissions (with all delete set to false)
const getDefaultCoTeacherPermissions = () => {
  return {
    ...Permissions.create,
    ...Permissions.edit,
    ...Permissions.delete,
  };
};

// Default non-editing teacher permissions (all false)
const getDefaultNonEditingTeacherPermissions = () => {
  const falsePermissions = {};
  for (const category in Permissions) {
    Object.keys(Permissions[category]).forEach((permission) => {
      falsePermissions[permission] = false;
    });
  }
  return falsePermissions;
};

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
  co_teacher_permissions: {
    type: Map,
    of: Boolean,
    default: getDefaultCoTeacherPermissions(),
  },
  non_editing_teacher_permissions: {
    type: Map,
    of: Boolean,
    default: getDefaultNonEditingTeacherPermissions(),
  },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  users: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
      role: { type: Schema.Types.ObjectId, ref: "role" },
    },
  ],
  blockedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: "user",
      default: [],
    },
  ],
});

module.exports = mongoose.model("course", Course);
