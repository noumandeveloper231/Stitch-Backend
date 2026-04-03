const mongoose = require("mongoose");
const asyncHandler = require("../middleware/asyncHandler");
const Expense = require("../models/Expense");
const ExpenseCategory = require("../models/ExpenseCategory");
const ExpenseSubcategory = require("../models/ExpenseSubcategory");
const { uploadExpenseReceipt, deleteCloudinaryAsset } = require("../services/cloudinaryService");

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function ensureCategorySubcategoryRelation(categoryId, subcategoryId) {
  const subcategory = await ExpenseSubcategory.findById(subcategoryId).lean();
  if (!subcategory) {
    const err = new Error("Expense subcategory not found");
    err.statusCode = 404;
    throw err;
  }
  if (String(subcategory.categoryId) !== String(categoryId)) {
    const err = new Error("Subcategory does not belong to selected category");
    err.statusCode = 400;
    throw err;
  }
}

async function generateExpenseNumber() {
  const latest = await Expense.findOne({}, { expenseNumber: 1 }).sort({ createdAt: -1 }).lean();
  const current = Number(String(latest?.expenseNumber || "").replace(/[^\d]/g, "")) || 0;
  const next = current + 1;
  return `EXP-${String(next).padStart(4, "0")}`;
}

exports.getNextExpenseNumber = asyncHandler(async (_req, res) => {
  const expenseNumber = await generateExpenseNumber();
  res.json({ data: { expenseNumber } });
});

exports.uploadReceipt = asyncHandler(async (req, res) => {
  const { fileData, originalName } = req.body;
  const receipt = await uploadExpenseReceipt(fileData, originalName);
  res.status(201).json({ data: receipt });
});

exports.getExpenses = asyncHandler(async (req, res) => {
  const {
    q,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    categoryId,
    subcategoryId,
    page,
    limit,
    sort,
    order,
  } = req.query;

  const filter = {};
  if (categoryId) filter.categoryId = categoryId;
  if (subcategoryId) filter.subcategoryId = subcategoryId;

  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(`${String(dateFrom).slice(0, 10)}T00:00:00.000Z`);
    if (dateTo) filter.date.$lte = new Date(`${String(dateTo).slice(0, 10)}T23:59:59.999Z`);
  }

  if (amountMin !== undefined || amountMax !== undefined) {
    filter.amount = {};
    if (amountMin !== undefined) filter.amount.$gte = amountMin;
    if (amountMax !== undefined) filter.amount.$lte = amountMax;
  }

  if (q) {
    const regex = new RegExp(escapeRegex(q.trim()), "i");
    const categoryIds = (
      await ExpenseCategory.find({ name: regex }, { _id: 1 }).lean()
    ).map((item) => item._id);
    const subcategoryIds = (
      await ExpenseSubcategory.find({ name: regex }, { _id: 1 }).lean()
    ).map((item) => item._id);

    const orClause = [
      { expenseNumber: regex },
      { title: regex },
      { notes: regex },
    ];
    if (categoryIds.length) orClause.push({ categoryId: { $in: categoryIds } });
    if (subcategoryIds.length) orClause.push({ subcategoryId: { $in: subcategoryIds } });

    if (mongoose.Types.ObjectId.isValid(q) && String(q).length === 24) {
      orClause.push({ _id: q });
    }

    filter.$or = orClause;
  }

  const skip = (page - 1) * limit;
  const sortDirection = order === "asc" ? 1 : -1;
  const sortObj = { [sort]: sortDirection, createdAt: -1 };

  const [items, total] = await Promise.all([
    Expense.find(filter)
      .populate("categoryId")
      .populate("subcategoryId")
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    Expense.countDocuments(filter),
  ]);

  res.json({
    data: items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

exports.createExpense = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  await ensureCategorySubcategoryRelation(payload.categoryId, payload.subcategoryId);

  payload.expenseNumber = await generateExpenseNumber();
  const created = await Expense.create(payload);
  const populated = await Expense.findById(created._id)
    .populate("categoryId")
    .populate("subcategoryId");
  res.status(201).json({ data: populated });
});

exports.updateExpense = asyncHandler(async (req, res) => {
  const existing = await Expense.findById(req.params.id);
  if (!existing) {
    const err = new Error("Expense not found");
    err.statusCode = 404;
    throw err;
  }

  const nextCategoryId = req.body.categoryId || existing.categoryId;
  const nextSubcategoryId = req.body.subcategoryId || existing.subcategoryId;
  await ensureCategorySubcategoryRelation(nextCategoryId, nextSubcategoryId);

  const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate("categoryId")
    .populate("subcategoryId");

  const previousPublicId = existing?.receipt?.publicId || "";
  const nextPublicId = req.body?.receipt?.publicId || "";
  if (previousPublicId && nextPublicId && previousPublicId !== nextPublicId) {
    await deleteCloudinaryAsset(previousPublicId);
  }

  res.json({ data: updated });
});

exports.deleteExpense = asyncHandler(async (req, res) => {
  const deleted = await Expense.findByIdAndDelete(req.params.id);
  if (!deleted) {
    const err = new Error("Expense not found");
    err.statusCode = 404;
    throw err;
  }
  if (deleted?.receipt?.publicId) {
    await deleteCloudinaryAsset(deleted.receipt.publicId);
  }
  res.json({ data: { message: "Expense deleted" } });
});
