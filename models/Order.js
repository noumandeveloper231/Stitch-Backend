const mongoose = require("mongoose");
const { ORDER_STATUSES } = require("../config/constants");

const measurementSnapshotSchema = new mongoose.Schema(
  {
    label: { type: String, default: "" },
    values: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    measurementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Measurement",
      default: null,
    },
    measurementSnapshot: { type: measurementSnapshotSchema, default: null },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },
    totalAmount: { type: Number, default: 0 },
    advance: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 },
    deliveryDate: { type: Date, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ deliveryDate: 1 });

module.exports = mongoose.model("Order", orderSchema);
