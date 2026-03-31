const mongoose = require("mongoose");
const { ORDER_STATUSES, PAYMENT_STATUSES, ORDER_PRIORITIES } = require("../config/constants");

const measurementSnapshotSchema = new mongoose.Schema(
  {
    label: { type: String, default: "" },
    values: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    cost: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
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
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "unpaid",
      index: true,
    },
    priority: {
      type: String,
      enum: ORDER_PRIORITIES,
      default: "auto",
      index: true,
    },
    // The calculated value for 'auto' or the manual override for display/sorting.
    // Default is 'low' to ensure a fallback.
    currentPriority: {
      type: String,
      enum: ["low", "medium", "high", "completed"],
      default: "low",
      index: true,
    },
    items: [itemSchema],
    totalCost: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    payments: [paymentSchema],
    totalPaid: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    deliveryDate: { type: Date, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ deliveryDate: 1 });

module.exports = mongoose.model("Order", orderSchema);
