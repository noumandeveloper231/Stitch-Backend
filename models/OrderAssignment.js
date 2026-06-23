const mongoose = require("mongoose");

const ASSIGNMENT_STATUSES = ["pending", "in_progress", "completed", "cancelled"];

const orderAssignmentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    costBreakdownItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    taskName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ASSIGNMENT_STATUSES,
      default: "pending",
    },
  },
  { timestamps: true },
);

orderAssignmentSchema.index({ orderId: 1, costBreakdownItemId: 1 }, { unique: true });
orderAssignmentSchema.index({ employeeId: 1, status: 1 });

module.exports = mongoose.model("OrderAssignment", orderAssignmentSchema);
module.exports.ASSIGNMENT_STATUSES = ASSIGNMENT_STATUSES;
