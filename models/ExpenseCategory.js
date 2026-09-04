const mongoose = require("mongoose");

const expenseCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

expenseCategorySchema.index({ name: 1 }, { unique: true });
expenseCategorySchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model("ExpenseCategory", expenseCategorySchema);
