const Order = require("../models/Order");

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function deliverySoonDays() {
  return parseInt(process.env.NOTIFICATION_DELIVERY_SOON_DAYS || "3", 10);
}

function stalePendingDays() {
  return parseInt(process.env.NOTIFICATION_STALE_PENDING_DAYS || "7", 10);
}

async function getAlerts() {
  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + deliverySoonDays());

  const deliverySoonOrders = await Order.find({
    deliveryDate: {
      $gte: startOfDay(now),
      $lte: endOfDay(soon),
    },
    status: { $ne: "delivered" },
  })
    .populate("customerId", "name")
    .select("deliveryDate status customerId createdAt")
    .limit(25)
    .lean();

  const staleCutoff = new Date(now);
  staleCutoff.setDate(staleCutoff.getDate() - stalePendingDays());
  staleCutoff.setHours(0, 0, 0, 0);

  const stalePendingOrders = await Order.find({
    status: "pending",
    createdAt: { $lt: staleCutoff },
  })
    .populate("customerId", "name")
    .select("createdAt status customerId deliveryDate")
    .limit(25)
    .lean();

  const alerts = [];

  deliverySoonOrders.forEach((o) => {
    const name = o.customerId?.name || "Customer";
    alerts.push({
      type: "delivery_soon",
      severity: "warning",
      title: "Delivery approaching",
      message: `${name} — due ${new Date(o.deliveryDate).toLocaleDateString()}`,
      orderId: o._id,
      deliveryDate: o.deliveryDate,
    });
  });

  stalePendingOrders.forEach((o) => {
    const name = o.customerId?.name || "Customer";
    alerts.push({
      type: "stale_pending",
      severity: "info",
      title: "Pending order aging",
      message: `${name} — pending since ${new Date(o.createdAt).toLocaleDateString()}`,
      orderId: o._id,
      createdAt: o.createdAt,
    });
  });

  return alerts;
}

module.exports = { getAlerts };
