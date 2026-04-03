const mongoose = require("mongoose");

const NOTE_PRIORITIES = ["low", "medium", "high"];

const customerNoteSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    priority: {
      type: String,
      enum: NOTE_PRIORITIES,
      default: "medium",
      index: true,
    },
    pinned: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

customerNoteSchema.index({ customerId: 1, pinned: -1, createdAt: -1 });

module.exports = mongoose.model("CustomerNote", customerNoteSchema);
