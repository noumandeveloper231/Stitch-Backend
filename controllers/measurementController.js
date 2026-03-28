const asyncHandler = require("../middleware/asyncHandler");
const Measurement = require("../models/Measurement");

exports.createMeasurement = asyncHandler(async (req, res) => {
  const m = await Measurement.create(req.body);
  const populated = await Measurement.findById(m._id).populate("customerId");
  res.status(201).json({ data: populated });
});

exports.getMeasurements = asyncHandler(async (req, res) => {
  const { customerId, q, from, to, createdFrom, createdTo, page, limit } = req.query;
  const filter = {};
  if (customerId) filter.customerId = customerId;
  if (q) filter.label = { $regex: q, $options: "i" };

  const rangeStart = createdFrom || from;
  const rangeEnd = createdTo || to;
  if (rangeStart || rangeEnd) {
    filter.createdAt = {};
    if (rangeStart) {
      filter.createdAt.$gte = new Date(`${String(rangeStart).slice(0, 10)}T00:00:00.000Z`);
    }
    if (rangeEnd) {
      filter.createdAt.$lte = new Date(`${String(rangeEnd).slice(0, 10)}T23:59:59.999Z`);
    }
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Measurement.find(filter)
      .populate("customerId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Measurement.countDocuments(filter),
  ]);

  res.json({
    data: items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

exports.getMeasurementById = asyncHandler(async (req, res) => {
  const m = await Measurement.findById(req.params.id).populate("customerId");
  if (!m) {
    const err = new Error("Measurement not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data: m });
});

exports.getLatestForCustomer = asyncHandler(async (req, res) => {
  const m = await Measurement.findOne({ customerId: req.params.customerId })
    .sort({ createdAt: -1 })
    .populate("customerId");
  res.json({ data: m });
});

exports.updateMeasurement = asyncHandler(async (req, res) => {
  const m = await Measurement.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("customerId");
  if (!m) {
    const err = new Error("Measurement not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data: m });
});

exports.deleteMeasurement = asyncHandler(async (req, res) => {
  const m = await Measurement.findByIdAndDelete(req.params.id);
  if (!m) {
    const err = new Error("Measurement not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data: { message: "Measurement deleted" } });
});
