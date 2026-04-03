const asyncHandler = require("../middleware/asyncHandler");
const CustomerNote = require("../models/CustomerNote");

exports.createCustomerNote = asyncHandler(async (req, res) => {
  const note = await CustomerNote.create(req.body);
  res.status(201).json({ data: note });
});

exports.getCustomerNotes = asyncHandler(async (req, res) => {
  const { customerId, page, limit, sort, order, pinned } = req.query;
  const skip = (page - 1) * limit;
  const dir = order === "asc" ? 1 : -1;
  const sortBy = sort === "priority" ? { priority: dir } : { createdAt: dir };

  const filter = { customerId };
  if (typeof pinned === "boolean") {
    filter.pinned = pinned;
  }

  const [items, total] = await Promise.all([
    CustomerNote.find(filter)
      .sort({ pinned: -1, ...sortBy })
      .skip(skip)
      .limit(limit)
      .lean(),
    CustomerNote.countDocuments(filter),
  ]);

  res.json({
    data: items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

exports.updateCustomerNote = asyncHandler(async (req, res) => {
  const note = await CustomerNote.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!note) {
    const err = new Error("Note not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data: note });
});

exports.deleteCustomerNote = asyncHandler(async (req, res) => {
  const note = await CustomerNote.findByIdAndDelete(req.params.id);
  if (!note) {
    const err = new Error("Note not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data: { message: "Note deleted" } });
});
