const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    permissions: {
      type: Map,
      of: {
        create: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        manage: { type: Boolean, default: false }, // Full access
        show: { type: Boolean, default: false },   // Read-only
      },
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Role", roleSchema);
