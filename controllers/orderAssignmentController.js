const asyncHandler = require("../middleware/asyncHandler");
const OrderAssignment = require("../models/OrderAssignment");
const orderAssignmentService = require("../services/orderAssignmentService");

exports.getOrderAssignments = asyncHandler(async (req, res) => {
  const data = await orderAssignmentService.getAssignmentsByOrder(req.params.orderId);
  res.json({ data });
});

exports.replaceOrderAssignments = asyncHandler(async (req, res) => {
  const { assignments } = req.body;

  const data = await orderAssignmentService.replaceAssignments(
    req.params.orderId,
    assignments || [],
  );

  const populated = await OrderAssignment.find({ orderId: req.params.orderId })
    .populate("employeeId", "firstName lastName email")
    .sort({ createdAt: 1 })
    .lean();

  res.json({ data: populated });
});

exports.updateAssignment = asyncHandler(async (req, res) => {
  const allowed = {};
  const { employeeId, status } = req.body;
  if (employeeId !== undefined) allowed.employeeId = employeeId || null;
  if (status !== undefined) allowed.status = status;

  const data = await orderAssignmentService.updateAssignment(
    req.params.assignmentId,
    allowed,
  );

  if (!data) {
    const err = new Error("Assignment not found");
    err.statusCode = 404;
    throw err;
  }

  if (allowed.employeeId && data.employeeId) {
    await orderAssignmentService
      .sendAssignmentEmail(data, req.params.orderId)
      .catch(() => {});
  }

  res.json({ data });
});
