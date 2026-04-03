const asyncHandler = require("../middleware/asyncHandler");
const ExpenseCategory = require("../models/ExpenseCategory");

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.getExpenseCategories = asyncHandler(async (req, res) => {
  const { q, isActive, page, limit, sort, order } = req.query;
  const filter = {};
  if (typeof isActive === "boolean") filter.isActive = isActive;
  if (q) filter.name = { $regex: new RegExp(escapeRegex(q.trim()), "i") };

  const skip = (page - 1) * limit;
  const sortDirection = order === "asc" ? 1 : -1;
  const sortObj = { [sort]: sortDirection };

  const [items, total] = await Promise.all([
    ExpenseCategory.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
    ExpenseCategory.countDocuments(filter),
  ]);

  res.json({
    data: items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

exports.createExpenseCategory = asyncHandler(async (req, res) => {
  const created = await ExpenseCategory.create(req.body);
  res.status(201).json({ data: created });
});

exports.updateExpenseCategory = asyncHandler(async (req, res) => {
  const updated = await ExpenseCategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updated) {
    const err = new Error("Expense category not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data: updated });
});

exports.deleteExpenseCategory = asyncHandler(async (req, res) => {
  const deleted = await ExpenseCategory.findByIdAndDelete(req.params.id);
  if (!deleted) {
    const err = new Error("Expense category not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data: { message: "Expense category deleted" } });
});
