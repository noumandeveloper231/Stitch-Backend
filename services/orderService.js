const Order = require("../models/Order");
const Measurement = require("../models/Measurement");
const { calculateAutoPriority } = require("./priorityService");

async function createOrderWithMeasurement(payload) {
  const { customerId, items, price, advance, status, deliveryDate, notes, priority } = payload;
  const latest = await Measurement.findOne({ customerId })
    .sort({ createdAt: -1 })
    .lean();

  const totalCost = (items || []).reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const totalPaid = Number(advance) || 0;
  const priceNum = Number(price) || 0;
  const payments = advance > 0 ? [{ amount: advance, date: new Date() }] : [];
  const createdAt = new Date();

  let paymentStatus = "unpaid";
  if (totalPaid > 0) {
    paymentStatus = totalPaid >= priceNum ? "paid" : "partially_paid";
  }

  const priorityVal = priority || "auto";
  let currentPriority = priorityVal;
  if (priorityVal === "auto") {
    currentPriority = calculateAutoPriority(createdAt, deliveryDate);
  }

  const doc = {
    customerId,
    status: status || "pending",
    paymentStatus,
    priority: priorityVal,
    currentPriority,
    items: items || [],
    price: priceNum,
    payments,
    totalCost,
    totalPaid,
    remaining: Math.max(0, (Number(price) || 0) - totalPaid),
    profit: (Number(price) || 0) - totalCost,
    deliveryDate: deliveryDate || null,
    notes: notes || "",
    measurementId: latest ? latest._id : null,
    measurementSnapshot: latest
      ? { label: latest.label || "", values: latest.values || {} }
      : null,
    createdAt,
  };

  const order = await Order.create(doc);
  return Order.findById(order._id).populate("customerId").populate("measurementId");
}

const ALLOWED_ORDER_UPDATE = new Set([
  "status",
  "paymentStatus",
  "items",
  "price",
  "deliveryDate",
  "notes",
  "priority",
]);

/**
 * Strip any fields that must not be updated from the client (snapshot, refs).
 */
function pickOrderUpdateFields(body) {
  const out = {};
  for (const key of ALLOWED_ORDER_UPDATE) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

/**
 * Apply allowed updates to a mongoose order doc and keep remaining in sync with total/advance.
 */
function applyOrderUpdates(orderDoc, patch) {
  const allowed = pickOrderUpdateFields(patch);
  Object.assign(orderDoc, allowed);

  // Recalculate totals
  if (allowed.items || allowed.price !== undefined) {
    orderDoc.totalCost = (orderDoc.items || []).reduce(
      (sum, item) => sum + (Number(item.cost) || 0),
      0,
    );
    orderDoc.totalPaid = (orderDoc.payments || []).reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0,
    );
    orderDoc.remaining = Math.max(0, (Number(orderDoc.price) || 0) - orderDoc.totalPaid);
    orderDoc.profit = (Number(orderDoc.price) || 0) - orderDoc.totalCost;

    // Update payment status automatically
    if (orderDoc.totalPaid >= orderDoc.price) {
      orderDoc.paymentStatus = "paid";
    } else if (orderDoc.totalPaid > 0) {
      orderDoc.paymentStatus = "partially_paid";
    } else {
      orderDoc.paymentStatus = "unpaid";
    }
  }

  // Handle priority recalculation if priority or deliveryDate changed
  if (patch.priority || patch.deliveryDate) {
    if (orderDoc.status === "delivered") {
      orderDoc.currentPriority = "completed";
    } else if (orderDoc.priority === "auto") {
      orderDoc.currentPriority = calculateAutoPriority(orderDoc.createdAt, orderDoc.deliveryDate);
    } else {
      orderDoc.currentPriority = orderDoc.priority;
    }
  }
}

async function addPaymentToOrder(orderId, amount) {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  if (amount <= 0) {
    const err = new Error("Payment amount must be positive");
    err.statusCode = 400;
    throw err;
  }

  if (amount > order.remaining) {
    const err = new Error(`Payment amount ${amount} exceeds remaining balance ${order.remaining}`);
    err.statusCode = 400;
    throw err;
  }

  order.payments.push({ amount, date: new Date() });
  order.totalPaid = (order.payments || []).reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0,
  );
  order.remaining = Math.max(0, (Number(order.price) || 0) - order.totalPaid);

  // Update payment status
  if (order.totalPaid >= order.price) {
    order.paymentStatus = "paid";
  } else if (order.totalPaid > 0) {
    order.paymentStatus = "partially_paid";
  } else {
    order.paymentStatus = "unpaid";
  }

  await order.save();
  return Order.findById(orderId).populate("customerId").populate("measurementId");
}

module.exports = {
  createOrderWithMeasurement,
  pickOrderUpdateFields,
  applyOrderUpdates,
  addPaymentToOrder,
};
