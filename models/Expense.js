const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
    originalName: { type: String, default: "" },
  },
  { _id: false },
);

const expenseSchema = new mongoose.Schema(
  {
    expenseNumber: { type: String, required: true, unique: true, index: true },
    date: { type: Date, required: true, index: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpenseCategory",
      required: true,
      index: true,
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpenseSubcategory",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    amount: { type: Number, required: true, min: 0, index: true },
    receipt: { type: receiptSchema, default: () => ({}) },
    notes: { type: String, trim: true, default: "", maxlength: 2000 },
  },
  { timestamps: true },
);

expenseSchema.index({ createdAt: -1 });
expenseSchema.index({ categoryId: 1, subcategoryId: 1, date: -1 });

module.exports = mongoose.model("Expense", expenseSchema);
