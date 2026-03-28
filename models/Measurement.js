const mongoose = require("mongoose");

const measurementSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    label: { type: String, trim: true, default: "" },
    values: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

measurementSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model("Measurement", measurementSchema);
