const Order = require("../models/Order");
const Measurement = require("../models/Measurement");
const StitchingType = require("../models/StitchingType");
const { DEFAULT_COST_ITEMS, STITCHING_STYLES } = require("../config/constants");
const { sendTemplatedEmail } = require("./emailSenderService");
const { EMAIL_TEMPLATE_KEYS } = require("./emailTemplateDefaults");

function fmtAmount(v) {
  return Number(v || 0).toLocaleString();
}

function sanitizeStitchingStyle(style) {
  return STITCHING_STYLES.includes(style) ? style : STITCHING_STYLES[0];
}

async function resolveStitchingSelection({ stitchingTypeId, stitchingStyle }) {
  if (!stitchingTypeId) {
    return {
      type: null,
      style: sanitizeStitchingStyle(stitchingStyle),
      price: null,
    };
  }

  const type = await StitchingType.findById(stitchingTypeId).lean();

  if (!type) {
    const err = new Error("Stitching type not found");
    err.statusCode = 400;
    throw err;
  }

  const style = sanitizeStitchingStyle(stitchingStyle);
  const price =
    style === "double" ? Number(type.doublePrice || 0) : Number(type.singlePrice || 0);

  return { type, style, price };
}

async function createOrderWithMeasurement(payload) {
  const {
    customerId,
    items,
    price,
    advance,
    status,
    deliveryDate,
    notes,
    stitchingTypeId,
    stitchingStyle,
  } = payload;
  const latest = await Measurement.findOne({ customerId })
    .sort({ createdAt: -1 })
    .lean();

  const stitchingSelection = await resolveStitchingSelection({
    stitchingTypeId,
    stitchingStyle,
  });
  const resolvedPrice = stitchingSelection.price;
  const fallbackPrice = Number(price) || 0;
  const finalPrice = resolvedPrice ?? fallbackPrice;
  const totalCost = (items || []).reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const totalPaid = Number(advance) || 0;
  const payments = advance > 0 ? [{ amount: advance, date: new Date() }] : [];
  const createdAt = new Date();

  let paymentStatus = "unpaid";
  if (totalPaid > 0) {
    paymentStatus = totalPaid >= finalPrice ? "paid" : "partially_paid";
  }

  const doc = {
    customerId,
    status: status || "pending",
    paymentStatus,
    items: (items && items.length > 0) 
      ? items 
      : DEFAULT_COST_ITEMS.map(name => ({ name, cost: 0 })),
    price: finalPrice,
    payments,
    totalCost,
    totalPaid,
    remaining: Math.max(0, finalPrice - totalPaid),
    profit: finalPrice - totalCost,
    deliveryDate: deliveryDate || null,
    notes: notes || "",
    measurementId: latest ? latest._id : null,
    measurementSnapshot: latest
      ? { label: latest.label || "", values: latest.values || {} }
      : null,
    stitchingType: stitchingSelection.type ? stitchingSelection.type._id : null,
    stitchingTypeName: stitchingSelection.type?.name || "",
    stitchingStyle: stitchingSelection.style,
    stitchingRate: resolvedPrice ?? finalPrice,
    createdAt,
  };

  const order = await Order.create(doc);
  const populated = await Order.findById(order._id)
    .populate("customerId")
    .populate("measurementId")
    .populate("stitchingType");
  if (populated?.customerId?.email) {
    try {
      await sendTemplatedEmail({
        templateKey: EMAIL_TEMPLATE_KEYS.NEW_ORDER,
        to: populated.customerId.email,
        variables: {
          user_name: populated.customerId.name || "",
          order_id: String(populated._id).slice(-6).toUpperCase(),
          order_date: new Date(populated.createdAt).toLocaleDateString(),
          order_status: populated.status,
          order_items: (populated.items || []).map((item) => item.name).join(", "),
          order_total: fmtAmount(populated.price),
          currency: "PKR",
          delivery_address: populated.customerId.address || "",
          estimated_delivery_date: populated.deliveryDate
            ? new Date(populated.deliveryDate).toLocaleDateString()
            : "TBD",
          order_url: `${process.env.FRONTEND_URL}/orders/${populated._id}?tab=details`,
        },
      });
    } catch (err) {
      console.error("Failed to send new order email:", err.message);
    }
  }
  return populated;
}

const ALLOWED_ORDER_UPDATE = new Set([
  "status",
  "paymentStatus",
  "items",
  "price",
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
    if (allowed.price !== undefined) {
      orderDoc.stitchingRate = Number(orderDoc.price) || 0;
    }

    // Update payment status automatically
    if (orderDoc.totalPaid >= orderDoc.price) {
      orderDoc.paymentStatus = "paid";
    } else if (orderDoc.totalPaid > 0) {
      orderDoc.paymentStatus = "partially_paid";
    } else {
      orderDoc.paymentStatus = "unpaid";
    }
  }

  // No-op for priority
}

async function addPaymentToOrder(orderId, amount) {
  const order = await Order.findById(orderId).populate("customerId");
  console.log(`[Payment] Processing payment for Order #${orderId}. Amount: ${amount}`);
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

  console.log(`[Payment] Order #${orderId} updated. New Total Paid: ${order.totalPaid}, Remaining: ${order.remaining}`);
  await order.save();
  
  if (order.customerId?.email) {
    try {
      await sendTemplatedEmail({
        templateKey: EMAIL_TEMPLATE_KEYS.NEW_ORDER_PAYMENT,
        to: order.customerId.email,
        variables: {
          user_name: order.customerId.name || "",
          order_id: String(order._id).slice(-6).toUpperCase(),
          order_date: new Date(order.createdAt).toLocaleDateString(),
          payment_id: `${String(order._id).slice(-6).toUpperCase()}-${order.payments.length}`,
          payment_method: "cash",
          payment_status: order.paymentStatus,
          amount_paid: fmtAmount(amount),
          currency: "PKR",
          order_total: fmtAmount(order.price),
          due_amount: fmtAmount(order.remaining),
          transaction_date: new Date().toLocaleString(),
          order_url: `${process.env.FRONTEND_URL}/orders/${orderId}?tab=details`,
        },
      });
    } catch (error) {
      console.error("Payment email error:", error.message);
    }
  }

  return Order.findById(orderId)
    .populate("customerId")
    .populate("measurementId")
    .populate("stitchingType");
}

async function sendOrderDeliveryAlert(order) {
  if (!order) return;
  try {
    await sendTemplatedEmail({
      templateKey: EMAIL_TEMPLATE_KEYS.ORDER_DELIVERY_ALERT,
      to: process.env.ADMIN_EMAIL || process.env.FROM_EMAIL || "",
      variables: {
        admin_name: process.env.ADMIN_NAME || "Admin",
        order_id: String(order._id).slice(-6).toUpperCase(),
        customer_name: order.customerId?.name || "",
        customer_email: order.customerId?.email || "",
        delivery_date: order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "",
        delivery_time: order.deliveryDate ? new Date(order.deliveryDate).toLocaleTimeString() : "",
        delivery_address: order.customerId?.address || "",
        order_status: order.status || "",
        assigned_driver: "N/A",
        notes: order.notes || "",
        admin_panel_url: `${process.env.FRONTEND_URL}/orders/${order._id}?tab=details`,
      },
    });
  } catch (error) {
    console.error("Delivery alert email error:", error.message);
  }
}

module.exports = {
  createOrderWithMeasurement,
  pickOrderUpdateFields,
  applyOrderUpdates,
  addPaymentToOrder,
  sendOrderDeliveryAlert,
};
