const mongoose = require("mongoose");

const loggedHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
      type: String, // Linux, Mac, Windows
      default: "Unknown",
    },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("LoggedHistory", loggedHistorySchema);
