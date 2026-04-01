const mongoose = require("mongoose");
const asyncHandler = require("../middleware/asyncHandler");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const {
  createOrderWithMeasurement,
  applyOrderUpdates,
  addPaymentToOrder,
  sendOrderDeliveryAlert,
} = require("../services/orderService");
const { renderInvoicePdf } = require("../services/invoicePdfService");

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.createOrder = asyncHandler(async (req, res) => {
  const order = await createOrderWithMeasurement(req.body);
  res.status(201).json({ data: order });
});

exports.addPayment = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const order = await addPaymentToOrder(req.params.id, amount);
  res.json({ data: order });
});

exports.getOrders = asyncHandler(async (req, res) => {
  const { status, customerId, from, to, dateField, page, limit, q } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (customerId) filter.customerId = customerId;

  if (q) {
    const rx = new RegExp(escapeRegex(q.trim()), "i");
    const orClause = [
      { status: rx },
      { notes: rx },
    ];

    // Search by customer name/phone/email
    const matchingCustomers = await Customer.find({
      $or: [{ name: rx }, { phone: rx }, { email: rx }],
    }).select("_id").lean();

    if (matchingCustomers.length > 0) {
      orClause.push({ customerId: { $in: matchingCustomers.map(c => c._id) } });
    }

    if (mongoose.Types.ObjectId.isValid(q) && String(q).length === 24) {
      orClause.push({ _id: q });
    } else if (q.length >= 4 && /^[0-9a-fA-F]+$/.test(q)) {

      orClause.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: escapeRegex(q.trim()) + "$",
            options: "i"
          }
        }
      });
    }

    filter.$or = orClause;
  }

  const field = dateField === "deliveryDate" ? "deliveryDate" : "createdAt";
  if (from || to) {
    filter[field] = {};
    if (from) filter[field].$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter[field].$lte = end;
    }
  }

  const skip = (page - 1) * limit;
  
  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate("customerId")
      .populate("measurementId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({
    data: items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("customerId")
    .populate("measurementId");
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data: order });
});

exports.downloadInvoicePdf = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("customerId").lean();
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }
  const pdfBuffer = await renderInvoicePdf(order);
  const filename = `invoice-${String(order._id).slice(-8)}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true },
  )
    .populate("customerId")
    .populate("measurementId");
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }
  if (order.status === "delivered") {
    await sendOrderDeliveryAlert(order);
  }
  res.json({ data: order });
});

exports.updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }
  applyOrderUpdates(order, req.body);
  await order.save();
  const fresh = await Order.findById(order._id)
    .populate("customerId")
    .populate("measurementId");
  res.json({ data: fresh });
});

exports.deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data: { message: "Order deleted" } });
});
