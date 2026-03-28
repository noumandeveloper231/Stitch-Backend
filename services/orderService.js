const Order = require("../models/Order");
const Measurement = require("../models/Measurement");

async function createOrderWithMeasurement(payload) {
  const { customerId, ...rest } = payload;
  const latest = await Measurement.findOne({ customerId })
    .sort({ createdAt: -1 })
    .lean();

  const doc = {
    customerId,
    ...rest,
    measurementId: latest ? latest._id : null,
    measurementSnapshot: latest
      ? { label: latest.label || "", values: latest.values || {} }
      : null,
  };

  const order = await Order.create(doc);
  return Order.findById(order._id).populate("customerId").populate("measurementId");
}

const ALLOWED_ORDER_UPDATE = new Set([
  "status",
  "totalAmount",
  "advance",
  "deliveryDate",
  "notes",
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
  const total = Number(orderDoc.totalAmount) || 0;
  const adv = Number(orderDoc.advance) || 0;
  orderDoc.remaining = Math.max(0, total - adv);
}

module.exports = {
  createOrderWithMeasurement,
  pickOrderUpdateFields,
  applyOrderUpdates,
};
