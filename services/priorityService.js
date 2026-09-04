const Order = require('../models/Order');
const { sendTemplatedEmail } = require("./emailSenderService");
const { EMAIL_TEMPLATE_KEYS } = require("./emailTemplateDefaults");

async function sendOverdueAlerts() {
  const now = new Date();
  const overdueOrders = await Order.find({
    status: { $nin: ['delivered', 'canceled'] },
    deliveryDate: { $lt: now }
  }).populate('customerId');

  if (overdueOrders.length === 0) return { sent: 0 };
  const frontendUrl = process.env.FRONTEND_URL;
  const summary = overdueOrders
    .map((o) => {
      const shortId = o?._id?.toString().slice(-6).toUpperCase();
      const due = o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : "N/A";
      return `#${shortId} - ${o.customerId?.name || "N/A"} - due ${due}`;
    })
    .join("; ");

  try {
    await sendTemplatedEmail({
      templateKey: EMAIL_TEMPLATE_KEYS.ORDER_DELIVERY_ALERT,
      to: process.env.ADMIN_EMAIL || "admin@example.com",
      variables: {
        admin_name: process.env.ADMIN_NAME || "Admin",
        order_id: `${overdueOrders.length} overdue`,
        customer_name: "Multiple customers",
        customer_email: "",
        delivery_date: new Date().toLocaleDateString(),
        delivery_time: new Date().toLocaleTimeString(),
        delivery_address: "",
        order_status: "overdue",
        assigned_driver: "N/A",
        notes: summary,
        admin_panel_url: `${frontendUrl}/orders`,
      },
    });
    return { sent: overdueOrders.length };
  } catch (error) {
    console.error('Failed to send email alert:', error);
    throw error;
  }
}

module.exports = {
  sendOverdueAlerts
};
