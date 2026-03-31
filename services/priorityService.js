const { Resend } = require('resend');
const Order = require('../models/Order');

const resendApiKey = process.env.RESEND_API_KEY;

const resend = new Resend(resendApiKey);

/**
 * Calculates priority based on time remaining until delivery.
 * First 33% of time remaining: priority = 'low'
 * 34% to 66% of time remaining: priority = 'medium'
 * 67% to 99% of time remaining: priority = 'high'
 * 100% or more (overdue): 'high' (handled by alert system)
 */
function calculateAutoPriority(createdAt, deliveryDate) {
  if (!deliveryDate) return 'low';

  const now = new Date();
  const start = new Date(createdAt);
  const end = new Date(deliveryDate);

  const totalDuration = end.getTime() - start.getTime();
  const timeElapsed = now.getTime() - start.getTime();

  if (totalDuration <= 0) return 'high'; // Invalid duration or already overdue at start

  const percentage = (timeElapsed / totalDuration) * 100;

  if (percentage < 33.33) return 'low';
  if (percentage < 66.66) return 'medium';
  return 'high';
}

/**
 * Updates priorities for all orders set to 'auto'.
 */
async function syncAutoPriorities() {
  console.log("Syncing");
  const orders = await Order.find({
    status: { $nin: ['delivered', 'canceled'] }
  });

  let updatedCount = 0;
  for (const order of orders) {
    let nextPriority = order.priority;

    if (order.status === 'delivered') {
      nextPriority = 'completed';
    } else if (order.priority === 'auto') {
      nextPriority = calculateAutoPriority(order.createdAt, order.deliveryDate);
    }

    if (order.currentPriority !== nextPriority) {
      order.currentPriority = nextPriority;
      await order.save();
      updatedCount++;
    }
  }
  return updatedCount;
}

async function sendOverdueAlerts() {
  const now = new Date();
  const overdueOrders = await Order.find({
    status: { $nin: ['delivered', 'canceled'] },
    deliveryDate: { $lt: now }
  }).populate('customerId');

  if (overdueOrders.length === 0) return { sent: 0 };
  const frontendUrl = process.env.FRONTEND_URL;

  const orderListHtml = overdueOrders.map(o => {
    const orderId = o?._id?.toString();
    const shortId = orderId?.slice(-6).toUpperCase();
    const link = `${frontendUrl}/orders/${orderId}?tab=details`;

    return `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <a href="${link}" style="text-decoration: none; color: #2563eb; font-weight: bold;">
          Order #${shortId}
        </a>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${o.customerId?.name || 'N/A'}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; color: #dc2626;">
        ${new Date(o.deliveryDate).toLocaleDateString()}
      </td>
    </tr>
  `;
  }).join('');

  const htmlTemplate = `
  <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden;">
      
      <!-- Header -->
      <div style="background: #dc2626; color: white; padding: 16px; font-size: 18px; font-weight: bold;">
        🚨 Overdue Orders Alert
      </div>

      <!-- Body -->
      <div style="padding: 20px;">
        <p style="margin-bottom: 16px; color: #374151;">
          The following orders are overdue. Click any order to view details:
        </p>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6; text-align: left;">
              <th style="padding: 10px;">Order</th>
              <th style="padding: 10px;">Customer</th>
              <th style="padding: 10px;">Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${orderListHtml}
          </tbody>
        </table>

        <!-- CTA Button -->
        <div style="margin-top: 20px; text-align: center;">
          <a href="${frontendUrl}/orders"
             style="display: inline-block; padding: 10px 16px; background: #2563eb; color: white; border-radius: 6px; text-decoration: none;">
            View All Orders
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 12px; text-align: center; font-size: 12px; color: #9ca3af;">
        This is an automated alert from your system.
      </div>

    </div>
  </div>
`;

  try {
    console.log("Sending Mails For the Overdue Orders")
    const data = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'admin@example.com',
      to: process.env.ADMIN_EMAIL || 'admin@example.com',
      subject: '🚨 Overdue Orders Alert',
      html: htmlTemplate, // 👈 use HTML instead of text
    });
    return { sent: overdueOrders.length, data };
  } catch (error) {
    console.error('Failed to send email alert:', error);
    throw error;
  }
}

module.exports = {
  calculateAutoPriority,
  syncAutoPriorities,
  sendOverdueAlerts
};
