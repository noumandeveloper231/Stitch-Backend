const Order = require("../models/Order");
const Customer = require("../models/Customer");

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

async function getDashboard({ from, to }) {
  const fromDate = from ? startOfDay(from) : startOfDay(new Date(Date.now() - 30 * 86400000));
  const toDate = to ? endOfDay(to) : endOfDay(new Date());

  const dateMatch = { createdAt: { $gte: fromDate, $lte: toDate } };

  const [
    customerCount,
    orderAgg,
    statusBreakdown,
    dailyOrders,
    revenueResult,
    revenueByMonth,
    recentOrders,
    topCustomersAgg,
  ] = await Promise.all([
    Customer.countDocuments(),
    Order.countDocuments(dateMatch),
    Order.aggregate([
      { $match: dateMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$price" },
          totalExpense: { $sum: "$totalCost" },
          totalProfit: { $sum: "$profit" },
        },
      },
    ]),
    Order.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$price" },
          expense: { $sum: "$totalCost" },
          profit: { $sum: "$profit" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.find(dateMatch)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("customerId", "name phone email")
      .select("customerId status price totalPaid remaining deliveryDate createdAt profit")
      .lean(),
    Order.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: "$customerId",
          totalSpent: { $sum: "$price" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
    ]),
  ]);

  const totals = revenueResult[0] || { totalRevenue: 0, totalExpense: 0, totalProfit: 0 };
  const statusCounts = {};
  statusBreakdown.forEach((s) => {
    statusCounts[s._id] = s.count;
  });

  const topCustomers = topCustomersAgg.map((row) => ({
    customerId: row._id,
    name: row.customer?.name || "Unknown",
    phone: row.customer?.phone || "",
    totalSpent: row.totalSpent || 0,
    orderCount: row.orderCount || 0,
  }));

  return {
    range: { from: fromDate.toISOString(), to: toDate.toISOString() },
    totals: {
      customers: customerCount,
      ordersInRange: orderAgg,
      revenueInRange: totals.totalRevenue,
      expenseInRange: totals.totalExpense,
      profitInRange: totals.totalProfit,
    },
    ordersByStatus: statusCounts,
    ordersPerDay: dailyOrders.map((d) => ({ date: d._id, count: d.count })),
    financialsByMonth: revenueByMonth.map((m) => ({
      month: m._id,
      revenue: m.revenue || 0,
      expense: m.expense || 0,
      profit: m.profit || 0,
    })),
    recentOrders,
    topCustomers,
  };
}

module.exports = { getDashboard };
