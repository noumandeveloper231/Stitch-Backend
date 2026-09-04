const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true, default: "" },
    password: { type: String, select: false },
    profilePicture: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive", "disabled"],
      default: "active",
    },
    invitationStatus: {
      type: String,
      enum: ["invited", "active", "disabled"],
      default: "invited",
    },
    employeeRole: { type: String, default: "employee" },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Employee", employeeSchema);
