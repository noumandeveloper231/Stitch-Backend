const mongoose = require("mongoose");
const { USER_ROLES } = require("../config/constants");

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
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "staff",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
