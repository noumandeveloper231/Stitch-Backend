const OrderAssignment = require("../models/OrderAssignment");
const Employee = require("../models/Employee");
const Order = require("../models/Order");
const { sendTemplatedEmail } = require("./emailSenderService");
const { EMAIL_TEMPLATE_KEYS } = require("./emailTemplateDefaults");

async function getAssignmentsByOrder(orderId) {
  return OrderAssignment.find({ orderId })
    .populate("employeeId", "firstName lastName email")
    .sort({ createdAt: 1 })
    .lean();
}

async function createAssignmentsFromOrder(order) {
  const assignments = (order.items || []).map((item) => ({
    orderId: order._id,
    costBreakdownItemId: item._id,
    employeeId: null,
    taskName: item.name,
    status: "pending",
  }));

  if (assignments.length === 0) return [];

  const created = await OrderAssignment.insertMany(assignments);
  return created;
}

async function replaceAssignments(orderId, assignmentList) {
  await OrderAssignment.deleteMany({ orderId });

  if (!assignmentList || assignmentList.length === 0) return [];

  const docs = assignmentList.map((a) => ({
    orderId,
    costBreakdownItemId: a.costBreakdownItemId,
    employeeId: a.employeeId || null,
    taskName: a.taskName || "",
    status: a.status || "pending",
  }));

  const created = await OrderAssignment.insertMany(docs);

  for (const assignment of created) {
    if (assignment.employeeId) {
      await sendAssignmentEmail(assignment, orderId).catch(() => {});
    }
  }

  return created;
}

async function updateAssignment(assignmentId, patch) {
  const assignment = await OrderAssignment.findByIdAndUpdate(
    assignmentId,
    { $set: patch },
    { returnDocument: "after", runValidators: true },
  ).populate("employeeId", "firstName lastName email");

  return assignment;
}

async function getEmployeeTasks(employeeId) {
  return OrderAssignment.find({ employeeId, status: { $ne: "cancelled" } })
    .populate("orderId", "status price createdAt customerId")
    .sort({ createdAt: -1 })
    .lean();
}

async function sendAssignmentEmail(assignment, orderId) {
  const order = await Order.findById(orderId).populate("customerId").lean();
  const employee = await Employee.findById(assignment.employeeId).lean();

  if (!employee?.email) return;

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  await sendTemplatedEmail({
    templateKey: EMAIL_TEMPLATE_KEYS.EMPLOYEE_TASK_ASSIGNED,
    to: employee.email,
    variables: {
      employee_name: `${employee.firstName} ${employee.lastName}`,
      order_id: String(order._id).slice(-6).toUpperCase(),
      task_name: assignment.taskName,
      order_status: order?.status || "",
      customer_name: order?.customerId?.name || "",
      dashboard_url: `${frontendUrl}/employee/dashboard`,
    },
  });
}

module.exports = {
  getAssignmentsByOrder,
  createAssignmentsFromOrder,
  replaceAssignments,
  updateAssignment,
  getEmployeeTasks,
  sendAssignmentEmail,
};
