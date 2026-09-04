const mongoose = require("mongoose");

const stitchingTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    singlePrice: { type: Number, required: true, min: 0, default: 0 },
    doublePrice: { type: Number, required: true, min: 0, default: 0 },
    notes: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StitchingType", stitchingTypeSchema);
