const mongoose = require("mongoose");
const Order = require("../models/Order");
const Customer = require("../models/Customer");

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function globalSearch(q, limit) {
  const lim = Math.min(Math.max(Number(limit) || 8, 1), 20);
  const rx = new RegExp(escapeRegex(q.trim()), "i");

  const customers = await Customer.find({
    $or: [{ name: rx }, { phone: rx }, { email: rx }],
  })
    .select("name phone email")
    .limit(lim)
    .lean();

  const ordersById = [];
  if (mongoose.Types.ObjectId.isValid(q) && String(q).length === 24) {
    const one = await Order.findById(q)
      .populate("customerId", "name phone")
      .select("status totalAmount customerId createdAt")
      .lean();
    if (one) ordersById.push(one);
  }

  const customerIdsFromSearch = customers.map((c) => c._id);
  const orClause = [{ notes: rx }];
  if (customerIdsFromSearch.length) {
    orClause.push({ customerId: { $in: customerIdsFromSearch } });
  }

  const ordersFromQuery = await Order.find({ $or: orClause })
    .populate("customerId", "name phone")
    .select("status totalAmount customerId notes createdAt")
    .sort({ createdAt: -1 })
    .limit(lim)
    .lean();

  const seen = new Set();
  const orders = [];
  for (const o of [...ordersById, ...ordersFromQuery]) {
    const id = String(o._id);
    if (seen.has(id)) continue;
    seen.add(id);
    orders.push({
      _id: o._id,
      status: o.status,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
      customerName: o.customerId?.name || null,
      customerId: o.customerId?._id || o.customerId,
    });
    if (orders.length >= lim) break;
  }

  return { customers, orders };
}

module.exports = { globalSearch };
