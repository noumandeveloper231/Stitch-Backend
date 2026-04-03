const asyncHandler = require("../middleware/asyncHandler");
const StitchingType = require("../models/StitchingType");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.getStitchingTypes = asyncHandler(async (req, res) => {
  const { q, isActive, page, limit } = req.query;
  const filter = {};
  if (typeof isActive === "boolean") {
    filter.isActive = isActive;
  }
  if (q) {
    filter.name = new RegExp(escapeRegex(q), "i");
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    StitchingType.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StitchingType.countDocuments(filter),
  ]);

  res.json({
    data: items,
    meta: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit || 1)),
    },
  });
});

exports.createStitchingType = asyncHandler(async (req, res) => {
  const type = await StitchingType.create(req.body);
  res.status(201).json({ data: type });
});

exports.updateStitchingType = asyncHandler(async (req, res) => {
  const type = await StitchingType.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!type) {
    const err = new Error("Stitching type not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data: type });
});

exports.deleteStitchingType = asyncHandler(async (req, res) => {
  const type = await StitchingType.findByIdAndDelete(req.params.id);
  if (!type) {
    const err = new Error("Stitching type not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data: { message: "Stitching type deleted" } });
});
