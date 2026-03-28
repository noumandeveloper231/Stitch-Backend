const asyncHandler = require("../middleware/asyncHandler");
const Customer = require("../models/Customer");

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.addCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create(req.body);
  res.status(201).json({ data: customer });
});

exports.getCustomers = asyncHandler(async (req, res) => {
  const { q, page, limit, sort, order } = req.query;
  const filter = {};
  if (q && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), "i");
    filter.$or = [{ name: rx }, { phone: rx }, { email: rx }];
  }
  const skip = (page - 1) * limit;
  const sortKey = sort === "name" ? "name" : "createdAt";
  const sortDir = order === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    Customer.find(filter)
      .sort({ [sortKey]: sortDir })
      .skip(skip)
      .limit(limit)
      .lean(),
    Customer.countDocuments(filter),
  ]);

  res.json({
    data: items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

exports.getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data: customer });
});

exports.updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!customer) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data: customer });
});

exports.deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data: { message: "Customer deleted" } });
});
