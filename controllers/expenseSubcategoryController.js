const asyncHandler = require("../middleware/asyncHandler");
const ExpenseSubcategory = require("../models/ExpenseSubcategory");

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.getExpenseSubcategories = asyncHandler(async (req, res) => {
  const { q, categoryId, isActive, page, limit, sort, order } = req.query;
  const filter = {};
  if (categoryId) filter.categoryId = categoryId;
  if (typeof isActive === "boolean") filter.isActive = isActive;
  if (q) filter.name = { $regex: new RegExp(escapeRegex(q.trim()), "i") };

  const skip = (page - 1) * limit;
  const sortDirection = order === "asc" ? 1 : -1;
  const sortObj = { [sort]: sortDirection };

  const [items, total] = await Promise.all([
    ExpenseSubcategory.find(filter)
      .populate("categoryId")
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    ExpenseSubcategory.countDocuments(filter),
  ]);

  res.json({
    data: items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

exports.createExpenseSubcategory = asyncHandler(async (req, res) => {
  const created = await ExpenseSubcategory.create(req.body);
  const populated = await ExpenseSubcategory.findById(created._id).populate("categoryId");
  res.status(201).json({ data: populated });
});

exports.updateExpenseSubcategory = asyncHandler(async (req, res) => {
  const updated = await ExpenseSubcategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("categoryId");
  if (!updated) {
    const err = new Error("Expense subcategory not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data: updated });
});

exports.deleteExpenseSubcategory = asyncHandler(async (req, res) => {
  const deleted = await ExpenseSubcategory.findByIdAndDelete(req.params.id);
  if (!deleted) {
    const err = new Error("Expense subcategory not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data: { message: "Expense subcategory deleted" } });
});
