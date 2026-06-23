const mongoose = require("mongoose");

const loggedHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    entityType: {
      type: String,
      enum: ["user", "employee"],
      default: "user",
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    loginDate: {
      type: Date,
      default: Date.now,
    },
    ip: {
      type: String,
      required: true,
    },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    system: {
      type: String,
      default: "Unknown",
    },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("LoggedHistory", loggedHistorySchema);
