const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, select: false },
    phone: { type: String, trim: true, default: "" },
    profilePicture: { type: String, default: "" },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    invitationStatus: {
      type: String,
      enum: ["invited", "active", "disabled"],
      default: "invited",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
