const mongoose = require("mongoose");

const expenseSubcategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpenseCategory",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

expenseSubcategorySchema.index({ categoryId: 1, name: 1 }, { unique: true });
expenseSubcategorySchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model("ExpenseSubcategory", expenseSubcategorySchema);
